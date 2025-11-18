import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusinessesService } from './businesses.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';

@Controller('api/businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  /**
   * Get business details
   * GET /api/businesses/:id
   */
  @Get(':id')
  getBusinessDetails(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.businessesService.getBusinessDetails(id, userId);
  }

  /**
   * Update business details
   * PUT /api/businesses/:id
   */
  @Put(':id')
  updateBusiness(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    return this.businessesService.updateBusiness(id, userId, updateBusinessDto);
  }

  /**
   * Upload business logo
   * POST /api/businesses/:id/logo
   */
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.businessesService.uploadLogo(id, userId, file);
  }

  /**
   * Delete business logo
   * DELETE /api/businesses/:id/logo
   */
  @Delete(':id/logo')
  deleteLogo(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.businessesService.deleteLogo(id, userId);
  }

  /**
   * Get business statistics
   * GET /api/businesses/:id/stats
   */
  @Get(':id/stats')
  getBusinessStats(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.businessesService.getBusinessStats(id, userId);
  }
}
