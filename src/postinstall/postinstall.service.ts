import { chmodSync, existsSync, mkdirSync, readdirSync, symlinkSync } from 'fs';
import { resolve } from 'path';

import { Injectable } from '@nestjs/common';
import { PackageJson } from 'type-fest';

import { AppLogger } from '../app.logger';
import { PackageService } from '../package/package.service';

@Injectable()
export class PostinstallService {
  private logger: AppLogger = new AppLogger();

  constructor(private packageService: PackageService) {}

  async installBinaries(path: string): Promise<void> {
    this.logger.update('postinstall'.gray, 'installing binaries');

    const modules: string[] = readdirSync(path).flatMap((module) => {
      if (module.startsWith('@'))
        return readdirSync(resolve(path, module)).map(
          (submodule) => `${module}/${submodule}`
        );

      return module;
    });

    const binPath: string = resolve(path, '.bin');
    if (!existsSync(binPath)) mkdirSync(binPath, { recursive: true });

    for (const module of modules) {
      const modulePath: string = resolve(path, module);
      const packageJsonPath: string = resolve(modulePath, 'package.json');

      if (!existsSync(packageJsonPath)) continue;

      const packageJson: PackageJson =
        this.packageService.readPackageJson(packageJsonPath);
      if (!packageJson.bin) continue;

      this.logger.update(
        'postinstall'.white,
        `installing binaries of ${module}`
      );

      const bin: Record<string, string> =
        typeof packageJson.bin === 'string'
          ? {
              [module.startsWith('@') ? module.split('/')[1] : module]:
                packageJson.bin
            }
          : packageJson.bin;

      for (const [command, relative] of Object.entries(bin)) {
        const source: string = resolve(modulePath, relative);
        const destination: string = resolve(binPath, command);

        symlinkSync(source, destination);
        chmodSync(destination, '755');
      }
    }

    this.logger.update('success'.green, 'binaries installed');
    this.logger.newline();
  }
}
