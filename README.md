# find.ctmartin.me
A Schema.org search engine for my websites

[![pipeline status](https://gitlab.com/ctmartin/find-ctmartin-me/badges/master/pipeline.svg)](https://gitlab.com/ctmartin/find-ctmartin-me/-/commits/master)

I added a Schema.org-based API for several of my websites.
Now, I'm adding a finder to allow filtering and searching for things in those sites.

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