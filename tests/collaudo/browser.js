// COLLAUDO DELLA LETTURA FOTO: la pagina vera in Chrome, le foto caricate nel campo «Fotografa i documenti» come dal telefono.
// Le foto vere degli ospiti NON vanno mai nel repo: si passa una cartella fuori dal progetto. Il risultato (persone lette) resta in un file temporaneo.
// Tesseract.js sostituito dallo stesso motore (tesseract 5, stesso modello eng del sito) chiamato da qui.
const path = require("path");
let puppeteer; try { puppeteer = require("puppeteer"); } catch (e) { try { puppeteer = require("/opt/npm-tools/node_modules/puppeteer"); } catch (e2) { console.log("Serve puppeteer (npm i -g puppeteer) e Chrome."); process.exit(0); } }
const http = require("http"), fs = require("fs"), { execFileSync } = require("child_process"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "../.."), ARG = (n) => (process.argv.find((a) => a.startsWith("--" + n + "=")) || "").split("=").slice(1).join("=");
const CARTELLA = ARG("foto"), OUT = ARG("out") || "/tmp/collaudo-risultati.json", RIPROVA = process.argv.includes("--riprova"), TESSDATA = ARG("tessdata") || "/usr/share/tesseract-ocr/5/tessdata";
if (!CARTELLA) { console.log("Uso: node tests/collaudo/browser.js --foto=/cartella/con/foto [--riprova] [--out=file.json] [--solo=1,2]\nLe foto vere NON vanno nel repo."); process.exit(0); }
const SOLO = (process.argv.find((a) => a.startsWith("--solo=")) || "").split("=")[1];
let seen = new Set(), files = [];
for (const f of fs.readdirSync(CARTELLA).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()) {
  const h = crypto.createHash("md5").update(fs.readFileSync(path.join(CARTELLA, f))).digest("hex"); if (seen.has(h)) continue; seen.add(h); files.push(path.join(CARTELLA, f));
}
// tabelle di prova (codici inventati, nomi veri dei comuni e degli stati)
const COMUNI = [["ROMA", "RM"], ["MARINO", "RM"], ["FRASCATI", "RM"], ["VELLETRI", "RM"], ["VITERBO", "VT"], ["LECCE", "LE"], ["CREMONA", "CR"], ["TRAPANI", "TP"], ["ASTI", "AT"], ["ALBANO LAZIALE", "RM"], ["SAVONA", "SV"], ["POTENZA", "PZ"], ["CATANIA", "CT"], ["FOGGIA", "FG"], ["GENOVA", "GE"], ["MILANO", "MI"], ["NAPOLI", "NA"]];
const STATI = ["ITALIA", "REGNO UNITO", "IRLANDA", "FRANCIA", "SPAGNA", "BELGIO", "RUSSIA", "SUD AFRICA", "GRECIA", "GERMANIA", "STATI UNITI D'AMERICA", "SVIZZERA", "AUSTRIA", "PAESI BASSI", "POLONIA", "ROMANIA", "UNIONE SOVIETICA"];
const luoghi = ["Codice;Descrizione;Provincia;DataFineVal"].concat(COMUNI.map((c, i) => "4" + String(100000000 + i).slice(1) + ";" + c[0] + ";" + c[1] + ";"), STATI.map((s, i) => "100000" + String(100 + i) + ";" + s + ";EE;")).join("\n");
const documenti = "IDENT;CARTA DI IDENTITA'\nIDELE;CARTA IDENTITA' ELETTRONICA\nPASOR;PASSAPORTO ORDINARIO\nPATEN;PATENTE DI GUIDA";
function pagina() {
  let s = fs.readFileSync(ROOT + "/admin/alloggiati/index.html", "utf8");
  const sost = [
    ["var gt=personeDaFoto()", "window.__T=ULTIME.map(function(U){return{rot:U.rot,testi:U.testi}});var gt=(window.__P=personeDaFoto())"],
    [",false).then(function(r){TESTI.push(testoMigliore(U));", ",false).then(function(r){if(r)(window.__MRZ=window.__MRZ||[]).push(r);TESTI.push(testoMigliore(U));"],
    ['.then(function(){$("drop").style.pointerEvents=""})});', '.then(function(){$("drop").style.pointerEvents="";window.__fatto=true})});'],
    ["mostraRevisione(buone)})", "window.__R=buone;mostraRevisione(buone)})"],
    [".then(function(){btn.disabled=false})}", ".then(function(){btn.disabled=false;window.__rifatto=true})}"],
  ];
  for (const [a, b] of sost) { if (!s.includes(a)) throw new Error("aggancio non trovato: " + a); s = s.replace(a, b); }
  s = s.replace(/\}\)\(\);\s*<\/script>\s*<\/body>/, "window.__riprova=riprovaFoto;window.__G=function(){return G};})();</script></body>");
  return s;
}
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  const json = (o) => { r.writeHead(200, { "Content-Type": "application/json" }); r.end(JSON.stringify(o)); };
  if (u === "/api/admin/me") return json({ admin: true });
  if (u === "/api/admin/aw/stato") return json({ portale: true, utente: "collaudo", tabelle: { aggiornate: Date.now() }, ai: false });
  if (u === "/api/admin/aw/tabelle") return json({ luoghi, documenti, appartamenti: "1;COLLAUDO", info: {} });
  if (u.startsWith("/api/")) return json({});
  if (u === "/admin/alloggiati/" || u === "/admin/alloggiati/index.html") { r.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return r.end(pagina()); }
  const f = path.join(ROOT, u); if (fs.existsSync(f) && fs.statSync(f).isFile()) { r.writeHead(200, { "Content-Type": /\.js$/.test(f) ? "text/javascript" : /\.css$/.test(f) ? "text/css" : "application/octet-stream" }); return r.end(fs.readFileSync(f)); }
  r.writeHead(404); r.end();
});
const STUB = `window.Tesseract={createWorker:function(){var P={};return Promise.resolve({setParameters:function(p){Object.assign(P,p);return Promise.resolve()},
 recognize:function(c,o,out){var d=c.toDataURL("image/png");return window.__ocr(d,String(P.tessedit_pageseg_mode||"3"),String(P.tessedit_char_whitelist||""),!!(out&&out.tsv)).then(function(x){return{data:{text:x.text,tsv:x.tsv}}})},terminate:function(){}})}};`;
