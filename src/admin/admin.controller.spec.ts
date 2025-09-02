import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { GetBarcodesDto } from './dto/get-barcodes.dto';
import { GetBarcodeDto } from './dto/get-barcode.dto';
import { EditStatusDto } from './dto/edit-status.dto';

describe('AdminController (simple endpoint logic)', () => {
  let controller: AdminController;
  let service: {
    getBarcodes: jest.Mock;
    getBarcode: jest.Mock;
    deleteBarcode: jest.Mock;
    editStatus: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getBarcodes: jest.fn(),
      getBarcode: jest.fn(),
      deleteBarcode: jest.fn(),
      editStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: service }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /admin/barcodes', () => {
    it('returns service result and passes dto/adminId', async () => {
      const dto: GetBarcodesDto = { userId: 'u1', page: 1, limit: 10 } as any;
      const adminId = 'admin1';
      const mockResult = {
        data: [{ id: 'b1' }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      service.getBarcodes.mockResolvedValue(mockResult);

      const res = await controller.getBarcodes(dto, adminId);

      expect(service.getBarcodes).toHaveBeenCalledWith(dto);
      expect(res).toEqual(mockResult);
    });
  });

  describe('GET /admin/barcodes/:id', () => {
    it('returns service result for a single barcode', async () => {
      const dto: GetBarcodeDto = { barcodeId: 'b1' } as any;
      const adminId = 'admin1';
      const mockResult = { barcode: { id: 'b1' } };
      service.getBarcode.mockResolvedValue(mockResult);

      const res = await controller.getBarcode(dto, adminId);

      expect(service.getBarcode).toHaveBeenCalledWith(dto);
      expect(res).toEqual(mockResult);
    });
  });

  describe('DELETE /admin/barcodes/:id', () => {
    it('delegates to service and returns message', async () => {
      const id = 'b1';
      const adminId = 'admin1';
      const mockResult = { message: 'Deleted successfully' };
      service.deleteBarcode.mockResolvedValue(mockResult);

      const res = await controller.deleteBarcode(id as any, adminId);

      expect(service.deleteBarcode).toHaveBeenCalledWith(id);
      expect(res).toEqual(mockResult);
    });

    it('rethrows on service error', async () => {
      service.deleteBarcode.mockRejectedValue(new Error('boom'));
      await expect(
        controller.deleteBarcode('b1' as any, 'admin1'),
      ).rejects.toThrow('boom');
    });
  });

  describe('PATCH /admin/status/:id', () => {
    it('delegates to service with id and body', async () => {
      const id = 'b1';
      const body: EditStatusDto = { status: true };
      const adminId = 'admin1';
      const mockResult = { barcode: { id, editFlag: true } };
      service.editStatus.mockResolvedValue(mockResult);

      const res = await controller.editStatus(id as any, body, adminId);

      expect(service.editStatus).toHaveBeenCalledWith(id, body);
      expect(res).toEqual(mockResult);
    });

    it('rethrows on service error', async () => {
      service.editStatus.mockRejectedValue(new Error('nope'));
      await expect(
        controller.editStatus('b1' as any, { status: false }, 'admin1'),
      ).rejects.toThrow('nope');
    });
  });
});
