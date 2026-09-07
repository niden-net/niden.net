import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';

import { allPosts, excerpt, postUrl } from '../lib/posts';
import { site } from '../site';

export const GET: APIRoute = async (context) => {
    const posts = await allPosts();

    return rss({
        title: site.name,
        description: site.description,
        site: context.site ?? site.url,
        items: posts.map((post) => ({
            categories: post.data.tags,
            description: excerpt(post, 400),
            link: postUrl(post),
            pubDate: post.data.date,
            title: post.data.title,
        })),
    });
};
