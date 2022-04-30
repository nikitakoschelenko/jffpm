import { existsSync, readFileSync, writeFileSync } from 'fs';

import { Injectable } from '@nestjs/common';
import { PackageJson } from 'type-fest';

import { AppLogger } from '../app.logger';

@Injectable()
export class PackageService {
  private logger: AppLogger = new AppLogger();

  readPackageJson(path: string): PackageJson {
    if (!existsSync(path)) {
      this.logger.error('no package.json file found');

      process.exit(-1);
    }

    try {
      const raw: string = readFileSync(path, { encoding: 'utf-8' });

      return JSON.parse(raw);
    } catch (e) {
      this.logger.error('reading package.json file:', e);

      process.exit(-1);
    }
  }

  writePackageJson(path: string, packageJson: PackageJson): void {
    if (!existsSync(path)) {
      this.logger.error('no package.json file found');

      process.exit(-1);
    }

    try {
      const raw: string = JSON.stringify(packageJson, null, 2);

      writeFileSync(path, raw, { encoding: 'utf-8' });
    } catch (e) {
      this.logger.error('writing package.json file:', e);

      process.exit(-1);
    }
  }

  sortDependencies(packageJson: PackageJson): PackageJson {
    const result: PackageJson = Object.assign({}, packageJson);

    if (packageJson.dependencies)
      result.dependencies = this.sortObject(packageJson.dependencies);

    if (packageJson.devDependencies)
      result.devDependencies = this.sortObject(packageJson.devDependencies);

    if (packageJson.peerDependencies)
      result.peerDependencies = this.sortObject(packageJson.peerDependencies);

    return result;
  }

  sortObject(list: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.keys(list)
        .sort()
        .map((key) => [key, list[key]])
    );
  }
}
