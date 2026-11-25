// Alloggiati Web (Polizia di Stato): invio delle schedine con il servizio web ufficiale, più la lettura dei documenti con l'AI.
// Regole di sicurezza:
// - le credenziali del portale e la chiave dell'AI restano sul server (segreti di Cloudflare o archivio KV) e non tornano mai al telefono;
// - foto e dati degli ospiti NON si salvano: passano dal server solo per andare al portale o all'AI e poi spariscono;
// - nel registro restano solo data, numero di schedine ed esito (nessun nome).
const ENDPOINT = "https://alloggiatiweb.poliziadistato.it/service/Service.asmx";
const NS = "AlloggiatiService";
export const AI_MODEL = "claude-sonnet-5-5";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const unesc = (s) => (s.indexOf("&") < 0 ? s : s.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
  const k = e.toLowerCase();
  if (k === "amp") return "&"; if (k === "lt") return "<"; if (k === "gt") return ">"; if (k === "quot") return '"'; if (k === "apos") return "'";
  return String.fromCodePoint(k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
}));
// primo contenuto del tag (con o senza prefisso di namespace)
function tag(xml, t) {
  const m = xml.match(new RegExp("<(?:\\w+:)?" + t + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?" + t + ">"));
  return m ? m[1] : null;
}
function tags(xml, t) {
  const re = new RegExp("<(?:\\w+:)?" + t + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?" + t + ">", "g");
  const out = []; let m; while ((m = re.exec(xml))) out.push(m[1]); return out;
}

export class AwError extends Error {
  constructor(code, detail) { super(code); this.code = code; this.detail = detail || ""; }
}

async function soap(action, inner) {
  const body = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>' + inner + "</soap:Body></soap:Envelope>";
  let r;
  try {
    r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: '"' + NS + "/" + action + '"' }, body, signal: AbortSignal.timeout(25000) });
  } catch (e) {
    throw new AwError("rete", e && e.name === "TimeoutError" ? "Il portale non ha risposto in 25 secondi." : "Il portale non è raggiungibile.");
  }
  const xml = await r.text();
  const fault = tag(xml, "faultstring");
  if (fault) throw new AwError("portale", unesc(fault).slice(0, 300));
  if (!r.ok) throw new AwError("portale", "Risposta " + r.status + " dal portale.");
  return xml;
}
// esito di un blocco EsitoOperazioneServizio
function esito(xml) {
  const e = (tag(xml, "esito") || "").trim().toLowerCase() === "true";
  return { ok: e, cod: unesc((tag(xml, "ErroreCod") || "").trim()), des: unesc((tag(xml, "ErroreDes") || "").trim()), det: unesc((tag(xml, "ErroreDettaglio") || "").trim()) };
}
function erroreDa(x) { return [x.des, x.det].filter(Boolean).join(": ") || "Errore " + (x.cod || "sconosciuto"); }

