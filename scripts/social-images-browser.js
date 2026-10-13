/* Load on the running site, then capture buildSocialPreview(-1..5) as PNG. */
window.buildSocialPreview = function (index) {
  document.querySelector('#social-preview')?.remove();
  const canvas = document.createElement('canvas');
  canvas.id = 'social-preview';
  canvas.width = 1200; canvas.height = 630;
  canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;width:1200px;height:630px';
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(document.querySelector('#alpine-scene'), 0, 0, 1200, 450);
  const style = getComputedStyle(document.body);
  g.fillStyle = style.backgroundColor;
  g.fillRect(0, 450, 1200, 180);
  g.fillStyle = style.color;
  g.font = 'bold 42px Georgia, serif';
  const title = index < 0 ? 'Swiss Music Box' : window.__scrim.state.songs[index].title;
  const words = title.split(' ');
  let line = '', y = 505;
  for (const word of words) {
    if (g.measureText(line + word).width > 1096) { g.fillText(line.trim(), 52, y); line = ''; y += 48; }
    line += word + ' ';
  }
  g.fillText(line.trim(), 52, y);
  g.font = '24px Georgia, serif';
  g.fillText(index < 0 ? 'Six haunted Swiss folk-inspired tunes · Listen, edit, share' : 'Swiss Music Box · Original folk-inspired music, synthesized live', 52, 603);
  document.body.append(canvas);
  return canvas;
};
