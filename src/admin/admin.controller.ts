import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { GetBarcodesDto } from './dto/get-barcodes.dto';
import { User } from 'src/shared/decorator/user.decorator';
import { EditStatusDto } from './dto/edit-status.dto';
import { GetBarcodeDto } from './dto/get-barcode.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private adminService: AdminService) {}

  @Get('barcodes')
  async getBarcodes(
    @Query() data: GetBarcodesDto,
    @User('id') adminId: string,
  ) {
    const barcodes = await this.adminService.getBarcodes(data);
    this.logger.log(
      `Admin with adminId=${adminId}, successfully got userId=${data.userId} barcodes`,
    );
    return barcodes;
  }

  @Get('barcodes/:id')
  async getBarcode(@Param() data: GetBarcodeDto, @User('id') adminId: string) {
    const barcodes = await this.adminService.getBarcode(data);
    this.logger.log(
      `Admin with adminId=${adminId}, successfully got barcodeId=${data.barcodeId} barcodes`,
    );
    return barcodes;
  }

  @Delete('barcodes/:id')
  async deleteBarcode(
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') adminId: string,
  ) {
    try {
      this.logger.log(
        `Attempting to delete barcode with id=${id} by adminId=${adminId}`,
      );
      return this.adminService.deleteBarcode(id);
    } catch (error) {
      this.logger.error(`Error deleting barcode with id=${id}: ${error}`);
      throw error;
    }
  }

  @Patch('status/:id')
  async editStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: EditStatusDto,
    @User('id') adminId: string,
  ) {
    try {
      this.logger.log(
        `Attempting to edit barcode status with id=${id} by adminId=${adminId}`,
      );
      return this.adminService.editStatus(id, data);
    } catch (error) {
      this.logger.error('Error in edit barcode status: ' + error);
      throw error;
    }
  }
}
