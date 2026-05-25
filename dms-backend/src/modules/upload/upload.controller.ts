import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { memoryStorage } from 'multer';
import { Readable } from 'stream';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';

const imageInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Chỉ được upload file ảnh'), false);
      return;
    }

    callback(null, true);
  },
});

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  @Post('image')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(imageInterceptor)
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(file, 'dms/products');
  }

  @Post('avatar')
  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.SELLER)
  @UseInterceptors(imageInterceptor)
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.handleUpload(file, 'dms/avatars');
  }

  private async handleUpload(file: Express.Multer.File, folder: string) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh');
    }

    const result = await this.uploadToCloudinary(file.buffer, folder);

    return {
      imageUrl: result.secure_url,
      publicId: result.public_id,
    };
  }

  private uploadToCloudinary(
    buffer: Buffer,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(this.toUploadError(error));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary did not return upload result'));
            return;
          }

          resolve(result);
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  private toUploadError(error: UploadApiErrorResponse): Error {
    return new Error(error.message || 'Cloudinary upload failed');
  }
}
