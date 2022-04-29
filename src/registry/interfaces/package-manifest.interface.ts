import { PackageJson } from 'type-fest';

export interface PackageManifest {
  versions: {
    [version: string]: PackageJson & {
      dist: {
        shasum: string;
        tarball: string;
      };
    };
  };

  'dist-tags'?: {
    latest: string;
  };
}
