import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { Marked } from 'marked'

const root = process.cwd()
const docsDir = join(root, 'docs')
const outDir = join(root, 'site')
const repoUrl = 'https://github.com/16Jorgecamargo/agroserv/blob/master'
const staticEntries = ['index.html', '404.html', 'assets', 'slides', 'flowcharts']

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function slugify(text, used) {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')
  const count = used.get(base) ?? 0
  used.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

function resolveHref(href) {
  if (!href || /^[a-z]+:/i.test(href) || href.startsWith('#') || href.startsWith('/')) return href
  const [path, hash] = href.split('#')
  const suffix = hash ? `#${hash}` : ''
  if (path.startsWith('../')) return `${repoUrl}/${normalize(path.slice(3))}${suffix}`
  if (path.endsWith('.md')) return `${path.slice(0, -3)}.html${suffix}`
  return href
}

function renderMarkdown(source) {
  const used = new Map()
  let hasMermaid = false
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const id = slugify(html.replace(/<[^>]+>/g, ''), used)
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${html}</h${depth}>\n`
      },
      code({ text, lang }) {
        if (lang === 'mermaid') {
          hasMermaid = true
          return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`
        }
        return `<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(text)}</code></pre>\n`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const target = resolveHref(href)
        const external = /^https?:/.test(target)
        return `<a href="${escapeHtml(target)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' rel="noopener"' : ''}>${text}</a>`
      },
      table(token) {
        const header = token.header.map((cell) => `<th${cell.align ? ` style="text-align:${cell.align}"` : ''}>${this.parser.parseInline(cell.tokens)}</th>`).join('')
        const rows = token.rows
          .map((row) => `<tr>${row.map((cell) => `<td${cell.align ? ` style="text-align:${cell.align}"` : ''}>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`)
          .join('\n')
        return `<div class="table"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>\n`
      },
    },
  })
  const html = marked.parse(source.replace(/ markdown="1"/g, ''))
  return { html: html.replace(/href="([^"]+\.md)(#[^"]*)?"/g, (_, path, hash = '') => `href="${resolveHref(path)}${hash}"`), hasMermaid }
}

function page({ title, body, hasMermaid }) {
  const mermaid = hasMermaid
    ? `<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs'
mermaid.initialize({ startOnLoad: true, theme: 'base', fontFamily: 'Geist, Manrope, sans-serif', themeVariables: { primaryColor: '#E6F0E8', primaryBorderColor: '#2F6B45', primaryTextColor: '#17201A', lineColor: '#667085', clusterBkg: '#F7F8F5', clusterBorder: '#C9D3C5' } })
</script>`
    : ''
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#F7F8F4" />
<title>${escapeHtml(title)} · AgroServ</title>
<link rel="icon" type="image/png" sizes="32x32" href="assets/brand/favicon-32.png" />
<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&display=swap" />
<style>
@font-face { font-family: 'Manrope'; src: url('slides/fonts/manrope.woff2') format('woff2'); font-weight: 200 800; font-display: swap; unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Manrope'; src: url('slides/fonts/manrope-ext.woff2') format('woff2'); font-weight: 200 800; font-display: swap; unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
:root { --dark: #173F2A; --green: #2F6B45; --soft: #E6F0E8; --bg: #F7F8F5; --surface: #FFFFFF; --muted: #667085; --ink: #17201A; --line: #E4E8E1; --soil: #F7F8F4; --plot: #DCEBDD; --boundary: #E3E7E0; --leaf: #171B19; --sage: #5B635D; --wheat: #286B4D; }
* { box-sizing: border-box; }
html { scroll-padding-top: 88px; }
body { margin: 0; background: var(--soil); color: var(--ink); font: 16px/1.65 'Geist', 'Manrope', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
header { position: sticky; top: 0; z-index: 10; background: rgb(247 248 244 / .85); backdrop-filter: blur(10px); border-bottom: 1px solid var(--boundary); }
.bar { max-width: 1040px; margin: 0 auto; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.brand img { display: block; height: 26px; width: auto; }
.brand span { padding-left: 12px; border-left: 1px solid var(--boundary); font: 500 14px/1 'Geist', 'Manrope', sans-serif; color: var(--sage); white-space: nowrap; }
nav { display: flex; gap: 4px; flex-wrap: wrap; }
nav a { color: var(--sage); text-decoration: none; font-weight: 600; font-size: 14px; padding: 6px 10px; border-radius: 8px; }
nav a:hover { color: var(--leaf); background: var(--plot); }
main { max-width: 1040px; margin: 0 auto; padding: 40px 16px 96px; }
article { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: clamp(20px, 4vw, 56px); overflow-wrap: anywhere; }
h1, h2, h3, h4 { line-height: 1.2; letter-spacing: -.01em; position: relative; font-family: 'Geist', 'Manrope', sans-serif; letter-spacing: -.02em; }
h1 { font-size: clamp(30px, 5vw, 42px); margin: 0 0 24px; letter-spacing: -.02em; }
h2 { font-size: 26px; margin: 48px 0 16px; padding-top: 24px; border-top: 1px solid var(--line); }
h3 { font-size: 20px; margin: 32px 0 12px; }
.anchor { position: absolute; left: -1em; color: var(--green); text-decoration: none; opacity: 0; padding-right: .3em; }
h1:hover .anchor, h2:hover .anchor, h3:hover .anchor, h4:hover .anchor { opacity: .7; }
a { color: var(--green); text-underline-offset: 3px; }
p, li { color: #2B3830; }
code { font: 0.88em ui-monospace, 'SF Mono', Menlo, monospace; background: var(--soft); padding: .12em .4em; border-radius: 6px; }
pre { background: #10261A; color: #E6F0E8; padding: 18px 20px; border-radius: 12px; overflow-x: auto; font-size: 14px; line-height: 1.55; }
pre code { background: none; padding: 0; color: inherit; }
pre.mermaid { background: var(--bg); color: var(--ink); border: 1px solid var(--line); text-align: center; }
.table { overflow-x: auto; margin: 20px 0; border: 1px solid var(--line); border-radius: 12px; }
table { border-collapse: collapse; width: 100%; font-size: 14.5px; }
th, td { padding: 10px 14px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
th { background: var(--bg); font-weight: 700; }
tr:last-child td { border-bottom: 0; }
blockquote { margin: 20px 0; padding: 12px 18px; border-left: 4px solid var(--green); background: var(--soft); border-radius: 0 12px 12px 0; }
blockquote p { margin: 0; }
img { max-width: 100%; height: auto; }
details { margin: 12px 0 28px; border: 1px solid var(--line); border-radius: 12px; padding: 10px 16px; }
summary { cursor: pointer; font-weight: 700; color: var(--green); }
hr { border: 0; border-top: 1px solid var(--line); margin: 32px 0; }
footer { max-width: 1040px; margin: 0 auto; padding: 0 16px 48px; color: var(--sage); font-size: 14px; }
footer a { color: var(--leaf); }
@media (max-width: 560px) { .brand span { display: none; } }
</style>
</head>
<body>
<header><div class="bar"><a class="brand" href="./" aria-label="AgroServ, página do projeto"><img src="assets/brand/logo-horizontal.png" alt="AgroServ" width="101" height="26" /><span>Página do projeto</span></a><nav><a href="./">Início</a><a href="app/">App</a><a href="slides/full-stack/">Apresentação</a><a href="slides/second-phase/">Etapa 2</a><a href="system-flowchart.html">Sistema</a><a href="api-contract.html">API</a></nav></div></header>
<main><article>
${body}
</article></main>
<footer>AgroServ, UTFPR Campus Santa Helena. <a href="https://github.com/16Jorgecamargo/agroserv">Código no GitHub</a></footer>
${mermaid}
</body>
</html>
`
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

staticEntries.forEach((entry) => {
  const source = join(docsDir, entry)
  if (existsSync(source)) cpSync(source, join(outDir, entry), { recursive: true })
})

const markdownFiles = readdirSync(docsDir).filter((file) => file.endsWith('.md'))
markdownFiles.forEach((file) => {
  const source = readFileSync(join(docsDir, file), 'utf8')
  const title = source.match(/^#\s+(.+)$/m)?.[1].replace(/^AgroServ\s+—\s+/, '') ?? file
  const { html, hasMermaid } = renderMarkdown(source)
  writeFileSync(join(outDir, file.replace(/\.md$/, '.html')), page({ title, body: html, hasMermaid }))
})

console.log(`site: ${markdownFiles.length} documents, ${staticEntries.length} static entries`)
