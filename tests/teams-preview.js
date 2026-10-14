'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { slug, songURL } = require('../sharing.js');

async function main() {
  const base = new URL('https://spieldose.tedt.org/');
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync('scores.js', 'utf8'), sandbox);
  // A crawler-style request checks unauthenticated raw HTML, not Teams' actual card renderer.
  const headers = { 'User-Agent': 'SkypeUriPreview' };
  await Promise.all([null, ...sandbox.window.ScrimTracks].map(async track => {
    const url = track ? songURL(base, track) : base;
    const response = await fetch(url, { headers });
    assert.equal(response.status, 200, url.href);
    assert.match(response.headers.get('content-type'), /text\/html/i);
    const head = (await response.text()).split('</head>')[0];
    for (const key of ['og:title', 'og:description', 'og:image']) {
      assert.match(head, new RegExp(`<meta property="${key}" content="[^"]+">`), key);
    }
    assert.ok(!/noindex|nofollow|noimageindex/i.test(response.headers.get('x-robots-tag') || ''), 'No restrictive crawler header');
    const imageURL = new URL(head.match(/<meta property="og:image" content="([^"]+)"/)[1]);
    assert.equal(imageURL.protocol, 'https:');
    const imageResponse = await fetch(imageURL, { headers });
    assert.equal(imageResponse.status, 200, imageURL.href);
    assert.match(imageResponse.headers.get('content-type'), /image\/png/i);
    const image = Buffer.from(await imageResponse.arrayBuffer());
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
    const local = fs.readFileSync(`assets/social/${track ? slug(track) : 'site'}.png`);
    assert.ok(image.equals(local), 'Deployed preview matches latest font-matched image');
    assert.equal(imageURL.searchParams.get('v'), createHash('sha256').update(image).digest('hex').slice(0, 12));
    console.log('PASS: publicly fetchable Teams preview fields and current PNG:', url.href);
  }));
  console.log('Site-side checks passed. Actual Teams rendering, tenant URL-preview policy and cache still require an in-Teams check.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
