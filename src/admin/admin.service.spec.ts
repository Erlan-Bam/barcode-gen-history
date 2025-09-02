import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { HttpException } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';

describe('AdminService (simple logic tests)', () => {
  let service: AdminService;

  // Minimal prisma mock
  const prismaMock = {
    $transaction: jest.fn(),
    barcode: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBarcodes', () => {
    it('returns items and meta (happy path)', async () => {
      // Arrange
      const items = [{ id: 'b1' }, { id: 'b2' }];
      (prismaMock.$transaction as any).mockResolvedValue([items, 7]);

      // Act
      const res = await service.getBarcodes({
        userId: 'u1',
        page: 2,
        limit: 2,
      } as any);

      // Assert
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(res).toEqual({
        data: items,
        meta: { page: 2, limit: 2, total: 7, totalPages: 4 },
      });
    });

    it('wraps unexpected errors into HttpException(500)', async () => {
      (prismaMock.$transaction as any).mockRejectedValue(new Error('db-down'));

      await expect(
        service.getBarcodes({ userId: 'u1' } as any),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('getBarcode', () => {
    it('returns barcode when found', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({ id: 'b1' });

      const res = await service.getBarcode({ barcodeId: 'b1' } as any);

      expect(prismaMock.barcode.findUnique).toHaveBeenCalledWith({
        where: { id: 'b1' },
      });
      expect(res).toEqual({ barcode: { id: 'b1' } });
    });

    it('currently rethrows not-found as 500 due to catch block', async () => {
      // NOTE: service throws 404, then catch{} wraps to 500.
      (prismaMock.barcode.findUnique as any).mockResolvedValue(null);

      await expect(
        service.getBarcode({ barcodeId: 'missing' } as any),
      ).rejects.toMatchObject({
        status: 500,
      });
    });

    it('wraps unexpected errors into HttpException(500)', async () => {
      (prismaMock.barcode.findUnique as any).mockRejectedValue(
        new Error('oops'),
      );

      await expect(
        service.getBarcode({ barcodeId: 'b1' } as any),
      ).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('deleteBarcode', () => {
    it('deletes when found', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({ id: 'b1' });
      (prismaMock.barcode.delete as any).mockResolvedValue({});

      const res = await service.deleteBarcode('b1');

      expect(prismaMock.barcode.findUnique).toHaveBeenCalledWith({
        where: { id: 'b1' },
      });
      expect(prismaMock.barcode.delete).toHaveBeenCalledWith({
        where: { id: 'b1' },
      });
      expect(res).toEqual({ message: 'Deleted successfully' });
    });

    it('throws 404 when record missing', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue(null);

      await expect(service.deleteBarcode('missing')).rejects.toMatchObject({
        status: 404,
        message: 'Barcode not found',
      });
    });

    it('wraps unexpected delete errors into HttpException(500)', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({ id: 'b1' });
      (prismaMock.barcode.delete as any).mockRejectedValue(new Error('db'));

      await expect(service.deleteBarcode('b1')).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('editStatus', () => {
    it('updates editFlag and returns updated barcode', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        id: 'b1',
        userId: 'u1',
      });
      (prismaMock.barcode.update as any).mockResolvedValue({
        id: 'b1',
        editFlag: true,
      });

      const res = await service.editStatus('b1', { status: true } as any);

      expect(prismaMock.barcode.findUnique).toHaveBeenCalledWith({
        where: { id: 'b1' },
        select: { id: true, userId: true },
      });
      expect(prismaMock.barcode.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { editFlag: true },
      });
      expect(res).toEqual({ barcode: { id: 'b1', editFlag: true } });
    });

    it('throws 404 when barcode missing', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue(null);

      await expect(
        service.editStatus('missing', { status: true } as any),
      ).rejects.toMatchObject({
        status: 404,
        message: 'Barcode not found',
      });
    });

    it('wraps unexpected update errors into HttpException(500)', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        id: 'b1',
        userId: 'u1',
      });
      (prismaMock.barcode.update as any).mockRejectedValue(new Error('db'));

      await expect(
        service.editStatus('b1', { status: false } as any),
      ).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
