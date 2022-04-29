import { PackageJson } from 'type-fest';

export interface Lockfile {
  [name: string]: LockfileItem;
}

export interface LockfileItem {
  version: string;
  url: string;
  shasum: string;
  dependencies?: PackageJson.Dependency;
}
