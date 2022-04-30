import { Hash, createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import { Injectable } from '@nestjs/common';
import { maxSatisfying, satisfies } from 'semver';
import { extract } from 'tar';
import { PackageJson } from 'type-fest';

import { LockfileItem } from 'src/lockfile/interfaces/lockfile.interface';

import { AppLogger } from '../app.logger';
import { LockfileService } from '../lockfile/lockfile.service';
import { PackageManifest } from '../registry/interfaces/package-manifest.interface';
import { RegistryService } from '../registry/registry.service';

import {
  DependencyList,
  DependencyListItem
} from './interfaces/dependency-list.interface';
import { ResolveInfo } from './interfaces/resolve-info.interface';
import {
  UnsatisfiedDependency,
  isUnsatisfiedDependency
} from './interfaces/unsatisfied-dependency.interface';

@Injectable()
export class DependencyService {
  private logger: AppLogger = new AppLogger();

  constructor(
    private lockfileService: LockfileService,
    private registryService: RegistryService
  ) {}

  async resolve(dependencies: PackageJson.Dependency): Promise<ResolveInfo> {
    const list: DependencyList = {};
    const unsatisfied: UnsatisfiedDependency[] = [];

    this.logger.update('resolving'.magenta, 'dependencies');

    this.lockfileService.readLockfile();

    for (const [name, range] of Object.entries(dependencies)) {
      await this.collectDeps(list, unsatisfied, name, range);
    }

    this.lockfileService.writeLockfile();

    this.logger.update('success'.green, 'resolved dependencies');
    this.logger.newline();

    return { list, unsatisfied };
  }

  private async collectDeps(
    list: DependencyList,
    unsatisfied: UnsatisfiedDependency[],
    name: string,
    range: string,
    parent?: string
  ): Promise<void> {
    this.logger.update(
      `resolving ${Object.keys(list).length + 1}`.magenta,
      name
    );

    const fromLockfile: LockfileItem = this.lockfileService.getItem(
      name,
      range
    );

    let version: string;
    let url: string;
    let shasum: string;
    let dependencies: PackageJson.Dependency;

    if (fromLockfile) {
      version = fromLockfile.version;
      url = fromLockfile.url;
      dependencies = fromLockfile.dependencies ?? {};
      shasum = fromLockfile.shasum;
    } else {
      try {
        const manifest: PackageManifest =
          await this.registryService.fetchPackageManifest(name);

        const latest: string | undefined = manifest['dist-tags']?.latest;

        if (latest && satisfies(latest, range)) {
          version = latest;
        } else {
          const versions: string[] = Object.keys(manifest.versions);
          const max: string | undefined =
            maxSatisfying(versions, range) ?? versions.at(-1);

          if (!max) {
            this.logger.newline();
            this.logger.error(`resolving version of ${name}`);

            process.exit(-1);
          }
          version = max;
        }

        url = manifest.versions[version].dist.tarball;
        dependencies = manifest.versions[version].dependencies ?? {};
        shasum = manifest.versions[version].dist.shasum;
      } catch (e) {
        this.logger.newline();
        this.logger.error(`fetching ${name}@${range} dependency:`, e);

        process.exit(-1);
      }
    }

    const item: LockfileItem = {
      version,
      url,
      dependencies,
      shasum
    };
    if (!Object.keys(dependencies).length) delete item.dependencies;

    this.lockfileService.setItem(name, range, item);

    if (list[name] && !satisfies(list[name].version, range)) {
      if (parent) {
        unsatisfied.push({
          name,
          parent,
          version,
          url,
          shasum
        });
      }
    } else {
      list[name] = {
        url,
        version,
        shasum
      };
    }

    if (dependencies) {
      const children: [string, string][] = Object.entries(dependencies).filter(
        ([childName, childRange]) =>
          !this.hasCirculation(list, childName, childRange)
      );

      for (const [childName, childRange] of children) {
        await this.collectDeps(list, unsatisfied, childName, childRange, name);
      }
    }
  }

  private hasCirculation(
    list: DependencyList,
    name: string,
    range: string
  ): boolean {
    return Object.entries(list).some(
      (item) => item[0] === name && satisfies(item[1].version, range)
    );
  }

  async install(
    list: DependencyList,
    unsatisfied: UnsatisfiedDependency[],
    force?: boolean
  ): Promise<boolean> {
    let alreadyUpToDate: boolean = true;

    const installedDependencies: string[] = [];

    const total: number = Object.keys(list).length + unsatisfied.length;
    this.logger.update(`installing ${total}`.blue, 'dependencies');

    for (const [current, [name, item]] of Object.entries(
      Object.entries(list)
    )) {
      try {
        const percent: number = Math.floor((+current / total) * 100);
        this.logger.update(`installing ${percent}%`.blue, name);

        const installed: boolean = await this.installDependency(
          name,
          item,
          force
        );
        if (installed) {
          installedDependencies.push(`${name}@${item.version}`);
          alreadyUpToDate = false;
        }
      } catch (e) {
        this.logger.newline();
        this.logger.error(`installing dependency ${name}@${item.version}:`, e);

        process.exit(-1);
      }
    }

    this.logger.update('installing'.blue, 'unsatisfied dependencies');

    for (const [current, dependency] of Object.entries(unsatisfied)) {
      try {
        const percent: number = Math.floor(
          ((+current + Object.keys(list).length) / total) * 100
        );
        this.logger.update(`installing ${percent}%`.blue, dependency.name);

        const installed: boolean = await this.installDependency(
          dependency.name,
          dependency,
          force
        );
        if (installed) {
          installedDependencies.push(
            `${dependency.name}@${dependency.version}`
          );
          alreadyUpToDate = false;
        }
      } catch (e) {
        this.logger.newline();
        this.logger.error(
          `installing dependency ${dependency.name}@${dependency.version}:`,
          e
        );

        process.exit(-1);
      }
    }

    this.logger.update(
      'success'.green,
      alreadyUpToDate ? 'already up-to-date' : 'installed dependencies'
    );
    this.logger.newline();

    if (!alreadyUpToDate) {
      this.logger.update(
        installedDependencies
          .map(
            (dependency, index, array) =>
              (index === array.length - 1 ? '└─ ' : '├─ ') + dependency
          )
          .join('\n')
      );
      this.logger.newline();
    }

    return alreadyUpToDate;
  }

  private async installDependency(
    name: string,
    dependency: DependencyListItem | UnsatisfiedDependency,
    force?: boolean
  ): Promise<boolean> {
    const path: string = isUnsatisfiedDependency(dependency)
      ? `${process.cwd()}/node_modules/${dependency.parent}/node_modules/${
          dependency.name
        }`
      : `${process.cwd()}/node_modules/${name}`;

    try {
      if (!force && existsSync(path)) return false;

      mkdirSync(path, { recursive: true });

      const readable: Readable = await this.registryService.fetchTarball(
        dependency.url
      );
      const hasher: Hash = createHash('sha1');

      await Promise.all([
        pipeline(readable, hasher),
        pipeline(readable, extract({ cwd: path, strip: 1 }))
      ]);

      if (hasher.digest('hex') !== dependency.shasum) {
        this.logger.newline();
        this.logger.error(
          `${name}@${dependency.version} dependency shasums do not match`
        );

        process.exit(-1);
      }
    } catch (e) {
      this.logger.newline();
      this.logger.error(
        `installing ${name}@${dependency.version} dependency:`,
        e
      );
    }

    return true;
  }
}
