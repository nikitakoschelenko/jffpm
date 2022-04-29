export interface DependencyList {
  [name: string]: DependencyListItem;
}

export interface DependencyListItem {
  url: string;
  version: string;
  shasum: string;
}
