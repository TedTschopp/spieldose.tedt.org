async (page) => {
  // Music box cabinet: themed shelves, interchangeable sections (cylinder/disc/barrel/roll), user-made sections with any number of airs.
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { window.confirm = () => true; });
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(() => { localStorage.removeItem('spieldose-cabinet'); localStorage.removeItem('scrimshaw-edits'); });
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForFunction(() => window.__scrim?.ui);
  const plates = () => page.evaluate(() => [...document.querySelectorAll('#rack .plate[data-section]')]
    .map(b => ({ id: b.dataset.section, shelf: b.closest('.shelf').dataset.shelf, pressed: b.getAttribute('aria-pressed'), text: b.textContent })));
  const listed = () => page.evaluate(() => [...document.querySelectorAll('#tracks .inv[data-tune]')].map(b => +b.dataset.tune));
  const counter = () => page.textContent('#transport-count');
  const sectionOf = i => page.evaluate(i => __scrim.state.tunes[i].section, i);
  const bundled = await page.evaluate(() => {
    const counts = {};
    ScrimTracks.forEach(t => { counts[t.section] = (counts[t.section] || 0) + 1; });
    return { counts, shelves: ScrimCabinet.shelves.map(s => s.name) };
  });

  let p = await plates();
  for (const shelf of ['alpine', 'holidays', 'world', 'genre']) assert(p.some(x => x.shelf === shelf), `Rack shows the ${shelf} shelf`);
  const shelfNames = await page.evaluate(() => [...document.querySelectorAll('#rack .shelf-name')].map(e => e.textContent));
  for (const name of bundled.shelves) assert(shelfNames.includes(name), `Shelf label ${name}`);
  assert(p.find(x => x.id === 'alpine-night').pressed === 'true', 'Alpine Night plate starts pressed');
  assert(p.filter(x => x.pressed === 'true').length === 1, 'Exactly one plate is pressed');
  assert((await listed()).length === 6, 'Tune card lists the six Alpine airs');
  assert(await counter() === '1 / 6', 'Counter counts within the section');

  // Change the disc: holidays.
  await page.click('#rack .plate[data-section="winter-holidays"]');
  const holiday = bundled.counts['winter-holidays'];
  assert(holiday > 6, 'Winter Holidays holds more than six airs');
  let ids = await listed();
  assert(ids.length === holiday, `Tune card lists only the holiday airs (${ids.length})`);
  for (const i of ids) assert(await sectionOf(i) === 'winter-holidays', 'Listed air belongs to the section');
  assert(await counter() === `1 / ${holiday}`, 'Counter resets for the new section');
  assert((await page.textContent('#tracks .tune-card')).includes('Steel disc'), 'Tune card names the mechanism');
  assert((await page.textContent('#tracks .add-air')).includes('Punch a new air'), 'Add verb matches the disc');
  assert((await plates()).find(x => x.id === 'winter-holidays').pressed === 'true', 'Holiday plate is pressed');
  for (let k = 0; k < holiday; k++) await page.click('#transport [data-action="next"]');
  assert(await counter() === `1 / ${holiday}`, 'Next wraps within the section');
  assert(await sectionOf(await page.evaluate(() => __scrim.state.idx)) === 'winter-holidays', 'Skipping stays on the disc');
  await page.click('#transport [data-action="prev"]');
  assert(await counter() === `${holiday} / ${holiday}`, 'Previous wraps to the last air on the disc');
  for (const [id, word] of [['world-folk', 'Organ barrel'], ['western-picture-show', 'Piano roll'], ['alpine-night', 'Pinned cylinder']]) {
    await page.click(`#rack .plate[data-section="${id}"]`);
    assert((await page.textContent('#tracks .tune-card')).includes(word), `${id} tune card shows ${word}`);
    assert((await listed()).length === bundled.counts[id], `${id} lists its airs`);
  }

  // Make a new section on an existing shelf, then pin it past six airs.
  await page.click('#b-new-section');
  assert(await page.isVisible('#new-section'), 'New section form opens');
  await page.fill('#ns-name', 'Halloween');
  await page.fill('#ns-shelf', 'holidays');
  await page.selectOption('#ns-mechanism', 'barrel');
  await page.click('#new-section button[type="submit"]');
  assert(!(await page.isVisible('#new-section')), 'Form closes after creating');
  p = await plates();
  const halloween = p.find(x => x.text.includes('Halloween'));
  assert(halloween && halloween.shelf === 'holidays', 'Halloween sits on the existing Holidays shelf (case-insensitive)');
  assert(halloween.pressed === 'true', 'New section is selected');
  assert((await listed()).length === 1 && await counter() === '1 / 1', 'New section starts with one air');
  assert(await page.evaluate(() => __scrim.state.songs[__scrim.state.idx].errors.length === 0), 'Starter air reads cleanly');
  assert(await page.evaluate(() => /pipe|organ/.test(__scrim.state.texts[__scrim.state.idx])), 'Barrel starter air uses an organ voice');
  for (let k = 0; k < 7; k++) await page.click('#tracks .add-air button');
  assert((await listed()).length === 8, 'A section can hold more than six airs');
  assert(await counter() === '8 / 8', 'The newest air is selected');
  await page.fill('#score', (await page.inputValue('#score')).replace(/^title\s+.*$/m, 'title    The Pumpkin Waltz'));
  await page.waitForFunction(() => document.querySelector('#tracks').textContent.includes('The Pumpkin Waltz'), null, { timeout: 3000 }).catch(() => {});
  assert((await page.textContent('#tracks')).includes('The Pumpkin Waltz'), 'Edits retitle the air');
  await page.click('#b-remove-air');
  assert((await listed()).length === 7, 'Remove this air takes it off the section');
  assert(!(await page.textContent('#tracks')).includes('The Pumpkin Waltz'), 'Removed air is gone');
  await page.click('#tracks .inv[data-tune]');
  await page.fill('#score', (await page.inputValue('#score')).replace(/^title\s+.*$/m, 'title    Lantern March'));
  await page.waitForFunction(() => __scrim.state.songs[__scrim.state.idx].title === 'Lantern March');

  // A new shelf from the form.
  await page.click('#b-new-section');
  await page.fill('#ns-name', 'Night Trains');
  await page.fill('#ns-shelf', 'Railway Songs');
  await page.selectOption('#ns-mechanism', 'roll');
  await page.click('#new-section button[type="submit"]');
  assert((await page.evaluate(() => [...document.querySelectorAll('#rack .shelf-name')].map(e => e.textContent))).includes('Railway Songs'), 'A typed shelf name makes a new shelf');
  assert(await page.evaluate(() => /piano/.test(__scrim.state.texts[__scrim.state.idx])), 'Roll starter tune uses the piano');

  // Persist across reloads.
  await page.reload();
  await page.waitForFunction(() => window.__scrim?.ui);
  p = await plates();
  assert(p.some(x => x.text.includes('Halloween')) && p.some(x => x.text.includes('Night Trains')), 'User sections survive a reload');
  await page.click('#rack .plate[data-section]:has-text("Halloween")');
  assert((await listed()).length === 7, 'User airs survive a reload');
  assert((await page.textContent('#tracks')).includes('Lantern March'), 'User edits survive a reload');
  const playable = await page.evaluate(() => { __scrim.ui.startTrack(); return __scrim.player.playing; });
  assert(playable, 'User air plays');
  await page.click('#transport [data-action="stop"]');

  // Share a user air and open it elsewhere.
  await page.click('#tracks .inv[data-tune]:has-text("Lantern March")');
  const link = await page.evaluate(() => __scrim.sharing.sharedURL());
  assert(/^http:\/\/127\.0\.0\.1:8765\/#v=1&score=/.test(link), `User air shares as a root score link (${link})`);
  const other = await page.context().browser().newContext();
  const guest = await other.newPage();
  const guestErrors = [];
  guest.on('pageerror', error => guestErrors.push(error.message));
  await guest.goto(link);
  await guest.waitForFunction(() => window.__scrim?.state.songs[__scrim.state.idx]?.title === 'Lantern March');
  assert(await guest.evaluate(() => __scrim.state.tunes[__scrim.state.idx].section === 'shared-with-me'), 'Shared air opens in Shared with me');
  assert((await guest.textContent('#rack')).includes('Shared with me'), 'Guest rack shows the shared section');
  await guest.reload();
  await guest.waitForFunction(() => window.__scrim?.state.songs[__scrim.state.idx]?.title === 'Lantern March');
  assert(await guest.evaluate(() => __scrim.state.tunes.filter(t => !t.removed && t.section === 'shared-with-me').length) === 1, 'Reopening a shared link does not duplicate it');
  assert(!guestErrors.length, `Guest page errors: ${guestErrors.join('; ')}`);
  await other.close();

  // Bundled permalinks select their section.
  const holidaySlug = await page.evaluate(() => ScrimSharing.slug(ScrimTracks.find(t => t.section === 'winter-holidays')));
  await page.goto(`http://127.0.0.1:8765/songs/${holidaySlug}/`);
  await page.waitForFunction(() => window.__scrim?.ui);
  await page.waitForFunction(() => __scrim.state.tunes[__scrim.state.idx].section === 'winter-holidays');
  assert((await plates()).find(x => x.id === 'winter-holidays').pressed === 'true', 'Permalink presses its section plate');
  await page.evaluate(() => __scrim.player.stop());

  // Remove a whole user section.
  await page.click('#rack .plate[data-section]:has-text("Night Trains")');
  await page.click('#b-remove-section');
  assert(!(await plates()).some(x => x.text.includes('Night Trains')), 'Removed section leaves the rack');
  assert(!(await page.evaluate(() => [...document.querySelectorAll('#rack .shelf-name')].map(e => e.textContent))).includes('Railway Songs'), 'Empty user shelf disappears');
  assert(await page.evaluate(() => !__scrim.state.tunes[__scrim.state.idx].removed), 'Selection moves to a remaining air');
  assert(!(await page.isVisible('#b-remove-section')) || await page.evaluate(() => __scrim.state.sections.find(s => s.id === __scrim.state.tunes[__scrim.state.idx].section).user),
    'Bundled sections cannot be removed');
  await page.evaluate(() => { localStorage.removeItem('spieldose-cabinet'); localStorage.removeItem('scrimshaw-edits'); });
  assert(!errors.length, `No page errors: ${errors.join('; ')}`);
  return 'cabinet ok';
}
