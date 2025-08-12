import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { GetBarcodesDto } from './dto/get-barcodes.dto';
import { EditStatusDto } from './dto/edit-status.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}
  async getBarcodes(data: GetBarcodesDto) {
    try {
      const { page = 1, limit = 10, userId } = data;
      const skip = (page - 1) * limit;

      const [items, total] = await this.prisma.$transaction([
        this.prisma.barcode.findMany({
          where: {
            userId: userId,
          },
          skip: skip,
          take: limit,
        }),
        this.prisma.barcode.count({
          where: {
            userId: userId,
          },
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error in Admin get barcodes: userId=${data.userId}, error: ${error}`,
      );
      throw new HttpException('Error occured in admin get barcodes', 500);
    }
  }

  async deleteBarcode(id: string) {
    try {
      const barcode = await this.prisma.barcode.findUnique({ where: { id } });
      if (!barcode) {
        throw new HttpException('Barcode not found', 404);
      }

      await this.prisma.barcode.delete({ where: { id } });
      this.logger.log(`deleteBarcode: deleted id=${id}`);

      return { message: 'Deleted successfully' };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Delete barcode failed id=${id}: ${error}`);
      throw new HttpException(
        'Error occurred during delete barcode for admin',
        500,
      );
    }
  }

  async editStatus(id: string, data: EditStatusDto) {
    try {
      const barcode = await this.prisma.barcode.findUnique({
        where: { id: id },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!barcode) {
        throw new HttpException('Barcode not found', 404);
      }

      await this.prisma.barcode.update({
        where: { id: id },
        data: { editFlag: data.status },
      });

      this.logger.log(
        `Barcode successfully edited with id=${id}, status=${data.status}`,
      );
      return barcode;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Something went wrong when editing status: barcodeId=${id}, status=${data.status}`,
      );
      throw new HttpException(
        'Error occurred during edit status for admin',
        500,
      );
    }
  }
}
