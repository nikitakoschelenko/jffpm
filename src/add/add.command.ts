import { resolve } from 'path';

import { Command, CommandRunner, Option } from 'nest-commander';
import { PackageJson } from 'type-fest';

import { DependencyService } from '../dependency/dependency.service';
import { PackageService } from '../package/package.service';
import { PostinstallService } from '../postinstall/postinstall.service';

import { AddCommandOptions } from './interfaces/add-command-options.interface';

@Command({
  name: 'add',
  arguments: '<modules...>',
  description: 'Adds module(s) to dependencies'
})
export class AddCommand implements CommandRunner {
  constructor(
    private packageService: PackageService,
    private dependencyService: DependencyService,
    private postinstallService: PostinstallService
  ) {}

  async run(inputs: string[], options: AddCommandOptions): Promise<void> {
    const path: string = resolve(process.cwd(), 'package.json');
    const packageJson: PackageJson = this.packageService.readPackageJson(path);

    const dependencies: PackageJson.Dependency = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...(options.peer ? packageJson.peerDependencies : {}),
      ...Object.fromEntries(
        inputs
          .map((value) => value.split('@'))
          .map(([name, range]) => [
            name,
            // TODO: this needs to be rewritten
            !range ? 'latest' : range
          ])
      )
    };

    const { list, unsatisfied } = await this.dependencyService.resolve(
      dependencies
    );

    const alreadyUpToDate: boolean = await this.dependencyService.install(
      list,
      unsatisfied
    );

    const key = options.dev
      ? 'devDependencies'
      : options.peer
      ? 'peerDependencies'
      : 'dependencies';

    packageJson[key] = {
      ...packageJson[key],
      ...Object.fromEntries(
        Object.entries(dependencies)
          .map(([name, range]) => [
            name,
            // TODO: this needs to be rewritten
            (range === 'latest' ? false : range) ||
              (list[name] ? `^${list[name].version}` : null)
          ])
          .filter(([name, range]) => name && range)
      )
    };

    this.packageService.writePackageJson(
      path,
      this.packageService.sortDependencies(packageJson)
    );

    if (!alreadyUpToDate)
      await this.postinstallService.installBinaries(
        resolve(process.cwd(), 'node_modules')
      );
  }

  @Option({
    name: 'dev',
    description: 'Install as dev dependency',
    flags: '-D, --dev',
    defaultValue: false
  })
  parseDev(): boolean {
    return true;
  }

  @Option({
    name: 'peer',
    description: 'Install as peer dependency',
    flags: '-P, --peer',
    defaultValue: false
  })
  parsePeer(): boolean {
    return true;
  }
}
