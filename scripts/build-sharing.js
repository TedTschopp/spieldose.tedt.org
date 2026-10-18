'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { slug, songURL } = require('../sharing.js');
const base = new URL('https://spieldose.tedt.org/');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync('scores.js', 'utf8'), sandbox);
const tracks = sandbox.window.ScrimTracks;
const cabinet = sandbox.window.ScrimCabinet;
const sectionOf = track => cabinet.sections.find(s => s.id === track.section);
const mechanismOf = track => cabinet.mechanisms[sectionOf(track).mechanism];
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const field = (track, name) => track.text.match(new RegExp(`^${name}\\s+(.+)$`, 'm'))?.[1] || '';
const siteDescription = `A cabinet of ${tracks.length} music box airs on pinned cylinders, steel discs, organ barrels and piano rolls, played live by a synthesizer in a moonlit Alpine village. Listen, edit the scores, and share your music.`;
let template = fs.readFileSync('index.html', 'utf8');
function output(filename, content) {
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(filename) || fs.readFileSync(filename, 'utf8') !== content) {
      throw new Error(`${filename} is out of date. Run node scripts/build-sharing.js`);
    }
  } else {
    fs.mkdirSync(require('node:path').dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
  }
}

function metadata(track) {
  const title = track ? `${field(track, 'title')} | Swiss Music Box` : 'Swiss Music Box';
  const description = track ? `${field(track, 'about')} From the ${sectionOf(track).name} ${mechanismOf(track).name.toLowerCase()} in the Swiss Music Box. Listen, edit, and share it.` : siteDescription;
  const url = track ? songURL(base, track).href : base.href;
  const imagePath = `assets/social/${track ? slug(track) : 'site'}.png`;
  const imageVersion = createHash('sha256').update(fs.readFileSync(imagePath)).digest('hex').slice(0, 12);
  const image = new URL(`${imagePath}?v=${imageVersion}`, base).href;
  const alt = track ? `${field(track, 'title')}, from the ${sectionOf(track).name} ${mechanismOf(track).name.toLowerCase()}, in the Swiss Music Box moonlit Alpine village` : 'Swiss Music Box: a moonlit Swiss Alpine village above a cabinet of music box airs';
  const graph = [
    { '@type': 'WebSite', '@id': base.href + '#website', url: base.href, name: 'Swiss Music Box', description: siteDescription, inLanguage: 'en' },
    { '@type': 'WebApplication', '@id': base.href + '#app', name: 'Swiss Music Box', url: base.href, applicationCategory: 'MultimediaApplication', operatingSystem: 'Web browser', browserRequirements: 'Requires JavaScript and Web Audio API', isAccessibleForFree: true, license: new URL('LICENSE', base).href },
    { '@type': 'WebPage', '@id': url + '#page', url, name: title, description, inLanguage: 'en', isPartOf: { '@id': base.href + '#website' }, primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 }, ...(track ? { mainEntity: { '@id': url + '#composition' } } : {}) }
  ];
  if (track) graph.push({ '@type': 'MusicComposition', '@id': url + '#composition', name: field(track, 'title'), description: field(track, 'about'), url, isAccessibleForFree: true });
  const tags = [
    `<base href="${track ? '../../' : './'}">`,
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    '<meta name="theme-color" content="#171f22">',
    `<link rel="canonical" href="${url}">`,
    '<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">'
  ];
  for (const [name, value] of Object.entries({
    'og:type': 'website', 'og:site_name': 'Swiss Music Box', 'og:locale': 'en_US',
    'og:title': title, 'og:description': description, 'og:url': url,
    'og:image': image, 'og:image:secure_url': image, 'og:image:type': 'image/png',
    'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': alt
  })) tags.push(`<meta property="${name}" content="${escape(value)}">`);
  for (const [name, value] of Object.entries({
    'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description,
    'twitter:image': image, 'twitter:image:alt': alt
  })) tags.push(`<meta name="${name}" content="${escape(value)}">`);
  tags.push(`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`);
  return `<!-- social-metadata:start -->\n${tags.join('\n')}\n<!-- social-metadata:end -->`;
}

const links = `<nav aria-label="Song permalinks">${cabinet.sections.map(section => `<p><b>${escape(section.name)}</b> (${escape(cabinet.mechanisms[section.mechanism].name.toLowerCase())}): ${tracks.filter(t => t.section === section.id).map(track => `<a href="songs/${slug(track)}/">${escape(field(track, 'title'))}</a>`).join(' · ')}</p>`).join('')}<p><a href="./">Swiss Music Box home</a></p></nav>`;
template = template.replace(/<!-- song-links:start -->[\s\S]*?<!-- song-links:end -->\n?/, '');
template = template.replace(/<!-- song-about:start -->[\s\S]*?<!-- song-about:end -->\n?/, '');
template = template.replace('  <footer>', `<!-- song-links:start -->${links}<!-- song-links:end -->\n  <footer>`);
for (const track of [null, ...tracks]) {
  let html = template.replace(/<!-- social-metadata:start -->[\s\S]*?<!-- social-metadata:end -->/, metadata(track));
  html = html.replace('<!-- song-links:start -->', `<!-- song-about:start --><section id="song-about" aria-label="About this tune"${track ? '' : ' hidden'}><h2>${track ? escape(field(track, 'title')) : ''}</h2><p>${track ? escape(field(track, 'about')) : ''}</p></section><!-- song-about:end -->\n<!-- song-links:start -->`);
  const filename = track ? `songs/${slug(track)}/index.html` : 'index.html';
  output(filename, html);
}
output('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[base.href, ...tracks.map(t => songURL(base, t).href)].map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`);
output('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', base).href}\n`);
console.log(`Generated site metadata, ${tracks.length} song pages, sitemap and robots.txt`);
