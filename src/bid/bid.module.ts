import { Module } from '@nestjs/common';
import { BidWizard } from './bid.wizard';
import { BidService } from './bid.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidEntity } from './bid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BidEntity])],
  providers: [BidWizard, BidService],
  exports: [BidService],
})
export class BidModule {}
