import getReadingTime from 'reading-time';
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** "design patterns" -> "design-patterns". Matches the current tag URLs. */
export function tagSlug(tag: string): string {
    return tag
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/** Jekyll permalink shape: `/post/:slug/`. The trailing slash matters. */
export function postUrl(post: Post): string {
    return `/post/${post.id}/`;
}

export function tagUrl(tag: string): string {
    return `/tag/${tagSlug(tag)}/`;
}

/** "05 Nov 2025" */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

/** "05 Nov" - the archive rows */
export function formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
    }).format(date);
}

/** "2025-11-05" - the home list rows */
export function formatIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/** Every published post, newest first. */
export async function allPosts(): Promise<Post[]> {
    const posts = await getCollection('posts', ({ data }) => data.draft !== true);

    return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export interface TagCount {
    count: number;
    slug: string;
    tag: string;
}

/** Every tag with its post count, most used first. */
export function tagCounts(posts: Post[]): TagCount[] {
    const counts = new Map<string, number>();

    for (const post of posts) {
        for (const tag of post.data.tags) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }

    return [...counts.entries()]
        .map(([tag, count]) => ({ count, slug: tagSlug(tag), tag }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Same-tag posts ranked by shared-tag count, then recency. The current post is
 * excluded. Returns an empty list when nothing shares a tag.
 */
export function relatedPosts(current: Post, posts: Post[], limit = 3): Post[] {
    const tags = new Set(current.data.tags);

    if (tags.size === 0) {
        return [];
    }

    return posts
        .filter((post) => post.id !== current.id)
        .map((post) => ({
            post,
            shared: post.data.tags.filter((tag) => tags.has(tag)).length,
        }))
        .filter((item) => item.shared > 0)
        .sort(
            (a, b) =>
                b.shared - a.shared ||
                b.post.data.date.valueOf() - a.post.data.date.valueOf()
        )
        .slice(0, limit)
        .map((item) => item.post);
}

/** Posts grouped by year, newest year first. */
export function groupByYear(posts: Post[]): Array<{ posts: Post[]; year: number }> {
    const groups = new Map<number, Post[]>();

    for (const post of posts) {
        const year = post.data.date.getUTCFullYear();
        groups.set(year, [...(groups.get(year) ?? []), post]);
    }

    return [...groups.entries()]
        .map(([year, items]) => ({ posts: items, year }))
        .sort((a, b) => b.year - a.year);
}

/**
 * Reading time in whole minutes, computed from the raw markdown body. The body
 * is already in the data store, so list pages do not have to render each post.
 */
export function readingMinutes(post: Post): number {
    return Math.max(1, Math.round(getReadingTime(post.body ?? '').minutes));
}

/**
 * The first paragraph of the body, with the light markdown syntax removed. This
 * is the same text Jekyll produced with `excerpt_separator: "\n\n"`.
 */
export function excerpt(post: Post, limit = 320): string {
    const body = (post.body ?? '')
        .replace(/^---[\s\S]*?---\s*/, '')
        .replace(/^\s*(?:#{1,6}\s.*|!\[[^\]]*\]\([^)]*\)|<[^>]+>)\s*$/gm, '')
        .trim();

    const paragraph = body.split(/\n\s*\n/).find((block) => block.trim().length > 0) ?? '';

    const text = paragraph
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

/** The current post's tag that the related set shares most often. */
export function primarySharedTag(current: Post, related: Post[]): string | undefined {
    let best: string | undefined;
    let bestCount = 0;

    for (const tag of current.data.tags) {
        const count = related.filter((post) => post.data.tags.includes(tag)).length;

        if (count > bestCount) {
            best = tag;
            bestCount = count;
        }
    }

    return best;
}
