import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHealth() {
    return {
      status: 'ok',
      mongoState: this.connection.readyState,
      mongoConnected: this.connection.readyState === 1,
      timestamp: new Date().toISOString(),
    };
  }
}
