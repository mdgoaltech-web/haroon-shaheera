// Generates the original garden artwork (SVG) used by the invitation.
// Run:  node tools/build-art.mjs      (writes into ./assets)
// The drawings are seeded, so re-running gives the same garden every time.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const SAGE = ['#A9BB9B', '#8FA685', '#7B9471', '#9DB290', '#6A8564'];
const SAGE_PALE = ['#CBD8BF', '#BBCBAE', '#D6E0CB'];
const LILAC = ['#C9B8E0', '#B49FD3', '#A48DC6', '#D9CCEB'];
const BLUSH = ['#F3D3CF', '#EBBDB9', '#F7E1DC', '#E4ACA9'];
const GOLD = ['#C9A45C', '#B8924A', '#DFC384'];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (n) => Math.round(n * 10) / 10;
const n2 = (n) => Math.round(n * 100) / 100;

function defs() {
  const rot = (count, inner) =>
    Array.from({ length: count }, (_, i) => `<g transform="rotate(${n1((360 / count) * i)})">${inner}</g>`).join('');
  // fern: a curved stem with paired leaflets, pointing up
  let fern = '<path d="M0 0Q7-52 0-104" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
  for (let i = 1; i <= 12; i++) {
    const t = i / 13;
    const x = 2 * 7 * t * (1 - t);
    const y = -104 * t;
    const len = (1 - t) * 0.62 + 0.14;
    for (const side of [-1, 1]) {
      fern += `<path transform="translate(${n1(x)} ${n1(y)}) rotate(${side * (62 - t * 18)}) scale(${n2(len)})" d="M0 0C7-10 7-28 0-42C-7-28-7-10 0 0Z"/>`;
    }
  }
  return `<defs>
<radialGradient id="gl"><stop offset="0" stop-color="#F6E3A8"/><stop offset=".35" stop-color="#E9CF8C" stop-opacity=".55"/><stop offset="1" stop-color="#E9CF8C" stop-opacity="0"/></radialGradient>
<path id="l" d="M0 0C9-12 9-30 0-44C-9-30-9-12 0 0Z"/>
<path id="w" d="M0 0C5-14 5-38 0-56C-5-38-5-14 0 0Z"/>
<g id="fe">${fern}</g>
<g id="b5">${rot(5, '<path d="M0 0C9-5 12-18 0-25C-12-18-9-5 0 0Z"/>')}${rot(5, '<path d="M0-5L0-13" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/>')}<circle r="4.4" fill="currentColor"/>${rot(5, '<circle cx="4.6" cy="-6.4" r="1.1" fill="currentColor"/>')}</g>
<g id="ro">${rot(7, '<circle cy="-11" r="10.5"/>')}<g fill="#fff" fill-opacity=".26">${rot(5, '<circle cy="-6.5" r="8"/>')}</g><circle r="7"/><circle r="7" fill="currentColor" fill-opacity=".28"/><path d="M-4.5 .5a4.5 4.5 0 1 1 4.5 4.5a7 7 0 0 1-7-7" fill="none" stroke="currentColor" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/></g>
<g id="da">${rot(10, '<path d="M0 0C3.4-6 4-15 0-20C-4-15-3.4-6 0 0Z"/>')}<circle r="4.6" fill="currentColor"/></g>
<g id="bd"><path d="M0-2C7-6 6-15 0-20C-6-15-7-6 0-2Z"/><path d="M-4.6-3C-2.5-9 2.5-9 4.6-3C2.5 1-2.5 1-4.6-3Z" fill="currentColor"/></g>
<ellipse id="fl" rx="5" ry="7"/>
<path id="sp" d="M0-9C1-2 2-1 9 0C2 1 1 2 0 9C-1 2-2 1-9 0C-2-1-1-2 0-9Z"/>
</defs>`;
}

