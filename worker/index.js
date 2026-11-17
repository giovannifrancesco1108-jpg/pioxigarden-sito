// Worker: serve il sito statico, le API (pagamenti, pannello /admin) e le foto caricate dal pannello.
import * as checkout from "../functions/api/create-checkout-session.js";
import * as webhook from "../functions/api/webhook.js";
import * as payStatus from "../functions/api/pay-status.js";
import * as prenota from "../functions/api/prenota.js";
import { admin, publicData, blob } from "./admin.js";

const ROUTES = {
  "/api/create-checkout-session": { POST: checkout.onRequestPost },
  "/api/webhook": { POST: webhook.onRequestPost },
  "/api/pay-status": { GET: payStatus.onRequestGet },
  "/api/prenota": { POST: prenota.onRequestPost },
  "/api/data": { GET: ({ env }) => publicData(env) },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    // Dominio principale: www e gli altri domini acquistati rimandano qui (301), così Google vede un solo sito.
    const PRIMARY = "pioxigarden.com";
    const h = url.hostname;
    if (h !== PRIMARY && !h.endsWith(".workers.dev") && h !== "localhost" && !pathname.startsWith("/api/")) {
      return Response.redirect("https://" + PRIMARY + pathname + url.search, 301);
    }
    try {
      if (pathname.startsWith("/api/admin/")) return await admin(request, env, pathname.slice(11));
      const route = ROUTES[pathname];
      if (route) {
        const fn = route[request.method];
        if (!fn) return new Response("Method Not Allowed", { status: 405, headers: { Allow: Object.keys(route).join(", ") } });
        return await fn({ request, env, ctx });
      }
      if (pathname.startsWith("/_blob/")) {
        const r = await env.ASSETS.fetch(request);
        if (r.status !== 404) return r;
        return (await blob(env, pathname.slice(7))) || r;
      }
    } catch (e) {
      console.log("Errore:", e && e.message);
      return new Response(JSON.stringify({ error: "server" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const res = await env.ASSETS.fetch(request);
    if (pathname.startsWith("/admin")) {
      const r = new Response(res.body, res);
      r.headers.set("X-Robots-Tag", "noindex, nofollow");
      r.headers.set("Cache-Control", "no-store");
      return r;
    }
    return res;
  },
};
