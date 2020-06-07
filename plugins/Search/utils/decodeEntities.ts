/**
 * Decodes HTML Entities
 * @param string
 * @return {string}
 */
export function decodeEntities (string: string): string {
  return (new DOMParser().parseFromString(`${string}`, 'text/html').body.textContent) ?? ''
}