function makeArt(seed) {
  const R = rng(seed);
  const r = (a, b) => a + (b - a) * R();
  const pick = (a) => a[Math.floor(R() * a.length)];
  const gauss = () => (R() + R() + R() - 1.5) / 1.5; // roughly -1..1, centre-weighted
  const use = (id, x, y, rot = 0, s = 1, extra = '') =>
    `<use href="#${id}" transform="translate(${n1(x)} ${n1(y)}) rotate(${Math.round(rot)}) scale(${n2(s)})"${extra ? ' ' + extra : ''}/>`;

  function polyline(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = cum[cum.length - 1];
    return {
      total,
      at(t) {
        const d = Math.max(0, Math.min(1, t)) * total;
        let i = 1;
        while (i < cum.length - 1 && cum[i] < d) i++;
        const a = pts[i - 1], b = pts[i];
        const k = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
        const tx = b[0] - a[0], ty = b[1] - a[1];
        const m = Math.hypot(tx, ty) || 1;
        return { x: a[0] + tx * k, y: a[1] + ty * k, nx: ty / m, ny: -tx / m };
      },
    };
  }

  const leaf = (x, y, s, pale) =>
    use(pick(['l', 'l', 'w']), x, y, r(0, 360), s, `fill="${pick(pale ? SAGE_PALE : SAGE)}"${pale ? ' opacity=".8"' : ''}`);
  const fern = (x, y, rot, s, c) => use('fe', x, y, rot, s, `fill="${c}" color="${c}"`);

  function flower(x, y, s, kind) {
    kind = kind || pick(['ro', 'ro', 'b5', 'b5', 'da', 'bd']);
    if (kind === 'ro') {
      const lil = R() < 0.55;
      return use('ro', x, y, r(0, 360), s, `fill="${pick(lil ? LILAC : BLUSH)}" color="${lil ? '#7F66AB' : '#C4807F'}"`);
    }
    if (kind === 'b5') return use('b5', x, y, r(0, 72), s, `fill="${pick([...BLUSH, '#FBF1E6', LILAC[3]])}" color="${pick(GOLD)}"`);
    if (kind === 'da') return use('da', x, y, r(0, 36), s, `fill="#FFFBF2" stroke="#E3D3B4" stroke-width=".7" color="${pick(GOLD)}"`);
    return use('bd', x, y, r(-60, 60), s, `fill="${pick([...LILAC, ...BLUSH])}" color="${SAGE[2]}"`);
  }

  // Foliage and flowers scattered along a path. Returns layered SVG strings.
  function garland(p, o) {
    const back = [], mid = [], front = [], top = [];
    const dens = o.density || (() => 1);
    const sample = () => { for (;;) { const t = R(); if (R() < dens(t)) return t; } };
    const spot = (w) => { const q = p.at(sample()); const d = gauss() * w; return { x: q.x + q.nx * d, y: q.y + q.ny * d, q }; };
    const count = (per100) => Math.round((p.total / 100) * per100 * (o.lush || 1));

    for (let i = 0; i < count(7); i++) { const s = spot(o.width * 1.05); back.push(leaf(s.x, s.y, r(1.2, 1.9) * o.scale, true)); }
    for (let i = 0; i < count(1.6); i++) {
      const s = spot(o.width * 0.5);
      const ang = (Math.atan2(s.q.ny, s.q.nx) * 180) / Math.PI + 90 + r(-65, 65);
      back.push(fern(s.x, s.y, ang, r(0.45, 0.8) * o.scale, pick(SAGE)));
    }
    for (let i = 0; i < count(15); i++) { const s = spot(o.width * 0.85); mid.push(leaf(s.x, s.y, r(0.7, 1.3) * o.scale, false)); }

    const clusters = Math.round((p.total / 100) * (o.clusters || 0.75));
    for (let i = 0; i < clusters; i++) {
      const t = (i + r(0.15, 0.85)) / clusters;
      if (R() > dens(t) + 0.35) continue;
      const q = p.at(t); const d = gauss() * o.width * 0.3;
      const cx = q.x + q.nx * d, cy = q.y + q.ny * d;
      const sats = 3 + Math.floor(R() * 3);
      for (let k = 0; k < sats; k++) {
        const a = r(0, Math.PI * 2), dist = r(22, 46) * o.scale;
        front.push(flower(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, r(0.65, 1.05) * o.scale, pick(['b5', 'b5', 'da', 'bd', 'ro'])));
      }
      for (let k = 0; k < 3; k++) { const a = r(0, Math.PI * 2); front.push(leaf(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, r(0.6, 0.9) * o.scale, false)); }
      front.push(flower(cx, cy, r(1.35, 1.85) * o.scale, 'ro'));
    }
    for (let i = 0; i < count(2.6); i++) { const s = spot(o.width * 0.9); front.push(flower(s.x, s.y, r(0.5, 0.85) * o.scale, pick(['b5', 'da', 'bd', 'bd']))); }
    for (let i = 0; i < count(1.5); i++) {
      const s = spot(o.width * 1.25);
      top.push(R() < 0.5
        ? use('sp', s.x, s.y, r(0, 45), r(0.35, 0.8), `fill="${pick(GOLD)}"`)
        : `<circle cx="${n1(s.x)}" cy="${n1(s.y)}" r="${n1(r(5, 11))}" fill="url(#gl)"/><circle cx="${n1(s.x)}" cy="${n1(s.y)}" r="1.5" fill="#FFF6D6"/>`);
    }
    return back.join('') + mid.join('') + front.join('') + top.join('');
  }

  function wisteria(x, y, len) {
    let s = `<path d="M${n1(x)} ${n1(y - 14)}V${n1(y + len * 0.55)}" stroke="${SAGE[2]}" stroke-width="1.1" fill="none"/>`;
    const steps = Math.max(5, Math.round(len / 8.5));
    const sway = r(-0.25, 0.25);
    for (let k = 0; k < steps; k++) {
      const u = k / (steps - 1);
      const w = (1 - u) * 13 + 1.5;
      const per = u < 0.75 ? 3 : 2;
      for (let j = 0; j < per; j++) {
        const fx = x + sway * k * 1.6 + (per === 1 ? 0 : (j / (per - 1) - 0.5) * 2 * w) + r(-2, 2);
        const fy = y + u * len + r(-3, 3);
        s += use('fl', fx, fy, r(-35, 35), (1 - u) * 0.75 + 0.5, `fill="${pick(u > 0.6 ? [LILAC[2], LILAC[1], '#8F78BA'] : LILAC)}"`);
      }
    }
    return s;
  }

  function bed(x, y, dir, s) { // a fan of ferns and blooms, like the foot of the printed card
    let out = '';
    const fans = [-34, -16, 2, 20, 36].map((a) => a * dir + r(-6, 6));
    fans.forEach((a, i) => { out += fern(x + i * 16 * dir * s, y + r(0, 10), a, r(1.25, 1.85) * s, pick(SAGE)); });
    for (let i = 0; i < 16; i++) out += leaf(x + r(-30, 120) * dir * s, y - r(0, 70) * s, r(0.9, 1.6) * s, R() < 0.3);
    for (let i = 0; i < 6; i++) out += flower(x + r(-20, 120) * dir * s, y - r(10, 80) * s, r(0.8, 1.5) * s);
    return out;
  }

  return { R, r, pick, use, polyline, garland, wisteria, bed, leaf, fern, flower };
}

