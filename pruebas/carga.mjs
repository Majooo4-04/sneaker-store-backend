// carga.mjs - prueba de carga reproducible (Práctica 12)
// Uso: node carga.mjs <url> [solicitudes_por_nivel] [niveles separados por coma]
import { writeFileSync, mkdirSync } from "node:fs";

const url = process.argv[2];
const total = Number(process.argv[3] || 100);
const niveles = (process.argv[4] || "1,10,25,50").split(",").map(Number);
const metodo = process.env.METHOD || "GET";
const cuerpo = process.env.BODY || undefined;
const headers = { "Content-Type": "application/json" };
if (process.env.TOKEN) headers.Authorization = `Bearer ${process.env.TOKEN}`;

const pct = (a, p) => a[Math.max(0, Math.ceil(p * a.length) - 1)];

async function una() {
  const t0 = performance.now();
  try {
    const r = await fetch(url, { method: metodo, headers, body: cuerpo,
      signal: AbortSignal.timeout(30000) });
    const bytes = (await r.arrayBuffer()).byteLength;
    return { ms: performance.now() - t0, status: r.status, bytes };
  } catch (e) {
    const causa = (e.cause && e.cause.code) || e.name || "fallo";
    return { ms: performance.now() - t0, status: "ERR:" + causa, bytes: 0 };
  }
}

async function nivel(conc) {
  const tiempos = [], codigos = {};
  let lanzadas = 0, bytes = 0;
  const t0 = performance.now();
  await Promise.all(Array.from({ length: conc }, async () => {
    while (lanzadas < total) {
      lanzadas++;
      const r = await una();
      tiempos.push(r.ms); bytes += r.bytes;
      codigos[r.status] = (codigos[r.status] || 0) + 1;
    }
  }));
  const seg = (performance.now() - t0) / 1000;
  tiempos.sort((a, b) => a - b);
  const ok = Object.entries(codigos).filter(([c]) => /^2/.test(c)).reduce((s, [, n]) => s + n, 0);
  return {
    concurrentes: conc, solicitudes: total, exitosas: ok,
    errores_pct: +(100 * (total - ok) / total).toFixed(2),
    rps: +(total / seg).toFixed(1),
    promedio_ms: +(tiempos.reduce((a, b) => a + b, 0) / total).toFixed(1),
    p90_ms: +pct(tiempos, 0.9).toFixed(1), p95_ms: +pct(tiempos, 0.95).toFixed(1),
    max_ms: +tiempos[tiempos.length - 1].toFixed(1), duracion_s: +seg.toFixed(2),
    bytes_resp: Math.round(bytes / total), codigos,
  };
}

console.log("Calentando servidor (evita contar el arranque en frio)...");
const w = await una();
console.log(`Calentamiento: ${w.status} en ${w.ms.toFixed(0)} ms`);

const resultados = [];
for (const c of niveles) {
  const r = await nivel(c);
  resultados.push(r);
  console.log(JSON.stringify(r));
  await new Promise(res => setTimeout(res, 3000));
}
mkdirSync("evidencia-p12", { recursive: true });
const etiqueta = process.env.ETIQUETA || "antes";
writeFileSync(`evidencia-p12/carga-${etiqueta}.json`,
  JSON.stringify({ url, metodo, fecha: new Date().toISOString(), resultados }, null, 2));
console.log(`Guardado en evidencia-p12/carga-${etiqueta}.json`);
