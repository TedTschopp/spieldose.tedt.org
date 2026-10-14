/* Village clock: maps the visitor's local day onto tonight's Swiss night (sunset to next sunrise). */
(function (root) {
  'use strict';
  const BERN = { lat: 46.948, lon: 7.447 };
  const DAY = 86400000;
  const rad = Math.PI / 180;
  const zurich = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zurich', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23'
  });
  const parts = ms => Object.fromEntries(zurich.formatToParts(ms)
    .filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));

  function zurichMinutes(ms) {
    const p = parts(ms);
    return p.hour * 60 + p.minute + (p.second + (ms % 1000 + 1000) % 1000 / 1000) / 60;
  }

  // Sunrise equation (NOAA/Meeus simplified), including refraction and the solar disc (-0.833 deg).
  function sunTimes(year, month, day, place = BERN) {
    const n = Math.round(Date.UTC(year, month, day, 12) / DAY + 2440587.5 - 2451545 - .0008);
    const jStar = n - place.lon / 360;
    const M = (357.5291 + .98560028 * jStar) % 360;
    const C = 1.9148 * Math.sin(M * rad) + .02 * Math.sin(2 * M * rad) + .0003 * Math.sin(3 * M * rad);
    const lambda = (M + C + 180 + 102.9372) % 360;
    const transit = 2451545 + jStar + .0053 * Math.sin(M * rad) - .0069 * Math.sin(2 * lambda * rad);
    const decl = Math.asin(Math.sin(lambda * rad) * Math.sin(23.4397 * rad));
    const cosW = (Math.sin(-.833 * rad) - Math.sin(place.lat * rad) * Math.sin(decl)) /
      (Math.cos(place.lat * rad) * Math.cos(decl));
    const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
    const toMs = j => (j - 2440587.5) * DAY;
    return { sunrise: toMs(transit - w / 360), sunset: toMs(transit + w / 360) };
  }

  // localMinutes: visitor's wall-clock minutes since midnight. Their sunrise is taken as the Swiss
  // sunrise clock time, since the page does not ask for the visitor's location.
  function villageTime(nowMs, localMinutes) {
    const p = parts(nowMs);
    const today = sunTimes(p.year, p.month - 1, p.day);
    const tomorrow = sunTimes(p.year, p.month - 1, p.day + 1);
    const rise = zurichMinutes(today.sunrise);
    const fraction = ((localMinutes - rise) % 1440 + 1440) % 1440 / 1440;
    const ms = today.sunset + fraction * (tomorrow.sunrise - today.sunset);
    const swiss = zurichMinutes(ms);
    return { ms, hours: Math.floor(swiss / 60) % 12, minutes: swiss % 60 };
  }

  const api = { sunTimes, villageTime, zurichMinutes, BERN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VillageClock = api;
})(typeof window !== 'undefined' ? window : globalThis);
