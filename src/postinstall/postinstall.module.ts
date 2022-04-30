import { Module } from '@nestjs/common';

import { PackageModule } from '../package/package.module';

import { PostinstallService } from './postinstall.service';

@Module({
  imports: [PackageModule],
  providers: [PostinstallService],
  exports: [PostinstallService]
})
export class PostinstallModule {}
