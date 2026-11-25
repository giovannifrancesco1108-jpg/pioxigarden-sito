// API della pagina /admin/alloggiati/ (solo dopo l'accesso al pannello).
import { credenziali, aiKey, provaAccesso, generaToken, tabella, controllaRighe, schedine, ricevuta, leggiDocumento, provaChiaveAI, AwError } from "../lib/alloggiati.js";

const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const oggi = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
const maschera = (u) => (u.length <= 3 ? "•••" : u.slice(0, 2) + "•".repeat(Math.min(8, u.length - 3)) + u.slice(-1));

async function stato(env) {
  const [c, k, info, log] = await Promise.all([credenziali(env), aiKey(env), env.PX.get("aw_tab_info", { type: "json" }), env.PX.get("aw_log", { type: "json" })]);
  return {
    portale: Boolean(c), fonte: c ? c.fonte : "", utente: c ? maschera(c.utente) : "",
    ai: Boolean(k), aiFonte: env.ANTHROPIC_API_KEY ? "cloudflare" : k ? "pannello" : "",
    tabelle: info || null, registro: (log || []).slice(0, 20),
  };
}
async function caricaTabelle(env, c) {
  const token = await generaToken(c);
  const [luoghi, documenti] = await Promise.all([tabella(c, "Luoghi", token), tabella(c, "Tipi_Documento", token)]);
  // elenco degli appartamenti: c'è solo per le utenze "Gestione Appartamenti"
  let app = ""; try { app = await tabella(c, "ListaAppartamenti", token); } catch { app = ""; }
  await Promise.all([env.PX.put("aw_tab_luoghi", luoghi), env.PX.put("aw_tab_doc", documenti), env.PX.put("aw_tab_app", app)]);
  const info = { aggiornate: new Date().toISOString(), righe: luoghi.split("\n").length, appartamenti: Boolean(app.trim()) };
  await env.PX.put("aw_tab_info", JSON.stringify(info));
  return info;
}
async function registra(env, voce) {
  const log = (await env.PX.get("aw_log", { type: "json" })) || [];
  log.unshift(voce);
  await env.PX.put("aw_log", JSON.stringify(log.slice(0, 40)));
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function alloggiati(req, env, p, m) {
  try {
    if (p === "stato" && m === "GET") return J(await stato(env));

    if (p === "credenziali") {
      if (m === "DELETE") { await env.PX.delete("aw_cred"); return J(await stato(env)); }
      if (m === "PUT") {
        if (env.ALLOGGIATI_UTENTE) return J({ error: "cloudflare" }, 409);
        const b = await req.json().catch(() => ({}));
        const c = { utente: String(b.utente || "").trim(), password: String(b.password || ""), wskey: String(b.wskey || "").trim() };
        if (!c.utente || c.utente.length > 60 || !c.password || c.password.length > 100 || !c.wskey || c.wskey.length > 200) return J({ error: "campi" }, 400);
        await provaAccesso(c); // salva solo credenziali che il portale accetta
        await env.PX.put("aw_cred", JSON.stringify({ utente: c.utente, password: c.password, wskey: c.wskey }));
        let tab = "";
        try { await caricaTabelle(env, c); } catch (e) { tab = (e && e.detail) || "tabelle non scaricate"; }
        return J({ ...(await stato(env)), avvisoTabelle: tab });
      }
    }
    if (p === "tabelle") {
      if (m === "GET") {
        const [luoghi, documenti, app, info] = await Promise.all([env.PX.get("aw_tab_luoghi"), env.PX.get("aw_tab_doc"), env.PX.get("aw_tab_app"), env.PX.get("aw_tab_info", { type: "json" })]);
        return J({ luoghi: luoghi || "", documenti: documenti || "", appartamenti: app || "", info: info || null });
      }
      if (m === "POST") {
        const c = await credenziali(env);
        if (!c) return J({ error: "non_collegato" }, 409);
        return J({ info: await caricaTabelle(env, c) });
      }
    }
    if (p === "ai") {
      if (m === "DELETE") { await env.PX.delete("ai_key"); return J(await stato(env)); }
      if (m === "PUT") {
        const { key } = await req.json().catch(() => ({}));
        const k = String(key || "").trim();
        if (!/^sk-ant-[A-Za-z0-9_-]{20,300}$/.test(k)) return J({ error: "formato" }, 400);
        const s = await provaChiaveAI(k);
        if (s === 401 || s === 403) return J({ error: "non_valida" }, 400);
        if (s >= 500 || s === 0) return J({ error: "ai_giu" }, 502);
        await env.PX.put("ai_key", k);
        return J(await stato(env));
      }
    }
    if (p === "leggi" && m === "POST") {
      const key = await aiKey(env);
      if (!key) return J({ error: "ai_mancante" }, 409);
      const len = +(req.headers.get("content-length") || 0);
      if (len > 9 * 1024 * 1024) return J({ error: "troppo_grande" }, 413);
      const b = await req.json().catch(() => ({}));
      const im = Array.isArray(b.immagini) ? b.immagini : [];
      if (!im.length || im.length > 4 || im.some((x) => !x || !/^image\/(jpeg|png|webp)$/.test(x.type) || typeof x.data !== "string" || x.data.length > 3.5e6 || !/^[A-Za-z0-9+/=]+$/.test(x.data.slice(0, 200))))
        return J({ error: "immagini" }, 400);
      // limite giornaliero: protegge la chiave da un uso sbagliato
      const ck = "aw_ai:" + oggi(), n = +(await env.PX.get(ck)) || 0;
      if (n >= 120) return J({ error: "limite" }, 429);
      await env.PX.put(ck, String(n + 1), { expirationTtl: 2 * 86400 });
      return J(await leggiDocumento(key, im));
    }
    if ((p === "verifica" || p === "invia") && m === "POST") {
      const c = await credenziali(env);
      if (!c) return J({ error: "non_collegato" }, 409);
      const b = await req.json().catch(() => ({}));
      const bad = controllaRighe(b.righe);
      if (bad) return J({ error: "schedine", detail: bad }, 400);
      const r = await schedine(c, b.righe, p === "invia" ? "Send" : "Test");
      if (p === "invia") await registra(env, { ts: Date.now(), arrivo: ISO.test(b.arrivo || "") ? b.arrivo : "", n: r.totali, valide: r.valide });
      return J(r);
    }
    if (p === "ricevuta" && m === "GET") {
      const c = await credenziali(env);
      if (!c) return J({ error: "non_collegato" }, 409);
      const d = new URL(req.url).searchParams.get("data") || "";
      if (!ISO.test(d)) return J({ error: "data" }, 400);
      const b64 = await ricevuta(c, d);
      const bin = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
      return new Response(bin, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="ricevuta-alloggiati-' + d + '.pdf"', "Cache-Control": "no-store" } });
    }
    return J({ error: "not_found" }, 404);
  } catch (e) {
    if (e instanceof AwError) return J({ error: e.code, detail: e.detail }, e.code === "credenziali" ? 400 : 502);
    console.log("alloggiati: errore interno"); // mai i dati degli ospiti nei registri
    return J({ error: "server" }, 500);
  }
}
