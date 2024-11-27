declare module "set.prototype.union" {
  declare function union<T>(set1: Set<T>, set2: Set<T>): Set<T>;
  export = union;
}

declare module "set.prototype.difference" {
  declare function difference<T>(set1: Set<T>, set2: Set<T>): Set<T>;
  export = difference;
}

declare module "set.prototype.intersection" {
  declare function intersection<T>(set1: Set<T>, set2: Set<T>): Set<T>;
  export = intersection;
}
