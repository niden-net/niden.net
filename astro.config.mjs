// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import { rehypeCodeBlock } from './src/lib/rehype-code-block';

/**
 * Shiki theme built from the handoff's code colors. The values are the hex
 * equivalents of the oklch() the handoff specifies; Shiki cannot read oklch.
 * `string` is not in the handoff table, so it reuses the number color.
 */
/** @type {import('shiki').ThemeRegistrationRaw} */
const shikiTheme = {
    name: 'niden',
    type: 'dark',
    fg: '#cdd1d6',
    bg: '#040507',
    settings: [
        {
            scope: ['comment', 'punctuation.definition.comment', 'entity.name.tag'],
            settings: { foreground: '#77818c' },
        },
        {
            scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new'],
            settings: { foreground: '#e3a2f2' },
        },
        {
            scope: ['entity.name.type', 'entity.name.class', 'support.class', 'entity.other.inherited-class'],
            settings: { foreground: '#96e498' },
        },
        {
            scope: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.other.attribute-name'],
            settings: { foreground: '#73d3f1' },
        },
        {
            scope: ['support.type', 'variable.language', 'constant.language'],
            settings: { foreground: '#92b1d3' },
        },
        {
            scope: ['constant.numeric', 'constant.character', 'string', 'string.quoted', 'punctuation.definition.string'],
            settings: { foreground: '#eec469' },
        },
        {
            scope: ['variable', 'punctuation', 'meta.brace'],
            settings: { foreground: '#cdd1d6' },
        },
    ],
};

// https://astro.build/config
export default defineConfig({
    site: 'https://niden.net',
    integrations: [
        mdx(),
        /* email-setup is an unlisted page handed out to specific customers. */
        sitemap({ filter: (page) => !page.includes('/email-setup') }),
    ],
    markdown: {
        rehypePlugins: [rehypeCodeBlock],
        /* Mermaid fences skip Shiki; `rehypeCodeBlock` turns them into the
           `pre.mermaid` blocks the Mermaid component renders. */
        syntaxHighlight: {
            type: 'shiki',
            excludeLangs: ['mermaid', 'math'],
        },
        shikiConfig: {
            theme: shikiTheme,
            wrap: false,
        },
    },
    server: {
        host: true,
        port: 4321,
    },
    vite: {
        optimizeDeps: {
            /*
             * Pre-bundle mermaid when the dev server starts. Left to discover
             * it on demand, Vite re-optimizes mid-session and the page is then
             * holding a stale hash, which answers 504. Dev only; the build does
             * not use this.
             */
            include: ['mermaid'],
        },
    },
});
