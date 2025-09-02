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

import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiExtraModels,
} from '@nestjs/swagger';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@ApiTags('Admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Only admins can access this endpoint' })
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private adminService: AdminService) {}

  @Get('barcodes')
  @ApiOperation({ summary: 'List barcodes for a user (paginated)' })
  @ApiQuery({
    name: 'userId',
    description: 'User ID to fetch barcodes for',
    required: true,
    type: String,
    example: '4d8b4d87-6c7c-4e0f-9c9c-cc8e3fd8b6f5',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiBadRequestResponse({ description: 'Validation error in query params' })
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
  @ApiOperation({ summary: 'Get a single barcode by ID' })
  @ApiParam({
    name: 'id',
    description: 'Barcode ID (UUID)',
    example: 'a7c6ab3a-1d9e-4d1c-8c3b-2e7f6b9f3e1a',
  })
  @ApiNotFoundResponse({ description: 'Barcode not found' })
  @ApiBadRequestResponse({ description: 'Validation error in params' })
  async getBarcode(@Param() data: GetBarcodeDto, @User('id') adminId: string) {
    const barcodes = await this.adminService.getBarcode(data);
    this.logger.log(
      `Admin with adminId=${adminId}, successfully got barcodeId=${data.barcodeId} barcodes`,
    );
    return barcodes;
  }

  @Delete('barcodes/:id')
  @ApiOperation({ summary: 'Delete a barcode by ID' })
  @ApiParam({
    name: 'id',
    description: 'Barcode ID (UUID)',
    example: 'a7c6ab3a-1d9e-4d1c-8c3b-2e7f6b9f3e1a',
  })
  @ApiOkResponse({ description: 'Barcode deleted successfully' })
  @ApiNotFoundResponse({ description: 'Barcode not found' })
  @ApiBadRequestResponse({ description: 'Validation error in params' })
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
  @ApiOperation({ summary: 'Edit barcode status' })
  @ApiParam({
    name: 'id',
    description: 'Barcode ID (UUID)',
    example: 'a7c6ab3a-1d9e-4d1c-8c3b-2e7f6b9f3e1a',
  })
  @ApiBody({ type: EditStatusDto })
  @ApiNotFoundResponse({ description: 'Barcode not found' })
  @ApiBadRequestResponse({ description: 'Validation error in body/params' })
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
