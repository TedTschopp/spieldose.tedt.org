'use strict';
const assert = require('node:assert/strict');
const clock = require('../village-clock.js');

const minutes = ms => clock.zurichMinutes(ms);
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} not within ${tolerance} of ${expected}`);

// Bern reference times from api.sunrise-sunset.org (Europe/Zurich): 14 Oct 2026 sunrise 07:45, sunset 18:47.
const day = Date.UTC(2026, 9, 14, 10);
const sun = clock.sunTimes(2026, 9, 14);
near(minutes(sun.sunrise), 7 * 60 + 45, 3, 'October sunrise');
near(minutes(sun.sunset), 18 * 60 + 47, 3, 'October sunset');
// Winter (CET) and summer (CEST) extremes: 21 Dec sunrise 08:11, 21 Jun sunset 21:30.
near(minutes(clock.sunTimes(2026, 11, 21).sunrise), 8 * 60 + 11, 3, 'December sunrise');
near(minutes(clock.sunTimes(2026, 5, 21).sunset), 21 * 60 + 30.5, 3, 'June sunset');

const rise = minutes(sun.sunrise);
const at = local => clock.villageTime(day, local);
// Local sunrise maps to Swiss sunset; the instant before it maps to just before the next Swiss sunrise.
near(minutes(at(rise).ms), minutes(sun.sunset), .01, 'sunrise -> sunset');
const nextRise = minutes(clock.sunTimes(2026, 9, 15).sunrise);
near(minutes(at(rise - .01).ms), nextRise, .1, 'just before sunrise -> just before Swiss sunrise');
// Midpoint of the local day lands at the midpoint of the Swiss night.
const mid = at((rise + 720) % 1440).ms;
const night = clock.sunTimes(2026, 9, 15).sunrise - sun.sunset;
near((mid - sun.sunset) / night, .5, .001, 'midpoint');
// Scene time always stays inside the night and moves forward monotonically through the local day.
let previous = -Infinity;
for (let k = 0; k < 1440; k += 7) {
  const t = at((rise + k) % 1440).ms;
  assert.ok(t >= sun.sunset && t < sun.sunset + night, 'inside night');
  assert.ok(t > previous, 'monotonic');
  previous = t;
}
const face = at(rise);
assert.equal(face.hours, Math.floor(minutes(sun.sunset) / 60) % 12);
assert.ok(face.minutes >= 0 && face.minutes < 60);
console.log('PASS: Swiss sunrise/sunset, local day -> Swiss night mapping, clock face fields');
