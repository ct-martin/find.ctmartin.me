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
  generate: {
    fallback: true
  },
  head: {
    titleTemplate: 'Find @ Christian Martin',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ]
  },
  mode: 'spa',
  modern: 'client',
  typescript: {
    typeCheck: {
      eslint: true
    }
  }
}
