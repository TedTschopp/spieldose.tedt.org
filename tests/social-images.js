'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const fonts = [], draws = [], loads = [];
  let ready = false;
  const context = {
    measureText: text => ({ width: text.length * 22 }),
    drawImage() { assert.ok(ready, 'Fonts must load before drawing'); },
    fillRect() {},
    fillText(text, x, y) { draws.push({ text, x, y }); },
    set font(value) { fonts.push(value); }
  };
  const canvas = { style: {}, getContext: () => context };
  const heading = {};
  const sandbox = {
    window: {},
    document: {
      body: { append() {} },
      fonts: { load: async font => { loads.push(font); ready = true; return [{}]; } },
      querySelector: selector => selector === '.masthead h1' ? heading : null,
      createElement: () => canvas
    },
    getComputedStyle: element => ({
      fontFamily: element === heading ? '"Site Heading", sans-serif' : '"Site Body", sans-serif',
      fontWeight: element === heading ? '700' : '400',
      backgroundColor: 'black', color: 'white'
    })
  };
  vm.runInNewContext(fs.readFileSync('scripts/social-images-browser.js', 'utf8'), sandbox);
  await sandbox.window.buildSocialPreview(-1);
  assert.deepEqual(fonts, ['700 42px "Site Heading", sans-serif', '400 24px "Site Body", sans-serif']);
  assert.deepEqual(loads, fonts);
  assert.ok(draws.every(draw => draw.x >= 0 && draw.y < 630));
  assert.equal(canvas.width, 1200);
  assert.equal(canvas.height, 630);
  console.log('PASS: preview uses site heading/body fonts and waits for loading before drawing');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
