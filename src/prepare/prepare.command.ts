import { resolve } from 'path';

import { Command, CommandRunner, Option } from 'nest-commander';
import { PackageJson } from 'type-fest';

import { DependencyService } from '../dependency/dependency.service';
import { PackageService } from '../package/package.service';

import { PrepareCommandOptions } from './interfaces/prepare-command-options.interface';

@Command({
  name: 'prepare',
  aliases: ['', 'p'],
  description: 'Installs dependencies'
})
export class PrepareCommand implements CommandRunner {
  constructor(
    private dependencyService: DependencyService,
    private packageService: PackageService
  ) {}

  async run(inputs: string[], options: PrepareCommandOptions): Promise<void> {
    const path: string = resolve(process.cwd(), 'package.json');
    const packageJson: PackageJson = this.packageService.readPackageJson(path);

    const dependencies: PackageJson.Dependency = {
      ...packageJson.dependencies,
      ...(!options.prod ? packageJson.devDependencies : {}),
      ...(options.peer ? packageJson.peerDependencies : {})
    };

    const { list, unsatisfied } = await this.dependencyService.resolve(
      dependencies
    );

    await this.dependencyService.install(list, unsatisfied, options.force);

    this.packageService.writePackageJson(
      path,
      this.packageService.sortDependencies(packageJson)
    );
  }

  @Option({
    name: 'prod',
    description: 'Install only production dependencies',
    flags: '-p, --prod',
    defaultValue: false
  })
  parseProd(): boolean {
    return true;
  }

  @Option({
    name: 'peer',
    description: 'Install peerDependencies',
    flags: '-P, --peer',
    defaultValue: false
  })
  parsePeer(): boolean {
    return true;
  }

  @Option({
    name: 'force',
    description: 'Force reinstall dependencies',
    flags: '-f, --force',
    defaultValue: false
  })
  parseForce(): boolean {
    return true;
  }
}
