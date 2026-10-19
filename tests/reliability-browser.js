async (page) => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForFunction(() => window.__scrim?.sharing);
  await page.evaluate(() => __scrim.sharing.ready);
  for (const repeat of [true, false]) {
    await page.evaluate(repeat => {
      __scrim.sharing.cancelAutoplay();
      __scrim.state.loop = repeat;
      const song = ScrimScore.compile('tempo 400\nbeats 1\nsteps 1\nvoice a musicbox\npattern A\na | C5 |\nplay A');
      __scrim.player.start(song, 0);
    }, repeat);
    await page.waitForFunction(() => !__scrim.player.playing, null, { timeout: 4000 });
    assert(await page.getAttribute('#transport [data-action="stop"]', 'aria-pressed') === 'true',
      `One-shot completion releases Play, even with repeat=${repeat}`);
  }
  for (const file of ['silent-night.scrim', 'joy-to-the-world.scrim']) {
    await page.evaluate(file => __scrim.ui.select(ScrimTracks.findIndex(t => t.file === file), false), file);
    assert(await page.isDisabled('#transport [data-action="loop"]'), `${file} cannot enable an empty repeat timeline`);
    assert(await page.textContent('#v-loop') === 'Plays once', `${file} explains its one-shot behavior`);
  }
  await page.evaluate(() => __scrim.ui.select(0, false));
  assert(!(await page.isDisabled('#transport [data-action="loop"]')), 'Looping scores retain Repeat control');
  await page.evaluate(() => {
    localStorage.setItem('scrimshaw-edits', JSON.stringify({
      [ScrimTracks[0].file]: ScrimTracks[0].text + '\n# Saved private draft\n'
    }));
  });
  await page.goto('http://127.0.0.1:8765/songs/sennentuntschis-lullaby/');
  await page.waitForFunction(() => window.__scrim?.sharing);
  await page.evaluate(() => { __scrim.sharing.cancelAutoplay(); });
  assert((await page.locator('#score').inputValue()).includes('Saved private draft'), 'Direct song link reopens saved draft');
  assert((await page.textContent('#share-status')).includes('saved draft'), 'Draft origin is explained');
  const shared = await page.evaluate(async () => {
    const text = ScrimTracks[0].text + '\n# Explicit shared edit\n';
    return location.pathname + '#v=1&score=' + await ScrimSharing.encodeScore(text);
  });
  await page.goto('http://127.0.0.1:8765' + shared);
  await page.waitForFunction(() => document.querySelector('#score').value.includes('Explicit shared edit'));
  await page.evaluate(() => __scrim.sharing.cancelAutoplay());
  assert(await page.evaluate(() => JSON.parse(localStorage.getItem('scrimshaw-edits'))[ScrimTracks[0].file].includes('Saved private draft')),
    'Shared edits do not overwrite saved drafts');
  await page.goto('http://127.0.0.1:8765/songs/sennentuntschis-lullaby/');
  await page.waitForFunction(() => window.__scrim?.sharing);
  assert((await page.locator('#score').inputValue()).includes('Saved private draft'), 'Returning from shared edit recovers saved draft');
  await page.evaluate(() => {
    __scrim.sharing.cancelAutoplay();
    __scrim.player.stop();
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new DOMException('Quota reached', 'QuotaExceededError'); };
  });
  await page.locator('#score').fill((await page.locator('#score').inputValue()) + '\n# Unsaved change\n');
  assert((await page.textContent('#save-status')).includes('not saved'), 'Failed score save is visible');
  await page.evaluate(() => {
    const { cabinet } = __scrim;
    const shelf = cabinet.shelfFor('Storage test');
    const section = cabinet.addSection({ name: 'Unsaved section', shelf: shelf.id, mechanism: 'cylinder' });
    cabinet.pinAir(section.id);
  });
  assert((await page.textContent('#save-status')).includes('cabinet'), 'Failed cabinet save is visible');
  await page.evaluate(() => { Storage.prototype.setItem = originalSetItem; });
  await page.evaluate(() => __scrim.ui.select(1, false));
  await page.locator('#score').fill((await page.locator('#score').inputValue()) + '\n# Retry score save\n');
  assert(await page.evaluate(() => JSON.parse(localStorage.getItem('scrimshaw-edits'))[ScrimTracks[0].file].includes('Unsaved change')),
    'Saving another score retries all pending bundled edits');
  assert((await page.textContent('#save-status')).includes('cabinet'), 'A score save does not hide a cabinet save failure');
  await page.evaluate(() => {
    const { cabinet } = __scrim;
    cabinet.pinAir(__scrim.state.sections.find(s => s.name === 'Unsaved section').id);
  });
  assert((await page.textContent('#save-status')).includes('Saved in this browser'), 'Successful retry clears the matching failure');
  await page.reload();
  await page.waitForFunction(() => window.__scrim?.sharing);
  assert(await page.evaluate(() => __scrim.state.sections.some(s => s.name === 'Unsaved section')), 'Retried cabinet survives reload');
  await page.evaluate(() => localStorage.setItem('spieldose-cabinet', '{bad json'));
  await page.reload();
  await page.waitForFunction(() => window.__scrim?.sharing);
  assert((await page.textContent('#save-status')).includes('cabinet'), 'Failed cabinet load is visible too');
  await page.evaluate(() => { __scrim.sharing.cancelAutoplay(); __scrim.player.stop(); });
  return 'PASS: one-shot completion, saved draft recovery, shared edit isolation, visible save errors and retries';
}
