/** Site-wide values. Carried over from the Jekyll `_config.yml`. */
export const site = {
    author: 'Nikolaos Dimopoulos',
    bio: 'Zend Certified Engineer, core member of Phalcon. Two decades in IT.',
    description:
        'Personal blog of Nikolaos (Nikos) Dimopoulos. Boldly goes where no other coder has gone before.... and other ramblings',
    keywords: 'php, phalcon, phalcon php, php framework, faster php framework',
    name: 'niden.net',
    url: 'https://niden.net',
    wordmark: 'niden',
    social: {
        github: 'https://github.com/niden',
        rss: '/feed.xml',
    },
};

export const nav = [
    { href: '/', label: 'Home' },
    { href: '/hosting', label: 'Hosting' },
    { href: '/tag', label: 'Tags' },
    { href: '/archive', label: 'Archive' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/disclaimer', label: 'Disclaimer' },
];

/** The reduced nav used by the tag and archive shells. */
export const navCompact = nav.filter((item) =>
    ['/', '/tag', '/archive', '/about'].includes(item.href)
);
