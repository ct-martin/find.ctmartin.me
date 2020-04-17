<template>
  <div>
    <h1>Hello World</h1>
    <p>Lorem ipsum</p>
    <h2>Sites</h2>
    <ul>
      <li v-for="site in meta.sites" :key="site">
        {{ site }}
      </li>
    </ul>
    <h2>Types</h2>
    <ul>
      <li v-for="_type in meta.types" :key="_type">
        {{ _type }}
      </li>
    </ul>
    <h2>Works</h2>
    <ul>
      <li v-for="work in works" :key="work.url">
        {{ work.name }}
        <ul>
          <li>{{ work.type }} @ {{ work.site }}</li>
          <li>{{ work.description }}</li>
          <li><a :href="work.url">{{ work.url }}</a></li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
/**
 * Handler for Schema.org parsing
 *
 * An empty/no-op value should be an empty array ([])
 * @param data Schema.org data. Assumes valid syntax; limited subset supported though
 * @return Array array of contents, reduced to basic meta
 */
function schemaParse (data: object|object[]): object[] {
  let works: object[] = []

  if (Array.isArray(data)) {
    data.forEach((i) => {
      works = works.concat(schemaParse(i))
    })
  } else {
    switch (data['@type']) {
      case 'ItemList':
        works = works.concat(schemaParse(data.itemListElement))
        break
      case 'ListItem':
        works = works.concat(schemaParse(data.item))
        break

      case 'WebPage':
      case 'Recipe':
      case 'Article':
      case 'BlogPosting':
      case 'TechArticle':
      case 'ImageGallery':
        works.push({
          type: data['@type'],
          name: data.headline || data.name,
          description: data.description,
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
function fetchSite (name: string, url: string): object[] {
  return fetch(url)
    .then((res) => {
      return res.json()
    })
    .then((data) => {
      const works = schemaParse(data)
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
function fetchAllSites (sites: object): object[] {
  const fetches = []
  sites.forEach(({ name, url }) => {
    fetches.push(fetchSite(name, url))
  })

  return Promise.allSettled(fetches).then((promises) => {
    let works = []
    let fetchFails = 0

    promises.forEach((res) => {
      if (res.status === 'fulfilled') {
        works.push(res.value)
      } else {
        fetchFails++
        console.error(res.reason)
      }
    })

    works = works.flat()

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
      works
    }

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

export default {
  asyncData () {
    const sites = [
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
      works: []
    }
  },
  computed: {
    filteredItems (): [] {
      return this.works.filter(i =>
        this.selected.sites.includes(i.site) &&
        this.selected.types.includes(i.type)
      )
    }
  }
}
</script>
