module.exports = {
  themeConfig: {
    smoothScroll: true,
    logo: 'https://xcp-ng.org/assets/img/smalllogo.png',
    lastUpdated: 'Last Updated', // add latest Git commit modification for each file
    repo: 'xcp-ng/xcp-ng-org', // point to the GH repo
    editLinks: true, // display link for people to edit a page
    editLinkText: 'Help us to improve this page!', // link text
    docsDir: 'docs',
    nav: [
      { text: 'Home', link: 'https://xcp-ng.org' },
      { text: 'News', link: 'https://xcp-ng.org/news' },
      { text: 'Pro Support', link: 'https://xcp-ng.com' },
      { text: 'Documentation', link: '/' }
    ],
    sidebar: [
      {
        title: 'XCP-ng Documentation',   // required
        path: '/',      // optional, link of the title, which should be an absolute path and must exist
        collapsable: false, // optional, defaults to true
        sidebarDepth: 1,    // optional, defaults to 1
        children: [
          ['/releases', 'Releases'],
          ['/requirements', 'Requirements'],
          ['/hcl', 'Hardware compatibility list'],
          ['/install', 'Installation'],
          ['/upgrade', 'Upgrade'],
          ['/updates', 'Updates'],
          ['/additionalpackages', 'Extra packages'],
          ['/storage', 'Storage'],
          ['/networking', 'Networking'],
          ['/compute', 'Compute'],
          ['/api', 'API'],
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
        ]
      },
      {
        title: 'Project',   // required
        path: '/project',      // optional, link of the title, which should be an absolute path and must exist
        collapsable: false, // optional, defaults to true
        sidebarDepth: 1,    // optional, defaults to 1
        children: [
          ['/contributing', 'Contributing'],
          ['/develprocess.md', 'Developement Process'],
          ['/licenses', 'Licenses'],
          ['/gitrepo', 'Git Repositories'],
          ['/mirrors', 'Mirrors'],
          ['/roadmap', 'Roadmap'],
          ['/glossary', 'Glossary'],
        ]
      },
    ]
  }
}