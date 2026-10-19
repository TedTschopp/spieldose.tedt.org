'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const share = require('../sharing.js');
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync('scores.js', 'utf8'), sandbox);
  const tracks = sandbox.window.ScrimTracks;
  const base = new URL('https://spieldose.tedt.org/');
  assert.equal(share.slug(tracks[0]), 'sennentuntschis-lullaby');
  for (let i = 0; i < tracks.length; i++) {
    const url = share.songURL(base, tracks[i]);
    assert.equal(share.resolve(url, base, tracks), i);
    assert.equal(share.resolve(new URL(`?song=${share.slug(tracks[i])}`, base), base, tracks), i);
  }
  assert.equal(share.resolve(base, base, tracks), -1);
  assert.throws(() => share.resolve(new URL('songs/not-a-song/', base), base, tracks), /not found/i);
  assert.throws(() => share.resolve(new URL('?song=missing', base), base, tracks), /not found/i);
  const text = tracks[2].text + '\n# Grüezi, 世界 🎵\n';
  const encoded = await share.encodeScore(text);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.equal(await share.decodeScore(encoded), text);
  await assert.rejects(share.decodeScore('%%%'), /invalid/i);
  await assert.rejects(share.decodeScore('a'.repeat(share.MAX_LINK_LENGTH + 1)), /invalid/i);
  await assert.rejects(share.encodeScore('a'.repeat(share.MAX_SCORE_BYTES + 1)), /too large/i);
  assert.equal(await share.decodeScore(await share.encodeScore('a'.repeat(share.MAX_SCORE_BYTES))),
    'a'.repeat(share.MAX_SCORE_BYTES));
  const bomb = await new Response(new Blob(['a'.repeat(share.MAX_SCORE_BYTES + 1)]).stream()
    .pipeThrough(new CompressionStream('deflate'))).arrayBuffer();
  const bombLink = Buffer.from(bomb).toString('base64url');
  await assert.rejects(share.decodeScore(bombLink), /too large/i);
  for (let i = -1; i < tracks.length; i++) {
    const slug = i < 0 ? 'site' : share.slug(tracks[i]);
    const filename = i < 0 ? 'index.html' : `songs/${slug}/index.html`;
    const html = fs.readFileSync(filename, 'utf8');
    const title = i < 0 ? 'Swiss Music Box' : tracks[i].text.match(/^title\s+(.+)$/m)[1];
    assert.ok(html.includes(title.replaceAll("'", '&#39;')), `${filename} title`);
    assert.match(html, /<html lang="en">/);
    for (const key of ['description', 'robots', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
      assert.match(html, new RegExp(`<meta name="${key}" content="[^"]+">`));
    }
    for (const key of ['og:title', 'og:description', 'og:url', 'og:type', 'og:image', 'og:image:alt', 'og:image:width', 'og:image:height', 'og:site_name']) {
      assert.match(html, new RegExp(`<meta property="${key}" content="[^"]+">`));
    }
    const canonical = i < 0 ? base.href : share.songURL(base, tracks[i]).href;
    const unlisted = i >= 0 && sandbox.window.ScrimCabinet.sections.find(s => s.id === tracks[i].section).unlisted;
    assert.ok(html.includes(`<meta name="robots" content="${unlisted ? 'noindex' : 'index'},follow,max-image-preview:large">`));
    if (i >= 0) assert.equal(fs.readFileSync('sitemap.xml', 'utf8').includes(canonical), !unlisted,
      'Only listed songs belong in the sitemap');
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${canonical}">`));
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.ok(graph['@graph'].some(n => n['@type'] === (i < 0 ? 'WebSite' : 'MusicComposition')));
    assert.ok(fs.existsSync(`assets/social/${slug}.png`), `image ${slug}`);
    const image = fs.readFileSync(`assets/social/${slug}.png`);
    const version = require('node:crypto').createHash('sha256').update(image).digest('hex').slice(0, 12);
    assert.ok(html.includes(`${slug}.png?v=${version}`), 'Preview image URL must change when image changes');
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
    const head = html.slice(0, html.indexOf('</head>'));
    assert.ok(head.includes('og:title'), 'metadata is in raw HTML head');
    assert.equal((html.match(/<title>/g) || []).length, 1);
  }
  assert.ok(fs.readFileSync('sitemap.xml', 'utf8').includes(share.songURL(base, tracks[5]).href));
  assert.match(fs.readFileSync('robots.txt', 'utf8'), /Sitemap: https:/);
  console.log('PASS: song routes, Unicode edited-score round trips, input limits, static metadata, images and sitemap');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
