import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHealth() {
    const databaseStates: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: Number(this.connection.readyState) === 1 ? 'ok' : 'degraded',
      service: 'dms-backend',
      environment: process.env.NODE_ENV ?? 'development',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: databaseStates[this.connection.readyState] ?? 'unknown',
        name: this.connection.name,
      },
    };
  }
}
