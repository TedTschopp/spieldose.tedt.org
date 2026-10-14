# Spieldose — Swiss Music Box

A Swiss music box adaptation of Simon Willison’s Scrimshaw Jukebox. The title, copy, visual styling and scene illustration have been adapted. Additional procedural instruments and six user-supplied, original Swiss folk-inspired scores extend the jukebox; existing instrument definitions and playback behavior remain unchanged.

The original harbour scene has been replaced by an animated pixel-art Swiss alpine village. Each load varies the placement and styles of 3–7 buildings, 1–5 everyday ground features (bell-curve weighted, most often three) drawn from twelve kinds (fountain, drinking trough, signpost, firewood stack, handcart, milk pails, wayside shrine, covered bench, boundary stone, village bell, market stall, hitching post; only the market stall and handcart may stand on the road). Features are rolled from one pool that also holds six building details (flower box, noticeboard, inn sign, cattle bells, sundial, carved lintel); a rolled detail is hung on a building with a free wall slot and does not count toward the ground limit, and rolling continues until the ground target is met. The village also has 12–32 trees and a random three-layer mountain skyline that always leaves the church cross and moon against open sky. The church combines a nave with stained-glass windows and a clock tower that flies the village flag below the clock. Moon shadows, including per-tier pine shadows, and ground creatures walk three gently wandering foreground lanes placed just below the village's front-most foot line, so they always pass in front of buildings, trees and features; flying creatures retain their sky paths. The scene's top-left corner carries the song title and an old-fashioned transport deck: previous, stop, play, next and repeat. Play, stop and repeat latch down while active, the skip buttons press briefly and keep the deck playing or stopped, and a counter shows the song number. Folklore creatures arrive in shuffled rounds, so each load opens with a different order and no creature appears twice in a row. The scene reads audio energy for window lighting without changing playback.

Upstream source: https://github.com/simonw/tools/blob/main/scrimshaw-jukebox.html

## Song links and sharing

Selecting or playing a song updates its URL under `songs/<slug>/`. Back and Forward restore the selected tune. A direct song link attempts playback; browser autoplay restrictions may require pressing **Play**. The homepage keeps its general website preview until you select or play a song.

**Copy song link** copies the selected score's URL; **Share song** opens the device's share sheet where Web Share is supported. **Copy website link** shares the general homepage instead. Clipboard denial exposes a selectable link for manual copying. HTTPS (or localhost for development) is required for clipboard and native sharing.

Edited scores are compressed into a versioned URL fragment, not uploaded to a server. Anyone with the link can read the score, and sharing apps receive the full link: do not include private information. Edits do not change the bundled music. Opening a shared link does not save its score over a local draft; typing or reverting explicitly saves the current song. Edited links are limited to 16,000 URL characters and 64,000 uncompressed UTF-8 bytes; malformed, oversized and invalid-score links show errors instead of autoplaying. Compression requires a current browser. Some messaging apps impose smaller link limits or strip fragments; **Copy score** remains an alternative.

Each bundled song has a complete, crawlable static page with its own title, description, canonical URL, Open Graph/X (Twitter) tags, structured data and 1200 x 630 PNG preview. The homepage has a separate site image and metadata. Edited links use their underlying bundled song's preview because crawlers cannot read fragment contents. There is no downloadable audio file, so metadata does not claim a hosted recording or embeddable social audio player. Social platforms control preview display and caching; no metadata can guarantee identical previews everywhere.

After changing `index.html` or `scores.js`, run `node scripts/build-sharing.js` and commit the generated `songs/` pages, `sitemap.xml` and `robots.txt`. Check drift with `node scripts/build-sharing.js --check`. The canonical base is the custom domain `https://spieldose.tedt.org/` (set by the `CNAME` file and a Cloudflare DNS-only CNAME to `tedtschopp.github.io`); the old `github.io` address redirects there. Because the site is served from the host root, `robots.txt` applies directly. Submit the sitemap directly in search webmaster tools if needed.

Preview images live in `assets/social/`. To regenerate them, serve the site, load `scripts/social-images-browser.js` into the page, await `buildSocialPreview(-1)` for the site or `buildSocialPreview(0)` through `buildSocialPreview(5)` for songs, and capture the `#social-preview` canvas as a 1200 x 630 PNG with its existing filename. The helper reads the site's computed heading/body font families and weights, waits for fonts to load, and uses the live Alpine illustration; it does not alter the scene or audio. Run the metadata generator afterward: image URLs include a content hash to distinguish updated images in preview caches.

### Microsoft Teams previews

