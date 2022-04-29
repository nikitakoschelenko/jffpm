import { Module } from '@nestjs/common';

import { PackageService } from './package.service';

@Module({
  providers: [PackageService],
  exports: [PackageService]
})
export class PackageModule {}
