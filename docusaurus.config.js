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
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/xcpcrop128.png',
  trailingSlash: true,

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

  // Mermaid graphs
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  scripts: [
    {
      src: 'https://cdn.vates.tech/rgpd/doc-xcp-ng-org.js',
      async: true,
    },
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/xcp-ng/xcp-ng-org/edit/master/',
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
      navbar: {
        title: 'XCP-ng Documentation',
        logo: {
          alt: 'XCP-ng logo',
          src: 'img/xcpcrop128.png',
        },
        items: [
          {href: 'https://xcp-ng.org', label: 'Home', position: 'right'},
          {href: 'https://xcp-ng.org/blog', label: 'Blog', position: 'right'},
          {href: 'https://vates.tech', label: 'Pro Support', position: 'right'},
          {
            href: 'https://github.com/xcp-ng',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Learn',
            items: [
              {
                label: 'Introduction',
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
      }
    }),
  plugins: [require.resolve('docusaurus-lunr-search')],
};

module.exports = config;
