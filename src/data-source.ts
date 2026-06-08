import { DataSource } from 'typeorm';
import 'dotenv/config'; 

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
  synchronize: false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});