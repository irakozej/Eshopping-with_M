/**
 * Minimal, dependency-free Markdown → HTML renderer.
 *
 * Supports the subset used by our policy documents: h1–h3, paragraphs,
 * unordered (`- `) and ordered (`1. `) lists, blockquotes (`> `), horizontal
 * rules (`---`), bold (`**x**`), and links (`[text](url)`).
 *
 * Content is trusted (authored in-repo, not user input), but text is still
 * HTML-escaped before inline formatting is applied. Tailwind classes are baked
 * in so the output is styled without the typography plugin.
 */
const CLS = {
  h1: 'text-2xl font-heading font-semibold text-stone-900 mt-2 mb-4',
  h2: 'text-lg font-heading font-semibold text-stone-900 mt-8 mb-2.5',
  h3: 'text-base font-semibold text-stone-800 mt-5 mb-2',
  p:  'text-sm text-stone-600 leading-relaxed mb-4',
  ul: 'list-disc pl-5 space-y-1.5 mb-4 text-sm text-stone-600 leading-relaxed',
  ol: 'list-decimal pl-5 space-y-1.5 mb-4 text-sm text-stone-600 leading-relaxed',
  li: '',
  a:  'text-accent underline underline-offset-2 hover:text-accent-dark',
  strong: 'font-semibold text-stone-800',
  hr: 'my-7 border-stone-200',
  blockquote: 'border-l-4 border-amber-400 bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-r-lg mb-5',
};

function inline(text) {
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, `<strong class="${CLS.strong}">$1</strong>`);
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const external = /^https?:\/\//i.test(url);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a class="${CLS.a}" href="${url}"${attrs}>${label}</a>`;
  });
  return s;
}

export function renderMarkdown(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let list = null; // { type: 'ul' | 'ol', items: [] }

  const flushList = () => {
    if (!list) return;
    const items = list.items.map(i => `<li class="${CLS.li}">${inline(i)}</li>`).join('');
    html.push(`<${list.type} class="${CLS[list.type]}">${items}</${list.type}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) { flushList(); continue; }

    const ul = line.match(/^\s*-\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul) {
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
      list.items.push(ul[1]);
      continue;
    }
    if (ol) {
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
      list.items.push(ol[1]);
      continue;
    }

    flushList();

    if (line.startsWith('### ')) { html.push(`<h3 class="${CLS.h3}">${inline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## '))  { html.push(`<h2 class="${CLS.h2}">${inline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# '))   { html.push(`<h1 class="${CLS.h1}">${inline(line.slice(2))}</h1>`); continue; }
    if (/^---+$/.test(line))     { html.push(`<hr class="${CLS.hr}" />`); continue; }
    if (line.startsWith('> '))   { html.push(`<blockquote class="${CLS.blockquote}">${inline(line.slice(2))}</blockquote>`); continue; }

    html.push(`<p class="${CLS.p}">${inline(line)}</p>`);
  }

  flushList();
  return html.join('\n');
}
