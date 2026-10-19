async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const origin = 'http://127.0.0.1:8765';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.sharedLinks = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => {
        if (window.blockCopy) throw new Error('Test clipboard denial');
        window.sharedLinks.push(text);
      }
    } });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.nativeShared = data; } });
  });
  await page.goto(origin);
  await page.waitForFunction(() => window.__scrim?.sharing);
  assert(new URL(page.url()).pathname === '/', 'Root stays generic before a selection');
  await page.evaluate(() => __scrim.ui.select(2, false));
  assert(page.url().includes('/songs/wildmannlis-midnight-dance/'), 'Selection updates song URL');
  await page.evaluate(() => __scrim.ui.select(4, false));
  await page.goBack();
  await page.waitForFunction(() => __scrim.state.idx === 2);
  await page.goForward();
  await page.waitForFunction(() => __scrim.state.idx === 4);
  await page.click('#v-stop');
  await page.click('#b-share');
  await page.waitForFunction(() => sharedLinks.length === 1);
  assert(await page.evaluate(() => sharedLinks[0] === location.href), 'Copied song URL matches current URL');
  await page.click('#b-share-site');
  await page.waitForFunction(() => sharedLinks.length === 2);
  assert(await page.evaluate(() => sharedLinks[1] === new URL('.', document.baseURI).href), 'Separate website link');
  const original = await page.locator('#score').inputValue();
  const edited = original + '\n# Shared edit: Grüezi 世界\n';
  const stored = await page.evaluate(() => localStorage.getItem('scrimshaw-edits'));
  try {
    await page.locator('#score').fill(edited);
    await page.click('#b-share');
    await page.waitForFunction(() => sharedLinks.length === 3);
    const url = await page.evaluate(() => sharedLinks[2]);
    assert(url.includes('#v=1&score='), 'Edited score fragment is present');
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('#score').value.includes('Grüezi'));
    assert(await page.locator('#score').inputValue() === edited, 'Exact Unicode score round trip');
    await page.click('#v-stop');
    await page.evaluate(() => window.blockCopy = true);
    await page.click('#b-share');
    await page.waitForFunction(() => !document.querySelector('#share-link').hidden);
    assert(await page.locator('#share-link').inputValue() === url, 'Clipboard denial offers exact selectable link');
    await page.evaluate(() => window.blockCopy = false);
    await page.focus('#b-native-share');
    await page.waitForTimeout(100);
    await page.click('#b-native-share');
    await page.waitForFunction(() => window.nativeShared);
    assert(await page.evaluate(() => nativeShared.url === location.href), 'Native share includes exact score URL');
    await page.goto(url.split('#')[0] + '#v=1&score=bad');
    await page.waitForFunction(() => document.querySelector('#share-status').textContent.includes('Invalid'));
    assert(await page.evaluate(() => !__scrim.player.playing), 'Malformed link does not autoplay');
    const invalid = await page.evaluate(() => ScrimSharing.encodeScore('voice lead invalid-instrument\nloop missing'));
    await page.goto(url.split('#')[0] + '#v=1&score=' + invalid);
    await page.waitForFunction(() => document.querySelector('#share-status').textContent.includes('score has errors'));
    assert(await page.evaluate(() => !__scrim.player.playing), 'Invalid score does not autoplay');
    await page.goto(origin + '/songs/do-not-wake-the-rollibock/');
    await page.waitForFunction(() => __scrim.state.idx === 3);
    assert(await page.title() === 'Do Not Wake the Rollibock | Swiss Music Box', 'Direct route restores song and title');
    assert(await page.locator('#score').inputValue() === await page.evaluate(() => ScrimTracks[3].text), 'Bundled permalink uses bundled score');
    await page.click('#v-stop');
    // Deterministic blocked autoplay and cancellation, independent of browser policy.
    await page.evaluate(async () => {
      window.realEnsure = __scrim.player.ensure;
      __scrim.player.ensure = () => ({ state: 'suspended', resume: () => new Promise(() => {}) });
      history.pushState(null, '', '/songs/sennentuntschis-lullaby/');
      await __scrim.sharing.restore();
    });
    await page.waitForFunction(() => document.querySelector('#share-status').textContent.includes('blocked autoplay'));
    assert(await page.evaluate(() => !__scrim.player.playing), 'Suspended audio never claims playback');
    await page.evaluate(() => {
      __scrim.sharing.restore();
      document.querySelector('#v-stop').click();
      document.querySelector('#share-status').textContent = 'Stopped';
    });
    await page.waitForTimeout(1400);
    assert(await page.locator('#share-status').textContent() === 'Stopped', 'Stop cancels pending autoplay');
    await page.evaluate(() => __scrim.player.ensure = realEnsure);
    await page.click('#v-play');
    await page.waitForFunction(() => __scrim.player.playing && __scrim.player.ctx.state === 'running');
    await page.click('#v-stop');
    await page.goto(origin + '/songs/devils-bridge-mazurka/');
    await page.waitForFunction(() => __scrim.state.idx === 5);
    const head = await page.locator('head').innerHTML();
    assert(head.includes('devils-bridge-mazurka.png'), 'Nested route loads dedicated raw preview metadata');
    assert(await page.evaluate(() => typeof ScrimSharing === 'object' && ScrimTracks.length > 6 && typeof ScrimCabinet === 'object'), 'Nested route loads root assets');
    await page.evaluate(() => localStorage.setItem('scrimshaw-edits', JSON.stringify({
      [ScrimTracks[0].file]: ScrimTracks[0].text + '\n# Private local draft\n'
    })));
    await page.goto(origin + '/songs/sennentuntschis-lullaby/');
    await page.waitForFunction(() => __scrim.state.idx === 0);
    assert((await page.locator('#score').inputValue()).includes('Private local draft'), 'Ordinary song link reopens its private saved draft');
    await page.evaluate(() => __scrim.ui.select(1, false));
    await page.locator('#score').fill(await page.locator('#score').inputValue() + '\n# Another local edit\n');
    assert(await page.evaluate(() => JSON.parse(localStorage.getItem('scrimshaw-edits'))[ScrimTracks[0].file]?.includes('Private local draft')),
      'Opening a bundled permalink must not discard a private draft when another track is edited');
    assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  } finally {
    await page.evaluate(value => {
      __scrim.player.stop();
      if (value === null) localStorage.removeItem('scrimshaw-edits');
      else localStorage.setItem('scrimshaw-edits', value);
    }, stored);
  }
  return 'PASS: URL selection/history, copied site/song links, edited Unicode round trip, clipboard fallback, native share, bad links, direct routes, blocked autoplay, cancellation and gesture playback';
}
