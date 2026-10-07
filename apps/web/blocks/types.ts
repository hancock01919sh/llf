/** Props every block component receives from `<DynamicZone>`. */
export interface BlockProps<T> {
  block: T;
  /** Position in the dynamic zone. The first block may own the page's h1 (TDD §6.6). */
  index: number;
  pageTitle: string;
}
