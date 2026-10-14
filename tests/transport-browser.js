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

  await page.click('#transport [data-action="next"]');
  assert(await page.evaluate(() => __scrim.state.idx) === 1, 'Next selects the following track');
  assert(await page.evaluate(() => !__scrim.player.playing), 'Next while stopped does not start playback');
  assert(await counter() === `2 / ${total}`, 'Counter follows next');
  await page.click('#transport [data-action="prev"]');
  await page.click('#transport [data-action="prev"]');
  assert(await page.evaluate(() => __scrim.state.idx) === total - 1, 'Previous wraps to the last track');

  await page.click('#transport [data-action="play"]');
  await page.waitForFunction(() => __scrim.player.playing);
  p = await pressed();
  assert(p.play === 'true' && p.stop === 'false', 'Playing deck shows play held down');
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
  return 'transport ok';
}
