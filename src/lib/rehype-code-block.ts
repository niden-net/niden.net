import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

const hasClass = (node: Element | undefined, name: string): boolean => {
    const classes = node?.properties?.className;

    return Array.isArray(classes) && classes.includes(name);
};

/**
 * Wraps every highlighted `<pre>` in the figure the design asks for: a header
 * strip carrying the language (or the fence's `title=`) and a Copy button. The
 * strip is built here, not in the browser, so it is there with JS off.
 *
 * A ```mermaid fence is left for the Mermaid component instead: it becomes a
 * bare `pre.mermaid` holding the diagram source.
 */
export function rehypeCodeBlock() {
    return (tree: Root): void => {
        visit(tree, 'element', (node: Element, index, parent) => {
            if (node.tagName !== 'pre' || parent === undefined || index === undefined) {
                return;
            }

            if ((parent as Element).tagName === 'figure' || hasClass(node, 'mermaid')) {
                return;
            }

            const code = node.children.find(
                (child): child is Element =>
                    child.type === 'element' && child.tagName === 'code'
            );

            if (hasClass(code, 'language-mermaid')) {
                parent.children[index] = {
                    type: 'element',
                    tagName: 'pre',
                    properties: { className: ['mermaid'] },
                    children: code?.children ?? [],
                };

                return;
            }

            const language = String(node.properties?.dataLanguage ?? '').trim();
            const label = language === '' || language === 'plaintext' ? 'code' : language;

            const figure: Element = {
                type: 'element',
                tagName: 'figure',
                properties: { className: ['code-block'] },
                children: [
                    {
                        type: 'element',
                        tagName: 'div',
                        properties: { className: ['code-head'] },
                        children: [
                            {
                                type: 'element',
                                tagName: 'span',
                                properties: { className: ['code-name'] },
                                children: [{ type: 'text', value: label }],
                            },
                            {
                                type: 'element',
                                tagName: 'button',
                                properties: {
                                    className: ['code-copy'],
                                    type: 'button',
                                    dataCopy: '',
                                },
                                children: [{ type: 'text', value: 'Copy' }],
                            },
                        ],
                    },
                    node,
                ],
            };

            parent.children[index] = figure;
        });
    };
}
