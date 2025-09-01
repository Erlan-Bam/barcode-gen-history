import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [PrismaService, JwtStrategy, JwtService],
  exports: [PrismaService, JwtStrategy, JwtService],
})
export class SharedModule {}
