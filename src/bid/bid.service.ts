import { Injectable } from '@nestjs/common';
import { BidEntity } from './bid.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { addHours } from 'date-fns/addHours';
import { addWeeks } from 'date-fns/addWeeks';
import { addDays } from 'date-fns/addDays';
import { InjectRepository } from '@nestjs/typeorm';

type createdFilters = 'last hour' | 'last day' | 'last week';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(BidEntity)
    private readonly bidRepository: Repository<BidEntity>,
  ) {}

  async saveBid(bidEntity: Omit<BidEntity, 'id' | 'createdAt'>) {
    const newBid = this.bidRepository.create(bidEntity);

    return await this.bidRepository.save(newBid);
  }

  async getBid(filters?: {
    created?: createdFilters;
    room?: BidEntity['room'];
  }) {
    const dateDecryption: Record<createdFilters, Date> = {
      'last hour': addHours(new Date(), -1),
      'last day': addDays(new Date(), -1),
      'last week': addWeeks(new Date(), -1),
    };

    return await this.bidRepository.find({
      where: {
        createdAt: !!filters.created
          ? MoreThanOrEqual(dateDecryption[filters.created])
          : undefined,
        room: filters.room,
      },
    });
  }
}
