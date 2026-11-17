// Worker: serve il sito statico e instrada le API (le stesse funzioni di /functions usate da Pages).
import * as checkout from "../functions/api/create-checkout-session.js";
import * as webhook from "../functions/api/webhook.js";
import * as payStatus from "../functions/api/pay-status.js";

const ROUTES = {
  "/api/create-checkout-session": { POST: checkout.onRequestPost },
  "/api/webhook": { POST: webhook.onRequestPost },
  "/api/pay-status": { GET: payStatus.onRequestGet },
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
    const route = ROUTES[pathname];
    if (route) {
      const fn = route[request.method];
      if (!fn) return new Response("Method Not Allowed", { status: 405, headers: { Allow: Object.keys(route).join(", ") } });
      return fn({ request, env, ctx });
    }
    return env.ASSETS.fetch(request);
  },
};
