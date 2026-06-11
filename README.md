# XCP-ng website & documentation


## Website

Our website is a simple and static HTML page.

## Documentation

Our documentation is built using [Docusaurus 3](https://docusaurus.io/), a modern static website and documentation generator. It's available at https://docs.xcp-ng.org

### Installation

```
$ npm i
```

### Local Development

```
$ npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.


### Contributor warning

The glossary relies on a [dedicated plugin](https://github.com/mcclowes/docusaurus-plugin-glossary/?tab=readme-ov-file), that, during build, identifies [matching terms](glossary/glossary.json) throughout the [documentation pages](docs).
Therefore, if your contribution uses ambiguous terms that are [already in the glossary](glossary/glossary.json), please note this in your pull request and we will discuss it.


### Autogeneration

This documentation is automatically rebuilt after each push event on `master` branch.