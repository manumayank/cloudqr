import { Module } from '@nestjs/common';
import { QRCodesController } from './qr-codes.controller';
import { QRCodesService } from './qr-codes.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QRCodesController],
  providers: [QRCodesService],
  exports: [QRCodesService],
})
export class QrCodesModule {}
