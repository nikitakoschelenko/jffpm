export interface UnsatisfiedDependency {
  name: string;
  parent: string;
  version: string;
  url: string;
  shasum: string;
}

export function isUnsatisfiedDependency(
  value: any
): value is UnsatisfiedDependency {
  return (
    typeof value.name === 'string' &&
    typeof value.parent === 'string' &&
    typeof value.version === 'string' &&
    typeof value.url === 'string' &&
    typeof value.shasum === 'string'
  );
}
