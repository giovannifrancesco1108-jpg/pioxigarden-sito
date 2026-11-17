// Worker: serve il sito statico e instrada le API di pagamento (stesse funzioni di Pages in /functions).
import * as checkout from "../functions/api/create-checkout-session.js";
import * as webhook from "../functions/api/webhook.js";

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
    const routes = {
      "/api/create-checkout-session": checkout,
      "/api/webhook": webhook,
    };
    const mod = routes[pathname];
    if (mod) {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
      return mod.onRequestPost({ request, env, ctx });
    }
    return env.ASSETS.fetch(request);
  },
};
