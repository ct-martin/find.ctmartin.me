/**
 * Normalizes string for comparison
 *
 * * Unicode normalization
 * * Lowercase (so case insensitive)
 * * Undoes some pretty-type things (such as ellipsis and "smart" quotes)
 *   * Goldmark's Typographer: https://github.com/yuin/goldmark#typographer-extension
 *   * (TODO) Wikipedia's list of quotations: https://en.wikipedia.org/wiki/Quotation_mark
 *     * To consider: how to handle `«`: as `<<` or `"`?
 *
 * @param string
 * @return {string}
 */
export function normalizeString (string: string): string {
  return string
    .replace(/[‘’]/, "'") // smart apos
    .replace(/[“”]/, '"') // smart quote
    .replace(/[–—]/, '-') // en-dash & em-dash
    .replace(/…/, '...') // ellipsis
    .replace(/«/, '<<') // left alt quote
    .replace(/»/, '>>') // right alt quote
    .normalize('NFKD')
    .toLowerCase()
}
