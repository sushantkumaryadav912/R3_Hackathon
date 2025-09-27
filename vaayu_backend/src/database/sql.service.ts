import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoricalWeather } from './historical-weather.entity';

@Injectable()
export class SqlService {
  constructor(
    @InjectRepository(HistoricalWeather)
    private readonly repo: Repository<HistoricalWeather>,
  ) {}

  async addRecord(data: Partial<HistoricalWeather>) {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async getRecords(lat: number, lon: number, start: Date, end: Date) {
    return this.repo.find({
      where: {
        latitude: lat,
        longitude: lon,
        timestamp: Between(start, end),
      },
    });
  }
}
function Between(start: Date, end: Date): Date | import("typeorm").FindOperator<Date> | undefined {
    throw new Error('Function not implemented.');
}