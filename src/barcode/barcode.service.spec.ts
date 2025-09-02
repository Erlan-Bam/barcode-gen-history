import { Test, TestingModule } from '@nestjs/testing';
import { BarcodeService } from './barcode.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { HttpException } from '@nestjs/common';

describe('BarcodeService (simple logic tests)', () => {
  let service: BarcodeService;

  const prismaMock = {
    $transaction: jest.fn(),
    barcode: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BarcodeService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BarcodeService>(BarcodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHistory', () => {
    it('returns paginated items and meta (happy path)', async () => {
      const items = [
        { id: 'b1', url: 'u', type: 'QR', editFlag: false, userId: 'u1' },
      ];
      (prismaMock.$transaction as any).mockResolvedValue([items, 5]);

      const res = await service.getHistory({
        userId: 'u1',
        page: 2,
        limit: 2,
        sortBy: 'createdAt',
      } as any);

      // ensure $transaction used and skip/take passed via findMany call object
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      const [ops] = (prismaMock.$transaction as any).mock.calls[0];
      expect(ops[0]).toMatchObject({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        skip: 2, // (page-1)*limit = (2-1)*2
        take: 2,
        select: {
          id: true,
          url: true,
          type: true,
          editFlag: true,
          userId: true,
        },
      });

      expect(res).toEqual({
        data: items,
        meta: { page: 2, limit: 2, total: 5, totalPages: 3 },
      });
    });

    it('applies filters when provided', async () => {
      (prismaMock.$transaction as any).mockResolvedValue([[], 0]);

      await service.getHistory({
        userId: 'u1',
        page: 1,
        limit: 20,
        type: 'QR' as any,
        edited: true,
        sortBy: 'updatedAt',
      } as any);

      const [ops] = (prismaMock.$transaction as any).mock.calls[0];
      expect(ops[0]).toMatchObject({
        where: { userId: 'u1', type: 'QR', editFlag: true },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('wraps unexpected errors into HttpException(500)', async () => {
      (prismaMock.$transaction as any).mockRejectedValue(new Error('db'));
      await expect(
        service.getHistory({ userId: 'u1' } as any),
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('getBarcode', () => {
    it('returns barcode when exists and owned by user', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        id: 'b1',
        userId: 'u1',
      });

      const res = await service.getBarcode('b1', 'u1');

      expect(prismaMock.barcode.findUnique).toHaveBeenCalledWith({
        where: { id: 'b1' },
      });
      expect(res).toEqual({ id: 'b1', userId: 'u1' });
    });

    it('404 when not found', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue(null);

      await expect(service.getBarcode('missing', 'u1')).rejects.toMatchObject({
        status: 404,
        message: 'Barcode not found',
      });
    });

    it('403 when user does not own barcode', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        id: 'b1',
        userId: 'owner',
      });

      await expect(service.getBarcode('b1', 'u1')).rejects.toMatchObject({
        status: 403,
      });
    });

    it('wraps unexpected errors into HttpException(500)', async () => {
      (prismaMock.barcode.findUnique as any).mockRejectedValue(new Error('db'));
      await expect(service.getBarcode('b1', 'u1')).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getStatus', () => {
    it('returns canEdit when owned by user', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        editFlag: true,
        userId: 'u1',
      });

      const res = await service.getStatus('b1', 'u1');

      expect(prismaMock.barcode.findUnique).toHaveBeenCalledWith({
        where: { id: 'b1' },
        select: { editFlag: true, userId: true },
      });
      expect(res).toEqual({ canEdit: true });
    });

    it('404 when not found', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue(null);

      await expect(service.getStatus('missing', 'u1')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('403 when not owned by user', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        editFlag: false,
        userId: 'owner',
      });

      await expect(service.getStatus('b1', 'u1')).rejects.toMatchObject({
        status: 403,
      });
    });

    it('wraps unexpected errors into HttpException(500)', async () => {
      (prismaMock.barcode.findUnique as any).mockRejectedValue(new Error('db'));
      await expect(service.getStatus('b1', 'u1')).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('deleteBarcode', () => {
    it('deletes when found and owned by user', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        id: 'b1',
        userId: 'u1',
      });
      (prismaMock.barcode.delete as any).mockResolvedValue({});

      const res = await service.deleteBarcode('b1', 'u1');

      expect(prismaMock.barcode.findUnique).toHaveBeenCalledWith({
        where: { id: 'b1' },
      });
      expect(prismaMock.barcode.delete).toHaveBeenCalledWith({
        where: { id: 'b1' },
      });
      expect(res).toEqual({ message: 'Deleted successfully' });
    });

    it('404 when not found', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue(null);

      await expect(
        service.deleteBarcode('missing', 'u1'),
      ).rejects.toMatchObject({
        status: 404,
      });
    });

    it('403 when not owned by user', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        id: 'b1',
        userId: 'owner',
      });

      await expect(service.deleteBarcode('b1', 'u1')).rejects.toMatchObject({
        status: 403,
      });
    });

    it('wraps unexpected errors into HttpException(500)', async () => {
      (prismaMock.barcode.findUnique as any).mockResolvedValue({
        id: 'b1',
        userId: 'u1',
      });
      (prismaMock.barcode.delete as any).mockRejectedValue(new Error('db'));

      await expect(service.deleteBarcode('b1', 'u1')).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