[Microsoft's documented website preview requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/share-to-teams-from-web-apps#craft-your-website-preview) are a publicly accessible, unauthenticated URL with a thumbnail or a title and description; this site provides all three via static Open Graph tags on the homepage and every song page. No Teams app, bot, SDK or dedicated share button is needed for these website metadata fields. The PNG is available over HTTPS without JavaScript, cookies or authentication. Edited-score fragments still preview the underlying bundled song.

Run `node tests/teams-preview.js` after deployment to check all seven live pages and their current images with a crawler-style request. This is not an actual Teams rendering test. Teams' **URL previews** messaging policy must be enabled by the tenant administrator ([policy documentation](https://learn.microsoft.com/en-us/microsoftteams/messaging-policies-in-teams)); client behavior and cached cards remain outside this site's control. To confirm end-to-end, paste a song URL into a new Teams message, wait for the card, and confirm its title, description and thumbnail before sending. Old messages may retain their old card; changing an image URL does not force Teams to re-fetch cached page metadata.

## Additional instruments

Use these ASCII identifiers in a `voice NAME INSTRUMENT` declaration. They also appear in the page's instrument reference and copyable composition prompt.

| Identifier | Procedural sound model |
| --- | --- |
| `piano` | Hammer transient, slightly stretched string partials, two close-tuned courses, faster upper-partial decay, note-off damping and soundboard colour. |
| `epiano` | Tine-style electric piano: decaying FM brightness plus a short high partial, with less modulation in the upper register. |
| `saxalto`, `saxtenor` | Distinct reed spectra, resonant body filters, breath noise and delayed vibrato; tenor is darker and slower. |
| `elecguitar`, `elecbass` | Clean Karplus–Strong electric strings with separate decay/excitation settings and pickup-like filtering, not acoustic aliases. Buffers use the existing warm-up cache. |
| `violin`, `viola`, `cello` | Solo bowed spectra with distinct body resonances, attack/release, bow noise and vibrato; no ensemble detuning. |
| `trombone` | Lip-like harmonic spectrum with an articulated brightness envelope and midrange resonance. |
| `schwyzeroergeli` | Schwyzerörgeli's Schwyzerton/MHH voicing: one main reed and two octave reeds detuned by ±7 cents. Fast articulation suits bass-and-chord accompaniment. |
| `hackbrett` | Hammered-string partials with three slightly detuned courses, a bright strike and ringing, frequency-dependent decay. |
| `alphorn`, `buechel` | Separate harmonic spectra and breath noise; alphorn has a soft attack and dark resonance, Büchel a faster attack and brighter spectrum. |
| `yodel` | Chest/head excitation and vowel-formant changes at C5, fast articulation and light breath noise. Register follows each written note. |

These are compact, original procedural approximations in the site's sound-module style, not samples or complete nonlinear physical models. Harmonic weights, filter frequencies and envelope values are design choices informed by the references below, not measured presets from a particular instrument. No third-party code or recordings are included.

## Swiss folk scores

The six bundled tunes in `scores.js` come from the supplied `Haunted_Swiss_Folk_Scores.md`. Score melodies, harmonies, rhythms and arrangements are retained; stand-in instrument assignments were updated to use the dedicated `schwyzeroergeli`, `hackbrett`, `violin`, `cello`, `alphorn`, `buechel` and `yodel` voices where they match the arrangement. Tune the latter voice with quick written low/high notes; the score does not add yodel leaps within held notes. Original folktune transcriptions are not included.

The track order is: “The Sennentuntschi's Lullaby”, “The Stollenwurm Behind the Stove”, “The Wildmannli's Midnight Dance”, “Do Not Wake the Rollibock”, “Three Steps Aside for the Tuerst”, and “The Devil's Bridge Mazurka”.

The score notes describe their scenes as fictional interpretations of the folklore. They are original music, not historical folk-song transcriptions. References supplied with the compositions include:

- [SRF: The Sennentuntschi legend](https://www.srf.ch/kultur/kunst/kunst-das-echte-sennentuntschi-ist-noch-viel-gfuerchiger-als-die-sage)
- [Aare Gorge: Tatzelwurm / Stollenwurm](https://aareschlucht.ch/en/Info/aareschlucht/tatzelwurm)
- [Switzerland Tourism: Toggenburg legends and Wildmannli](https://www.myswitzerland.com/de-ch/erlebnisse/route/toggenburger-sagenweg/)
- [Switzerland Tourism: Rollibock of the Aletsch Glacier](https://www.myswitzerland.com/en-us/experiences/summer-autumn/autumn/spooky-places-in-switzerland/)
- [Swiss Hiking Trails: Tuerst](https://www.schweizer-wanderwege.ch/de/inspiration/blog/wer-hat-angst-vom-tuerst)
- [Andermatt-Urserntal Tourism: Devil's Bridge legend](https://www.andermatt-sedrun-disentis.ch/en/stories/schoellenenschlucht)
- [Switzerland Tourism: folk music in Switzerland](https://www.myswitzerland.com/en-us/planning/about-switzerland/custom-and-tradition/folk-music-in-switzerland/)
- [House of Switzerland: Swiss folk music](https://houseofswitzerland.org/swiss-stories-archives/swiss-folk-music-5-traditional-instruments)

Schwyzerörgeli bass notes and chords must be written explicitly; the voice does not generate an accompaniment. Use separate parts, with `gate=0.4`–`0.6` for detached chord pulses. Yodel leaps likewise come from quick low/high score notes, for example G4/G5; no pitch jumps are inserted into held notes. Alphorn and Büchel keep the score's equal-tempered pitches rather than silently snapping to a fixed horn's natural tones. For an overtone-shaped phrase above C2, C3/C4/G4/C5/E5/G5 approximate partials 2/4/6/8/10/12; the natural 7th and 11th cannot be represented exactly by the current score notation.

The new voices reuse scheduled Web Audio envelopes, bounded filters, cached periodic waves and finite source lifetimes. Struck partials above Nyquist are omitted. The existing master compressor, limiter and reverb routing are unchanged. Attack/release overrides apply to the new sustained and hammered models; electric strings retain the existing pluck helper's fixed pick attack and damping.

### Research

- [Julius O. Smith III, Physical Audio Signal Processing](https://ccrma.stanford.edu/~jos/pasp/): physical-modeling foundation. Its [piano synthesis](https://www.dsprelated.com/freebooks/pasp/Piano_Synthesis.html), [bowed strings](https://www.dsprelated.com/freebooks/pasp/Bowed_Strings.html) and [electric guitars](https://www.dsprelated.com/freebooks/pasp/Electric_Guitars.html) sections inform stiff partials, body resonances and frequency-dependent string decay.
- [MDN: Web Audio advanced techniques](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques): scheduled envelopes, periodic waves, filtered noise and modulation.
- [UNSW: saxophone acoustics](https://newt.phys.unsw.edu.au/music/saxophone/) and [cylindrical/conical pipe harmonics](https://newt.phys.unsw.edu.au/jw/pipes.html): saxophone resonances support both odd and even harmonics, unlike the predominantly odd-harmonic clarinet model.
- [Schwyzerörgeli construction and tuning](https://en.wikipedia.org/wiki/Schwyzer%C3%B6rgeli): MHH octave-reed voicing, tremolo and separate bass/chord buttons.
- [Hammered dulcimer](https://en.wikipedia.org/wiki/Hammered_dulcimer): hammered string courses and resonant soundboard.
- [Switzerland Tourism: alphorn natural tones](https://www.myswitzerland.com/en-us/planning/about-switzerland/custom-and-tradition/alphorn-the-sound-of-natural-tones/) and [Swiss Living Traditions: Alphorn- und Büchelspiel](https://www.lebendige-traditionen.ch/de/alphorn-und-buechelspiel): natural harmonics and distinct horn character.
- [Appenzell Tourism: yodeling](https://www.appenzell.ch/en/culture-traditions/appenzeller-music/yodeling-and-talerschwingen.html): rapid chest/falsetto register changes.

### Verification

Run `node tests/instruments.js` for parser/compiler coverage, instrument/list consistency, source scheduling checks and fingerprints protecting the existing voices and playback. Run `node tests/tunes.js` to compile and validate all six bundled tunes and their intended instrument assignments. No packages are required.

Run `node tests/sharing.js` for song routing, edited-score encoding, size limits, static metadata, sitemap and preview image dimensions. `tests/sharing-browser.js` is an async Playwright page function for the local server on port 8765; it covers history, direct links, exact edited-score restoration, local-draft preservation, clipboard denial, native sharing, malformed links, autoplay restrictions and Stop cancellation. Run it in an isolated browser test profile; it temporarily changes local edits and restores their saved value.

Run `node tests/social-images.js` to verify preview font inheritance and font-loading order.

Run `node tests/village-clock.js` to check the church clock. The scene is always night, so `village-clock.js` maps the visitor's local day onto tonight's Swiss night: local sunrise shows the Swiss sunset time, and the moment before local sunrise shows the moment before the next Swiss sunrise. Sunrise and sunset are calculated for Bern in Europe/Zurich time. The page does not ask for the visitor's location, so the Swiss sunrise clock time stands in for local sunrise.

Run `node tests/village-layout.js` to verify randomized building and landmark variants, placement counts, and that all three foreground creature lanes stay in front of the village at distinct depths.

For actual Web Audio checks, serve the repository with `python3 -m http.server 8765`, open `http://localhost:8765/`, load `tests/audio-browser.js` in that page (for example with a browser developer-tools script tag), and run `await runInstrumentAudioTests()` and `await runTuneAudioTests()`. The instrument test renders all 15 voices with normal, short/bright, chord and long-attack settings; the tune test renders a four-second excerpt of all six tracks. They check finite, non-silent audio, peaks below clipping and decaying release tails. These checks do not establish acoustic realism; timbre remains a perceptual approximation.

The source is distributed under the Apache License 2.0; see [LICENSE](LICENSE).
