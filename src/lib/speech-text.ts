import { MarkdownIt } from 'react-native-markdown-display';

const markdown = new MarkdownIt({ html: false });
type Token = { type: string; content: string; children?: Token[] | null; block?: boolean; nesting?: number };

/** Speak the rendered words, not Markdown delimiters or link destinations. */
export function speechText(source: string): string {
  const read = (tokens: Token[]): string => tokens.map(token => {
    if (token.children) return read(token.children);
    if (['text', 'code_inline', 'code_block', 'fence', 'image'].includes(token.type)) return token.content;
    if (['softbreak', 'hardbreak', 'hr'].includes(token.type) || (token.block && token.nesting === -1)) return '\n';
    if (token.type === 'td_close' || token.type === 'th_close') return '; ';
    return '';
  }).join('');
  return read(markdown.parse(source, {})).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function speechChunks(text: string, maximum: number): string[] {
  const limit = Math.max(2, Math.min(3000, Math.floor(maximum) || 3000));
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    let end = rest.lastIndexOf(' ', limit);
    if (end < limit / 2) end = limit;
    // Do not split an emoji's UTF-16 surrogate pair.
    if (/[\uD800-\uDBFF]/.test(rest[end - 1])) end--;
    chunks.push(rest.slice(0, end));
    rest = rest.slice(end).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}
