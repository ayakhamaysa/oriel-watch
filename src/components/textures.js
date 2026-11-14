import * as THREE from "three";

// All the fine surface details are drawn in code on a canvas (no image files):
// the sunburst dial, the watchmaker's finishes on the movement, the leather grain.

function canvas(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

// A repeatable random generator (same picture every time)
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// The dial: "sunburst" brushing (thin lines from the centre that catch the light),
// a minute track around the edge, and the brand name printed on it
export function dialTexture(color, ink, brand) {
  const t = canvas(1024, (ctx, s) => {
    const c = s / 2;
    // base color, a little lighter in the middle
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.12).getStyle());
    g.addColorStop(1, new THREE.Color(color).multiplyScalar(0.75).getStyle());
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    // sunburst: 720 thin rays, some lighter, some darker
    const r = seeded(5);
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI * 2;
      ctx.strokeStyle = r() > 0.5 ? `rgba(255,255,255,${0.02 + r() * 0.05})` : `rgba(0,0,0,${0.03 + r() * 0.06})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.sin(a) * c, c - Math.cos(a) * c);
      ctx.stroke();
    }
    // minute track: 60 small lines around the edge
    ctx.strokeStyle = ink;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const long = i % 5 === 0;
      ctx.lineWidth = long ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.sin(a) * c * 0.955, c - Math.cos(a) * c * 0.955);
      ctx.lineTo(c + Math.sin(a) * c * (long ? 0.895 : 0.92), c - Math.cos(a) * c * (long ? 0.895 : 0.92));
      ctx.stroke();
    }
    // printing
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.font = "600 64px 'Cormorant Garamond', serif";
    ctx.letterSpacing = "14px";
    ctx.fillText(brand, c + 7, c - 210);
    ctx.font = "500 22px 'Inter', sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("AUTOMATIC", c + 4, c + 230);
    ctx.font = "400 18px 'Inter', sans-serif";
    ctx.letterSpacing = "5px";
    ctx.globalAlpha = 0.7;
    ctx.fillText("CHRONOMÈTRE", c + 3, c + 262);
  });
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// "Perlage": small overlapping circles brushed into the movement plate
export function perlageTexture() {
  const t = canvas(512, (ctx, s) => {
    ctx.fillStyle = "#c9c3b4";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s + 20; y += 22) {
      for (let x = 0; x < s + 20; x += 22) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
        g.addColorStop(0, "rgba(255,255,255,0.35)");
        g.addColorStop(0.7, "rgba(120,110,95,0.25)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + ((y / 22) % 2) * 11, y, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// "Côtes de Genève": the famous wide stripes on the bridges and the rotor
export function genevaTexture(base = "#cfc8b8") {
  const t = canvas(512, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    for (let x = -64; x < s + 64; x += 48) {
      const g = ctx.createLinearGradient(x, 0, x + 48, 0);
      g.addColorStop(0, "rgba(255,255,255,0.45)");
      g.addColorStop(0.5, "rgba(80,70,55,0.2)");
      g.addColorStop(1, "rgba(255,255,255,0.45)");
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.rotate(-0.35);
      ctx.translate(-s / 2, -s / 2);
      ctx.fillRect(x, -s, 48, s * 3);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(60,50,40,0.75)";
    ctx.font = "600 34px 'Cormorant Garamond', serif";
    ctx.textAlign = "center";
    ctx.fillText("ORIEL · OR-01", s / 2, s * 0.32);
    ctx.font = "400 18px 'Inter', sans-serif";
    ctx.fillText("31 JEWELS · ADJUSTED 5 POSITIONS", s / 2, s * 0.38);
  });
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Leather grain, used as a bump map (tiny ups and downs on the strap)
export function grainTexture() {
  const t = canvas(256, (ctx, s) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, s, s);
    const r = seeded(9);
    for (let i = 0; i < 2600; i++) {
      const v = Math.floor(100 + r() * 70);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.beginPath();
      ctx.arc(r() * s, r() * s, 0.5 + r() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 6);
  return t;
}

// The presentation box: the brand logo printed in gold on the inside of the lid (cream satin)
// and on the outside (black leather)
export function boxLogoTexture(inside) {
  const t = canvas(1024, (ctx, s) => {
    ctx.fillStyle = inside ? "#efe6d6" : "#121214";
    ctx.fillRect(0, 0, s, s);
    if (inside) {
      // soft satin folds
      for (let i = 0; i < 14; i++) {
        const g = ctx.createLinearGradient(0, (i / 14) * s, 0, ((i + 1) / 14) * s);
        g.addColorStop(0, "rgba(255,255,255,0.18)");
        g.addColorStop(1, "rgba(150,120,80,0.10)");
        ctx.fillStyle = g;
        ctx.fillRect(0, (i / 14) * s, s, s / 14);
      }
    }
    // thin gold frame
    ctx.strokeStyle = "#c9a96e";
    ctx.lineWidth = 6;
    ctx.strokeRect(46, 46, s - 92, s - 92);
    // logo: a small watch-face circle + the brand name
    const gold = ctx.createLinearGradient(0, s * 0.35, 0, s * 0.65);
    gold.addColorStop(0, "#f3dca2");
    gold.addColorStop(0.5, "#c9a96e");
    gold.addColorStop(1, "#8f7140");
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(s / 2, s * 0.38, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s / 2, s * 0.38);
    ctx.lineTo(s / 2, s * 0.38 - 30);
    ctx.moveTo(s / 2, s * 0.38);
    ctx.lineTo(s / 2 + 20, s * 0.38 + 10);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "600 150px 'Cormorant Garamond', serif";
    ctx.letterSpacing = "40px";
    ctx.fillText("ORIEL", s / 2 + 20, s * 0.6);
    ctx.font = "500 30px 'Inter', sans-serif";
    ctx.letterSpacing = "14px";
    ctx.fillText("HERITAGE 40", s / 2 + 7, s * 0.68);
  });
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