const wrap = (w, h, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}>${defs()}${body}</svg>\n`;

// ---------- 1. Garden arch (opening screen) ----------
function arch() {
  const A = makeArt(11);
  const W = 800, H = 1200, x0 = 72, x1 = 728, shoulder = 430, cx = 400, rad = (x1 - x0) / 2;
  const pts = [];
  for (let y = H; y > shoulder; y -= 6) pts.push([x0, y]);
  for (let a = Math.PI; a <= Math.PI * 2 + 1e-6; a += Math.PI / 160) pts.push([cx + rad * Math.cos(a), shoulder + rad * Math.sin(a)]);
  for (let y = shoulder; y <= H; y += 6) pts.push([x1, y]);
  const p = A.polyline(pts);
  const pillar = (H - shoulder) / p.total;
  // fuller over the crown and at the feet, lighter on the uprights
  const density = (t) => {
    const u = t < 0.5 ? t : 1 - t;
    if (u < 0.07) return 1;
    if (u < pillar) return 0.5;
    return 0.72 + 0.28 * Math.sin(((u - pillar) / (0.5 - pillar)) * Math.PI / 2);
  };
  let s = '';
  s += `<path d="M112 ${H}V${shoulder}A288 288 0 0 1 688 ${shoulder}V${H}" fill="none" stroke="#C9A45C" stroke-width="2.4"/>`;
  s += `<path d="M124 ${H}V${shoulder}A276 276 0 0 1 676 ${shoulder}V${H}" fill="none" stroke="#C9A45C" stroke-width="1" opacity=".6"/>`;
  // wisteria hanging inside the crown: long at the shoulders, short at the centre
  for (let i = 0; i < 15; i++) {
    const a = Math.PI * (1.04 + (0.92 * (i + A.r(0.2, 0.8))) / 15);
    const rr = rad - 34;
    const x = cx + rr * Math.cos(a), y = shoulder + rr * Math.sin(a);
    const len = 46 + 150 * Math.pow(Math.abs(Math.cos(a)), 1.3) + A.r(-10, 22);
    s += A.wisteria(x, y, len);
  }
  s += A.garland(p, { width: 40, scale: 1, density, clusters: 0.8 });
  s += A.bed(46, H + 6, 1, 1.05) + A.bed(W - 46, H + 6, -1, 1.05);
  return wrap(W, H, s);
}

// ---------- 2. Meadow (footer) ----------
function meadow() {
  const A = makeArt(23);
  const W = 800, H = 230;
  let s = '';
  for (let i = 0; i < 26; i++) {
    const x = A.r(-10, W + 10);
    const edge = Math.abs(x - W / 2) / (W / 2);
    s += A.fern(x, H + 8, A.r(-28, 28), A.r(0.7, 1.1) + edge * 0.9, A.pick(SAGE));
  }
  for (let i = 0; i < 90; i++) s += A.leaf(A.r(0, W), H - A.r(0, 50), A.r(0.8, 1.5), A.R() < 0.3);
  for (let i = 0; i < 34; i++) {
    const x = A.r(10, W - 10);
    s += A.flower(x, H - A.r(8, 62), A.r(0.7, 1.4));
  }
  for (let i = 0; i < 16; i++) {
    const x = A.r(20, W - 20), y = A.r(40, H - 60);
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(A.r(5, 10))}" fill="url(#gl)"/><circle cx="${n1(x)}" cy="${n1(y)}" r="1.4" fill="#FFF6D6"/>`;
  }
  return wrap(W, H, s, ' preserveAspectRatio="xMidYMax slice"');
}

