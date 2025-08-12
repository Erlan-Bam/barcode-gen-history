import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BarcodeModule } from './barcode/barcode.module';
import { AdminModule } from './admin/admin.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [BarcodeModule, AdminModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
