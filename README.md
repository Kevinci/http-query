# http-query monorepo

This repository contains the `@http-query/*` packages. To build the `client` package demo for GitHub Pages:

1. From `packages/client` run:

```bash
npm install
npm run prepare:ghpages
```

2. The script will copy the built `dist` and `demo` into `docs/client`.
3. Push to GitHub and enable Pages with the `docs/` folder as source (or use gh-pages branch as you prefer).

