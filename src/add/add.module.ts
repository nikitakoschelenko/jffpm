import { Module } from '@nestjs/common';

import { DependencyModule } from '../dependency/dependency.module';
import { PackageModule } from '../package/package.module';
import { PostinstallModule } from '../postinstall/postinstall.module';

import { AddCommand } from './add.command';

@Module({
  imports: [PackageModule, DependencyModule, PostinstallModule],
  providers: [AddCommand]
})
export class AddModule {}
