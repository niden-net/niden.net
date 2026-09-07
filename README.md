### niden.net Blog

Personal blog of Nikolaos (Nikos) Dimopoulos.

Built with [Astro](https://astro.build). You are more than welcome to fork the
repository and use the implementation for your own needs.

#### Local development

There is no tooling on the host; everything runs in a container.

```bash
./serve        # http://localhost:4321
./serve -d     # detached
```

#### Build

```bash
docker exec niden-net-astro sh -c 'cd /app && npm run build'   # writes dist/
```

The site is built and published by GitHub Actions on every push to `master`:
`dist/` is pushed to the `production` branch, which Cloudflare Pages serves.
Cloudflare runs no build of its own.

#### Layout

| Path | Holds |
| --- | --- |
| `src/content/posts` | The posts, one `.mdx` file per post |
| `src/content/pages` | About, Contact, Hosting, Disclaimer, Email setup |
| `src/components` | Header, Footer, Search, Callout, Mermaid, … |
| `src/layouts` | `Base`, `Post` and `Page` |
| `src/pages` | Routes, the RSS feed and the search index |
| `src/styles` | Design tokens, global styles and the prose styles |
| `public` | Files served as they are, including `_redirects` |

#### Checks

```bash
docker exec niden-net-astro sh -c 'cd /app && npx astro check'   # types
docker exec niden-net-astro sh -c 'cd /app && node mdx-lint.mjs' # content parses as MDX
```
