import {W, H, EDGE, R, PADDLE_H, PADDLE_W, createGame, resizeGame, step} from './engine.js';
const $ = id => document.getElementById(id), canvas = $('canvas'), ctx = canvas.getContext('2d');
const read = (k, fallback) => {try {return localStorage.getItem(k) ?? fallback;} catch {return fallback;}};
const save = (k, value) => {try {localStorage.setItem(k, value);} catch {}};
let g = createGame(), target = H / 2, running = false, paused = false, last = performance.now();
let best = Number(read('zypong-wins', '0')) || 0, sound = read('zypong-sound', 'false') === 'true', audio;
let scale = 1, dpr = 1, trail = [], installPrompt;
const keys = new Set();
$('best').textContent = best;
function soundLabel() {
  $('sound').textContent = sound ? 'SOM ON' : 'SOM OFF';
  $('sound').setAttribute('aria-pressed', String(sound));
  $('sound').setAttribute('aria-label', sound ? 'Desativar som' : 'Ativar som');
}
soundLabel();
function beep(frequency = 440) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const oscillator = audio.createOscillator(), volume = audio.createGain();
    oscillator.type = 'square'; oscillator.frequency.value = frequency;
    oscillator.connect(volume); volume.connect(audio.destination);
    volume.gain.setValueAtTime(.025, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .08);
    oscillator.start(); oscillator.stop(audio.currentTime + .09);
  } catch {}
}
$('sound').onclick = () => {sound = !sound; save('zypong-sound', sound); soundLabel(); beep();};
async function fullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    if (screen.orientation?.lock) await screen.orientation.lock('landscape');
  } catch {
    $('status').textContent = 'Se necessário, gire o celular manualmente e use a opção de tela cheia do navegador.';
  }
}
$('fullscreen').onclick = fullscreen;
$('rotate-fullscreen').onclick = fullscreen;
function scores() {$('player').textContent = g.player; $('computer').textContent = g.computer;}
function showMenu(title, message, button, badge) {
  $('headline').textContent = title; $('message').textContent = message;
  $('play').textContent = button; $('badge').textContent = badge; $('overlay').hidden = false;
}
function pause() {
  keys.clear();
  if (!running || paused) return;
  paused = true; $('pause').hidden = true;
  showMenu('Pausa no arcade.', 'Seu placar está salvo nesta partida. Volte quando estiver pronto.', 'CONTINUAR ▶', 'RESPIRE. VOLTE. VENÇA.');
}
$('pause').onclick = pause;
$('play').onclick = () => {
  if (matchMedia('(orientation: portrait)').matches) return;
  if (!paused) {g = createGame(g.width); target = H / 2; trail = []; scores();}
  paused = false; running = true; last = performance.now();
  $('overlay').hidden = true; $('pause').hidden = false; $('difficulty').disabled = true;
  canvas.focus({preventScroll: true}); beep(660);
  // Called directly from the user gesture; unsupported fullscreen does not block play.
  void fullscreen();
};
function resize() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
  scale = rect.height / H;
  resizeGame(g, rect.width / scale); trail = [];
  if (rect.height > rect.width) pause();
}
window.addEventListener('resize', resize);
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Tela cheia ativa' : 'Ativar tela cheia');
  if (!document.fullscreenElement) pause();
  resize();
});
window.addEventListener('keydown', e => {
  if (document.activeElement !== canvas || !['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S', 'Escape', ' '].includes(e.key)) return;
  e.preventDefault();
  if (e.key === 'Escape' || e.key === ' ') pause(); else keys.add(e.key.toLowerCase());
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
function pointer(e) {target = (e.clientY - canvas.getBoundingClientRect().top) / scale;}
canvas.addEventListener('pointerdown', e => {if (!running || paused) return; canvas.setPointerCapture(e.pointerId); pointer(e);});
canvas.addEventListener('pointermove', e => {if (running && !paused && (e.pointerType === 'mouse' || canvas.hasPointerCapture(e.pointerId))) pointer(e);});
function paddle(x, y, blue) {
  const fill = ctx.createLinearGradient(x - 15, y, x + 15, y);
  fill.addColorStop(0, blue ? '#0c56ef' : '#ac0735'); fill.addColorStop(.55, blue ? '#0c9fff' : '#ff244b'); fill.addColorStop(1, blue ? '#75efff' : '#ff9fa8');
  ctx.shadowColor = blue ? '#00afff' : '#ff204b'; ctx.shadowBlur = 25;
  ctx.fillStyle = '#09031b'; ctx.fillRect(x - PADDLE_W / 2 - 5, y - PADDLE_H / 2 - 5, PADDLE_W + 10, PADDLE_H + 10);
  ctx.fillStyle = fill; ctx.fillRect(x - PADDLE_W / 2, y - PADDLE_H / 2, PADDLE_W, PADDLE_H);
  ctx.fillStyle = blue ? '#b4f9ff' : '#ffd8df'; ctx.fillRect(x - PADDLE_W / 2 + 3, y - PADDLE_H / 2 + 4, 4, PADDLE_H - 8);
  ctx.shadowBlur = 0;
}
function draw() {
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  const width = g.width;
  const bg = ctx.createRadialGradient(width / 2, H / 2, 30, width / 2, H / 2, width * .7);
  bg.addColorStop(0, '#071d46'); bg.addColorStop(.6, '#070d2c'); bg.addColorStop(1, '#0b0320');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, H);
  ctx.lineWidth = 1; ctx.strokeStyle = '#113c7a50'; ctx.beginPath();
  for (let x = width / 2 % 80; x < width; x += 80) {ctx.moveTo(x, 16); ctx.lineTo(x, H - 16);}
  for (let y = 40; y < H; y += 80) {ctx.moveTo(16, y); ctx.lineTo(width - 16, y);}
  ctx.stroke();
  ctx.strokeStyle = '#b334ff'; ctx.shadowColor = '#a51bff'; ctx.shadowBlur = 22; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(12, 12, width - 24, H - 24, 30); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ed9eff'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#5eeaff'; ctx.shadowColor = '#00baff'; ctx.shadowBlur = 15; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(65, H - 17); ctx.lineTo(width - 65, H - 17); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#9bd6ff77'; ctx.lineWidth = 3; ctx.setLineDash([13, 17]);
  ctx.beginPath(); ctx.moveTo(width / 2, 110); ctx.lineTo(width / 2, H - 65); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#6377c433'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(width / 2, H / 2, 80, 0, Math.PI * 2); ctx.stroke();
  paddle(EDGE, g.py, true); paddle(width - EDGE, g.ai, false);
  trail.forEach((point, index) => {ctx.fillStyle = `rgba(97,210,255,${(index + 1) / trail.length * .22})`; ctx.beginPath(); ctx.arc(point.x, point.y, R * index / trail.length, 0, Math.PI * 2); ctx.fill();});
  ctx.shadowBlur = 20; ctx.shadowColor = '#77e8ff'; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(g.ball.x, g.ball.y, R, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#bcc2ff'; ctx.fillRect(g.ball.x - 4, g.ball.y + 3, 8, 4);
  if (running && !paused && g.waiting > 0) {ctx.fillStyle = '#d6b1ff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.fillText('PREPARE-SE', width / 2, H / 2 + 115);}
}
function frame(now) {
  const dt = Math.min((now - last) / 1000, .035); last = now;
  if (running && !paused) {
    target += (Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'))) * 650 * dt;
    target = Math.max(PADDLE_H / 2 + 20, Math.min(H - PADDLE_H / 2 - 20, target));
    const event = step(g, dt, target, $('difficulty').value);
    trail.push({x: g.ball.x, y: g.ball.y}); if (trail.length > 9) trail.shift();
    if (event) {beep(event === 'hit' ? 440 : 880); scores();}
    if (event === 'point') {trail = []; $('status').textContent = `Placar: você ${g.player}, computador ${g.computer}.`;}
    if (g.winner) {
      running = false; $('pause').hidden = true; $('difficulty').disabled = false;
      const won = g.winner === 'player';
      if (won) {best++; save('zypong-wins', best); $('best').textContent = best;}
      showMenu(won ? 'Vitória neon!' : 'A revanche é sua.', `Placar final: ${g.player} × ${g.computer}. ${won ? 'Seus reflexos brilharam.' : 'Treine o tempo da sua defesa.'}`, 'JOGAR NOVAMENTE ▶', won ? 'PLAYER 01 VENCEU' : 'FIM DE PARTIDA');
      $('status').textContent = won ? 'Você venceu!' : 'O computador venceu.';
    }
  }
  draw(); requestAnimationFrame(frame);
}
resize(); requestAnimationFrame(frame);
window.addEventListener('beforeinstallprompt', e => {e.preventDefault(); installPrompt = e; $('install').hidden = false;});
$('install').onclick = async () => {
  if (!installPrompt) return;
  await installPrompt.prompt(); const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') $('install').hidden = true;
  installPrompt = null;
};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {$('status').textContent = 'Modo offline indisponível nesta sessão.';});
