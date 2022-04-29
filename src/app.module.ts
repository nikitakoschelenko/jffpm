import {
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown
} from '@nestjs/common';

import { AddModule } from './add/add.module';
import { AppLogger } from './app.logger';
import { PrepareModule } from './prepare/prepare.module';

@Module({
  imports: [PrepareModule, AddModule]
})
export class AppModule
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private logger: AppLogger = new AppLogger();
  private startTime!: number;

  onApplicationBootstrap(): void {
    this.startTime = Date.now();
  }

  onApplicationShutdown(signal?: string): void {
    if (signal) return;

    this.logger.log(
      'done'.blue,
      'in',
      ((Date.now() - this.startTime) / 1000).toFixed(2) + 's'
    );
  }
}
