import { decodeEntities } from './utils/decodeEntities'

export interface SimpleWork {
  date: string|Date|undefined,
  description: string,
  image?: string,
  name: string,
  site: string,
  type: string,
  url: string
}

/**
 * Handler for Schema.org parsing
 *
 * An empty/no-op value should be an empty array ([])
 * @param data Schema.org data. Assumes valid syntax; limited subset supported though
 * @param site site name
 * @return Array array of contents, reduced to basic meta
 */
export function schemaParse (data: any|any[], site: string): SimpleWork[] {
  let works: SimpleWork[] = []

  if (Array.isArray(data)) {
    data.forEach((i) => {
      works = works.concat(schemaParse(i, site))
    })
  } else {
    switch (data['@type']) {
      case 'ItemList':
        works = works.concat(schemaParse(data.itemListElement, site))
        break
      case 'ListItem':
        works = works.concat(schemaParse(data.item, site))
        break

      case 'Article':
      case 'BlogPosting':
      case 'ImageGallery':
      case 'Recipe':
      case 'TechArticle':
      case 'WebPage':
        works.push({
          date: data.datePublished,
          description: decodeEntities(data.description),
          image: data.image,
          name: decodeEntities(data.headline ?? data.name),
          site,
          type: data['@type'],
          url: data.url ?? data.mainEntityOfPage?.['@id'] ?? data.mainEntityOfPage
        })
        break

      case 'WebSite':
      default:
        // do nothing; either unsupported or not useful for our purposes
    }
  }

  return works
}
