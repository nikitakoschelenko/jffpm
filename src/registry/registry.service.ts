import { Readable } from 'stream';

import { Injectable } from '@nestjs/common';
import { request } from 'undici';

import { PackageManifest } from './interfaces/package-manifest.interface';

@Injectable()
export class RegistryService {
  public registryUrl: string = 'https://registry.yarnpkg.com';

  fetchPackageManifest(name: string): Promise<PackageManifest> {
    return request(`${this.registryUrl}/${name}`, {
      headers: {
        accept:
          'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
        'accept-encoding': 'gzip'
      }
    }).then((response) => response.body.json());
  }

  fetchTarball(url: string): Promise<Readable> {
    return request(url, {
      headers: {
        accept:
          'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
        'accept-encoding': 'gzip'
      }
    }).then((response) => response.body);
  }
}
