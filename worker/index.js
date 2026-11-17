// Worker: serve il sito statico e instrada le API di pagamento (stesse funzioni di Pages in /functions).
import * as checkout from "../functions/api/create-checkout-session.js";
import * as webhook from "../functions/api/webhook.js";

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
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
