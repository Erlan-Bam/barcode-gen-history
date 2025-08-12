import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BarcodeModule } from './barcode/barcode.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [BarcodeModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
