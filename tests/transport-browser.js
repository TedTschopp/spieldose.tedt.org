async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForFunction(() => window.__scrim?.ui);
  const deck = await page.evaluate(() => [...document.querySelectorAll('#transport button')]
    .map(b => b.dataset.action));
  assert(JSON.stringify(deck) === JSON.stringify(['prev', 'stop', 'play', 'next', 'loop']),
    `Deck order is prev, stop, play, next, loop (got ${deck})`);
  const pressed = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#transport button')]
    .filter(b => b.hasAttribute('aria-pressed')).map(b => [b.dataset.action, b.getAttribute('aria-pressed')])));
  const counter = () => page.textContent('#transport-count');
  const total = await page.evaluate(() => __scrim.state.songs.length);
  assert(!(await page.textContent('#caption')).match(/Press|Stop/), 'No Press Play / Stop wording remains');
  let p = await pressed();
  assert(p.stop === 'true' && p.play === 'false', 'Stopped deck shows stop held down');
  assert(await counter() === `1 / ${total}`, 'Counter shows first track');
  const tagline = () => page.evaluate(() => {
    const el = document.querySelector('#caption-about');
    const song = __scrim.state.songs[__scrim.player.playing ? __scrim.player.idx : __scrim.state.idx];
    return { shown: !el.hidden && el.offsetHeight > 0, text: el.textContent, want: song.about.split('.')[0] };
  });
  let t = await tagline();
  assert(t.shown && t.text && t.text === t.want, `Stopped caption already shows the selected song tagline (${JSON.stringify(t)})`);
  const captionHeight = () => page.evaluate(() => document.querySelector('#caption').getBoundingClientRect().height);
  const stoppedHeight = await captionHeight();

  await page.click('#transport [data-action="next"]');
  assert(await page.evaluate(() => __scrim.state.idx) === 1, 'Next selects the following track');
  assert(await page.evaluate(() => !__scrim.player.playing), 'Next while stopped does not start playback');
  assert(await counter() === `2 / ${total}`, 'Counter follows next');
  t = await tagline();
  assert(t.shown && t.text === t.want, 'Tagline follows the selected song while stopped');
  await page.click('#transport [data-action="prev"]');
  await page.click('#transport [data-action="prev"]');
  assert(await page.evaluate(() => __scrim.state.idx) === total - 1, 'Previous wraps to the last track');

  await page.click('#transport [data-action="play"]');
  await page.waitForFunction(() => __scrim.player.playing);
  p = await pressed();
  assert(p.play === 'true' && p.stop === 'false', 'Playing deck shows play held down');
  t = await tagline();
  assert(t.shown && t.text === t.want, 'Tagline stays put while playing');
  assert(Math.abs(await captionHeight() - stoppedHeight) < 1, 'Caption does not jump when playback starts');
  await page.click('#transport [data-action="next"]');
  await page.waitForFunction(() => __scrim.player.playing && __scrim.player.idx === 0);
  assert(await counter() === `1 / ${total}`, 'Next wraps to the first track and keeps playing');

  const loopBefore = await page.evaluate(() => __scrim.state.loop);
  await page.click('#transport [data-action="loop"]');
  assert(await page.evaluate(() => __scrim.state.loop) === !loopBefore, 'Loop toggles looping');
  assert((await pressed()).loop === String(!loopBefore), 'Loop shows its latched state');
  assert(await page.evaluate(() => document.querySelector('#v-loop').getAttribute('aria-pressed')) === String(!loopBefore),
    'Loop stays in sync with the panel Loop verb');
  await page.click('#transport [data-action="loop"]');

  await page.click('#transport [data-action="stop"]');
  assert(await page.evaluate(() => !__scrim.player.playing), 'Stop halts playback');
  p = await pressed();
  assert(p.stop === 'true' && p.play === 'false', 'Stop latches down again');
  for (const action of ['prev', 'stop', 'play', 'next', 'loop'])
    assert(await page.getAttribute(`#transport [data-action="${action}"]`, 'aria-label'), `${action} has an accessible name`);
  assert(!errors.length, `No page errors: ${errors.join('; ')}`);
  for (const width of [1400, 700, 420]) {
    await page.setViewportSize({ width, height: 800 });
    const heights = new Set();
    for (let i = 0; i < total; i++) {
      await page.click('#transport [data-action="next"]');
      const lines = await page.evaluate(() => ['#caption-title', '#caption-about'].map(sel => {
        const el = document.querySelector(sel);
        return { lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
          full: el.title === el.textContent };
      }));
      assert(lines.every(l => l.lines === 1 && l.full), `Caption lines stay single and keep their full text as a tooltip at ${width}px`);
      const countLines = await page.evaluate(() => { const el = document.querySelector('#transport-count');
        return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)); });
      assert(countLines === 1, `Song counter stays on one line at ${width}px`);
      heights.add(Math.round(await captionHeight()));
    }
    assert(heights.size === 1, `Caption height is the same for every song at ${width}px (got ${[...heights]})`);
  }
  return 'transport ok';
}
