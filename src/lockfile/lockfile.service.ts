import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { Injectable } from '@nestjs/common';
import { parse, stringify } from 'yaml';

import { AppLogger } from '../app.logger';

import { Lockfile, LockfileItem } from './interfaces/lockfile.interface';

@Injectable()
export class LockfileService {
  private logger: AppLogger = new AppLogger();

  private path: string = resolve(process.cwd(), 'jffpm-lock.yml');
  private readable!: Lockfile;
  private writable!: Lockfile;

  readLockfile(): void {
    if (existsSync(this.path)) {
      try {
        const raw: string = readFileSync(this.path, { encoding: 'utf-8' });
        const parsed: Lockfile = parse(raw) ?? {};

        this.readable = parsed;
      } catch (e) {
        this.logger.update('error'.red, 'reading lockfile:', e);

        process.exit(-1);
      }
    } else {
      this.readable = {};

      this.logger.update('info'.blue, 'no lockfile file found');
      this.logger.newline();
    }
  }

  writeLockfile(): void {
    if (!this.writable) return;

    const { version } = JSON.parse(
      readFileSync(resolve('./package.json'), {
        encoding: 'utf-8'
      })
    );

    const comment: string =
      '# AUTO-GENERATED FILE\n' +
      '# DO NOT EDIT MANUALLY\n' +
      '#\n' +
      `# This file was auto-generated using jffpm@${version}\n` +
      `# Total ${Object.keys(this.writable).length} modules\n` +
      `# Generation date: ${new Date().toUTCString()}\n\n`;

    const yaml: string = stringify(this.writable, {
      sortMapEntries: true
    });

    writeFileSync(this.path, comment + yaml, { encoding: 'utf-8' });
  }

  getItem(name: string, range: string): LockfileItem {
    return this.readable[`${name}@${range}`];
  }

  setItem(name: string, range: string, item: LockfileItem): void {
    if (!this.writable) this.writable = {};

    this.writable[`${name}@${range}`] = item;
  }
}
