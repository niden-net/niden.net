import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Post filenames keep the Jekyll shape `YYYY-MM-DD-slug.md`. Posts sit in a
 * folder per year, and `entry` carries that folder (`2026/2026-12-25-slug.mdx`).
 * The URL uses the slug part only: the folder and the date are dropped here,
 * so `/post/:slug/` stays the same as the current site.
 */
const stripDatePrefix = ({ entry }: { entry: string }): string =>
    entry
        .replace(/^.*\//, '')
        .replace(/\.[^.]+$/, '')
        .replace(/^\d{4}-\d{2}-\d{2}-/, '');

const posts = defineCollection({
    loader: glob({
        base: './src/content/posts',
        pattern: '**/*.{md,mdx}',
        generateId: stripDatePrefix,
    }),
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        categories: z.array(z.string()).optional(),
        draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
    loader: glob({
        base: './src/content/pages',
        pattern: '**/*.{md,mdx}',
    }),
    schema: z.object({
        title: z.string(),
        permalink: z.string(),
        credentials: z.array(z.object({ href: z.string(), label: z.string() })).optional(),
        lead: z.string().optional(),
    }),
});

export const collections = { pages, posts };