/* ---- credenziali: dai segreti di Cloudflare oppure salvate dal pannello (mai restituite) ---- */
export async function credenziali(env) {
  if (env.ALLOGGIATI_UTENTE && env.ALLOGGIATI_PASSWORD && env.ALLOGGIATI_WSKEY)
    return { utente: env.ALLOGGIATI_UTENTE, password: env.ALLOGGIATI_PASSWORD, wskey: env.ALLOGGIATI_WSKEY, fonte: "cloudflare" };
  const c = env.PX ? await env.PX.get("aw_cred", { type: "json" }) : null;
  return c && c.utente ? { ...c, fonte: "pannello" } : null;
}
export async function aiKey(env) {
  if (env.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY;
  return env.PX ? (await env.PX.get("ai_key")) || "" : "";
}

export async function generaToken(c) {
  const xml = await soap("GenerateToken", '<GenerateToken xmlns="' + NS + '"><Utente>' + esc(c.utente) + "</Utente><Password>" + esc(c.password) + "</Password><WsKey>" + esc(c.wskey) + "</WsKey></GenerateToken>");
  const res = tag(xml, "result");
  if (res) { const x = esito(res); if (!x.ok) throw new AwError("credenziali", erroreDa(x)); }
  const t = (tag(xml, "token") || "").trim();
  if (!t) throw new AwError("credenziali", "Il portale non ha dato il permesso di accesso.");
  return unesc(t);
}
export async function provaAccesso(c) {
  const token = await generaToken(c);
  const xml = await soap("Authentication_Test", '<Authentication_Test xmlns="' + NS + '"><Utente>' + esc(c.utente) + "</Utente><token>" + esc(token) + "</token></Authentication_Test>");
  const x = esito(tag(xml, "Authentication_TestResult") || xml);
  if (!x.ok) throw new AwError("credenziali", erroreDa(x));
  return token;
}

/* ---- schedine: controllo prima dell'invio (168 caratteri, solo caratteri semplici) ---- */
export function controllaRighe(righe) {
  if (!Array.isArray(righe) || !righe.length) return "Nessuna schedina.";
  if (righe.length > 60) return "Troppe schedine in un invio.";
  for (let i = 0; i < righe.length; i++) {
    const r = righe[i];
    // 168 caratteri; 174 con l'ID dell'appartamento in fondo (utenze "Gestione Appartamenti")
    if (typeof r !== "string" || (r.length !== 168 && r.length !== 174) || r.length !== righe[0].length) return "La schedina " + (i + 1) + " non ha la lunghezza giusta.";
    if (!/^[\x20-\x7E]+$/.test(r)) return "La schedina " + (i + 1) + " contiene caratteri non ammessi.";
    if (!/^(1[6-9]|20)\d\d\/\d\d\/\d{4}\d\d/.test(r)) return "La schedina " + (i + 1) + " ha tipo, data o notti non validi.";
  }
  return "";
}
// azione = "Test" (verifica, non manda nulla alla Questura) oppure "Send" (invio vero)
// Utenze "Gestione Appartamenti": servono i metodi GestioneAppartamenti_Test/Send, con l'ID appartamento come ultimo parametro
// (nella schedina l'ID non va: le righe da 174 caratteri hanno l'ID negli ultimi 6, qui lo si toglie e lo si passa a parte).
export async function schedine(c, righe, azione) {
  const token = await generaToken(c);
  const base = azione === "Send" ? "Send" : "Test";
  const conApp = righe[0].length === 174;
  let a = base, extra = "";
  if (conApp) {
    const grezzo = righe[0].slice(168).trim(); // l'ID dell'appartamento non è un dato dell'ospite
    const id = parseInt(grezzo, 10);
    if (!/^\d+$/.test(grezzo) || !(id > 0)) throw new AwError("schedine", "ID appartamento non valido: «" + grezzo.slice(0, 12) + "». Aggiorna le tabelle e scegli l'appartamento.");
    if (righe.some((r) => r.slice(168).trim() !== grezzo)) throw new AwError("schedine", "Le schedine hanno appartamenti diversi: ne serve uno solo.");
    a = "GestioneAppartamenti_" + base;
    extra = "<IdAppartamento>" + id + "</IdAppartamento>";
    righe = righe.map((r) => r.slice(0, 168));
  }
  const xml = await soap(a, "<" + a + ' xmlns="' + NS + '"><Utente>' + esc(c.utente) + "</Utente><token>" + esc(token) + "</token><ElencoSchedine>" + righe.map((r) => "<string>" + esc(r) + "</string>").join("") + "</ElencoSchedine>" + extra + "</" + a + ">");
  const top = esito(tag(xml, a + "Result") || "");
  const det = tag(xml, "Dettaglio") || "";
  const per = tags(det, "EsitoOperazioneServizio").map(esito);
  const valide = parseInt(tag(xml, "SchedineValide") || "0", 10) || 0;
  if (!top.ok && !per.length) {
    const msg = erroreDa(top);
    throw new AwError("portale", !conApp && /appartament/i.test(msg) ? msg + " (manca l'appartamento: aggiorna le tabelle dal pannello e sceglilo prima di inviare)" : msg);
  }
  return { azione: base, ok: top.ok && valide === righe.length, valide, totali: righe.length, righe: per.map((x) => ({ ok: x.ok, errore: x.ok ? "" : erroreDa(x) })) };
}
export async function ricevuta(c, data) {
  const token = await generaToken(c);
  const xml = await soap("Ricevuta", '<Ricevuta xmlns="' + NS + '"><Utente>' + esc(c.utente) + "</Utente><token>" + esc(token) + "</token><Data>" + esc(data) + "</Data></Ricevuta>");
  const x = esito(tag(xml, "RicevutaResult") || "");
  const pdf = (tag(xml, "PDF") || "").replace(/\s+/g, "");
  if (!pdf) throw new AwError("ricevuta", x.ok ? "Nessuna ricevuta per questa data." : erroreDa(x));
  return pdf; // base64
}
// tabelle ufficiali (Luoghi = comuni e stati, Tipi_Documento): il testo CSV si tiene così com'è, lo legge il telefono
export async function tabella(c, tipo, token) {
  token = token || (await generaToken(c));
  const xml = await soap("Tabella", '<Tabella xmlns="' + NS + '"><Utente>' + esc(c.utente) + "</Utente><token>" + esc(token) + "</token><tipo>" + esc(tipo) + "</tipo></Tabella>");
  const csv = tag(xml, "CSV");
  if (!csv || !csv.trim()) { const x = esito(tag(xml, "TabellaResult") || ""); throw new AwError("tabelle", erroreDa(x)); }
  return unesc(csv);
}

/* ---- lettura dei documenti con Claude ---- */
const PROMPT = `Leggi i documenti d'identità nelle foto per la comunicazione degli ospiti alla Questura (Alloggiati Web).
Le foto possono essere fronte e retro dello stesso documento: in quel caso è UNA persona. Se nelle foto ci sono documenti di persone diverse, una voce per persona.
Se c'è la zona a lettura ottica (MRZ, righe con <<<), usala per controllare cognome, nome, numero del documento, data di nascita e sesso.
Rispondi SOLO con un oggetto JSON, senza altro testo:
{"persone":[{"cognome":"","nome":"","sesso":"M|F","data_nascita":"gg/mm/aaaa","stato_nascita":"","comune_nascita":"","provincia_nascita":"","cittadinanza":"","tipo_documento":"IDENT|IDELE|PASOR|PATEN|ALTRO","numero_documento":"","rilascio_stato":"","rilascio_comune":"","dubbi":[]}],"note":""}
Regole:
- Stati in italiano e in maiuscolo, come nelle tabelle della Polizia di Stato: ITALIA, GERMANIA, FRANCIA, SPAGNA, REGNO UNITO, STATI UNITI D'AMERICA, PAESI BASSI, SVIZZERA, AUSTRIA, POLONIA, ROMANIA…
- Nato in Italia: comune_nascita = comune per esteso in maiuscolo, provincia_nascita = sigla (es. RM). Nato all'estero: comune_nascita e provincia_nascita vuoti.
- tipo_documento: IDENT carta d'identità cartacea, IDELE carta d'identità elettronica, PASOR passaporto, PATEN patente di guida, ALTRO se diverso.
- Luogo di rilascio: documento italiano rilasciato da un comune ("COMUNE DI X") o da una questura ("QUESTURA DI X") → rilascio_comune = X, rilascio_stato = ITALIA. Passaporto italiano del Ministero degli Affari Esteri → ROMA. Patente italiana "MIT-UCO" senza sigla di provincia → ROMA. Documento straniero → rilascio_stato = stato che lo ha emesso e rilascio_comune vuoto.
- Cognome e nome come sul documento, in maiuscolo. Date sempre gg/mm/aaaa.
- Non inventare nulla: se un dato non si legge lascialo vuoto e mettine il nome in "dubbi". Metti in "dubbi" anche i campi di cui non sei sicuro.
- Ignora numeri di carte di pagamento, codici d'accesso o altro che non serve.`;

export async function leggiDocumento(key, immagini) {
  const content = immagini.map((d) => ({ type: "image", source: { type: "base64", media_type: d.type, data: d.data } }));
  content.push({ type: "text", text: "Leggi questi documenti e rispondi con il JSON." });
  let r;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: AI_MODEL, max_tokens: 2000, system: PROMPT, messages: [{ role: "user", content }] }),
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new AwError("ai", "La lettura non ha risposto: riprova.");
  }
  if (r.status === 401 || r.status === 403) throw new AwError("ai_chiave", "La chiave dell'AI non è valida.");
  if (r.status === 429 || r.status === 529) throw new AwError("ai", "L'AI è occupata: riprova tra poco.");
  if (!r.ok) throw new AwError("ai", "Lettura non riuscita (" + r.status + ").");
  const j = await r.json();
  const text = ((j.content || []).find((c) => c.type === "text") || {}).text || "";
  const m = text.match(/\{[\s\S]*\}/);
  let out; try { out = JSON.parse(m ? m[0] : ""); } catch { throw new AwError("ai", "Non sono riuscito a leggere il documento: riprova con una foto più nitida."); }
  const S = (v, n) => String(v == null ? "" : v).slice(0, n);
  const persone = (Array.isArray(out.persone) ? out.persone : []).slice(0, 10).map((p) => ({
    cognome: S(p.cognome, 50), nome: S(p.nome, 30), sesso: /^[MF]$/.test(p.sesso) ? p.sesso : "",
    data_nascita: /^\d\d\/\d\d\/\d{4}$/.test(p.data_nascita) ? p.data_nascita : "",
    stato_nascita: S(p.stato_nascita, 60), comune_nascita: S(p.comune_nascita, 60), provincia_nascita: S(p.provincia_nascita, 2),
    cittadinanza: S(p.cittadinanza, 60), tipo_documento: S(p.tipo_documento, 5), numero_documento: S(p.numero_documento, 20),
    rilascio_stato: S(p.rilascio_stato, 60), rilascio_comune: S(p.rilascio_comune, 60),
    dubbi: (Array.isArray(p.dubbi) ? p.dubbi : []).map((d) => S(d, 30)).slice(0, 20),
  }));
  return { persone, note: S(out.note, 300) };
}
export async function provaChiaveAI(key) {
  const r = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
  return r.status;
}
