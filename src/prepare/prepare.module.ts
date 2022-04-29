import { Module } from '@nestjs/common';

import { DependencyModule } from '../dependency/dependency.module';
import { PackageModule } from '../package/package.module';

import { PrepareCommand } from './prepare.command';

@Module({
  imports: [DependencyModule, PackageModule],
  providers: [PrepareCommand]
})
export class PrepareModule {}
