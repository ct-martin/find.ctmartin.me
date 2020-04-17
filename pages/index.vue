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
/**
 * Decodes HTML Entities
 * @param string
 * @return {string}
 */
function decodeEntities (string: string): string {
  return new DOMParser().parseFromString(`${string}`, 'text/html').body.textContent
}

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
          name: decodeEntities(data.headline || data.name),
          description: decodeEntities(data.description),
          url: data.url || data.mainEntityOfPage['@id'] || data.mainEntityOfPage,
          date: data.datePublished
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

    works = works.flat().sort((a, b) => {
      if (!a.date && !b.date) {
        return 0
      } else if (!b.date || a.date > b.date) {
        return -1
      } else if (!a.date || a.date < b.date) {
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
      stringFilter: '',
      works: []
    }
  },
  computed: {
    filteredItems (): [] {
      return this.works.filter(i =>
        this.selected.sites.includes(i.site) &&
        this.selected.types.includes(i.type) &&
        (
          this.stringFilter === '' ||
          (
            i.name.toLowerCase().includes(this.stringFilter.toLowerCase()) ||
            i.description.toLowerCase().includes(this.stringFilter.toLowerCase())
          )
        )
      )
    }
  }
}
</script>
