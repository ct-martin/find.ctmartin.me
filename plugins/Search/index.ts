import { fetchSites, SiteList } from './SchemaFetcher'
import { SimpleWork } from './SchemaParser'
import { normalizeString } from './utils/normalizeString'

export type { SiteList } from './SchemaFetcher'
export type { SimpleWork } from './SchemaParser'

export interface SearchData {
  fetchFails: string[],
  meta: {
    sites: string[],
    types: string[]
  },
  selected: {
    sites: string[],
    types: string[]
  },
  stringFilter: string,
  works: SimpleWork[]
}

/**
 * Sorts works by date
 * @param works {SimpleWork[]} Unsorted list of works
 */
export function sortWorks (works: SimpleWork[]): SimpleWork[] {
  return works.sort((a, b) => {
    if (a.date === undefined || b.date === undefined) {
      if (a.date === undefined && b.date === undefined) {
        return 0
      } else if (a.date === undefined) {
        return 1
      } else {
        return -1
      }
    } else if (a.date > b.date) {
      return -1
    } else if (a.date < b.date) {
      return 1
    } else {
      return 0
    }
  })
}

/**
 * Creates an empty SearchData object
 */
export function searchPlaceholder (): SearchData {
  return {
    fetchFails: [],
    meta: {
      sites: [],
      types: []
    },
    selected: {
      sites: [],
      types: []
    },
    stringFilter: '',
    works: []
  } as SearchData
}

/**
 * Fetches sites using SchemaFetcher and creates a SearchData based on the results
 * @param sites List of sites to fetch
 */
export function buildSearch (sites: SiteList[]): Promise<SearchData> {
  return fetchSites(sites)
    .then(({ fetchFails, works }) => {
      works = sortWorks(works)

      const out: SearchData = {
        fetchFails,
        meta: {
          sites: [],
          types: []
        },
        selected: {
          sites: [],
          types: []
        },
        stringFilter: '',
        works
      } as SearchData

      works.forEach((i) => {
        if (!out.meta.sites.includes(i.site)) {
          out.meta.sites.push(i.site)
          out.selected.sites.push(i.site)
        }
        if (!out.meta.types.includes(i.type)) {
          out.meta.types.push(i.type)
          out.selected.types.push(i.type)
        }
      })

      return out
    })
}

/**
 * Filters SimpleWork based on:
 * * Site
 * * Type
 * * Text in name and description
 * @param data SearchData to filter works from
 */
export function filterWorks (data: SearchData): SimpleWork[] {
  const stringFilter: string = normalizeString(data.stringFilter)

  return data.works.filter(i =>
    data.selected.sites.includes(i.site) &&
    data.selected.types.includes(i.type) &&
    (
      data.stringFilter === '' ||
      (
        normalizeString(i.name).includes(stringFilter) ||
        normalizeString(i.description).includes(stringFilter)
      )
    )
  )
}
