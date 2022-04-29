import { Module } from '@nestjs/common';

import { DependencyModule } from '../dependency/dependency.module';
import { PackageModule } from '../package/package.module';

import { AddCommand } from './add.command';

@Module({
  imports: [DependencyModule, PackageModule],
  providers: [AddCommand]
})
export class AddModule {}
