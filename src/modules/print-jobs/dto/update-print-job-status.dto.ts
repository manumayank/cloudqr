import { IsEnum } from 'class-validator';

export class UpdatePrintJobStatusDto {
  @IsEnum(['PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'])
  status: string;
}
