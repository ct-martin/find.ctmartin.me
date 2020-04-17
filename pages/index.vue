<template>
  <div>
    <h1>Find@CTMartin</h1>
    <p>Search engine/finder for content on my websites.</p>
    <div id="searchFilters">
      <div>
        <span>Sites:</span>
        <span v-for="site in meta.sites" :key="site">
          <span v-if="selected.sites.includes(site)" class="btn" @click="selected.sites.splice(selected.sites.indexOf(site), 1)">{{ site }}</span>
          <span v-else class="btn btn-inverse" @click="selected.sites.push(site)"><s>{{ site }}</s></span>
        </span>
      </div>
      <div>
        <span>Types:</span>
        <span v-for="_type in meta.types" :key="_type">
          <span v-if="selected.types.includes(_type)" class="btn" @click="selected.types.splice(selected.types.indexOf(_type), 1)">{{ _type.replace(/([a-z])([A-Z])/, "$1 $2") }}</span>
          <span v-else class="btn btn-inverse" @click="selected.types.push(_type)"><s>{{ _type.replace(/([a-z])([A-Z])/, "$1 $2") }}</s></span>
        </span>
      </div>
      <input v-model="stringFilter" placeholder="Search" type="text">
    </div>
    <article v-for="work in filteredItems" :key="work.url" class="article-list">
      <a :href="work.url">
        <h2>{{ work.name }}</h2>
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

  input {
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
  return (new DOMParser().parseFromString(`${string}`, 'text/html').body.textContent) || ''
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

      case 'WebPage':
      case 'Recipe':
      case 'Article':
      case 'BlogPosting':
      case 'TechArticle':
      case 'ImageGallery':
        works.push({
          date: data.datePublished,
          description: decodeEntities(data.description),
          name: decodeEntities(data.headline || data.name),
          site,
          type: data['@type'],
          url: data.url || data.mainEntityOfPage['@id'] || data.mainEntityOfPage
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
        works.concat(res.value)
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
      return data.works.filter(i =>
        data.selected.sites.includes(i.site) &&
        data.selected.types.includes(i.type) &&
        (
          data.stringFilter === '' ||
          (
            i.name.toLowerCase().includes(data.stringFilter.toLowerCase()) ||
            i.description.toLowerCase().includes(data.stringFilter.toLowerCase())
          )
        )
      )
    }
  }
})
</script>
