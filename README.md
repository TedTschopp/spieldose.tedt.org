# Spieldose — Swiss Music Box

A Swiss music box adaptation of Simon Willison’s Scrimshaw Jukebox. The title, copy, visual styling and scene illustration have been adapted. Additional procedural instruments and six user-supplied, original Swiss folk-inspired scores extend the jukebox; existing instrument definitions and playback behavior remain unchanged.

The original harbour scene has been replaced by an animated pixel-art Swiss alpine village. It reads audio energy for window lighting without changing playback.

Upstream source: https://github.com/simonw/tools/blob/main/scrimshaw-jukebox.html

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

For actual Web Audio checks, serve the repository with `python3 -m http.server 8765`, open `http://localhost:8765/`, load `tests/audio-browser.js` in that page (for example with a browser developer-tools script tag), and run `await runInstrumentAudioTests()` and `await runTuneAudioTests()`. The instrument test renders all 15 voices with normal, short/bright, chord and long-attack settings; the tune test renders a four-second excerpt of all six tracks. They check finite, non-silent audio, peaks below clipping and decaying release tails. These checks do not establish acoustic realism; timbre remains a perceptual approximation.

The source is distributed under the Apache License 2.0; see [LICENSE](LICENSE).
