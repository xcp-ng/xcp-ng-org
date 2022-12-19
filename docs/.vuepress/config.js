module.exports = {
  title: 'XCP-ng documentation',
  description: 'Official XCP-ng documentation',
  head: [
    ['link', { rel: "shortcut icon", href: "https://xcp-ng.org/favicon.png"}],
  ],
  base: '/docs/',
  themeConfig: {
    smoothScroll: false,
    logo: 'https://xcp-ng.org/assets/img/smalllogo_notext.png',
    // "abuse" lastUpdated label to add the License in the footer
    lastUpdated: 'License: CC BY-SA 2.0 - Last Updated', // add latest Git commit modification for each file
    repo: 'xcp-ng/xcp-ng-org', // point to the GH repo
    editLinks: true, // display link for people to edit a page
    editLinkText: 'Help us to improve this page!', // link text
    docsDir: 'docs',
    algolia: {
      apiKey: '9247f863f432d8ed6e58f97cb5dde6e4',
      indexName: 'xcp-ng'
    },
    nav: [
      { text: 'Home', link: 'https://xcp-ng.org' },
      { text: 'News', link: 'https://xcp-ng.org/news' },
      { text: 'Pro Support', link: 'https://xcp-ng.com' },
      { text: 'Documentation', link: '/' }
    ],
    sidebar: [
      {
        title: 'XCP-ng',   // required
        path: '/',      // optional, link of the title, which should be an absolute path and must exist
        collapsable: false, // optional, defaults to true
        sidebarDepth: 1,    // optional, defaults to 1
        children: [
          ['/releases', 'Releases'],
          ['/requirements', 'Requirements'],
          ['/hardware', 'Hardware support'],
          ['/install', 'Installation'],
          ['/upgrade', 'Upgrade'],
          ['/updates', 'Updates'],
          ['/storage', 'Storage'],
          ['/networking', 'Networking'],
          ['/compute', 'Compute & GPU'],
          ['/guests','VM & Guests tools'],
          ['/api', 'API'],
          ['/additionalpackages', 'Additional packages'],
          ['/troubleshooting', 'Troubleshooting'],
        ]
      },
      {
        title: 'Management & Backup',   // required
        path: '/manage',      // optional, link of the title, which should be an absolute path and must exist
        collapsable: false, // optional, defaults to true
        sidebarDepth: 1,    // optional, defaults to 1
        children: [
          ['/management', 'Management'],
          ['/backup', 'Backup'],
          ['/cloud', 'Cloud'],
          ['/hosting', 'Hosting'],
          ['/migratetoxcpng', 'Migrate to XCP-ng'],
          ['/ha', 'High Availability'],
          ['/guides', 'Guides'],
        ]
      },
      {
        title: 'Project',   // required
        path: '/project',      // optional, link of the title, which should be an absolute path and must exist
        collapsable: false, // optional, defaults to true
        sidebarDepth: 1,    // optional, defaults to 1
        children: [
          ['/ecosystem', 'Ecosystem'],
          ['/security', 'Security'],
          ['/contributing', 'Contributing'],
          ['/architecture', 'Architecture'],
          ['/develprocess', 'Development Process'],
          ['/licenses', 'Licenses'],
          ['/brand-guidelines', 'Brand Guidelines'],
          ['/gitrepo', 'Git Repositories'],
          ['/mirrors', 'Mirrors'],
          ['/roadmap', 'Roadmap'],
        ]
      },
      {
        title: 'Appendix',// required
        collapsable: false, // optional, defaults to true
        sidebarDepth: 1,    // optional, defaults to 1
        children: [
          ['/glossary', 'Glossary'],
          ['/cli_reference', 'CLI reference'],
          ['/answerfile', 'Answer file'],
        ]
      },
    ]
  }
}
