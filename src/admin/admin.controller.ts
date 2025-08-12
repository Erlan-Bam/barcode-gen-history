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

  @Delete('barcodes/:id')
  async deleteBarcode(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteBarcode(id);
  }

  @Patch('status/:id')
  async editStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: EditStatusDto,
  ) {
    return this.adminService.editStatus(id, data);
  }
}
