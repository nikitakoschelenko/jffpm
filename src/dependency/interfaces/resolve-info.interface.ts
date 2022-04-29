import { DependencyList } from './dependency-list.interface';
import { UnsatisfiedDependency } from './unsatisfied-dependency.interface';

export interface ResolveInfo {
  list: DependencyList;
  unsatisfied: UnsatisfiedDependency[];
}
