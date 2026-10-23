export const W = 1280, H = 720, PADDLE_H = 132, PADDLE_W = 22, EDGE = 64, R = 11;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function createGame(width = W) {
  return {width, player: 0, computer: 0, py: H / 2, ai: H / 2,
    ball: {x: width / 2, y: H / 2, vx: -440, vy: 130}, waiting: .8, winner: null};
}
export function serve(g, direction = -1) {
  g.ball = {x: g.width / 2, y: H / 2, vx: direction * 440, vy: (Math.random() - .5) * 300};
  g.waiting = .8;
}
export function resizeGame(g, width) {
  g.ball.x *= width / g.width;
  g.width = width;
}
export function step(g, dt, target, level = 'normal') {
  if (g.winner) return null;
  g.py = clamp(target, PADDLE_H / 2 + 20, H - PADDLE_H / 2 - 20);
  const speed = {easy: 205, normal: 315, hard: 450}[level] || 315;
  g.ai = clamp(g.ai + clamp(g.ball.y - g.ai, -speed * dt, speed * dt), PADDLE_H / 2 + 20, H - PADDLE_H / 2 - 20);
  if (g.waiting > 0) {g.waiting -= dt; return null;}
  const b = g.ball, oldX = b.x;
  b.x += b.vx * dt; b.y += b.vy * dt;
  let event = null;
  if (b.y < R + 16 || b.y > H - R - 16) {
    b.y = clamp(b.y, R + 16, H - R - 16); b.vy *= -1; event = 'hit';
  }
  for (const [x, y, direction] of [[EDGE, g.py, 1], [g.width - EDGE, g.ai, -1]]) {
    const face = x + direction * (PADDLE_W / 2 + R);
    if (b.vx * direction < 0 && (oldX - face) * direction >= 0 && (b.x - face) * direction <= 0) {
      const contactY = b.y - b.vy * dt * ((b.x - face) / (b.x - oldX));
      if (Math.abs(contactY - y) < PADDLE_H / 2 + R) {
        b.x = face;
        const angle = clamp((contactY - y) / (PADDLE_H / 2), -1, 1) * 1.03;
        const speed = Math.min(1050, Math.hypot(b.vx, b.vy) * 1.065);
        b.vx = direction * Math.cos(angle) * speed; b.vy = Math.sin(angle) * speed; event = 'hit';
      }
    }
  }
  if (b.x < -R * 2 || b.x > g.width + R * 2) {
    const scorer = b.x > g.width ? 'player' : 'computer';
    g[scorer]++;
    if (g[scorer] >= 7) {g.winner = scorer; return 'win';}
    serve(g, scorer === 'player' ? 1 : -1); return 'point';
  }
  return event;
}