let nOcr = 0;
function ocr(dataUrl, psm, wl, tsv) {
  nOcr++; const f = require("os").tmpdir() + "/collaudo-ocr-" + process.pid; fs.writeFileSync(f + ".png", Buffer.from(dataUrl.split(",")[1], "base64")); if (process.env.SALVA) fs.copyFileSync(f + ".png", require("os").tmpdir() + "/collaudo-img-" + String(nOcr).padStart(3, "0") + "-psm" + psm + ".png");
  const args = [f + ".png", f, "--tessdata-dir", TESSDATA, "--oem", "1", "--psm", psm, "-l", "eng"]; if (wl) args.push("-c", "tessedit_char_whitelist=" + wl); args.push("txt"); if (tsv) args.push("tsv");
  try { execFileSync("tesseract", args, { stdio: "ignore", timeout: 120000 }); } catch (e) { return { text: "", tsv: "" }; }
  return { text: fs.existsSync(f + ".txt") ? fs.readFileSync(f + ".txt", "utf8") : "", tsv: tsv && fs.existsSync(f + ".tsv") ? fs.readFileSync(f + ".tsv", "utf8") : "" };
}
(async () => {
  await new Promise((ok) => srv.listen(8765, ok));
  const br = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
  const ris = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  for (let i = 0; i < files.length; i++) {
    const k = String(i + 1); if (SOLO && !SOLO.split(",").includes(k)) continue; if (ris[k] && !SOLO) continue;
    const pg = await br.newPage(); pg.setDefaultTimeout(0);
    await pg.setRequestInterception(true);
    pg.on("request", (q) => { if (/tesseract\.min\.js/.test(q.url())) return q.respond({ status: 200, contentType: "text/javascript", body: STUB }); if (!q.url().startsWith("http://127.0.0.1:8765")) return q.respond({ status: 404, body: "" }); q.continue(); });
    const errori = []; pg.on("pageerror", (e) => errori.push(String(e.message).slice(0, 200)));
    await pg.exposeFunction("__ocr", ocr);
    await pg.goto("http://127.0.0.1:8765/admin/alloggiati/", { waitUntil: "load" });
    await pg.waitForFunction(() => !document.getElementById("tool").hidden);
    const t0 = Date.now(), n0 = nOcr;
    const inp = await pg.$("#foto"); await inp.uploadFile(files[i]);
    await pg.waitForFunction(() => window.__fatto === true, { polling: 500 });
    const r1 = await pg.evaluate(() => ({ T: window.__T || [], P: window.__P || [], MRZ: window.__MRZ || [], msg: document.getElementById("mL").textContent, scans: [].map.call(document.querySelectorAll("#scans .scan small"), (x) => x.textContent), G: window.__G().map((g) => ({ cognome: g.cognome, nome: g.nome, sesso: g.sesso, nascita: g.nascita, citt: g.citt, statoN: g.statoN, comuneN: g.comuneN, num: g.num, ril: g.ril, doc: g.doc, dubbi: Object.keys(g.dubbi || {}) })) }));
    const voce = { file: path.basename(files[i]), primo: r1, ocr1: nOcr - n0, sec1: Math.round((Date.now() - t0) / 1000), errori };
    if (RIPROVA) {
      const t1 = Date.now(), n1 = nOcr;
      await pg.evaluate(() => window.__riprova());
      await pg.waitForFunction(() => window.__rifatto === true, { polling: 500 });
      voce.riprova = await pg.evaluate(() => ({ R: window.__R || [], msg: document.getElementById("mL").textContent + " | " + document.getElementById("mI").textContent }));
      voce.ocr2 = nOcr - n1; voce.sec2 = Math.round((Date.now() - t1) / 1000);
    }
    ris[k] = voce; fs.writeFileSync(OUT, JSON.stringify(ris));
    console.log(k, "letture OCR", voce.ocr1, "in", voce.sec1, "s", RIPROVA ? "| riprova " + voce.ocr2 + " letture " + voce.sec2 + " s" : "", errori.length ? "ERRORI: " + errori.join(" / ") : "");
    await pg.close();
  }
  await br.close(); srv.close();
})().catch((e) => { console.error("COLLAUDO FALLITO", e); process.exit(1); });
