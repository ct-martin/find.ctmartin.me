export default {
  build: {
    extend (config, ctx) {
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(.js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  },
  buildModules: ['@nuxt/typescript-build'],
  css: [
    '@/assets/theme/assets/css/main.scss'
  ],
  generate: {
    dir: 'public',
    fallback: true
  },
  head: {
    bodyAttrs: {
      id: '__nuxt_body'
    },
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'Search for my websites' }
    ],
    titleTemplate: 'Find@CTMartin'
  },
  loading: {
    color: 'black'
  },
  mode: 'spa',
  modern: 'client',
  typescript: {
    typeCheck: {
      eslint: true
    }
  }
}
