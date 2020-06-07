<template>
  <div>
    <h1>Find@CTMartin</h1>
    <p>Search engine/finder for content on my websites.</p>
    <div id="searchFilters">
      <div>
        <span>Sites:</span>
        <span v-for="site in meta.sites" :key="site" class="btn" :class="{ 'btn-inverse': !selected.sites.includes(site) }">
          <input :id="site" v-model="selected.sites" type="checkbox" :value="site">
          <label :for="site">{{ site }}</label>
        </span>
      </div>
      <div>
        <span>Types:</span>
        <span v-for="_type in meta.types" :key="_type" class="btn" :class="{ 'btn-inverse': !selected.types.includes(_type) }">
          <input :id="_type" v-model="selected.types" type="checkbox" :value="_type">
          <label :for="_type">{{ _type.replace(/([a-z])([A-Z])/, "$1 $2") }}</label>
        </span>
      </div>
      <input v-model="stringFilter" placeholder="Search" type="text">
    </div>
    <article v-for="work in filteredItems" :key="work.url" class="article-list">
      <a :href="work.url">
        <h2>{{ work.name }}</h2>
        <div v-if="work.image" class="list-image">
          <img :src="work.image" alt="">
        </div>
        <p>
          {{ work.description }}
        </p>
        <p>
          {{ work.type.replace(/([a-z])([A-Z])/, "$1 $2") }} @ {{ work.site }}{{ work.date ? ` (${work.date})` : '' }}
        </p>
      </a>
    </article>
  </div>
</template>

<style lang="scss">
// I really should make this a proper deal (with ids/classes), but the verbosity needed by templating makes that a pain
#searchFilters {
  border: 1px solid black;
  border-radius: 3px;
  box-sizing: border-box;
  margin-bottom: 1em;
  padding:1em;

  div {
    display: inline-block;
    padding-right: 16px;

    span:nth-child(2) .btn {
      margin-left: 0;
    }
  }

  input[type=checkbox] {
    display: none;

    ~ label::before {
      content: '✘ '
    }

    &:checked ~ label::before {
      content: '✔ '
    }
  }

  input[type=text] {
    display: block;
    margin-top: 0.5em;
    width: 100%;
  }
}
</style>

<script lang="ts">
import Vue from 'vue'

interface SimpleWork {
  date: string|Date|undefined,
  description: string,
  image?: string,
  name: string,
  site: string,
  type: string,
  url: string
}

interface SiteList {
  name: string,
  url: string
}

interface SearchData {
  fetchFails: number,
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
 * Decodes HTML Entities
 * @param string
 * @return {string}
 */
function decodeEntities (string: string): string {
  return (new DOMParser().parseFromString(`${string}`, 'text/html').body.textContent) ?? ''
}

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
function normalizeString (string: string): string {
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

/**
 * Handler for Schema.org parsing
 *
 * An empty/no-op value should be an empty array ([])
 * @param data Schema.org data. Assumes valid syntax; limited subset supported though
 * @param site site name
 * @return Array array of contents, reduced to basic meta
 */
function schemaParse (data: any|any[], site: string): SimpleWork[] {
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
          url: data.url ?? data.mainEntityOfPage['@id'] ?? data.mainEntityOfPage
        })
        break

      case 'WebSite':
      default:
        // do nothing; either unsupported or not useful for our purposes
    }
  }

  return works
}

/**
 * Fetches a given site's Schema.org JSON file and sends it through the Schema.org parser
 *
 * @param name: string - the name of the site
 * @param url: the URL to fetch the JSON from
 * @return array of simplified works
 */
function fetchSite (name: string, url: string): Promise<SimpleWork[]> {
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
 * Calls fetcher on all sites and aggregates results
 *
 * @param sites: {name:string, url:string}[] - array of sites to fetch with names
 * @return object[] - simplified array of works
 */
function fetchAllSites (sites: SiteList[]): Promise<SearchData> {
  const fetches: Promise<SimpleWork[]>[] = []
  sites.forEach(({ name, url }) => {
    fetches.push(fetchSite(name, url))
  })

  return Promise.allSettled(fetches).then((promises) => {
    let works: SimpleWork[] = []
    let fetchFails: number = 0

    promises.forEach((res) => {
      if (res.status === 'fulfilled') {
        works = works.concat(res.value)
      } else {
        fetchFails++
        console.error(res.reason)
      }
    })

    works = works.sort((a, b) => {
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

    const out = {
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

export default Vue.extend({
  asyncData () {
    const sites: SiteList[] = [
      { name: 'Blog', url: 'https://blog.ctmartin.me/index.json' },
      { name: 'Food', url: 'https://food.ctmartin.me/index.json' },
      { name: 'Visualizations', url: 'https://vis.ctmartin.me/index.json' }
    ]

    return fetchAllSites(sites)
  },
  data () {
    return {
      fetchFails: 0,
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
  },
  computed: {
    filteredItems (): SimpleWork[] {
      const data: SearchData = this as SearchData

      const stringFilter:string = normalizeString(data.stringFilter)

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
  }
})
</script>
