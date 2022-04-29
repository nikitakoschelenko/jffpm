import { Module } from '@nestjs/common';

import { LockfileService } from './lockfile.service';

@Module({
  providers: [LockfileService],
  exports: [LockfileService]
})
export class LockfileModule {}
