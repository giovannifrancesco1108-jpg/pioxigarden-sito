// API del pannello riservato (/admin) e dati pubblici del sito.
import { alloggiati } from "./alloggiati.js";
import { COLS, getCol, putJSON, getJSON, getPrezzi, cleanPrezzi, getImp, cleanImp, hashPw, eq, newToken, cookie, isAdmin, stripeKey, validStripeKey } from "../lib/store.js";

const J = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...h } });
const DAY = 86400;

function sameOrigin(req) {
  const o = req.headers.get("origin");
  return !o || o === new URL(req.url).origin;
}
function sessCookie(t, maxAge) {
  return `pxs=${t}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
async function tooMany(env, ip) {
  const n = +(await env.PX.get("fail:" + ip)) || 0;
  return n >= 10;
}
async function fail(env, ip) {
  const n = +(await env.PX.get("fail:" + ip)) || 0;
  await env.PX.put("fail:" + ip, String(n + 1), { expirationTtl: 900 });
}
async function startSession(env) {
  const t = newToken();
  await env.PX.put("sess:" + t, "1", { expirationTtl: 30 * DAY });
  return J({ ok: true }, 200, { "Set-Cookie": sessCookie(t, 30 * DAY) });
}

export async function publicData(env) {
  const [foto, extra, blocchi, imp] = await Promise.all([getCol(env, "foto"), getCol(env, "extra"), getCol(env, "blocchi"), getImp(env)]);
  return J({ foto, extra, blocchi, link: { airbnb: imp.airbnb, vrbo: imp.vrbo, booking: imp.booking }, stat: { gtm: imp.gtm, clarity: imp.clarity, aw: imp.aw, awBuy: imp.awBuy, awLead: imp.awLead } }, 200, { "Cache-Control": "public, max-age=20" });
}

export async function blob(env, id) {
  if (!env.PX || !/^[0-9a-z]{8,40}$/.test(id)) return null;
  const { value, metadata } = await env.PX.getWithMetadata("blob:" + id, { type: "arrayBuffer" });
  if (!value) return null;
  return new Response(value, { headers: { "Content-Type": (metadata && metadata.type) || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
}

export async function admin(req, env, path) {
  if (!env.PX) return J({ error: "kv_missing" }, 503);
  const m = req.method;
  const ip = req.headers.get("cf-connecting-ip") || "x";
  if (m !== "GET" && (!sameOrigin(req) || req.headers.get("x-px") !== "1")) return J({ error: "forbidden" }, 403);

  if (path === "me") {
    const auth = await env.PX.get("auth", { type: "json" });
    const ok = await isAdmin(req, env);
    return J({ admin: ok, setup: !auth, stripe: ok ? Boolean(await stripeKey(env)) : undefined });
  }
  if (path === "setup" && m === "POST") {
    if (await env.PX.get("auth")) return J({ error: "exists" }, 409);
    const { password } = await req.json().catch(() => ({}));
    if (typeof password !== "string" || password.length < 8) return J({ error: "short" }, 400);
    await putJSON(env, "auth", await hashPw(password));
    return startSession(env);
  }
  if (path === "login" && m === "POST") {
    if (await tooMany(env, ip)) return J({ error: "wait" }, 429);
    const { password } = await req.json().catch(() => ({}));
    const auth = await env.PX.get("auth", { type: "json" });
    if (!auth || typeof password !== "string") return J({ error: "bad" }, 401);
    const h = await hashPw(password, auth.salt);
    if (!eq(h.hash, auth.hash)) { await fail(env, ip); return J({ error: "bad" }, 401); }
    return startSession(env);
  }
  if (path === "logout" && m === "POST") {
    const t = cookie(req, "pxs");
    if (/^[0-9a-f]{64}$/.test(t)) await env.PX.delete("sess:" + t);
    return J({ ok: true }, 200, { "Set-Cookie": sessCookie("", 0) });
  }

  // da qui in poi serve l'accesso
  if (!(await isAdmin(req, env))) return J({ error: "login" }, 401);

  if (path === "password" && m === "POST") {
    const { old, password } = await req.json().catch(() => ({}));
    const auth = await env.PX.get("auth", { type: "json" });
    if (!auth || !eq((await hashPw(String(old || ""), auth.salt)).hash, auth.hash)) return J({ error: "bad" }, 401);
    if (typeof password !== "string" || password.length < 8) return J({ error: "short" }, 400);
    await putJSON(env, "auth", await hashPw(password));
    return J({ ok: true });
  }
  if (path === "prezzi") {
    if (m === "GET") return J(await getPrezzi(env));
    if (m === "PUT") { const p = cleanPrezzi(await req.json().catch(() => ({}))); await putJSON(env, "prezzi", p); return J(p); }
  }
  if (path === "impostazioni") {
    if (m === "GET") return J(await getImp(env));
    if (m === "PUT") { const p = cleanImp(await req.json().catch(() => ({}))); await putJSON(env, "impostazioni", p); return J(p); }
  }
  if (path === "stripe") {
    if (m === "PUT") {
      const { key } = await req.json().catch(() => ({}));
      const k = String(key || "").trim();
      if (/^(pk|mk)_/.test(k)) return J({ error: "wrong_kind" }, 400);
      if (!validStripeKey(k)) return J({ error: "format" }, 400);
      // prova la chiave con Stripe prima di salvarla
      const t = await fetch("https://api.stripe.com/v1/checkout/sessions?limit=1", { headers: { Authorization: `Bearer ${k}` } });
      if (t.status === 401) return J({ error: "invalid" }, 400);
      if (t.status === 403) return J({ error: "permissions" }, 400);
      await env.PX.put("stripe_key", k);
      return J({ ok: true, live: k.includes("_live_") });
    }
    if (m === "DELETE") { await env.PX.delete("stripe_key"); return J({ ok: true }); }
  }
  if (path === "upload" && m === "POST") {
    const type = (req.headers.get("content-type") || "").split(";")[0];
    if (!/^image\/(jpeg|png|webp)$/.test(type)) return J({ error: "type" }, 415);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > 15 * 1024 * 1024) return J({ error: "size" }, 413);
    const id = newToken().slice(0, 32);
    await env.PX.put("blob:" + id, buf, { metadata: { type } });
    return J({ id, url: "/_blob/" + id });
  }
  if (path.startsWith("aw/")) return alloggiati(req, env, path.slice(3), m);
  const dm = path.match(/^doc\/([a-z]+)\/([A-Za-z0-9_-]{1,60})$/);
  if (dm && COLS.includes(dm[1]) && (m === "PUT" || m === "DELETE")) {
    const col = await getCol(env, dm[1]);
    if (m === "DELETE") delete col[dm[2]];
    else {
      const body = await req.text();
      if (body.length > 20000) return J({ error: "size" }, 413);
      let d; try { d = JSON.parse(body); } catch { return J({ error: "json" }, 400); }
      if (!d || typeof d !== "object" || Array.isArray(d)) return J({ error: "json" }, 400);
      col[dm[2]] = d;
    }
    await putJSON(env, "col:" + dm[1], col);
    return J({ ok: true, [dm[1]]: col });
  }
  return J({ error: "not_found" }, 404);
}
