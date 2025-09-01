import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BarcodeModule } from './barcode/barcode.module';
import { AdminModule } from './admin/admin.module';
import { SharedModule } from './shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import config from './configs/config';
import * as Joi from 'joi';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [config],
      envFilePath: ['.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().default(6001),
        DATABASE_URL: Joi.string().uri().required(),
        FRONTEND_URL: Joi.string().uri().required(),
        JWT_ACCESS_SECRET: Joi.string().min(8).required(),
      }),
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    BarcodeModule,
    AdminModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
