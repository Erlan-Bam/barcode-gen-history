import { HttpException, Injectable, Logger } from '@nestjs/common';
import { GetHistoryDto } from './dto/get-history.dto';
import { PrismaService } from 'src/shared/services/prisma.service';
import { Barcode, Prisma } from '@prisma/client';

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);
  constructor(private prisma: PrismaService) {}
  async getHistory(data: GetHistoryDto) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        edited,
        sortBy = 'createdAt',
        userId,
      } = data;
      const skip = (page - 1) * limit;

      const where: Prisma.BarcodeWhereInput = {
        userId: userId,
        ...(type && { type: type }),
        ...(edited !== undefined && { editFlag: edited }),
      };

      const orderBy: Prisma.BarcodeOrderByWithRelationInput = {
        [sortBy]: 'desc',
      };

      const [items, total] = await this.prisma.$transaction([
        this.prisma.barcode.findMany({
          where,
          orderBy,
          skip,
          select: {
            id: true,
            url: true,
            type: true,
            editFlag: true,
            userId: true,
          },
          take: limit,
        }),
        this.prisma.barcode.count({ where }),
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
    } catch (error: any) {
      this.logger.error(
        `Get history failed: ${error?.message ?? error}`,
        error?.stack,
      );
      throw new HttpException(
        'Error occurred while retrieving barcode history',
        500,
      );
    }
  }

  async getBarcode(id: string, userId: string): Promise<Barcode> {
    try {
      const barcode = await this.prisma.barcode.findUnique({
        where: { id: id },
      });
      if (!barcode) {
        throw new HttpException('Barcode not found', 404);
      }
      if (barcode.userId !== userId) {
        throw new HttpException(
          'This barcode does not belong to this user',
          403,
        );
      }

      return barcode;
    } catch (error) {
      this.logger.error(
        `getBarcode failed id=${id} userId=${userId}: ${error}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error occurred during get barcode', 500);
    }
  }

  async getStatus(id: string, userId: string) {
    try {
      const barcode = await this.prisma.barcode.findUnique({
        where: { id: id },
        select: { editFlag: true, userId: true },
      });
      if (!barcode) {
        throw new HttpException('Barcode not found', 404);
      }
      if (barcode.userId !== userId) {
        throw new HttpException(
          'This barcode does not belong to this user',
          403,
        );
      }

      return { canEdit: barcode.editFlag };
    } catch (error) {
      this.logger.error(
        `getBarcode failed id=${id} userId=${userId}: ${error}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error occurred during get barcode', 500);
    }
  }

  async deleteBarcode(id: string, userId: string) {
    try {
      const barcode = await this.prisma.barcode.findUnique({ where: { id } });
      if (!barcode) {
        throw new HttpException('Barcode not found', 404);
      }
      if (barcode.userId !== userId) {
        this.logger.warn(
          `deleteBarcode: forbidden id=${id} owner=${barcode.userId} requester=${userId}`,
        );
        throw new HttpException(
          'This barcode does not belong to this user',
          403,
        );
      }

      await this.prisma.barcode.delete({ where: { id } });
      this.logger.log(`deleteBarcode: deleted id=${id}`);

      return { message: 'Deleted successfully' };
    } catch (error: any) {
      this.logger.error(
        `Delete barcode failed id=${id} userId=${userId}: ${error}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error occurred during delete barcode', 500);
    }
  }
}
