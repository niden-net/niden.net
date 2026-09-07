import type { APIRoute } from 'astro';
import { allPosts, excerpt, formatDate, postUrl, tagCounts, tagUrl } from '../lib/posts';

/** Static search index. Built once; matched client-side. */
export const GET: APIRoute = async () => {
    const posts = await allPosts();

    const body = {
        posts: posts.map((post) => ({
            date: formatDate(post.data.date),
            excerpt: excerpt(post, 140),
            tags: post.data.tags,
            title: post.data.title,
            url: postUrl(post),
        })),
        tags: tagCounts(posts).map((item) => ({
            count: item.count,
            tag: item.tag,
            url: tagUrl(item.tag),
        })),
    };

    return new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json' },
    });
};
