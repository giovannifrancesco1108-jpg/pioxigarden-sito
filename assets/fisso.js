/* Dati modificabili del sito (foto, testi, blocchi) dal pannello riservato /admin.
   Per i visitatori: legge /api/data. Per il proprietario collegato: abilita "Modifica sito" e salva sul server. */
(function(){if(window.claude)return;
var D={"foto": {"soggiorno": {"c": {"it": "Dal bancone: zona pranzo, librerie a muro e l'arco d'ingresso."}, "t": {"it": "Soggiorno"}}, "soggiorno-2": {"c": {"it": "Tavolo per sei, divano e la porta-finestra verso l'esterno."}, "t": {"it": "Soggiorno"}}}, "extra": {"xmw2aob3f": {"asset": "b870d4875db78f5e9e635cf65ac213c0", "at": 1793807507499, "pos": "94% 91%", "room": "camera", "z": 1.1, "t": {"it": "Camera da letto", "en": "Bedroom", "fr": "Chambre", "de": "Schlafzimmer", "es": "Dormitorio"}, "c": {"it": "Letto matrimoniale, armadio grande e porta-finestra sul verde.", "en": "Double bed, large wardrobe and a French window onto the greenery.", "fr": "Lit double, grande armoire et porte-fenêtre sur la verdure.", "de": "Doppelbett, großer Kleiderschrank und Fenstertür ins Grüne.", "es": "Cama de matrimonio, armario grande y puerta ventana al verde."}}, "xmw2axfgh": {"asset": "a244729b74432835af7652ab87896203", "at": 1793807933058, "room": "bagno", "t": {"it": "Bagno", "en": "Bathroom", "fr": "Salle de bain", "de": "Badezimmer", "es": "Baño"}, "c": {"it": "Bagno in cotto con sanitari e mensole a muro.", "en": "Terracotta-tiled bathroom with wall shelves.", "fr": "Salle de bain en terre cuite avec étagères murales.", "de": "Bad mit Terrakottafliesen und Wandregalen.", "es": "Baño de barro cocido con estantes de pared."}}}, "blocchi": {}};
var L={},loaded=null,admin=null;
function load(){if(!loaded)loaded=fetch("/api/data",{credentials:"same-origin"}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j){["foto","extra","blocchi"].forEach(function(k){if(j[k])D[k]=j[k]});link(j.link||{})}}).catch(function(){});return loaded}
function emit(n){(L[n]||[]).forEach(function(cb){cb(snap(n))})}
function snap(n){var o=D[n]||{};return{docs:Object.keys(o).map(function(k){return{id:k,data:function(){return JSON.parse(JSON.stringify(o[k]))}}})}}
function col(n){return{onSnapshot:function(cb){(L[n]=L[n]||[]).push(cb);load().then(function(){cb(snap(n))});return function(){L[n]=(L[n]||[]).filter(function(x){return x!==cb})}}}}
function req(m,path,body,type){return fetch("/api/admin/"+path,{method:m,credentials:"same-origin",headers:{"X-PX":"1","Content-Type":type||"application/json"},body:body}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||r.status);return j})})}
function doc(p){var a=p.split("/"),n=a[0],id=a[1];return{
 set:function(d){return req("PUT","doc/"+n+"/"+id,JSON.stringify(d)).then(function(j){D[n]=j[n];emit(n)})},
 update:function(d){var cur=Object.assign({},(D[n]||{})[id]||{},d);return this.set(cur)},
 delete:function(){return req("DELETE","doc/"+n+"/"+id).then(function(j){D[n]=j[n];emit(n)})},
 get:function(){return load().then(function(){var v=(D[n]||{})[id];return{exists:!!v,data:function(){return v}}})}}}
var db={collection:col,doc:doc};
var assets={upload:function(b,o){return req("POST","upload",b,(o&&o.type)||b.type||"image/jpeg")}};
function me(){if(!admin)admin=fetch("/api/admin/me",{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.ok?r.json():{}}).then(function(j){return !!j.admin}).catch(function(){return false});return admin}
function link(l){[["airbnb",l.airbnb],["vrbo",l.vrbo],["booking",l.booking]].forEach(function(x){if(!x[1])return;var a=document.querySelector('[data-ota="'+x[0]+'"]');if(a){a.href=x[1];a.hidden=false}})}
window.claude={use:function(n){if(n==="db")return Promise.resolve(db);if(n==="assets")return me().then(function(ok){if(ok)document.documentElement.classList.add("px-admin");return ok?assets:null});return Promise.resolve(null)}};
})();
