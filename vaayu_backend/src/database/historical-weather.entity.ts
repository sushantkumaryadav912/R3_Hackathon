import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('historical_weather_data')
export class HistoricalWeather {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('timestamp')
  timestamp: Date;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column('float')
  temperature: number;

  @Column('float')
  rainfall: number;

  @Column('float')
  wind_speed: number;

  @Column('jsonb', { nullable: true })
  raw_data: any;
}
