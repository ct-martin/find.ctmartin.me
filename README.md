# find.ctmartin.me
A Schema.org search engine for my websites

[![pipeline status](https://gitlab.com/ctmartin/find-ctmartin-me/badges/master/pipeline.svg)](https://gitlab.com/ctmartin/find-ctmartin-me/-/commits/master)

I added a Schema.org-based API for several of my websites.
Now, I'm adding a finder to allow filtering and searching for things in those sites.

## Features

* Supports JSON-LD Schema.org data
* Filtering and searching
  * Filter by site and type
  * Search by name/title and description/excerpt
* Fast
* Static SPA (single page app; entirely in-browser)

## Built using

* [Nuxt.js](https://nuxtjs.org/)
* [TypeScript](https://www.typescriptlang.org/) with type checking enforced
* [SASS](https://sass-lang.com/)
* [GitLab CI](https://about.gitlab.com/ci-cd/)
* [Existing Hugo theme](https://github.com/ct-martin/ctmartin-hugo-theme)

## Background

When I created my blog, I didn't have any personal sites yet.
Over the last year or so, I've been moving more production things under [ctmartin.dev](https://ctmartin.dev/) (which also enforces HTTPS/HSTS at the TLD level) and keeping personal things under [ctmartin.me](https://ctmartin.me/), such as [food.ctmartin.me](https://food.ctmartin.me/).
This has been great b/c I also [rewrote my blog using Hugo](https://blog.ctmartin.me/2019/10/hugo/) so everything is Markdown now.
Which means that it's also _really_ easy to spin up new pages and sites.
However, the downside of having things in a git repo is that unless they're all in the same git repo, you can't interlink them as easily.
And I have two cases which I don't want to merge into one repo.
The first is [my blog](https://blog.ctmartin.me/), which for I don't want to move because there are just enough links to it that I don't want to break them.
The second is that I have a not-ready pictures site, which is going to hit the size limit for GitLab Pages pretty quick so I'm trying to avoid anything that would needlessly make an individual site large.

## Architecture

An array of URLs are provided via a config.
At load, the URLs are `fetch`ed and mapped from Schema.org to just what is needed.
These values are then passed to Nuxt to handle; Nuxt is capable of filtering and searching the data already.

The `site` is specified manually for two reasons.
First, the API currently doesn't export this data.
Second, the name is typically different on the site vs here (e.g. "Food" is short whereas the actual site has my name in the title).

### Schema types

Currently, only types I use are supported.
However, any types that pass the mapping below can be added with just a `case`.
Currently I have it as opt-in because this is new and I wanted to keep the scope reasonable, but it wouldn't be hard to check the required properties exist.

Supported for extracting data:
* Article
* BlogPosting
* ImageGallery
* Recipe
* TechArticle
* WebPage

Support for iteration:
* Arrays (JSON/`[]`)
* ItemList
  * ListItem

Intentionally ignored:
* WebSite (API currently does not provide any meaningful data)

### Schema property mapping

The TypeScript interface for the mapped data is as follows:

```typescript
interface SimpleWork {
  date: string|Date|undefined,
  description: string,
  name: string,
  site: string,
  type: string,
  url: string
}
```

Mappings:

```js
{
  date: data.datePublished,
  description: data.description,
  name: data.headline ?? data.name,
  site,
  type: data['@type'],
  url: data.url ?? data.mainEntityOfPage['@id'] ?? data.mainEntityOfPage
}
```
