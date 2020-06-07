import { schemaParse, SimpleWork } from './SchemaParser'

export interface SiteList {
  name: string,
  url: string
}

export interface FetchResults {
  fetchFails: string[],
  works: SimpleWork[]
}

/**
 * Fetches a given site's Schema.org JSON file and sends it through the Schema.org parser
 *
 * @param name: string - the name of the site
 * @param url: the URL to fetch the JSON from
 * @return array of simplified works
 */
export function fetchSite (name: string, url: string): Promise<SimpleWork[]> {
  return fetch(url)
    .then((res) => {
      return res.json()
    })
    .then((data) => {
      const works: SimpleWork[] = schemaParse(data, name)
        .map((i) => {
          return {
            ...i,
            site: name
          }
        })

      return works
    })
}

/**
 * Calls fetcher on list of sites and aggregates results
 *
 * @param sites: SiteList[] - array of sites to fetch with names
 * @return SimpleWork[] - simplified array of works
 */
export function fetchSites (sites: SiteList[]): Promise<FetchResults> {
  const fetches: Promise<SimpleWork[]>[] = []
  sites.forEach(({ name, url }) => {
    fetches.push(fetchSite(name, url))
  })

  return Promise.allSettled(fetches).then((promises) => {
    let works: SimpleWork[] = []
    const fetchFails: string[] = []

    promises.forEach((res) => {
      if (res.status === 'fulfilled') {
        works = works.concat(res.value)
      } else {
        fetchFails.push(name)
        console.error(res.reason)
      }
    })

    return {
      fetchFails,
      works
    }
  })
}
