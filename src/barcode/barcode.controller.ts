import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BarcodeService } from './barcode.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetHistoryDto } from './dto/get-history.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/shared/decorator/user.decorator';

@ApiTags('Barcode')
@ApiBearerAuth() // показывает, что требуется JWT
@Controller('barcode')
@UseGuards(AuthGuard('jwt'))
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get('history')
  @ApiOperation({
    summary: 'Get barcode scan history with optional filters and pagination',
  })
  @ApiOkResponse({
    description: 'Paginated barcode history',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              url: { type: 'string' },
              type: { type: 'string' },
              editFlag: { type: 'boolean' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 57 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
      },
    },
  })
  async getHistory(@Query() data: GetHistoryDto, @User('id') userId: string) {
    data.userId = userId;
    return this.barcodeService.getHistory(data);
  }

  @Get('status/:id')
  @ApiOperation({ summary: 'Get processing status of a barcode' })
  @ApiParam({
    name: 'id',
    description: 'Barcode ID',
    schema: { type: 'string', format: 'uuid' },
  })
  async getStatus(@Param('id') id: string, @User('id') userId: string) {
    return this.barcodeService.getStatus(id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single barcode by ID' })
  @ApiParam({
    name: 'id',
    description: 'Barcode ID',
    schema: { type: 'string', format: 'uuid' },
  })
  async getBarcode(
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') userId: string,
  ) {
    return this.barcodeService.getBarcode(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a barcode by ID' })
  @ApiParam({
    name: 'id',
    description: 'Barcode ID',
    schema: { type: 'string', format: 'uuid' },
  })
  async deleteBarcode(
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') userId: string,
  ) {
    return this.barcodeService.deleteBarcode(id, userId);
  }
}
