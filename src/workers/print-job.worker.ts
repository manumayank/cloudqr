import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface PrintJobData {
  orderId: string;
  campaignId: string;
}

@Processor('print-jobs')
export class PrintJobWorker {
  private readonly logger = new Logger(PrintJobWorker.name);
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'ap-south-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  @Process('create-print-job')
  async handleCreatePrintJob(job: Job<PrintJobData>): Promise<void> {
    const { orderId, campaignId } = job.data;

    this.logger.log(`Processing print job for order: ${orderId}`);

    try {
      // 1. Get order and campaign details
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          business: true,
          campaign: {
            include: {
              qrCodes: { take: 1 },
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // 2. Create print job record
      const printJob = await this.prisma.printJob.create({
        data: {
          orderId: order.id,
          campaignId: order.campaignId,
          status: 'PENDING',
        },
      });

      // 3. Generate QR codes if needed
      const qrCodes = await this.generateQRCodes(order, printJob.id);

      this.logger.log(`Generated ${qrCodes.length} QR codes for print job ${printJob.id}`);

      // 4. Generate print-ready PDF
      const pdfBuffer = await this.generatePrintPDF(order, qrCodes);

      // 5. Upload to S3
      const s3Key = `print-jobs/${printJob.id}/${order.orderNumber}.pdf`;
      const bucket = this.configService.get('S3_BUCKET') || 'qrconnect-assets';

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        }),
      );

      const region = this.configService.get('AWS_REGION') || 'ap-south-1';
      const impositionFileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

      this.logger.log(`PDF uploaded to S3: ${impositionFileUrl}`);

      // 6. Update print job with file URL
      await this.prisma.printJob.update({
        where: { id: printJob.id },
        data: {
          status: 'QUEUED',
          impositionFileUrl,
          qrCodesGenerated: qrCodes.length,
          sheetCount: Math.ceil(qrCodes.length / this.getImpositionLayout(order.productType).perSheet),
          impositionData: {
            qrCodes: qrCodes.map((qr) => ({
              id: qr.id,
              slug: qr.slug,
              url: `${this.configService.get('QR_BASE_URL') || 'https://qr.co'}/r/${qr.slug}`,
            })),
            businessName: order.business.businessName,
            logoUrl: order.business.logoUrl,
            campaignName: order.campaign.name,
          },
        },
      });

      // 7. Update order status
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'IN_PRODUCTION' },
      });

      this.logger.log(`Print job ${printJob.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Print job creation failed: ${error.message}`, error.stack);

      // Mark as error
      await this.prisma.printJob.updateMany({
        where: { orderId },
        data: {
          status: 'ERROR',
          errorMessage: error.message,
        },
      });

      throw error; // Will trigger job retry
    }
  }

  /**
   * Generate QR codes for the order
   */
  private async generateQRCodes(order: any, printJobId: string) {
    const existingQR = order.campaign.qrCodes[0];

    // For small orders or if QR already exists, use existing
    if (order.quantity <= 50 || existingQR) {
      return existingQR ? [existingQR] : [await this.createQRCode(order.campaign.id, 1)];
    }

    // For batch orders, create unique QR codes
    const qrCodes = [];
    const batchSize = Math.min(order.quantity, 1000); // Max 1000 QR codes

    for (let i = 0; i < batchSize; i++) {
      const qr = await this.createQRCode(order.campaign.id, i + 1);
      qrCodes.push(qr);
    }

    return qrCodes;
  }

  /**
   * Create a single QR code
   */
  private async createQRCode(campaignId: string, serialNumber: number) {
    const slug = await this.generateUniqueSlug();

    return this.prisma.qRCode.create({
      data: {
        campaignId,
        slug,
        codeType: 'BATCH',
        targetMode: 'DIRECT_LINK',
        isActive: true,
        metadata: { serialNumber },
      },
    });
  }

  /**
   * Generate unique slug
   */
  private async generateUniqueSlug(): Promise<string> {
    let slug: string;
    let exists: boolean;

    do {
      slug = nanoid(8);
      const existing = await this.prisma.qRCode.findUnique({ where: { slug } });
      exists = !!existing;
    } while (exists);

    return slug;
  }

  /**
   * Generate print-ready PDF
   */
  private async generatePrintPDF(order: any, qrCodes: any[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const layout = this.getImpositionLayout(order.productType);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
          bufferPages: true,
        });

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate pages
        const itemsPerSheet = layout.perSheet;
        const totalSheets = Math.ceil(qrCodes.length / itemsPerSheet);

        for (let sheet = 0; sheet < totalSheets; sheet++) {
          if (sheet > 0) doc.addPage();

          const startIdx = sheet * itemsPerSheet;
          const endIdx = Math.min(startIdx + itemsPerSheet, qrCodes.length);

          for (let i = startIdx; i < endIdx; i++) {
            const qr = qrCodes[i];
            const position = i % itemsPerSheet;

            await this.renderCard(doc, qr, order, layout, position);
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Render a single card on the PDF
   */
  private async renderCard(
    doc: PDFKit.PDFDocument,
    qr: any,
    order: any,
    layout: any,
    position: number,
  ) {
    const row = Math.floor(position / layout.cols);
    const col = position % layout.cols;

    const x = layout.marginLeft + col * (layout.cardWidth + layout.gutter);
    const y = layout.marginTop + row * (layout.cardHeight + layout.gutter);

    // Draw card outline
    doc.rect(x, y, layout.cardWidth, layout.cardHeight).stroke('#CCCCCC');

    // Generate QR code image
    const qrUrl = `${this.configService.get('QR_BASE_URL') || 'https://qr.co'}/r/${qr.slug}`;
    const qrImageBuffer = await QRCode.toBuffer(qrUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'H',
    });

    // Place QR code
    doc.image(qrImageBuffer, x + 20, y + 20, { width: 60 });

    // Add business name
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(order.business.businessName, x + 90, y + 25, { width: 100 });

    // Add campaign name
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(order.campaign.name, x + 90, y + 40, { width: 100 });

    // Add instructions
    doc
      .fontSize(6)
      .font('Helvetica')
      .text('Scan to connect', x + 90, y + 55, { width: 100 });

    // Add serial number (if batch)
    if (qr.metadata?.serialNumber) {
      doc
        .fontSize(6)
        .font('Helvetica')
        .text(`#${qr.metadata.serialNumber}`, x + 5, y + layout.cardHeight - 10);
    }
  }

  /**
   * Get imposition layout for product type
   */
  private getImpositionLayout(productType: string) {
    const layouts = {
      BUSINESS_CARD: {
        cardWidth: 240, // 85mm in points (1mm ≈ 2.83pt)
        cardHeight: 156, // 55mm
        cols: 2,
        rows: 5,
        perSheet: 10,
        marginLeft: 30,
        marginTop: 30,
        gutter: 20,
      },
      STICKER_SMALL: {
        cardWidth: 150, // ~50mm
        cardHeight: 150,
        cols: 3,
        rows: 5,
        perSheet: 15,
        marginLeft: 30,
        marginTop: 30,
        gutter: 15,
      },
      STICKER_MEDIUM: {
        cardWidth: 200,
        cardHeight: 200,
        cols: 2,
        rows: 3,
        perSheet: 6,
        marginLeft: 50,
        marginTop: 50,
        gutter: 20,
      },
      STICKER_LARGE: {
        cardWidth: 250,
        cardHeight: 250,
        cols: 2,
        rows: 2,
        perSheet: 4,
        marginLeft: 40,
        marginTop: 80,
        gutter: 20,
      },
      CUSTOM: {
        cardWidth: 240,
        cardHeight: 156,
        cols: 2,
        rows: 5,
        perSheet: 10,
        marginLeft: 30,
        marginTop: 30,
        gutter: 20,
      },
    };

    return layouts[productType] || layouts.BUSINESS_CARD;
  }
}
