import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoricalWeather } from './historical-weather.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432', 10),
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASS || 'password',
      database: process.env.PG_DB || 'vaayu',
      entities: [HistoricalWeather],
      synchronize: true, // Only for dev; use migrations in production
    }),
    TypeOrmModule.forFeature([HistoricalWeather]),
  ],
  exports: [TypeOrmModule],
})
export class SqlModule {}
