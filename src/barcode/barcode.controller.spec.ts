import { Test, TestingModule } from '@nestjs/testing';
import { BarcodeController } from './barcode.controller';
import { BarcodeService } from './barcode.service';
import { GetHistoryDto } from './dto/get-history.dto';

describe('BarcodeController (simple endpoint logic)', () => {
  let controller: BarcodeController;
  let service: {
    getHistory: jest.Mock;
    getStatus: jest.Mock;
    getBarcode: jest.Mock;
    deleteBarcode: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getHistory: jest.fn(),
      getStatus: jest.fn(),
      getBarcode: jest.fn(),
      deleteBarcode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarcodeController],
      providers: [{ provide: BarcodeService, useValue: service }],
    }).compile();

    controller = module.get<BarcodeController>(BarcodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /barcodes/history', () => {
    it('passes dto with userId to service and returns result', async () => {
      const dto = { page: 1, limit: 20 } as GetHistoryDto;
      const userId = 'u1';
      const mockResult = {
        data: [{ id: 'b1' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      service.getHistory.mockResolvedValue(mockResult);

      const res = await controller.getHistory(dto, userId);

      // Controller should augment dto with userId
      expect(service.getHistory).toHaveBeenCalledWith({ ...dto, userId });
      expect(res).toEqual(mockResult);
    });
  });

  describe('GET /barcodes/status/:id', () => {
    it('calls service and returns status', async () => {
      service.getStatus.mockResolvedValue({ canEdit: true });

      const res = await controller.getStatus('b1', 'u1');

      expect(service.getStatus).toHaveBeenCalledWith('b1', 'u1');
      expect(res).toEqual({ canEdit: true });
    });
  });

  describe('GET /barcodes/:id', () => {
    it('calls service and returns barcode', async () => {
      const mockBarcode = { id: 'b1', userId: 'u1' };
      service.getBarcode.mockResolvedValue(mockBarcode);

      const res = await controller.getBarcode('b1', 'u1');

      expect(service.getBarcode).toHaveBeenCalledWith('b1', 'u1');
      expect(res).toEqual(mockBarcode);
    });
  });

  describe('DELETE /barcodes/:id', () => {
    it('calls service and returns message', async () => {
      service.deleteBarcode.mockResolvedValue({
        message: 'Deleted successfully',
      });

      const res = await controller.deleteBarcode('b1', 'u1');

      expect(service.deleteBarcode).toHaveBeenCalledWith('b1', 'u1');
      expect(res).toEqual({ message: 'Deleted successfully' });
    });

    it('rethrows on service error', async () => {
      service.deleteBarcode.mockRejectedValue(new Error('boom'));

      await expect(controller.deleteBarcode('b1', 'u1')).rejects.toThrow(
        'boom',
      );
    });
  });
});
