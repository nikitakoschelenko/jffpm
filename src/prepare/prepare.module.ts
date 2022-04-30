import { Module } from '@nestjs/common';

import { DependencyModule } from '../dependency/dependency.module';
import { PackageModule } from '../package/package.module';
import { PostinstallModule } from '../postinstall/postinstall.module';

import { PrepareCommand } from './prepare.command';

@Module({
  imports: [PackageModule, DependencyModule, PostinstallModule],
  providers: [PrepareCommand]
})
export class PrepareModule {}
