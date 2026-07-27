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


### Feedback & analytics

**Formbricks** (https://survey.vates.tech): the "Was this page helpful?" widget under every doc article. The component is `src/components/PageFeedback`, injected by the swizzled `src/theme/DocItem/Footer`. It talks to the public Formbricks client API directly, no SDK, no secrets: the environment ID and survey ID in `docusaurus.config.js` (`customFields.formbricks`) are client-visible by design. Votes are recorded immediately on click; a thumbs-down then asks why (Outdated, Unclear or confusing, Missing information, Inaccurate) plus optional free text, and updates the same response. Every response carries the page path in the hidden `page` field. Responses are browsed and exported in the Formbricks UI (survey "XCP-ng Docs page feedback"). Careful: the reason labels in the component must match the survey's choice labels exactly.

**Matomo** (site 19 on https://visit.vates.tech): loaded by the tarteaucitron consent banner (the `rgpd` script in `docusaurus.config.js`). On top of it, `src/clientModules/matomo.js` tracks SPA navigations and search queries (zero-result searches are the articles we should write), and the feedback widget mirrors votes as `doc_feedback` events — all only once the visitor has consented.

### Autogeneration

This documentation is automatically rebuilt after each push event on `master` branch.