// ---------- 3. Sprig divider ----------
function sprig() {
  const A = makeArt(5);
  const W = 260, H = 44, cy = 24;
  let s = `<path d="M18 ${cy}Q74 ${cy - 10} 130 ${cy}Q186 ${cy + 10} 242 ${cy}" fill="none" stroke="#C9A45C" stroke-width="1.1"/>`;
  for (let i = 0; i < 7; i++) {
    const d = 22 + i * 13;
    for (const dir of [-1, 1]) {
      const x = 130 + dir * d;
      const y = cy + dir * Math.sin((d / 112) * Math.PI) * 5;
      const up = i % 2 === 0 ? 1 : -1;
      s += A.use('l', x, y, dir * 90 + up * dir * -48, 0.36 - i * 0.02, `fill="${SAGE[i % SAGE.length]}"`);
    }
  }
  s += A.use('b5', 130, cy, 0, 0.62, `fill="${LILAC[0]}" color="${GOLD[0]}"`);
  s += A.use('bd', 104, cy - 3, -70, 0.5, `fill="${BLUSH[1]}" color="${SAGE[2]}"`) + A.use('bd', 156, cy + 3, 110, 0.5, `fill="${BLUSH[1]}" color="${SAGE[2]}"`);
  s += A.use('sp', 10, cy, 0, 0.42, `fill="${GOLD[0]}"`) + A.use('sp', 250, cy, 0, 0.42, `fill="${GOLD[0]}"`);
  return wrap(W, H, s);
}

// ---------- 4. Share cover (1200 x 630; text is added in tools/cover.html) ----------
function cover() {
  const A = makeArt(41);
  const W = 1200, H = 630, m = 58, rad = 150;
  const pts = [];
  for (let y = H + 20; y > m + rad; y -= 6) pts.push([m, y]);
  for (let a = Math.PI; a <= Math.PI * 1.5 + 1e-6; a += Math.PI / 120) pts.push([m + rad + rad * Math.cos(a), m + rad + rad * Math.sin(a)]);
  for (let x = m + rad; x < W - m - rad; x += 6) pts.push([x, m]);
  for (let a = Math.PI * 1.5; a <= Math.PI * 2 + 1e-6; a += Math.PI / 120) pts.push([W - m - rad + rad * Math.cos(a), m + rad + rad * Math.sin(a)]);
  for (let y = m + rad; y <= H + 20; y += 6) pts.push([W - m, y]);
  const p = A.polyline(pts);
  let s = `<rect width="${W}" height="${H}" fill="#FBF7EF"/>`;
  s += `<path d="M${m + 40} ${H}V${m + rad + 20}A${rad - 20} ${rad - 20} 0 0 1 ${m + rad + 20} ${m + 40}H${W - m - rad - 20}A${rad - 20} ${rad - 20} 0 0 1 ${W - m - 40} ${m + rad + 20}V${H}" fill="#FFFDF8" stroke="#C9A45C" stroke-width="2"/>`;
  for (let i = 0; i < 9; i++) {
    const left = i % 2 === 0;
    const x = left ? A.r(m + 46, m + 150) : A.r(W - m - 150, W - m - 46);
    s += A.wisteria(x, m + 64 + A.r(0, 60), A.r(70, 150));
  }
  const density = (t) => { const u = Math.abs(t - 0.5) * 2; return 0.55 + 0.45 * Math.min(1, Math.abs(u - 0.45) * 2.4); };
  s += A.garland(p, { width: 36, scale: 0.95, density, clusters: 0.8 });
  s += A.bed(26, H + 8, 1, 1) + A.bed(W - 26, H + 8, -1, 1);
  return wrap(W, H, s);
}

fs.mkdirSync(OUT, { recursive: true });
const files = { 'arch.svg': arch(), 'meadow.svg': meadow(), 'sprig.svg': sprig(), 'cover-art.svg': cover() };
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log(name, (svg.length / 1024).toFixed(1) + ' KB');
}
