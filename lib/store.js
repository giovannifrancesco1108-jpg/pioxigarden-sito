// Archivio del sito su Cloudflare KV (binding PX): foto, testi, blocchi, prezzi, impostazioni, accesso admin.
import { SEED } from "./seed.js";

export const COLS = ["foto", "extra", "blocchi"];
const enc = new TextEncoder();

export function kv(env) {
  if (!env.PX) throw new Error("kv_missing");
  return env.PX;
}
export async function getJSON(env, key, def) {
  if (!env.PX) return def;
  const v = await env.PX.get(key, { type: "json" });
  return v == null ? def : v;
}
export async function putJSON(env, key, val) {
  await kv(env).put(key, JSON.stringify(val));
}
export async function getCol(env, name) {
  return getJSON(env, "col:" + name, SEED[name] || {});
}

/* ---- prezzi ---- */
export const PREZZI_DEF = { notte: 75, weekend: null, pulizie: 0, min: 1, max: 30, ospiti: 4, stagioni: [] };
const num = (v, d) => { if (v === "" || v == null) return d; const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) && n >= 0 ? n : d; };
export function cleanPrezzi(p) {
  p = p || {};
  const isoOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  return {
    notte: Math.min(5000, num(p.notte, 75)) || 75,
    weekend: p.weekend === "" || p.weekend == null ? null : Math.min(5000, num(p.weekend, null)),
    pulizie: Math.min(1000, num(p.pulizie, 0)),
    min: Math.max(1, Math.min(30, Math.round(num(p.min, 1)))),
    max: 30,
    ospiti: Math.max(1, Math.min(4, Math.round(num(p.ospiti, 4)))),
    stagioni: (Array.isArray(p.stagioni) ? p.stagioni : [])
      .filter((x) => x && isoOk(x.dal) && isoOk(x.al) && x.al >= x.dal && num(x.notte, null) != null)
      .slice(0, 40)
      .map((x) => ({ dal: x.dal, al: x.al, notte: Math.min(5000, num(x.notte, 75)), nome: String(x.nome || "").slice(0, 40) })),
  };
}
export async function getPrezzi(env) {
  const base = { ...PREZZI_DEF };
  // vecchie variabili d'ambiente come ripiego
  if (env.PREZZO_NOTTE) base.notte = num(env.PREZZO_NOTTE, 75);
  if (env.PULIZIE) base.pulizie = num(env.PULIZIE, 0);
  if (env.NOTTI_MIN) base.min = Math.max(1, Math.round(num(env.NOTTI_MIN, 1)));
  return cleanPrezzi({ ...base, ...(await getJSON(env, "prezzi", {})) });
}
// prezzo di ogni notte: periodo speciale > weekend (notti di venerdì e sabato) > base
export function nightPrice(P, iso) {
  const s = P.stagioni.find((x) => iso >= x.dal && iso <= x.al);
  if (s) return s.notte;
  const d = new Date(iso + "T12:00:00Z").getUTCDay();
  if ((d === 5 || d === 6) && P.weekend != null) return P.weekend;
  return P.notte;
}

/* ---- impostazioni ---- */
export const IMP_DEF = { carta: true, airbnb: "", vrbo: "", booking: "" };
export function cleanImp(p) {
  p = p || {};
  const url = (u) => (/^https:\/\/[^\s"<>]+$/.test(String(u || "").trim()) ? String(u).trim().slice(0, 500) : "");
  return { carta: p.carta !== false, airbnb: url(p.airbnb), vrbo: url(p.vrbo), booking: url(p.booking) };
}
export async function getImp(env) {
  return cleanImp({ ...IMP_DEF, ...(await getJSON(env, "impostazioni", {})) });
}

/* ---- accesso ---- */
function hex(b) { return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
export async function hashPw(pw, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return { salt: hex(salt), hash: hex(bits) };
}
export function eq(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0;
}
export function newToken() { return hex(crypto.getRandomValues(new Uint8Array(32))); }
export function cookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? m[1] : "";
}
export async function isAdmin(req, env) {
  if (!env.PX) return false;
  const t = cookie(req, "pxs");
  if (!/^[0-9a-f]{64}$/.test(t)) return false;
  return (await env.PX.get("sess:" + t)) === "1";
}

/* ---- chiave Stripe: dai segreti di Cloudflare oppure salvata dal pannello /admin (mai restituita) ---- */
export async function stripeKey(env) {
  if (env.STRIPE_SECRET_KEY) return env.STRIPE_SECRET_KEY;
  if (!env.PX) return "";
  return (await env.PX.get("stripe_key")) || "";
}
export function validStripeKey(k) {
  return /^(rk|sk)_(live|test)_[A-Za-z0-9]{20,250}$/.test(String(k || "").trim());
}
