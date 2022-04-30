#!/usr/bin/env node

import { CommandFactory } from 'nest-commander';

import { AppLogger } from './app.logger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  await CommandFactory.run(AppModule, {
    cliName: 'jffpm',
    logger: {
      log: () => void 0,
      warn: () => void 0,
      error: new AppLogger().error
    }
  });
}
bootstrap();
