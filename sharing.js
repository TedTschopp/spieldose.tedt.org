/* Song links and private, compressed score fragments. No upload service. */
(function (root) {
  'use strict';
  const MAX_SCORE_BYTES = 64000;
  const MAX_LINK_LENGTH = 16000;
  const slug = track => track.file.replace(/^\d+-/, '').replace(/\.scrim$/, '');
  const songURL = (base, track) => new URL(`songs/${slug(track)}/`, base);

  function resolve(url, base, tracks) {
    const relative = url.pathname.startsWith(base.pathname) ? url.pathname.slice(base.pathname.length) : '';
    const match = /^songs\/([^/]+)\/(?:index\.html)?$/.exec(relative);
    const key = match ? match[1] : url.searchParams.get('song');
    if (!key && !relative.startsWith('songs/')) return -1;
    const index = tracks.findIndex(track => slug(track) === key);
    if (index < 0) throw new Error('Shared song not found. Choose a song below.');
    return index;
  }

  async function encodeScore(text) {
    if (typeof CompressionStream === 'undefined') throw new Error('This browser cannot create edited-score links. Copy the score instead.');
    const bytes = new TextEncoder().encode(text);
    if (bytes.length > MAX_SCORE_BYTES) throw new Error('This score is too large to share in a link. Copy the score instead.');
    const compressed = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(compressed))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  }

  async function decodeScore(encoded) {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open edited-score links. Try a current browser.');
    if (!encoded || encoded.length > MAX_LINK_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
      throw new Error('Invalid shared score link.');
    }
    try {
      const bytes = Uint8Array.from(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
      const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_SCORE_BYTES) {
          await reader.cancel();
          throw new Error('Decompressed score is too large.');
        }
        chunks.push(value);
      }
      const all = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
      return new TextDecoder('utf-8', { fatal: true }).decode(all);
    } catch (error) {
      throw new Error('Invalid shared score link: ' + error.message);
    }
  }

  function connect({ tracks, state, player, ui, compileAt, receive }) {
    const base = new URL('.', document.baseURI);
    const status = document.querySelector('#share-status');
    const manual = document.querySelector('#share-link');
    let restoring = false, revision = 0, busy = false;
    function message(text, error = false) {
      status.textContent = text;
      status.setAttribute('role', error ? 'alert' : 'status');
    }
    function metadata(index) {
      const song = state.songs[index];
      document.title = `${song.title} | Swiss Music Box`;
      const about = document.querySelector('#song-about');
      about.hidden = false;
      about.querySelector('h2').textContent = song.title;
      about.querySelector('p').textContent = song.about;
    }
    function selected(index) {
      metadata(index);
      if (restoring) return;
      revision++;
      const own = index >= tracks.length;
      const next = own ? new URL(base) : songURL(base, tracks[index]);
      if (location.pathname !== next.pathname || location.search || (own && location.hash)) {
        history.pushState(null, '', next);
      }
      manual.hidden = true;
      prepareNative();
    }
    async function autoplay(token) {
      try {
        const ctx = player.ensure();
        const resume = ctx.resume();
        await Promise.race([resume, new Promise(resolve => setTimeout(resolve, 1200))]);
        if (token !== revision) return;
        if (ctx.state === 'running') { ui.startTrack(); }
        else message('Your browser blocked autoplay. Press Play to hear this song.');
      } catch (error) {
        if (token !== revision) return;
        console.warn('Shared-song autoplay could not start:', error);
        message('Playback could not start automatically. Press Play to try again.');
      }
    }
    async function restore(initial = false) {
      const token = ++revision;
      restoring = false;
      nativeData = null;
      player.stop();
      try {
        const url = new URL(location.href);
        const index = resolve(url, base, tracks);
        const fragment = new URLSearchParams(url.hash.slice(1));
        const encoded = fragment.get('score');
        if (encoded && fragment.get('v') !== '1') throw new Error('Unsupported shared score link version.');
        const text = encoded ? await decodeScore(encoded) : null;
        if (token !== revision) return;
        if (index >= 0) {
          state.texts[index] = text ?? tracks[index].text;
          compileAt(index);
          const song = state.songs[index];
          document.querySelector('#score').value = state.texts[index];
          restoring = true;
          ui.select(index, false);
          if (song.errors.length) throw new Error('The shared score has errors. Review them in the score editor before playing.');
          message(text == null ? '' : 'Shared edit loaded. Its notes are stored in this link, not uploaded. Social previews show the original song.');
          autoplay(token);
        } else if (encoded) {
          if (!receive) throw new Error('A shared edit needs a valid song URL.');
          // A score with no song page is someone's own air: keep it in "Shared with me".
          const adopted = receive(text);
          compileAt(adopted);
          const song = state.songs[adopted];
          document.querySelector('#score').value = state.texts[adopted];
          restoring = true;
          ui.select(adopted, false);
          if (song.errors.length) throw new Error('The shared score has errors. Review them in the score editor before playing.');
          message('Shared air added to your cabinet under "Shared with me". Its notes came in this link, not from an upload.');
          autoplay(token);
        }
        else {
          if (!initial) { restoring = true; ui.select(0, false); }
          document.title = 'Swiss Music Box';
          document.querySelector('#song-about').hidden = true;
          message('');
        }
      } catch (error) {
        if (token !== revision) return;
        console.warn('Unable to open shared song:', error);
        message(error.message, true);
        ui.refresh();
      } finally {
        if (token === revision) { restoring = false; prepareNative(); }
      }
    }
    async function sharedURL(site = false) {
      if (site) return base.href;
      const index = state.idx, text = state.texts[index];
      compileAt(index);
      const song = state.songs[index];
      ui.renderErrors(song);
      if (song.errors.length) throw new Error('Fix the score errors before sharing.');
      const own = index >= tracks.length;
      const url = own ? new URL(base) : songURL(base, tracks[index]);
      if (own || text !== tracks[index].text) url.hash = `v=1&score=${await encodeScore(text)}`;
      if (url.href.length > MAX_LINK_LENGTH) throw new Error('This edited-score link is too long. Copy the score instead.');
      return url.href;
    }
    async function copy(site = false) {
      if (busy) return;
      busy = true;
      const index = state.idx, text = state.texts[index];
      try {
        const url = await sharedURL(site);
        if (!site && state.idx === index && state.texts[index] === text) history.replaceState(null, '', url);
        manual.value = url;
        try {
          await navigator.clipboard.writeText(url);
          manual.hidden = true;
          message(site ? 'Website link copied.' : 'Song link copied.' + (url.includes('#') ? ' Includes your edited score; some apps may reject long links. Preview shows the original song.' : ''));
        } catch (error) {
          console.warn('Clipboard unavailable:', error);
          manual.hidden = false; manual.focus(); manual.select();
          message('Copy was blocked. The link is selected below; copy it manually.', true);
        }
      } catch (error) { message(error.message, true); }
      finally { busy = false; }
    }
    document.querySelector('#b-share').addEventListener('click', () => copy());
    document.querySelector('#b-share-site').addEventListener('click', () => copy(true));
    const native = document.querySelector('#b-native-share');
    native.hidden = typeof navigator.share !== 'function';
    let nativeData = null, preparedRevision = 0;
    async function prepareNative() {
      nativeData = null;
      const mine = ++preparedRevision;
      try {
        const url = await sharedURL();
        if (mine === preparedRevision) nativeData = { url, title: state.songs[state.idx].title + ' | Swiss Music Box' };
      } catch (error) { native.title = error.message; }
    }
    // Prepare before the click so Web Share keeps the user's transient activation.
    document.querySelector('#score').addEventListener('input', () => { revision++; prepareNative(); });
    document.querySelector('#b-revert').addEventListener('click', prepareNative);
    native.addEventListener('click', async () => {
      if (!nativeData) { await copy(); return; }
      try {
        history.replaceState(null, '', nativeData.url);
        await navigator.share(nativeData);
        message('Song shared.');
      }
      catch (error) {
        if (error.name === 'AbortError') return;
        console.warn('Native sharing unavailable:', error);
        await copy();
      }
    });
    window.addEventListener('popstate', () => restore());
    window.addEventListener('hashchange', () => restore());
    return { selected, restore, sharedURL, cancelAutoplay() { revision++; }, ready: restore(true) };
  }

  const api = { slug, songURL, resolve, encodeScore, decodeScore, connect, MAX_SCORE_BYTES, MAX_LINK_LENGTH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScrimSharing = api;
})(typeof window !== 'undefined' ? window : globalThis);
