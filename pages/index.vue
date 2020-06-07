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
import { buildSearch, filterWorks, searchPlaceholder, SearchData, SimpleWork, SiteList } from '~/plugins/Search'

export default Vue.extend({
  asyncData () {
    const sites: SiteList[] = [
      { name: 'Blog', url: 'https://blog.ctmartin.me/index.json' },
      { name: 'Food', url: 'https://food.ctmartin.me/index.json' },
      { name: 'Visualizations', url: 'https://vis.ctmartin.me/index.json' }
    ]

    return buildSearch(sites)
  },
  data () {
    return searchPlaceholder()
  },
  computed: {
    filteredItems (): SimpleWork[] {
      const data: SearchData = this as SearchData

      return filterWorks(data)
    }
  }
})
</script>
