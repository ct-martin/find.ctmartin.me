<template>
  <div>
    <header>
      <nav id="navbar" class="container" :class="{ active: navOpen }">
        <a class="nav-brand" href="/">Find@CTMartin</a>
        <div class="nav-links">
          <a href="https://ctmartin.me/">The Human/About</a>
          <a href="https://ctmartin.dev/">Portfolio</a>
        </div>
        <div class="nav-toggle-wrapper">
          <a class="nav-toggle" @click="navOpen = !navOpen" />
        </div>
      </nav>
    </header>
    <main class="container">
      <nuxt />
    </main>
    <footer>
      <div class="container">
        <div id="footer-copyright">
          <small>&copy; 2020 Christian Martin</small>
        </div>
        <div id="footer-source">
          <small><a href="https://github.com/ct-martin/find.ctmartin.me" rel="noopener" target="_blank">Source</a></small>
        </div>
        <div id="footer-baseurl">
          <small>https://find.ctmartin.me/</small>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
export default {
  data () {
    return {
      navOpen: false
    }
  }
}
</script>
