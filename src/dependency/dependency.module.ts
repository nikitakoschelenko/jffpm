import { Module } from '@nestjs/common';

import { LockfileModule } from '../lockfile/lockfile.module';
import { RegistryModule } from '../registry/registry.module';

import { DependencyService } from './dependency.service';

@Module({
  imports: [LockfileModule, RegistryModule],
  providers: [DependencyService],
  exports: [DependencyService]
})
export class DependencyModule {}
