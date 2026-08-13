// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'XCP-ng Documentation',
  tagline: 'Documentation for XCP-ng',
  url: 'https://docs.xcp-ng.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  favicon: 'img/xcpcrop128.png',
  trailingSlash: true,
  markdown: {
    // Mermaid graphs
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  //organizationName: 'xcp-ng', // Usually your GitHub org/user name.
  //projectName: 'xcp-ng-org', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-mermaid', 'docusaurus-theme-search-typesense'],

  customFields: {
    // Formbricks feedback widget (see src/components/PageFeedback).
    // These IDs are client-safe: the widget only talks to the public client API.
    formbricks: {
      apiHost: 'https://survey.vates.tech',
      environmentId: 'cm1t5b3lt000811e86uf67vs8',
      surveyId: 'cms3fa2uk005frw01pzboreld',
    },
  },

  // The rgpd script wires Matomo (site 19) behind the tarteaucitron
  // consent banner; the client module adds SPA page views and search
  // tracking on top, only after consent (see src/clientModules/matomo.js).
  scripts: [
    {
      src: 'https://cdn.vates.tech/rgpd/doc-xcp-ng-org.js',
      async: true,
    },
  ],

  clientModules: [require.resolve('./src/clientModules/matomo.js')],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          showLastUpdateTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/xcp-ng/xcp-ng-org/edit/master/',
          // Heading emoji come from the heading_emoji front matter, never from
          // the markdown itself, so that they reach nobody reading the source
          // as a row of question marks. See src/plugins/emoji/.
          rehypePlugins: [require('./src/plugins/emoji/headings')],
          beforeDefaultRemarkPlugins: [require('./src/plugins/emoji/inline')],
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Federated search across docs.xcp-ng.org, docs.vates.tech and
      // docs.xen-orchestra.com. Results group by product; hits from the
      // two sibling sites keep their absolute URL (externalUrlRegex).
      // The API key is search-only and public by design.
      // Local dev against a local Typesense (prod only allows CORS from
      // the three doc domains):
      //   TYPESENSE_HOST=localhost TYPESENSE_PORT=8108 \
      //   TYPESENSE_PROTOCOL=http TYPESENSE_SEARCH_KEY=<key> npm start
      typesense: {
        typesenseCollectionName: 'vates_federated',
        externalUrlRegex: 'docs\\.vates\\.tech|docs\\.xen-orchestra\\.com',
        typesenseServerConfig: {
          nodes: [{
            host: process.env.TYPESENSE_HOST ?? 'typesense.vates.tech',
            port: Number(process.env.TYPESENSE_PORT ?? 443),
            protocol: process.env.TYPESENSE_PROTOCOL ?? 'https',
          }],
          apiKey: process.env.TYPESENSE_SEARCH_KEY ?? 'b2806f42e60429ceecb3808a2c6bb31cc9ca955cb1e4290c',
        },
        typesenseSearchParameters: {},
        contextualSearch: false,
      },
      navbar: {
        title: 'XCP-ng Documentation',
        logo: {
          alt: 'XCP-ng logo',
          src: 'img/xcpcrop128.png',
        },
        items: [
          {href: 'https://docs.vates.tech/', label: 'Vates VMS', position: 'right'},
          {href: '/', label: 'XCP-ng', position: 'right'},
          {to: 'https://docs.xen-orchestra.com/', label: 'Xen Orchestra', position: 'right', target: '_self'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Learn',
            items: [
              {
                label: 'About XCP-ng',
                href: 'https://xcp-ng.org',
              },
              {
                label: 'XCP-ng doc',
                href: '/',
              },
              {
                label: 'Installation',
                href: '/category/installation',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Forum',
                href: 'https://xcp-ng.org/forum',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/Hr98F6wRvx',
              },
            ],
          },
          {
            title: 'Pro Support',
            items: [
              {
                label: 'Vates Stack',
                href: 'https://vates.tech',
              },
              {
                label: 'Contact us',
                href: 'https://vates.tech/contact',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'News',
                href: 'https://xcp-ng.org/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/xcp-ng/xcp-ng-org',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} XCP-ng Project, Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      // Mermaid
      mermaid: {
        options: {
          fontSize: 25,
          gantt: {
            fontSize: 25,
            barHeight: 70,
          }
        },
      },
      zoom: {
        selector: '.markdown :not(em) > img',
        background: {
          light: 'rgb(255, 255, 255)',
          dark: 'rgb(50, 50, 50)'
        },
        config: {
          // options you can specify via https://github.com/francoischalifour/medium-zoom#usage
        }
      },
    }),
  plugins: [
    require.resolve('docusaurus-plugin-image-zoom'),
    // Kept even though Typesense provides the search UI: this plugin
    // generates search-doc.json, which the federated search indexer
    // consumes (src/theme/SearchBar picks the Typesense bar).
    require.resolve('docusaurus-lunr-search'),
    [
      '@docusaurus/plugin-client-redirects',
      {
        // Whenever a page is moved or renamed, add a redirect here so the
        // old URL keeps working (external links, search engines, forum posts).
        redirects: [
          {
            from: '/troubleshooting/storage/disk-failure-softwaire-RAID/',
            to: '/troubleshooting/storage/disk-failure-software-RAID/',
          },
        ],
      },
    ],
  ],
};

module.exports = config;
