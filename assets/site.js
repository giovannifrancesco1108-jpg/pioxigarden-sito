/* misurazione delle conversioni (Google Analytics 4 / Google Ads via Tag Manager): eventi nel dataLayer, nessun ID qui */
function track(ev,p){try{window.dataLayer=window.dataLayer||[];var o={event:ev};for(var k in p)o[k]=p[k];window.dataLayer.push(o)}catch(e){}}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";
 if(h.indexOf("tel:")===0)track("contact",{method:"phone"});else if(/wa\.me|whatsapp/.test(h))track("contact",{method:"whatsapp"});else if(/#contatti$/.test(h))track("begin_checkout",{source:a.id||a.className})},true);
(function(){
"use strict";
var PX=window.PX||{},U=PX.ui||{};
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var RM=window.matchMedia?matchMedia("(prefers-reduced-motion: reduce)"):{matches:false};

// barra: vetro dopo lo scroll
var top=$(".top");function sc(){if(top)top.classList.toggle("on",window.scrollY>40)}sc();addEventListener("scroll",sc,{passive:true});

// barra mobile: si toglie di mezzo quando il modulo di richiesta è a schermo
(function(){var fb=$(".fbar"),ct=$("#contatti");if(!fb||!ct||!("IntersectionObserver" in window))return;
 new IntersectionObserver(function(es){es.forEach(function(e){fb.classList.toggle("away",e.isIntersecting)})},{rootMargin:"0px 0px -25% 0px"}).observe(ct)})();

// ---------- la sirena che si tuffa: transizione tra le pagine ----------
var sp=$("#splash");
function anim(el,k,o){return el&&el.animate?el.animate(k,o):null}
function dive(href){
 var W=innerWidth,H=innerHeight,mer=$(".sp-mer",sp),ring=$(".sp-ring",sp),water=$(".sp-water",sp);
 var x0=-170,y0=H*.78,x1=W*.42,y1=H*.12,x2=W*.56,y2=H*.74;
 try{sessionStorage.setItem("pxs",String(Date.now()))}catch(x){}
 anim(mer,[{opacity:0,transform:"translate("+x0+"px,"+y0+"px) rotate(-55deg)"},
  {opacity:1,offset:.08,transform:"translate("+(x0+60)+"px,"+(y0-60)+"px) rotate(-45deg)"},
  {opacity:1,offset:.5,transform:"translate("+x1+"px,"+y1+"px) rotate(8deg)"},
  {opacity:1,offset:.9,transform:"translate("+x2+"px,"+y2+"px) rotate(72deg)"},
  {opacity:0,transform:"translate("+(x2+18)+"px,"+(y2+40)+"px) rotate(84deg) scale(.8)"}],{duration:780,easing:"cubic-bezier(.4,0,.6,1)",fill:"forwards"});
 anim(ring,[{opacity:0,transform:"translate("+(x2+85)+"px,"+(y2+70)+"px) scale(.2)"},{opacity:1,offset:.25,transform:"translate("+(x2+85)+"px,"+(y2+70)+"px) scale(.6)"},{opacity:0,transform:"translate("+(x2+85)+"px,"+(y2+70)+"px) scale(1.8)"}],{duration:520,delay:640,easing:"ease-out",fill:"forwards"});
 anim(water,[{transform:"translateY(105%)"},{transform:"translateY(0)"}],{duration:520,delay:600,easing:"cubic-bezier(.6,0,.3,1)",fill:"forwards"});
 setTimeout(function(){location.href=href},1130)}
document.addEventListener("click",function(e){
 var a=e.target.closest&&e.target.closest("a[href]");if(!a||!sp)return;
 if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||a.target==="_blank"||a.hasAttribute("download"))return;
 var u;try{u=new URL(a.href,location.href)}catch(x){return}
 if(u.origin!==location.origin||(u.pathname===location.pathname&&u.hash)||u.protocol.indexOf("http")!==0&&u.protocol!=="file:")return;
 if(RM.matches||!sp.animate)return;
 e.preventDefault();dive(a.href)});
// tornando indietro la pagina può riapparire dalla cache con l'acqua ancora alzata: la si toglie subito
addEventListener("pageshow",function(e){if(!sp||!e.persisted)return;$$("*",sp).forEach(function(n){if(n.getAnimations)n.getAnimations().forEach(function(x){x.cancel()})});document.documentElement.classList.remove("splash-in")});
setTimeout(function(){document.documentElement.classList.remove("splash-in")},1400);

// dialoghi (termini, privacy)
$$("[data-dlg]").forEach(function(b){b.addEventListener("click",function(){var d=document.getElementById(b.dataset.dlg);if(d&&d.showModal)d.showModal()})});
$$("dialog .x").forEach(function(b){b.addEventListener("click",function(){b.closest("dialog").close()})});
$$("dialog:not(.tour)").forEach(function(d){d.addEventListener("click",function(e){if(e.target===d)d.close()})});

// ---------- tour animato ----------
(function(){
 var dlg=$("#tv"),C=PX.tour||[],TT=PX.tu||{};
 var ok=!!(dlg&&dlg.showModal&&C.length);
 // qualsiasi elemento con data-tour apre il tour sulla tappa indicata (e data-media apre subito quella foto)
 document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-tour]");if(!b||!ok)return;e.preventDefault();open(+b.dataset.tour||0,b.dataset.media||null)},true);
 if(!ok)return;
 var svg=null,box=$("#tvs"),nEl=$("#tvn"),tEl=$("#tvt"),cEl=$("#tvc"),med=$("#tvmed"),cta=$("#tvcta"),auto=$("#tvauto"),hint=$("#tvhint");
 var dots=$$("#tvl button"),view=$("#tvv"),vBox=$("#tvvm"),vCap=$("#tvvc");
 var mer=null,spl=null,pin=null,loading=false,waiters=[];
 function scene(cb){ // la scena disegnata si carica solo quando apri il tour
  if(svg||!PX.scene||!window.fetch){cb();return}waiters.push(cb);if(loading)return;loading=true;
  fetch(PX.scene).then(function(r){return r.text()}).then(function(t){
   var d=document.createElement("div");d.innerHTML=t.replace(/<symbol id="mm"[\s\S]*?<\/symbol>/,"");var s=d.querySelector("svg");
   if(s){s.id="sc";box.insertBefore(s,box.firstChild);svg=s;mer=$("#sc-mer",s);spl=$("#sc-splash",s);pin=$("#sc-pin",s);
    if(s.animate)s.animate([{opacity:0},{opacity:1}],{duration:500,easing:"ease-out"})}
  }).catch(function(){}).then(function(){var w=waiters;waiters=[];w.forEach(function(f){f()})})}
 var i=-1,vb=null,raf=0,autoT=0,autoOn=false,pushed=false,fromPop=false,goAfter=null,vi=0;
 function aspect(){var r=box.getBoundingClientRect();return Math.max(.3,(r.width||1)/(r.height||1))}
 function fit(c){var a=aspect(),w=c.box[2],h=c.box[3];if(a>w/h)w=h*a;else h=w/a;return [c.box[0]-w/2,c.box[1]-h/2,w,h]}
 function setVB(v){if(v[1]+v[3]>1595)v=[v[0],1595-v[3],v[2],v[3]];vb=v;if(svg)svg.setAttribute("viewBox",v.map(function(n){return n.toFixed(1)}).join(" "))}
 function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
 function fly(to,dur,done){cancelAnimationFrame(raf);
  if(!vb||RM.matches||!dur){setVB(to);if(done)done();return}
  var f=vb.slice(),t0=performance.now(),c0=[f[0]+f[2]/2,f[1]+f[3]/2],c1=[to[0]+to[2]/2,to[1]+to[3]/2];
  var d=Math.hypot(c1[0]-c0[0],c1[1]-c0[1]),bump=Math.min(.45,d/(Math.max(f[2],to[2])*1.8)),r=to[3]/to[2];
  (function step(now){var t=Math.min(1,(now-t0)/dur),e=ease(t);
   var w=Math.exp(Math.log(f[2])+(Math.log(to[2])-Math.log(f[2]))*e)*(1+bump*Math.sin(Math.PI*t));
   var cx=c0[0]+(c1[0]-c0[0])*e,cy=c0[1]+(c1[1]-c0[1])*e;
   setVB([cx-w/2,cy-w*r/2,w,w*r]);if(t<1)raf=requestAnimationFrame(step);else if(done)done()})(t0)}
 function jump(){ // la sirena salta fuori dal lago e si rituffa
  if(RM.matches||!mer||!mer.animate)return;
  var x0=1310,y0=930,x1=1440,y1=700,x2=1580,y2=920;
  mer.animate([{opacity:0,transform:"translate("+x0+"px,"+y0+"px) rotate(-70deg) scale(.7)"},{opacity:1,offset:.12,transform:"translate("+(x0+12)+"px,"+(y0-40)+"px) rotate(-55deg) scale(.9)"},
   {opacity:1,offset:.5,transform:"translate("+x1+"px,"+y1+"px) rotate(5deg) scale(1)"},{opacity:1,offset:.88,transform:"translate("+x2+"px,"+(y2-18)+"px) rotate(70deg) scale(.95)"},
   {opacity:0,transform:"translate("+(x2+8)+"px,"+(y2+16)+"px) rotate(82deg) scale(.8)"}],{duration:1500,easing:"ease-in-out",fill:"forwards"});
  spl.animate([{opacity:0,transform:"translate("+x2+"px,"+y2+"px) scale(.2)"},{opacity:1,offset:.2,transform:"translate("+x2+"px,"+y2+"px) scale(.6)"},{opacity:0,transform:"translate("+x2+"px,"+y2+"px) scale(1.5)"}],{duration:900,delay:1280,easing:"ease-out",fill:"forwards"})}
 function thumb(m,n){var b=document.createElement("button");b.type="button";b.setAttribute("aria-label",m.t);
  var im=document.createElement("img");im.src=m.thumb;im.alt="";im.loading="lazy";im.decoding="async";b.appendChild(im);
  if(m.type==="v"){var s=document.createElement("span");s.className="vb";s.innerHTML='<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>';b.appendChild(s);b.setAttribute("aria-label",m.t+" ("+(TT.video||"video")+")")}
  b.addEventListener("click",function(){stopAuto();openView(n)});return b}
 function go(n,dur){
  n=Math.max(0,Math.min(C.length-1,n));var c=C[n],first=i<0;i=n;
  nEl.textContent=(n+1)+" "+(TT.of||"/")+" "+C.length;tEl.textContent=c.t;cEl.textContent=c.c;
  if(!RM.matches&&tEl.animate){tEl.animate([{opacity:0,transform:"translateY(8px)"},{opacity:1,transform:"none"}],{duration:420,easing:"ease-out"});cEl.animate([{opacity:0},{opacity:1}],{duration:520,delay:90,easing:"ease-out",fill:"backwards"})}
  med.innerHTML="";c.media.forEach(function(m,k){med.appendChild(thumb(m,k))});
  cta.hidden=n!==C.length-1;
  dots.forEach(function(b,k){if(k===n)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current")});
  if(svg){svg.classList.toggle("eve",!!c.eve);
   $$(".sc-room",svg).forEach(function(r){r.classList.toggle("on",r.id==="sc-hl-"+c.room)});
   if(c.pin){pin.style.transition=first?"none":"transform .9s cubic-bezier(.3,1.4,.5,1),opacity .4s";pin.style.transform="translate("+c.pin[0]+"px,"+c.pin[1]+"px)";pin.style.opacity="1"}else pin.style.opacity="0"}
  fly(fit(c),dur===undefined?1500:dur,function(){if(c.intro)jump()});
  if(autoOn)queue()}
 function queue(){clearTimeout(autoT);autoT=setTimeout(function(){if(!autoOn)return;if(i<C.length-1)go(i+1);else stopAuto()},6500)}
 function stopAuto(){autoOn=false;clearTimeout(autoT);auto.setAttribute("aria-pressed","false")}
 auto.addEventListener("click",function(){autoOn=!autoOn;auto.setAttribute("aria-pressed",autoOn?"true":"false");if(autoOn){if(i>=C.length-1)go(0);else queue()}else clearTimeout(autoT)});
 // foto e video grandi
 function openView(n){var list=C[i].media;vi=(n+list.length)%list.length;var m=list[vi];vBox.innerHTML="";var el;
  if(m.type==="v"){el=document.createElement("video");el.muted=true;el.defaultMuted=true;el.loop=true;el.autoplay=true;el.playsInline=true;el.setAttribute("playsinline","");el.setAttribute("muted","");el.poster=m.poster;
   el.src=(!el.canPlayType('video/mp4; codecs="avc1.640028"')&&m.webm)?m.webm:m.src;el.setAttribute("aria-label",m.alt);var p=el.play&&el.play();if(p&&p.catch)p.catch(function(){el.controls=true})}
  else{el=document.createElement("img");el.alt=m.alt;el.sizes="96vw";el.srcset=m.srcset;el.src=m.src}
  vBox.appendChild(el);vCap.textContent=m.t+" · "+m.alt;view.hidden=false;
  var nav=list.length>1;$("#tvvp").hidden=!nav;$("#tvvn").hidden=!nav;$("#tvvx").focus({preventScroll:true})}
 function closeView(){if(view.hidden)return;var v=$("video",vBox);if(v)v.pause();view.hidden=true;vBox.innerHTML=""}
 $("#tvvx").addEventListener("click",closeView);
 $("#tvvp").addEventListener("click",function(){openView(vi-1)});
 $("#tvvn").addEventListener("click",function(){openView(vi+1)});
 view.addEventListener("click",function(e){if(e.target===view||e.target===vBox)closeView()});
 // apertura e chiusura, con il tasto indietro del telefono
 function open(n,mk){
  if(!dlg.open){dlg.showModal();document.documentElement.classList.add("tv-on");
   if(location.hash!=="#tour"){try{history.pushState({tv:1},"","#tour");pushed=true}catch(x){pushed=false}}
   if(hint){if(hint.dataset.k&&matchMedia("(hover: hover) and (pointer: fine)").matches)hint.textContent=hint.dataset.k;hint.classList.add("on");setTimeout(function(){hint.classList.remove("on")},4200)}
   i=-1}
  go(n,0);
  if(mk){var k=C[n].media.map(function(m){return m.k}).indexOf(mk);if(k>=0)openView(k)}
  else $("#tvnext").focus({preventScroll:true});
  scene(function(){if(!dlg.open||!svg)return;var cur=i<0?n:i,f=fit(C[cur]);vb=null;
   if(!RM.matches&&!mk)setVB([f[0]-f[2]*.35,f[1]-f[3]*.55,f[2]*1.7,f[3]*1.7]);i=-1;go(cur,mk?0:undefined)})}
 function after(){if(!goAfter)return;var t=$(goAfter);goAfter=null;if(!t)return;
  requestAnimationFrame(function(){t.scrollIntoView({behavior:RM.matches?"auto":"smooth",block:"start"});var f=$("input,select,textarea",t);if(f)f.focus({preventScroll:true})})}
 dlg.addEventListener("cancel",function(e){if(!view.hidden){e.preventDefault();closeView()}});
 dlg.addEventListener("close",function(){
  cancelAnimationFrame(raf);stopAuto();closeView();document.documentElement.classList.remove("tv-on");i=-1;
  if(!fromPop&&pushed){pushed=false;history.back()}
  else{if(location.hash==="#tour"){try{history.replaceState(null,"",location.pathname+location.search)}catch(x){}}after()}
  fromPop=false});
 addEventListener("popstate",function(){if(dlg.open&&location.hash!=="#tour"){fromPop=true;pushed=false;dlg.close()}else after()});
 addEventListener("resize",function(){if(dlg.open&&i>=0){cancelAnimationFrame(raf);setVB(fit(C[i]))}});
 // comandi
 $("#tvx").addEventListener("click",function(){dlg.close()});
 $("#tvprev").addEventListener("click",function(){stopAuto();go(i-1)});
 $("#tvnext").addEventListener("click",function(){stopAuto();go(i+1)});
 $("#tvre").addEventListener("click",function(){go(0)});
 $("#tvgo").addEventListener("click",function(e){e.preventDefault();goAfter="#contatti";dlg.close()});
 dots.forEach(function(b){b.addEventListener("click",function(){stopAuto();go(+b.dataset.i)})});
 var sx=0,sy=0;
 box.addEventListener("pointerdown",function(e){sx=e.clientX;sy=e.clientY});
 box.addEventListener("pointerup",function(e){var dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3){stopAuto();go(i+(dx<0?1:-1))}});
 dlg.addEventListener("keydown",function(e){
  if(!view.hidden){if(e.key==="ArrowRight"){e.preventDefault();openView(vi+1)}else if(e.key==="ArrowLeft"){e.preventDefault();openView(vi-1)}return}
  if(e.key==="ArrowRight"){e.preventDefault();stopAuto();go(i+1)}else if(e.key==="ArrowLeft"){e.preventDefault();stopAuto();go(i-1)}});
 document.addEventListener("visibilitychange",function(){if(document.hidden)stopAuto()});
 // link diretto: /it/#tour apre il tour
 if(location.hash==="#tour")open(0);
 addEventListener("hashchange",function(){if(location.hash==="#tour"&&!dlg.open)open(0)});
})();

// contatti
function digits(s){return String(s||"").replace(/\D/g,"")}
var phone=digits(PX.phone),email=PX.email||"";
function body(f){var l=[U.hello,"",U.arr+": "+(f.arrival||"?"),U.dep+": "+(f.departure||"?"),U.gst+": "+f.guests,U.nm+": "+(f.name||"")];if(f.message)l.push("",f.message);return l.join("\n")}
function links(f){f=f||{guests:2};var t=body(f);
 var w=$("#cw"),m=$("#cm"),c=$("#cc");
 if(w){if(phone){w.href="https://wa.me/"+phone+"?text="+encodeURIComponent(t);w.hidden=false}else w.hidden=true}
 if(m){if(email){m.href="mailto:"+email+"?subject="+encodeURIComponent(U.subj)+"&body="+encodeURIComponent(t);m.hidden=false}else m.hidden=true}
 if(c){if(phone){c.href="tel:+"+phone;c.hidden=false}else c.hidden=true}
 $$(".fw").forEach(function(a){if(phone){a.href="https://wa.me/"+phone+"?text="+encodeURIComponent(U.hello);a.hidden=false}else a.hidden=true});
 $$(".ph").forEach(function(a){if(phone){a.href="tel:+"+phone;a.hidden=false}else a.hidden=true});
 $$(".phn").forEach(function(a){a.textContent=phone?"+"+phone.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/,"$1 $2 $3 $4"):""})}
links();

// form
var form=$("#rq");if(!form)return;
var dx=$("#dx");if(dx)dx.addEventListener("click",function(){$("#done").classList.remove("on")});
var d1=$("#d1"),d2=$("#d2"),nn=$("#nn"),msg=$("#fm"),btn=$("#sb"),done=$("#done");
var today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());var iso=today.toISOString().slice(0,10);
d1.min=iso;d2.min=iso;
function nights(){if(!d1.value||!d2.value)return 0;return Math.round((new Date(d2.value)-new Date(d1.value))/864e5)}
function upd(){if(d1.value){var n=new Date(d1.value);n.setDate(n.getDate()+1);d2.min=n.toISOString().slice(0,10)}
 var n=nights();nn.textContent=n>0?n+" "+(n===1?U.n1:U.nN):U.pick}
d1.addEventListener("change",function(){if(d2.value&&d2.value<=d1.value)d2.value="";upd()});d2.addEventListener("change",upd);upd();
function data(){var g=function(i){return document.getElementById(i).value.trim()};
 return {lang:PX.lang,arrival:d1.value,departure:d2.value,guests:g("gg"),name:g("nm"),email:g("em"),phone:g("tl"),message:g("ms"),website:g("hp")}}
form.addEventListener("input",function(){links(data())});
form.addEventListener("submit",function(e){e.preventDefault();var f=data();msg.className="msg";msg.textContent="";
 if(!f.name||!/^\S+@\S+\.\S+$/.test(f.email)){msg.className="msg bad";msg.textContent=U.errReq;return}
 if(!$(".chk input",form).checked){msg.className="msg bad";msg.textContent=U.errConsent;return}
 if(f.arrival&&f.departure&&f.departure<=f.arrival){msg.className="msg bad";msg.textContent=U.errDates;return}
 if(!PX.api){ // senza servizio collegato non dichiariamo "inviata": apriamo WhatsApp/email già compilati
  links(f);var t=phone?$("#cw"):email?$("#cm"):null;if(t){track("generate_lead",{method:t.id==="cw"?"whatsapp":"email"});location.href=t.href}else{msg.className="msg bad";msg.textContent=U.err}return}
 btn.disabled=true;btn.textContent=U.sending;
 fetch(PX.api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(f)})
  .then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
  .then(function(){done.classList.add("on");form.reset();upd();track("generate_lead",{method:"form"})})
  .catch(function(){msg.className="msg bad";msg.textContent=U.err;links(f)})
  .then(function(){btn.disabled=false;btn.textContent=U.send})});
})();

/* ---------- a tema lago: calendario a onde, ospiti, increspature, riflessi ---------- */
(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var L=(document.documentElement.lang||"it").slice(0,2);
var TX={it:{arr:"Arrivo",dep:"Partenza",pickA:"Tocca il giorno di arrivo",pickD:"Ora tocca il giorno di partenza",n1:"notte sul lago",nN:"notti sul lago",clr:"Cambia date",prev:"Mese precedente",next:"Mese successivo",g:"Ospiti",go:"Continua con i tuoi dati",past:"giorno passato"},
en:{arr:"Arrival",dep:"Departure",pickA:"Tap your arrival day",pickD:"Now tap your departure day",n1:"night by the lake",nN:"nights by the lake",clr:"Change dates",prev:"Previous month",next:"Next month",g:"Guests",go:"Continue with your details",past:"past day"},
fr:{arr:"Arrivée",dep:"Départ",pickA:"Touchez le jour d'arrivée",pickD:"Touchez maintenant le jour de départ",n1:"nuit au bord du lac",nN:"nuits au bord du lac",clr:"Changer les dates",prev:"Mois précédent",next:"Mois suivant",g:"Voyageurs",go:"Continuer avec vos coordonnées",past:"jour passé"},
de:{arr:"Anreise",dep:"Abreise",pickA:"Tippen Sie auf den Anreisetag",pickD:"Jetzt den Abreisetag antippen",n1:"Nacht am See",nN:"Nächte am See",clr:"Daten ändern",prev:"Voriger Monat",next:"Nächster Monat",g:"Gäste",go:"Weiter mit Ihren Daten",past:"vergangener Tag"},
es:{arr:"Llegada",dep:"Salida",pickA:"Toca el día de llegada",pickD:"Ahora toca el día de salida",n1:"noche junto al lago",nN:"noches junto al lago",clr:"Cambiar fechas",prev:"Mes anterior",next:"Mes siguiente",g:"Huéspedes",go:"Continuar con tus datos",past:"día pasado"}}[L]||null;
if(!TX)return;

/* increspatura su ogni tocco */
document.addEventListener("pointerdown",function(e){if(RM)return;var b=e.target.closest(".btn,.chip,.lc-d,.lg-b,.tz-stops button");if(!b||b.disabled)return;
 var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2.2,i=document.createElement("span");i.className="rip";
 i.style.cssText="width:"+s+"px;height:"+s+"px;left:"+(e.clientX-r.left-s/2)+"px;top:"+(e.clientY-r.top-s/2)+"px";
 if(getComputedStyle(b).position==="static")b.style.position="relative";b.style.overflow="hidden";b.appendChild(i);setTimeout(function(){i.remove()},900)},{passive:true});

/* calendario */
var d1=$("#d1"),d2=$("#d2"),host=$("#lc"),gg=$("#gg");if(!d1||!d2||!host)return;
var fmtM=new Intl.DateTimeFormat(L,{month:"long",year:"numeric"}),fmtD=new Intl.DateTimeFormat(L,{weekday:"short",day:"numeric",month:"short"}),fmtW=new Intl.DateTimeFormat(L,{weekday:"narrow"});
function isoOf(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function parse(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2])}
var today=new Date();today.setHours(0,0,0,0);var view=new Date(today.getFullYear(),today.getMonth(),1);
function months(){return host.clientWidth>=620?2:1}
host.innerHTML='<div class="lc-top"><div class="lc-sel"><button type="button" class="lc-f" data-f="a"><small>'+TX.arr+'</small><b id="lca">—</b></button><span class="lc-boat" aria-hidden="true"><svg viewBox="0 0 40 20"><path d="M4 12h32l-5 6H9z"/><path d="M20 2v10M20 3l8 8h-8"/></svg></span><button type="button" class="lc-f" data-f="d"><small>'+TX.dep+'</small><b id="lcd">—</b></button></div>'+
 '<p class="lc-msg" id="lcm" aria-live="polite"></p></div><div class="lc-nav"><button type="button" class="lc-ar" id="lcp" aria-label="'+TX.prev+'"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="lc-ar" id="lcn" aria-label="'+TX.next+'"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div><div class="lc-ms" id="lcg"></div>';
var grid=$("#lcg",host),hov=null;
function cls(ds){var a=d1.value,b=d2.value,c=[];if(ds===a)c.push("a");if(ds===b)c.push("b");var end=b||(a&&hov&&hov>a?hov:"");
 if(a&&end&&ds>a&&ds<end)c.push("in");if(a&&!b&&hov&&ds===hov&&hov>a)c.push("hv");return c.join(" ")}
function render(){var n=months(),h="",wk=[];for(var i=0;i<7;i++)wk.push(fmtW.format(new Date(2024,0,1+i)));
 for(var m=0;m<n;m++){var first=new Date(view.getFullYear(),view.getMonth()+m,1),days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),off=(first.getDay()+6)%7;
  h+='<div class="lc-m"><h4>'+fmtM.format(first)+'</h4><div class="lc-w">'+wk.map(function(x){return"<span>"+x+"</span>"}).join("")+'</div><div class="lc-g">';
  for(var k=0;k<off;k++)h+="<span></span>";
  for(var d=1;d<=days;d++){var dt=new Date(first.getFullYear(),first.getMonth(),d),ds=isoOf(dt),past=dt<today;
   h+='<button type="button" class="lc-d '+cls(ds)+'" data-d="'+ds+'"'+(past?' disabled aria-label="'+d+', '+TX.past+'"':' aria-label="'+fmtD.format(dt)+'"')+(cls(ds).indexOf("a")>-1||cls(ds).indexOf("b")>-1?' aria-pressed="true"':'')+'><span>'+d+'</span></button>'}
  h+="</div></div>"}
 grid.innerHTML=h;$("#lcp",host).disabled=view<=new Date(today.getFullYear(),today.getMonth(),1);
 $("#lca",host).textContent=d1.value?fmtD.format(parse(d1.value)):"—";$("#lcd",host).textContent=d2.value?fmtD.format(parse(d2.value)):"—";
 var nights=d1.value&&d2.value?Math.round((parse(d2.value)-parse(d1.value))/864e5):0;
 host.classList.toggle("full",nights>0);
 $("#lcm",host).innerHTML=nights>0?'<b>'+nights+'</b> '+(nights===1?TX.n1:TX.nN)+' <button type="button" class="lc-clr">'+TX.clr+'</button>':(d1.value?TX.pickD:TX.pickA);
 var cb=$(".lc-clr",host);if(cb)cb.onclick=function(){set("","");};
 $$(".lc-f",host).forEach(function(f){f.classList.toggle("on",(f.dataset.f==="a"&&!d1.value)||(f.dataset.f==="d"&&d1.value&&!d2.value))})}
function fire(el){el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("input",{bubbles:true}))}
function set(a,b){d1.value=a;fire(d1);d2.value=b;fire(d2);render()}
grid.addEventListener("click",function(e){var b=e.target.closest(".lc-d");if(!b||b.disabled)return;var ds=b.dataset.d;
 if(!d1.value||d2.value||ds<=d1.value)set(ds,"");else{set(d1.value,ds);if(!RM){host.classList.add("splash");setTimeout(function(){host.classList.remove("splash")},900)}}});
grid.addEventListener("pointerover",function(e){var b=e.target.closest(".lc-d");var v=b&&!b.disabled?b.dataset.d:null;if(v!==hov&&d1.value&&!d2.value){hov=v;$$(".lc-d",grid).forEach(function(x){x.className="lc-d "+cls(x.dataset.d)})}});
$("#lcp",host).onclick=function(){view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};
$("#lcn",host).onclick=function(){view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};
$$(".lc-f",host).forEach(function(f){f.onclick=function(){if(f.dataset.f==="a")set("","");else if(d1.value)set(d1.value,"")}});
[d1,d2].forEach(function(x){x.addEventListener("change",function(){if(x.value){var v=parse(d1.value||x.value);if(v<view||v>=new Date(view.getFullYear(),view.getMonth()+months(),1))view=new Date(v.getFullYear(),v.getMonth(),1)}render()})});
var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(render,150)});render();
var form=$("#rq");if(form)form.addEventListener("reset",function(){setTimeout(render,0)});

/* ospiti con pulsanti */
if(gg){var max=gg.options.length,wrap=document.createElement("div");wrap.className="lg";
 wrap.innerHTML='<button type="button" class="lg-b" data-s="-1" aria-label="−">−</button><span class="lg-v" aria-live="polite"><b></b><i aria-hidden="true"></i></span><button type="button" class="lg-b" data-s="1" aria-label="+">+</button>';
 gg.parentNode.insertBefore(wrap,gg.nextSibling);gg.classList.add("vh");
 function gupd(){var v=+gg.value;$(".lg-v b",wrap).textContent=v;$(".lg-v i",wrap).innerHTML=new Array(v+1).join('<svg viewBox="0 0 12 12"><circle cx="6" cy="3.4" r="2.4"/><path d="M1.5 12a4.5 4.5 0 0 1 9 0z"/></svg>');
  $$(".lg-b",wrap)[0].disabled=v<=1;$$(".lg-b",wrap)[1].disabled=v>=max}
 wrap.addEventListener("click",function(e){var b=e.target.closest(".lg-b");if(!b)return;var v=Math.min(max,Math.max(1,+gg.value+ +b.dataset.s));gg.value=String(v);fire(gg);gupd()});
 gg.addEventListener("change",gupd);gupd();if(form)form.addEventListener("reset",function(){setTimeout(gupd,0)})}
})();

/* ---------- vetrina delle foto, a tutta larghezza, e foto a schermo intero ---------- */
(function(){
"use strict";
var tr=document.getElementById("sht");if(!tr)return;
var sl=[],n=document.getElementById("shn"),RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches,cur=0;
function near(){var c=tr.scrollLeft+tr.clientWidth/2,b=0,bd=1e9;sl.forEach(function(s,i){var d=Math.abs(s.offsetLeft+s.offsetWidth/2-c);if(d<bd){bd=d;b=i}});return b}
function to(i){i=Math.max(0,Math.min(sl.length-1,i));var s=sl[i];tr.scrollTo({left:s.offsetLeft-(tr.clientWidth-s.offsetWidth)/2,behavior:RM?"auto":"smooth"})}
var st;tr.addEventListener("scroll",function(){clearTimeout(st);st=setTimeout(function(){cur=near();n.textContent=(cur+1)+" / "+sl.length;sl.forEach(function(s,i){s.classList.toggle("on",i===cur)})},60)},{passive:true});
function refresh(){sl=[].slice.call(tr.querySelectorAll(".sl"));sl.forEach(function(s,i){var b=s.querySelector(".sl-b");if(b)b.dataset.i=i});if(n)n.textContent=(near()+1)+" / "+sl.length}
refresh();if(sl[0])sl[0].classList.add("on");window.PXshow={refresh:refresh};
document.getElementById("shp").onclick=function(){to(near()-1)};document.getElementById("shx").onclick=function(){to(near()+1)};
tr.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){e.preventDefault();to(near()+1)}else if(e.key==="ArrowLeft"){e.preventDefault();to(near()-1)}});
/* trascinare con il mouse */
var dn=null,moved=false;
tr.addEventListener("pointerdown",function(e){if(e.pointerType!=="mouse")return;dn={x:e.clientX,l:tr.scrollLeft};moved=false;tr.classList.add("drag")});
addEventListener("pointermove",function(e){if(!dn)return;var d=e.clientX-dn.x;if(Math.abs(d)>5)moved=true;tr.scrollLeft=dn.l-d});
addEventListener("pointerup",function(){if(!dn)return;dn=null;tr.classList.remove("drag");if(moved)to(near())});
/* foto grande */
var lb=document.getElementById("lb"),box=document.getElementById("lbi"),cap=document.getElementById("lbc"),li=0;
var set=sl;function show(i){li=(i+set.length)%set.length;var im=set[li].querySelector("img"),c=set[li].querySelector("figcaption");box.innerHTML="";var x=new Image();x.alt=im.alt;x.srcset=im.srcset;x.sizes="96vw";x.src=im.currentSrc||im.src;box.appendChild(x);
 cap.textContent=c&&c.querySelector("b")?c.querySelector("b").textContent:"";if(!RM&&x.animate)x.animate([{opacity:0,transform:"scale(.98)"},{opacity:1,transform:"none"}],{duration:320,easing:"ease-out"})}
tr.addEventListener("click",function(e){var b=e.target.closest(".sl-b");if(!b||moved||!lb||!lb.showModal||document.documentElement.classList.contains("edmode"))return;set=sl;show(+b.dataset.i);lb.showModal();document.getElementById("lbx").focus({preventScroll:true})});
if(lb){document.getElementById("lbx").onclick=function(){lb.close()};document.getElementById("lbp").onclick=function(){show(li-1)};document.getElementById("lbn").onclick=function(){show(li+1)};
 lb.addEventListener("click",function(e){if(e.target===lb||e.target===box)lb.close()});
 lb.addEventListener("keydown",function(e){if(e.key==="ArrowRight")show(li+1);else if(e.key==="ArrowLeft")show(li-1)});
 var sx=0;lb.addEventListener("pointerdown",function(e){sx=e.clientX});lb.addEventListener("pointerup",function(e){var d=e.clientX-sx;if(Math.abs(d)>50)show(li+(d<0?1:-1))});
 lb.addEventListener("close",function(){if(set===sl)to(li)});
 var ex=document.getElementById("exg");if(ex){ex.addEventListener("click",function(e){var b=e.target.closest(".ex-b");if(!b||!lb.showModal||document.documentElement.classList.contains("edmode"))return;set=[].slice.call(ex.querySelectorAll("figure"));show(+b.dataset.i);lb.showModal();document.getElementById("lbx").focus({preventScroll:true})})}}
})();

/* ---------- consenso ai cookie: Tag Manager si carica solo dopo "Accetto" ---------- */
(function(){
"use strict";
var PX=window.PX||{},E=PX.ed||{};
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-ota]");if(a){try{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:"ota_click",platform:a.dataset.ota})}catch(x){}}},true);
if(!PX.gtm)return;
function load(){if(window.__gtm)return;window.__gtm=1;window.dataLayer=window.dataLayer||[];window.dataLayer.push({"gtm.start":Date.now(),event:"gtm.js"});
 var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtm.js?id="+encodeURIComponent(PX.gtm);document.head.appendChild(s)}
var v=null;try{v=localStorage.getItem("pxc")}catch(x){}
if(v==="1"){load();return}if(v==="0")return;
var b=document.createElement("div");b.className="ck";b.setAttribute("role","dialog");b.setAttribute("aria-label",E.more||"Privacy");
b.innerHTML='<p></p><div><button type="button" class="btn g s" data-c="0"></button><button type="button" class="btn s" data-c="1"></button></div>';
b.querySelector("p").textContent=E.cookie||"";b.querySelector('[data-c="0"]').textContent=E.no||"No";b.querySelector('[data-c="1"]').textContent=E.ok||"OK";
b.addEventListener("click",function(e){var c=e.target.closest("[data-c]");if(!c)return;try{localStorage.setItem("pxc",c.dataset.c)}catch(x){}if(c.dataset.c==="1")load();b.remove()});
document.body.appendChild(b);
})();

/* ---------- gestione delle foto: solo per il proprietario (chi può modificare l'anteprima) ----------
   foto/{chiave}  : {asset?, pos?, z?, t?:{lingua}, c?:{lingua}}  cambia, ritaglia o riscrive una foto del sito
   extra/{id}     : {asset, room, pos?, z?, t?:{lingua}, c?:{lingua}, at}  foto aggiunte in un ambiente del carosello */
(function(){
"use strict";
var C=window.claude;if(!C||!C.use)return;
var PX=window.PX||{},L=PX.lang||"it",E=PX.ed||{},db=null,assets=null,F={},X={},orig={};
function $$(q,r){return [].slice.call((r||document).querySelectorAll(q))}
function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e}
function fig(im){return im.closest(".sl,.ex,.band,.cine-st,.hero")}
function keep(im){if(im.__o)return im.__o;var pic=im.parentNode&&im.parentNode.tagName==="PICTURE"?im.parentNode:null,f=fig(im),b=f&&f.querySelector("figcaption b"),c=f&&f.querySelector("figcaption span");
 im.__o={src:im.getAttribute("src"),srcset:im.getAttribute("srcset"),sizes:im.getAttribute("sizes"),pic:pic,sources:pic?$$("source",pic):[],t:b?b.textContent:null,c:c?c.textContent:null};return im.__o}
function look(im,d){var o=keep(im),f=fig(im);d=d||{};
 if(d.asset){o.sources.forEach(function(s){s.remove()});im.removeAttribute("srcset");im.removeAttribute("sizes");if(im.getAttribute("src")!=="/_blob/"+d.asset)im.src="/_blob/"+d.asset}
 else if(o.src&&im.getAttribute("src")!==o.src){o.sources.forEach(function(s){o.pic&&o.pic.insertBefore(s,im)});if(o.srcset)im.setAttribute("srcset",o.srcset);if(o.sizes)im.setAttribute("sizes",o.sizes);im.src=o.src}
 im.style.objectPosition=d.pos||"";im.style.transformOrigin=d.pos||"";im.style.scale=d.z&&d.z!==1?String(d.z):"";
 if(f){var b=f.querySelector("figcaption b"),c=f.querySelector("figcaption span"),t=d.t&&d.t[L],cc=d.c&&d.c[L];if(b&&o.t!=null)b.textContent=t||o.t;if(c&&o.c!=null)c.textContent=cc||o.c;
  var btn=f.querySelector(".sl-b,.ex-b");if(btn&&b)btn.setAttribute("aria-label",b.textContent)}}
function applyF(){$$("img[data-k]").forEach(function(im){if(im.closest("[data-x]"))return;look(im,F[im.dataset.k])})}
/* foto aggiunte nel carosello */
function applyX(){var tr=document.getElementById("sht");if(!tr)return;
 $$("[data-x]",tr).forEach(function(f){if(!X[f.dataset.x])f.remove()});
 Object.keys(X).sort(function(a,b){return (X[a].at||0)-(X[b].at||0)}).forEach(function(id){var d=X[id],f=tr.querySelector('[data-x="'+id+'"]');
  if(!f){f=el("figure","sl");f.dataset.x=id;f.dataset.room=d.room||"esterno";f.style.setProperty("--ar","3/4");
   var b=el("button","sl-b");b.type="button";var im=new Image();im.dataset.k="x-"+id;im.alt=(d.t&&d.t[L])||"";im.decoding="async";im.loading="lazy";
   im.onload=function(){if(im.naturalWidth)f.style.setProperty("--ar",im.naturalWidth+"/"+im.naturalHeight)};
   b.appendChild(im);f.appendChild(b);var fc=el("figcaption");fc.appendChild(el("b"));fc.appendChild(el("span"));f.appendChild(fc);
   var same=$$('.sl[data-room="'+f.dataset.room+'"]',tr),after=same[same.length-1];if(after)after.after(f);else tr.appendChild(f);if(on)addCtl(f)}
  var img=f.querySelector("img");img.src="/_blob/"+d.asset;img.style.objectPosition=d.pos||"";img.style.transformOrigin=d.pos||"";img.style.scale=d.z&&d.z!==1?String(d.z):"";
  f.querySelector("figcaption b").textContent=(d.t&&d.t[L])||"";f.querySelector("figcaption span").textContent=(d.c&&d.c[L])||"";img.alt=(d.t&&d.t[L])||""});
 if(window.PXshow)window.PXshow.refresh()}
C.use("db").then(function(d){if(!d)return null;db=d;
 d.collection("foto").onSnapshot(function(q){F={};q.docs.forEach(function(s){F[s.id]=s.data()||{}});applyF();mark()},function(){});
 d.collection("extra").onSnapshot(function(q){X={};q.docs.forEach(function(s){var x=s.data()||{};if(x.asset)X[s.id]=x});applyX()},function(){});
 return C.use("assets")}).then(function(a){if(a&&db){assets=a;ui()}}).catch(function(){});
/* ---- strumenti del proprietario ---- */
var on=false,busy=false,file,bar;
function keyOf(f){if(f.dataset.x)return {x:f.dataset.x};var im=f.querySelector("img[data-k]");return {k:im.dataset.k}}
function data(r){return r.x?X[r.x]||{}:F[r.k]||{}}
function ref(r){return r.x?db.doc("extra/"+r.x):db.doc("foto/"+r.k)}
function save(r,patch){var d=JSON.parse(JSON.stringify(data(r)));for(var k in patch){if(patch[k]==null)delete d[k];else d[k]=patch[k]}busy=true;return ref(r).set(d).catch(function(){}).then(function(){busy=false})}
function mark(){if(!on)return;$$(".edc").forEach(function(c){var r=keyOf(c.parentNode),rr=c.querySelector(".r");if(rr&&r.k)rr.hidden=!F[r.k]})}
function addCtl(f){if(f.querySelector(".edc"))return;var r=keyOf(f),c=el("div","edc");
 [["c",E.change],["p",E.crop],["t",E.text],r.x?["d",E.del_]:["r",E.reset]].forEach(function(b){var x=el("button","btn s "+b[0]+(b[0]==="c"?"":" g"),b[1]);x.type="button";c.appendChild(x)});
 c.appendChild(el("span","st"));
 c.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var b=e.target.closest("button");if(!b||busy)return;var cl=b.classList;
  if(cl.contains("c"))pick(function(id){return save(r,{asset:id})},c.querySelector(".st"));
  else if(cl.contains("p"))crop(f,r);
  else if(cl.contains("t"))text(f,r);
  else if(cl.contains("r")){busy=true;ref(r).delete().catch(function(){}).then(function(){busy=false})}
  else if(cl.contains("d")){busy=true;ref(r).delete().catch(function(){}).then(function(){busy=false})}});
 ["pointerdown","mousedown","touchstart"].forEach(function(t){c.addEventListener(t,function(e){e.stopPropagation()})});
 f.appendChild(c)}
function ui(){
 file=el("input");file.type="file";file.accept="image/*";file.hidden=true;document.body.appendChild(file);
 var b=el("button","edb",E.edit);b.type="button";document.body.appendChild(b);
 var hd=document.querySelector(".show-hd");var add=el("button","btn s edadd",E.add);add.type="button";if(hd)hd.appendChild(add);
 add.onclick=function(){addX()};
 b.onclick=function(){on=!on;document.documentElement.classList.toggle("edmode",on);b.textContent=on?E.done:E.edit;if(on){$$("img[data-k]").forEach(function(im){var f=fig(im);if(f)addCtl(f)});mark()}else closeBar()}}
function pick(done,st){file.value="";file.onchange=function(){var f=file.files&&file.files[0];if(!f)return;busy=true;if(st)st.textContent=E.up;
  shrink(f).then(function(bl){return assets.upload(bl,{type:"image/jpeg"})}).then(function(r){busy=false;return done(r.id)}).then(function(){if(st)st.textContent=""})
  .catch(function(){busy=false;if(st)st.textContent=E.err})};file.click()}
/* pannello in basso per ritaglio, testi, nuova foto */
function closeBar(){if(bar){bar.remove();bar=null}$$(".cropping").forEach(function(f){f.classList.remove("cropping")})}
function panel(){closeBar();bar=el("div","edp");document.body.appendChild(bar);return bar}
function crop(f,r){var im=f.querySelector("img"),d=data(r),p=(d.pos||"50% 50%").split(" ").map(parseFloat),z=d.z||1,P=panel();f.classList.add("cropping");
 P.appendChild(el("p",null,E.hint));var row=el("label","edz");row.appendChild(el("span",null,E.zoom));var rg=el("input");rg.type="range";rg.min="1";rg.max="2.5";rg.step="0.05";rg.value=z;row.appendChild(rg);P.appendChild(row);
 var acts=el("div","eda"),ca=el("button","btn g s",E.cancel),sv=el("button","btn s",E.save);ca.type=sv.type="button";acts.appendChild(ca);acts.appendChild(sv);P.appendChild(acts);
 function show(){im.style.objectPosition=p[0]+"% "+p[1]+"%";im.style.transformOrigin=im.style.objectPosition;im.style.scale=z!==1?String(z):""}
 rg.oninput=function(){z=+rg.value;show()};
 var dn=null;function down(e){if(!f.classList.contains("cropping"))return;e.preventDefault();e.stopPropagation();var t=e.touches?e.touches[0]:e;dn={x:t.clientX,y:t.clientY,p:p.slice()}}
 function move(e){if(!dn)return;e.preventDefault();var t=e.touches?e.touches[0]:e,w=im.clientWidth,h=im.clientHeight;
  p[0]=Math.max(0,Math.min(100,dn.p[0]-(t.clientX-dn.x)/w*100*1.6/z));p[1]=Math.max(0,Math.min(100,dn.p[1]-(t.clientY-dn.y)/h*100*1.6/z));show()}
 function up(){dn=null}
 im.addEventListener("pointerdown",down,true);im.addEventListener("touchstart",down,{passive:false,capture:true});
 addEventListener("pointermove",move,{passive:false});addEventListener("touchmove",move,{passive:false});addEventListener("pointerup",up);addEventListener("touchend",up);
 function off(){im.removeEventListener("pointerdown",down,true);im.removeEventListener("touchstart",down,true);removeEventListener("pointermove",move);removeEventListener("touchmove",move);removeEventListener("pointerup",up);removeEventListener("touchend",up);closeBar()}
 ca.onclick=function(){off();if(r.x)applyX();else applyF()};
 sv.onclick=function(){var pos=Math.round(p[0])+"% "+Math.round(p[1])+"%";off();save(r,{pos:pos==="50% 50%"?null:pos,z:z===1?null:z})}}
function text(f,r){var d=data(r),b=f.querySelector("figcaption b"),c=f.querySelector("figcaption span"),P=panel();
 var t1=el("input"),t2=el("textarea");t1.value=b?b.textContent:"";t2.value=c?c.textContent:"";t2.rows=2;
 var l1=el("label",null,E.tl),l2=el("label",null,E.cl);l1.appendChild(t1);l2.appendChild(t2);P.appendChild(l1);P.appendChild(l2);
 var acts=el("div","eda"),ca=el("button","btn g s",E.cancel),sv=el("button","btn s",E.save);ca.type=sv.type="button";acts.appendChild(ca);acts.appendChild(sv);P.appendChild(acts);
 ca.onclick=closeBar;
 sv.onclick=function(){var t=Object.assign({},d.t||{}),cc=Object.assign({},d.c||{});t[L]=t1.value.trim();cc[L]=t2.value.trim();if(!t[L])delete t[L];if(!cc[L])delete cc[L];
  closeBar();save(r,{t:Object.keys(t).length?t:null,c:Object.keys(cc).length?cc:null})}}
function addX(){var P=panel(),R=E.rooms||{};P.appendChild(el("p",null,E.room));var g=el("div","edr");
 Object.keys(R).forEach(function(k){var b=el("button","btn g s",R[k]);b.type="button";b.onclick=function(){var st=el("span","st");g.appendChild(st);
   pick(function(id){var x="x"+Date.now().toString(36);return db.doc("extra/"+x).set({asset:id,room:k,at:Date.now()}).then(function(){closeBar();setTimeout(function(){var f=document.querySelector('[data-x="'+x+'"]');if(f)f.scrollIntoView({block:"nearest",inline:"center"})},300)})},st)};g.appendChild(b)});
 P.appendChild(g);var ca=el("button","btn g s",E.cancel);ca.type="button";ca.onclick=closeBar;var a=el("div","eda");a.appendChild(ca);P.appendChild(a)}
/* solo ridimensionata per il web, nessun ritocco: colori e luce restano quelli dello scatto */
function shrink(f){return (window.createImageBitmap?createImageBitmap(f,{imageOrientation:"from-image"}):Promise.reject()).then(function(bm){
  var M=2400,s=Math.min(1,M/Math.max(bm.width,bm.height)),cv=document.createElement("canvas");cv.width=Math.round(bm.width*s);cv.height=Math.round(bm.height*s);
  cv.getContext("2d").drawImage(bm,0,0,cv.width,cv.height);return new Promise(function(ok,ko){cv.toBlob(function(b){b?ok(b):ko()},"image/jpeg",.9)})})
 .catch(function(){if(/^image\/(jpeg|png|webp)$/.test(f.type)&&f.size<20e6)return f;throw new Error("decode")})}
})();

/* ---------- blocchi liberi: testi, immagini e pulsanti aggiunti dal proprietario tra una sezione e l'altra ----------
   blocchi/{id} : {after: id della sezione dopo cui va, kind: "t"|"i"|"b", h?:{lingua}, p?:{lingua}, label?:{lingua}, go?: "book"|"wa"|"tel"|"url", url?, asset?, at} */
(function(){
"use strict";
var C=window.claude;if(!C||!C.use)return;
var PX=window.PX||{},L=PX.lang||"it",E=PX.ed||{},db=null,assets=null,B={},on=false,bar=null,busy=false;
var main=document.getElementById("main");if(!main)return;
function $$(q,r){return [].slice.call((r||document).querySelectorAll(q))}
function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e}
function tx(o){if(!o)return "";return o[L]||o.it||o.en||o[Object.keys(o)[0]]||""}
/* i punti dove si può aggiungere: dopo l'apertura e dopo ogni sezione */
function slots(){var o=[];var h=main.querySelector(".hero");if(h)o.push({id:"hero",node:h});$$(":scope > section[id]",main).forEach(function(s){o.push({id:s.id,node:s})});return o}
function href(d){if(d.go==="book")return "#contatti";var ph=(PX.phone||"").replace(/\D/g,"");
 if(d.go==="wa")return ph?"https://wa.me/"+ph:"#contatti";if(d.go==="tel")return ph?"tel:+"+ph:"#contatti";
 if(d.go==="url"&&/^https:\/\//.test(d.url||""))return d.url;return "#contatti"}
function render(){
 $$(".blk").forEach(function(n){if(!B[n.dataset.b])n.remove()});
 var bySlot={};Object.keys(B).forEach(function(id){var d=B[id];(bySlot[d.after]=bySlot[d.after]||[]).push(id)});
 slots().forEach(function(s){var ids=(bySlot[s.id]||[]).sort(function(a,b){return (B[a].at||0)-(B[b].at||0)}),prev=s.node;
  ids.forEach(function(id){var d=B[id],n=main.querySelector('.blk[data-b="'+id+'"]');
   if(!n){n=el("section","blk");n.dataset.b=id;n.appendChild(el("div","wrap"))}
   var w=n.querySelector(":scope > .wrap");w.innerHTML="";n.className="blk blk-"+d.kind;
   if(d.kind==="i"&&d.asset){var f=el("figure");var im=new Image();im.src="/_blob/"+d.asset;im.alt=tx(d.h)||tx(d.p)||"";im.loading="lazy";im.decoding="async";f.appendChild(im);
    if(tx(d.h)||tx(d.p)){var fc=el("figcaption");if(tx(d.h))fc.appendChild(el("b",null,tx(d.h)));if(tx(d.p))fc.appendChild(el("span",null,tx(d.p)));f.appendChild(fc)}w.appendChild(f)}
   else{if(tx(d.h))w.appendChild(el("h2",null,tx(d.h)));if(tx(d.p))w.appendChild(el("p",null,tx(d.p)));
    if(d.kind==="b"&&tx(d.label)){var a=el("a","btn",tx(d.label));a.href=href(d);if(/^https?:/.test(a.href)&&a.getAttribute("href").charAt(0)!=="#"){a.target="_blank";a.rel="noopener"}w.appendChild(a)}}
   if(on)ctl(n,id);
   if(prev.nextSibling!==n)prev.after(n);prev=n});
  });
 if(on)plus()}
C.use("db").then(function(d){if(!d)return null;db=d;
 d.collection("blocchi").onSnapshot(function(q){B={};q.docs.forEach(function(s){B[s.id]=s.data()||{}});render()},function(){});
 return C.use("assets")}).then(function(a){if(!a||!db)return;assets=a;
 /* si accende e spegne insieme al pulsante "Modifica foto" */
 new MutationObserver(function(){var x=document.documentElement.classList.contains("edmode");if(x!==on){on=x;if(!on){close();$$(".blk-plus,.blk .edc").forEach(function(n){n.remove()})}render()}}).observe(document.documentElement,{attributes:true,attributeFilter:["class"]})}).catch(function(){});
function plus(){$$(".blk-plus").forEach(function(n){n.remove()});
 slots().forEach(function(s){var last=s.node;while(last.nextElementSibling&&last.nextElementSibling.classList.contains("blk"))last=last.nextElementSibling;
  var p=el("div","blk-plus"),b=el("button","btn s",E.here);b.type="button";b.onclick=function(){form(null,{after:s.id})};p.appendChild(b);last.after(p)})}
function ctl(n,id){if(n.querySelector(":scope > .blk-c"))return;var c=el("div","edc blk-c");[["m",E.mod],["u",E.up_],["d",E.dn],["x",E.del_]].forEach(function(b){var x=el("button","btn s g "+b[0],b[1]);x.type="button";c.appendChild(x)});
 c.onclick=function(e){var b=e.target.closest("button");if(!b||busy)return;var d=B[id];
  if(b.classList.contains("m"))form(id,d);
  else if(b.classList.contains("x")){busy=true;db.doc("blocchi/"+id).delete().catch(function(){}).then(function(){busy=false})}
  else{var sib=Object.keys(B).filter(function(k){return B[k].after===d.after}).sort(function(a,c){return (B[a].at||0)-(B[c].at||0)}),i=sib.indexOf(id),j=i+(b.classList.contains("u")?-1:1);
   if(j<0||j>=sib.length)return;var o=sib[j],a1=B[id].at,a2=B[o].at;if(a1===a2)a2=a1+1;busy=true;
   db.doc("blocchi/"+id).set(Object.assign({},B[id],{at:a2})).then(function(){return db.doc("blocchi/"+o).set(Object.assign({},B[o],{at:a1}))}).catch(function(){}).then(function(){busy=false})}};
 n.insertBefore(c,n.firstChild)}
function close(){if(bar){bar.remove();bar=null}}
function inp(lbl,v,area){var l=el("label",null,lbl),i=el(area?"textarea":"input");if(area)i.rows=3;i.value=v||"";l.appendChild(i);return {l:l,i:i}}
function form(id,d){close();d=JSON.parse(JSON.stringify(d||{}));bar=el("div","edp");document.body.appendChild(bar);
 var kind=d.kind||null,box=el("div","edf"),msg=el("p","edm");
 function step(){box.innerHTML="";msg.textContent="";
  if(!kind){box.appendChild(el("p",null,E.what));var g=el("div","edr");[["t",E.kT],["i",E.kI],["b",E.kB]].forEach(function(k){var b=el("button","btn g s",k[1]);b.type="button";b.onclick=function(){kind=k[0];step()};g.appendChild(b)});box.appendChild(g);return}
  var H=inp(E.hd,(d.h||{})[L]),P=inp(kind==="i"?E.cl:E.bd,(d.p||{})[L],true);
  var file=null,pv=null;
  if(kind==="i"){var fl=el("label",null,E.kI),fi=el("input");fi.type="file";fi.accept="image/*";fl.appendChild(fi);box.appendChild(fl);fi.onchange=function(){file=fi.files&&fi.files[0]};
   if(d.asset){pv=new Image();pv.src="/_blob/"+d.asset;pv.className="edpv";box.appendChild(pv)}}
  box.appendChild(H.l);box.appendChild(P.l);
  var LB,sel,U;
  if(kind==="b"){LB=inp(E.lab,(d.label||{})[L]);box.appendChild(LB.l);var sl=el("label",null,E.lnk);sel=el("select");
   [["book",E.lBook],["wa",E.lWa],["tel",E.lTel],["url",E.lUrl]].forEach(function(o){var op=el("option",null,o[1]);op.value=o[0];sel.appendChild(op)});sel.value=d.go||"book";sl.appendChild(sel);box.appendChild(sl);
   U=inp(E.url,d.url||"");box.appendChild(U.l);function sh(){U.l.hidden=sel.value!=="url"}sel.onchange=sh;sh()}
  var acts=el("div","eda"),ca=el("button","btn g s",E.cancel),sv=el("button","btn s",E.save);ca.type=sv.type="button";acts.appendChild(ca);acts.appendChild(sv);box.appendChild(msg);box.appendChild(acts);
  ca.onclick=close;
  sv.onclick=function(){if(busy)return;function put(o,k,v){o[k]=Object.assign({},o[k]||{});if(v)o[k][L]=v;else delete o[k][L];if(!Object.keys(o[k]).length)delete o[k]}
   put(d,"h",H.i.value.trim());put(d,"p",P.i.value.trim());d.kind=kind;
   if(kind==="b"){put(d,"label",LB.i.value.trim());d.go=sel.value;if(d.go==="url"){var u=U.i.value.trim();if(!/^https:\/\/\S+$/.test(u)){msg.textContent=E.badUrl;return}d.url=u}else delete d.url;
    if(!tx(d.label)){msg.textContent=E.need;return}}
   if(kind==="t"&&!tx(d.h)&&!tx(d.p)){msg.textContent=E.need;return}
   if(kind==="i"&&!file&&!d.asset){msg.textContent=E.need;return}
   if(!d.at)d.at=Date.now();var key=id||("b"+Date.now().toString(36));busy=true;msg.textContent=file?E.up:"";
   (file?shrink(file).then(function(bl){return assets.upload(bl,{type:"image/jpeg"})}).then(function(r){d.asset=r.id}):Promise.resolve())
    .then(function(){return db.doc("blocchi/"+key).set(d)}).then(function(){busy=false;close()}).catch(function(){busy=false;msg.textContent=E.err})}}
 bar.appendChild(box);step()}
function shrink(f){return (window.createImageBitmap?createImageBitmap(f,{imageOrientation:"from-image"}):Promise.reject()).then(function(bm){
  var M=2400,s=Math.min(1,M/Math.max(bm.width,bm.height)),cv=document.createElement("canvas");cv.width=Math.round(bm.width*s);cv.height=Math.round(bm.height*s);
  cv.getContext("2d").drawImage(bm,0,0,cv.width,cv.height);return new Promise(function(ok,ko){cv.toBlob(function(b){b?ok(b):ko()},"image/jpeg",.9)})})
 .catch(function(){if(/^image\/(jpeg|png|webp)$/.test(f.type)&&f.size<20e6)return f;throw new Error("decode")})}
})();

/* ---------- apertura cinematografica: drone → lago → terrazza → statua → occhio → prima persona → tuffo → sott'acqua ---------- */
(function(){
"use strict";
var H=document.getElementById("cine");if(!H)return;
/* il sito si apre sempre dall'inizio: prima immagine dall'alto e la scritta "Pio XI"; il volo parte solo quando si scorre */
try{if("scrollRestoration" in history)history.scrollRestoration="manual"}catch(e){}
if(!location.hash||location.hash==="#"){scrollTo(0,0);addEventListener("pageshow",function(ev){if(ev.persisted)return;scrollTo(0,0)})}
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;if(RM){H.classList.add("still");return}
/* alla fine la camera è sott'acqua: l'acqua del lago sale e copre lo schermo, e sul turchese calmo il testo si legge bene */
(function(){var st=H.querySelector(".cine-st"),w=document.createElement("div");w.className="cine-water";w.setAttribute("aria-hidden","true");
 var h='<i class="cw-surf"></i><i class="cw-caus"></i><i class="cw-rays"></i>';for(var i=0;i<16;i++)h+='<i class="cw-b" style="left:'+(4+Math.random()*92).toFixed(1)+'%;--s:'+(4+Math.random()*10).toFixed(1)+'px;animation-delay:-'+(Math.random()*6).toFixed(2)+'s;animation-duration:'+(4+Math.random()*4).toFixed(2)+'s"></i>';
 w.innerHTML=h;st.insertBefore(w,st.querySelector(".cine-note"));var fl=document.createElement("div");fl.className="cine-flash";fl.setAttribute("aria-hidden","true");st.insertBefore(fl,w)})();
var cv=H.querySelector(".cine-cv"),cx=cv.getContext("2d"),N=+H.dataset.n||0,M=+H.dataset.pov||0,B=H.dataset.base,set=null,F=[],cur="",raf=0;if(!N)return;
var AUTO=null,PK=null,LO=[],pump=null;try{PK=H.dataset.pk?JSON.parse(H.dataset.pk):null}catch(e){} if(PK){var DL=document.createElement("div");DL.className="cine-dl";DL.setAttribute("aria-hidden","true");DL.innerHTML="<i></i>";H.querySelector(".cine-st").appendChild(DL)}
var PH=H.dataset.photo?{url:B+H.dataset.photo,eye:H.dataset.eye.split(",").map(Number),z:+H.dataset.zoom||12,im:null}:null;
var A=+H.dataset.app||0,STORY=!!(M&&A);
/* regia sullo scorrimento (0 = inizio, 1 = fine dell'apertura) */
var T=STORY?{a:.40,b:.60,c:.645,d:.80,u0:.79,u1:.845,t0:.84,t1:.93,d0:.60,d1:.64,d2:.70,d3:.74,end:.95}
             :{a:.78,b:.78,c:.78,d:.78,u0:.79,u1:.90,t0:.89,t1:.97,d0:.50,d1:.55,d2:.66,d3:.71,end:.98};
var TOT=N+A+M,P0=N+A;
function pad(i){return ("00"+i).slice(-3)}
function url(i,s){return i<N?B+s+"/f"+pad(i+1)+".webp":i<P0?B+"app/"+s+"/f"+pad(i-N+1)+".webp":B+"pov/"+s+"/f"+pad(i-P0+1)+".webp"}
var BM=!!(window.createImageBitmap&&window.fetch),fi=0,AP=null;
function pick(){var s=innerWidth<=700?"m":"d";if(s===set)return;set=s;F=new Array(TOT);cur="";
 /* prima il primo fotogramma, poi uno ogni 16, 8, 4, 2, tutti: lo scorrimento funziona subito e si fa più fluido */
 var order=[0],seen={0:1};[16,8,4,2,1].forEach(function(st){for(var i=0;i<TOT;i+=st)if(!seen[i]){seen[i]=1;order.push(i)}});
 var k=0,req={};function pickI(){var p0=Math.max(0,Math.floor(fi));for(var d=0;d<28;d++){var j=p0+d;if(j<TOT&&!req[j])return j}while(k<order.length&&req[order[k]])k++;return k<order.length?order[k++]:-1}
 function got(i,im){F[i]=im;if(i===0)size();if(Math.abs(i-fi)<9){cur="";draw()}next()}
 /* le immagini si decodificano fuori dal filo principale (ImageBitmap): niente intoppi mentre si scorre */
 function next(){if(set!==s)return;var i=pickI();if(i<0)return;req[i]=1;var u=url(i,s);
  if(BM){fetch(u).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){return createImageBitmap(b)}).then(function(im){got(i,im)},function(){BM=false;req[i]=0;next()});return}
  var im=new Image();im.decoding="async";im.onload=function(){var ok=function(){got(i,im)};if(im.decode)im.decode().then(ok,ok);else ok()};im.onerror=next;im.src=u}
 if(PK){/* miniature di tutto il volo subito pronte; i fogli nitidi si caricano attorno al punto in cui sei e quelli lontani si liberano (poca memoria, anche su tablet e telefoni) */
  var G=PK[s],per=G.C*G.R,MAX=Math.max(8,Math.round(((navigator.deviceMemory||4)>=8?48:30)/per)),hi={},lru=[],busy=0;LO=[];var loN=0,warm=null;
  for(var l=0;l<G.LK;l++)(function(l){var im=new Image();im.decoding="async";im.onload=function(){var ok=function(){var lp=G.LC*G.LR;for(var n=0;n<lp;n++){var i=l*lp+n;if(i>=TOT)break;LO[i]={im:im,sx:(n%G.LC)*G.lw,sy:Math.floor(n/G.LC)*G.lh,width:G.lw,height:G.lh}}if(l===0&&!cv.dataset.sz){cv.dataset.sz=1;size()}cur="";draw();if(++loN>=G.LK&&warm)warm()};if(im.decode)im.decode().then(ok,ok);else ok()};try{im.fetchPriority="high"}catch(e){}im.src=B+"pk/"+s+"/l"+l+".webp"})(l);
  var want=function(){/* più scorri veloce, più avanti si preparano i fotogrammi nitidi, nella direzione in cui stai andando */var c=Math.max(0,Math.floor(fi)),v=(window.__cineV||0)*N/160*16,ah=Math.min((MAX-3)*per-3,18+Math.abs(v)*40),fw=v>=-.02,lo=fw?c-6:c-ah,hi=fw?c+ah:c+6,a=Math.floor(Math.max(0,lo)/per),b=Math.min(G.K-1,Math.floor(Math.min(TOT-1,hi)/per)),out=[Math.floor(c/per)];if(fw){for(var k=Math.floor(c/per)+1;k<=b;k++)out.push(k);for(k=Math.floor(c/per)-1;k>=a;k--)out.push(k)}else{for(var k=Math.floor(c/per)-1;k>=a;k--)out.push(k);for(k=Math.floor(c/per)+1;k<=b;k++)out.push(k)}return out};
  pump=function(){if(set!==s||busy>=7)return;var w=want(),j=-1;if(busy>=4&&hi[w[0]])return;for(var q=0;q<w.length;q++)if(!hi[w[q]]){j=w[q];break}if(j<0)return;hi[j]="l";busy++;
   var im=new Image();im.decoding="async";im.onload=function(){var ok=function(){busy--;if(set!==s)return;hi[j]=im;lru.push(j);for(var n=0;n<per;n++){var i=j*per+n;if(i>=TOT)break;F[i]={im:im,sx:(n%G.C)*G.w,sy:Math.floor(n/G.C)*G.h,width:G.w,height:G.h}}
     while(lru.length>MAX){var w2=want(),k2=-1;for(var q2=0;q2<lru.length;q2++)if(w2.indexOf(lru[q2])<0){k2=q2;break}if(k2<0)break;var old=lru.splice(k2,1)[0],oi=hi[old];delete hi[old];for(var n2=0;n2<per;n2++)F[old*per+n2]=undefined;if(oi&&oi.src)oi.src=""}
     if(!cv.dataset.sz){cv.dataset.sz=1;size()}cur="";draw();pump()};if(im.decode)im.decode().then(ok,ok);else ok()};im.onerror=function(){busy--;delete hi[j]};im.src=B+"pk/"+s+"/s"+(j<10?"0"+j:j)+".webp"};
  pump();pump();
  warm=function(){if(warm.on)return;warm.on=1;var tw=Date.now();var j=0,got=0,L=document.querySelector(".cine-load"),N0=L?L.querySelector(".cl-n"):null,
   fin=function(){if(!L||L.done)return;L.done=1;L.classList.add("out");document.documentElement.classList.remove("cine-loading");setTimeout(function(){L.remove()},1000)},
   tk=function(){got++;var dl=H.querySelector(".cine-dl");if(dl){var q=Math.min(1,got/G.K);dl.firstChild.style.transform="scaleX("+q.toFixed(3)+")";if(q>=1)dl.classList.add("ok")}if(L){var p=Math.min(1,got/G.K);L.style.setProperty("--p",p.toFixed(3));if(N0)N0.textContent=Math.round(p*100)+"%";var el=(Date.now()-tw)/1000,rt=got/Math.max(.3,el);if(got>=Math.min(G.K,Math.max(10,Math.ceil(G.K*.1)))&&(G.K-got)<=rt*20&&(function(){for(var i=0;i<G.T;i++)if(!LO[i])return false;return true})())setTimeout(fin,200)}},
   nx=function(){if(j>=G.K||set!==s)return;var u=B+"pk/"+s+"/s"+(j<10?"0"+j:j)+".webp";j++;try{fetch(u).then(function(r){return r.blob()}).then(function(){tk();nx()},function(){tk();nx()})}catch(e){tk();nx()}};
   for(var k=0;k<4;k++)nx();setTimeout(fin,7000)};if(loN>=G.LK)warm();else setTimeout(warm,4000);
 }else for(var j=0;j<4;j++)next();
 if(PH&&!PH.im){var pi=new Image();pi.decoding="async";pi.onload=function(){PH.im=pi;cur="";draw()};pi.src=PH.url}}
/* la tela ha la stessa misura dei fotogrammi: il browser la scala con la scheda grafica */
function size(){var f=PK?{width:PK[set||(innerWidth<=700?"m":"d")].w,height:PK[set||(innerWidth<=700?"m":"d")].h}:F[0];if(f){if(cv.width!==f.width)cv.width=f.width;if(cv.height!==f.height)cv.height=f.height}measure();cur="";draw()}
var GT=0,GH=1;function measure(){var r=H.getBoundingClientRect();GT=r.top+scrollY;GH=r.height}
var VC={};function sv(k,v){v=Math.round(v*1000)/1000;if(VC[k]!==v){VC[k]=v;H.style.setProperty(k,String(v))}}
function ss(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)}
function cl(a,b,x){return Math.max(0,Math.min(1,(x-a)/(b-a)))}
function near(i,lo,hi){i=Math.round(i);for(var d=0;d<=hi-lo;d++){if(i-d>=lo&&F[i-d])return i-d;if(i+d<=hi&&F[i+d])return i+d;if(d>6)break}return -1}
function nearL(i,lo,hi){i=Math.round(i);for(var d=0;d<=hi-lo;d++){if(i-d>=lo&&LO[i-d])return i-d;if(i+d<=hi&&LO[i+d])return i+d}return -1}
/* un fotogramma di una sequenza, sfumato col successivo: movimento continuo anche scorrendo piano */
var LL=-1,FU=0;function seq(f,lo,hi,a){window.__cineAll=(window.__cineAll||0)+1;var i0=Math.floor(f),fr=f-i0,k=near(i0,lo,hi);if(k<0){window.__cineLo=(window.__cineLo||0)+1;var kl=nearL(i0,lo,hi);if(kl<0)return false;cx.globalAlpha=a;cover(LO[kl]);if(LO[i0+1]&&kl===i0&&fr>.02){cx.globalAlpha=a*fr;cover(LO[i0+1])}cx.globalAlpha=1;LL=kl;FU=0;return true}
 /* quando arriva il fotogramma nitido al posto della miniatura, compare con una dissolvenza brevissima: niente lampo */
 if(LL>=0&&Math.abs(LL-k)<=1&&LO[LL]){if(!FU)FU=performance.now();var e=Math.min(1,(performance.now()-FU)/180);cx.globalAlpha=a;cover(LO[LL]);cx.globalAlpha=a*e;cover(F[k]);cx.globalAlpha=1;if(e<1)requestAnimationFrame(function(){cur="";draw()});else{LL=-1;FU=0}return true}
 LL=-1;FU=0;cx.globalAlpha=a;cover(F[k]);if(k===i0&&i0+1<=hi&&F[i0+1]&&fr>.02){cx.globalAlpha=a*fr;cover(F[i0+1])}cx.globalAlpha=1;return true}
function cover(im){var W=cv.width,Hh=cv.height;if(im.im){if(im.width===W&&im.height===Hh)cx.drawImage(im.im,im.sx,im.sy,im.width,im.height,0,0,W,Hh);else{var r=Math.max(W/im.width,Hh/im.height),w=im.width*r,h=im.height*r;cx.drawImage(im.im,im.sx,im.sy,im.width,im.height,(W-w)/2,(Hh-h)/2,w,h)}return}if(im.width===W&&im.height===Hh)cx.drawImage(im,0,0);else{var r=Math.max(W/im.width,Hh/im.height),w=im.width*r,h=im.height*r;cx.drawImage(im,(W-w)/2,(Hh-h)/2,w,h)}}
/* la statua vera: dalla foto intera la camera spinge fino all'occhio (zoom a velocità costante) */
function photo(z,a){var im=PH.im;if(!im)return false;var W=cv.width,Hh=cv.height,s0=Math.max(W/im.width,Hh/im.height),s=s0*Math.pow(PH.z,z);
 var ex=PH.eye[0]*im.width,ey=PH.eye[1]*im.height,C=function(v,h,L){return Math.max(h,Math.min(L-h,v))},hw0=W/s0/2,hh0=Hh/s0/2,cx0=C(ex,hw0,im.width),cy0=C(im.height/2,hh0,im.height),k=z*z*(3-2*z),px=cx0+(ex-cx0)*Math.min(1,k*1.25),py=cy0+(ey-cy0)*Math.min(1,k*1.25);px=C(px,W/s/2,im.width);py=C(py,Hh/s/2,im.height);
 cx.globalAlpha=a;cx.drawImage(im,W/2-px*s,Hh/2-py*s,im.width*s,im.height*s);cx.globalAlpha=1;return true}
var pp=0,want=0,last=0,SET=false;
function draw(){var p=pp,key;
 if(p<=T.a||!STORY){var f=Math.min(1,p/T.a)*(N-1);/* da fermo si mostra un solo fotogramma, nitido; la dissolvenza serve solo in movimento */f=Math.round(f);fi=f;key="a"+f;if(key===cur)return;cur=key;seq(f,0,N-1,1);H.classList.add("live");return}
 if(p<T.b){/* la camera gira attorno alla statua e spinge fino al suo occhio */var e=cl(T.a,T.b,p),f=N+e*(A-1);fi=f;key="b"+Math.round(f*40);if(key===cur)return;cur=key;seq(f,N,P0-1,1);return}
 if(p<T.c){/* nell'occhio: la pupilla si apre e dentro c'è già la vista della statua */var e=cl(T.b,T.c,p);fi=P0;key="c"+Math.round(e*400);if(key===cur)return;cur=key;
  var W=cv.width,Hh=cv.height,z=1+e*e*1.6;cx.save();cx.translate(W/2,Hh/2);cx.scale(z,z);cx.translate(-W/2,-Hh/2);seq(P0-1,N,P0-1,1);cx.restore();var R=Math.hypot(W,Hh)*.5*Math.pow(e,1.8);
  cx.save();cx.beginPath();cx.arc(W/2,Hh/2,Math.max(1,R),0,6.2832);cx.clip();if(!seq(P0,P0,TOT-1,1)){cx.fillStyle="#1a1010";cx.fillRect(0,0,W,Hh)}cx.restore();
  var g=cx.createRadialGradient(W/2,Hh/2,R*.75,W/2,Hh/2,R*1.2+2);g.addColorStop(0,"rgba(30,16,12,0)");g.addColorStop(.6,"rgba(30,16,12,.5)");g.addColorStop(1,"rgba(30,16,12,0)");cx.fillStyle=g;cx.fillRect(0,0,W,Hh);return}
 /* in prima persona: il salto e il tuffo */var e=cl(T.c,T.d,p),f=P0+e*(M-1);fi=f;key="d"+Math.round(f*40);if(key===cur)return;cur=key;seq(f,P0,TOT-1,1)}
function geo(){var y=scrollY,top=GT-y,run=Math.max(1,GH-innerHeight);return{r:{top:top,bottom:top+GH},run:run,ps:Math.max(0,Math.min(1,-top/run))}}
function tick(now){raf=0;var g=geo(),r=g.r,p=AUTO?AUTO.p:g.ps;now=now||performance.now();
 /* inerzia: la scena insegue lo scorrimento con una molla morbida, così anche un colpo di pollice diventa un movimento continuo */
 var dt=Math.min(64,last?now-last:16);last=now;var k=AUTO?1:1-Math.exp(-dt/40);var p0=pp;pp+=(p-pp)*k;if(Math.abs(p-pp)<.0002)pp=p;
 window.__cineV=(pp-p0)/Math.max(1,dt)*160;SET=(pp===p);draw();if(pump){pump();pump()}if(pp!==p)on();else last=0;
 var q=pp;sv("--w",1-ss(.03,.2,q));sv("--u",ss(T.u0,T.u1,q));sv("--fl",STORY?ss(T.d-.012,T.d,q)*(1-ss(T.d,T.d+.03,q)):0);var t=ss(T.t0,T.t1,q);sv("--d",ss(T.d0,T.d1,q)*(1-ss(T.d2,T.d3,q)));sv("--t",t);
 var rd=t>.5,ic=r.bottom>innerHeight*.5;if(VC.rd!==rd){VC.rd=rd;H.classList.toggle("ready",rd)}if(VC.ic!==ic){VC.ic=ic;document.documentElement.classList.toggle("in-cine",ic)}sv("--h",1-ss(0,.06,q))}
function on(){if(!raf)raf=requestAnimationFrame(tick)}
measure();if(document.readyState==="complete")pick();else addEventListener("load",function(){setTimeout(pick,60)},{once:true});size();tick(0);pp=geo().ps;draw();
var PR=document.createElement("div");PR.setAttribute("aria-hidden","true");PR.style.cssText="position:fixed;top:0;bottom:0;left:0;width:0;visibility:hidden;pointer-events:none";document.body.appendChild(PR);var VH=function(){var h=Math.round(PR.getBoundingClientRect().height||innerHeight);if(h>0&&VC.vh!==h){VC.vh=h;document.documentElement.style.setProperty("--vh",h+"px");measure()}};VH();addEventListener("scroll",on,{passive:true});addEventListener("resize",function(){VH();if(set)pick();size();on()});addEventListener("orientationchange",function(){setTimeout(function(){VH();on()},300)});if(window.visualViewport)visualViewport.addEventListener("resize",function(){VH();on()});addEventListener("load",function(){measure();on()});if(window.ResizeObserver)new ResizeObserver(function(){VH();measure();on()}).observe(document.documentElement);setInterval(VH,500);addEventListener("scroll",VH,{passive:true});
/* HYBRID: al primo gesto il volo parte da solo; ma appena metti il dito il volo segue il dito all'istante
   (avanti e indietro, come trascinare un film), e quando lo lasci prosegue con lo slancio e poi riparte da solo */
(function(){var root=document.documentElement,st=H.querySelector(".cine-st"),FPS=42,S=0,fp=0,hold=0,lt=0,tail=0,push=0,
  drag=false,ty=null,tt=0,vel=0,fling=0,lastIn=0;
 AUTO={p:0};root.classList.add("cine-lock");
 /* filo dorato in basso: mostra a che punto del volo sei (e che puoi spingerlo col dito) */
 var pg=document.createElement("div");pg.className="cine-prog";pg.setAttribute("aria-hidden","true");pg.innerHTML="<i></i>";st.appendChild(pg);var pgi=pg.firstChild;
 /* alla fine, nel pannello dell'acqua: rivedi il volo */
 var RV={en:"Watch the flight again",fr:"Revoir le vol",de:"Flug noch einmal ansehen",es:"Ver el vuelo otra vez"}[(root.lang||"it").slice(0,2)]||"Rivedi il volo";
 var tx=H.querySelector(".cine-txt"),rv=document.createElement("button");rv.type="button";rv.className="cine-replay";rv.textContent="\u21BA "+RV;if(tx)tx.appendChild(rv);
 rv.addEventListener("click",function(){H.classList.remove("cine-end");root.classList.add("cine-lock");scrollTo(0,0);S=0;fp=0;tail=0;push=0;fling=0;hold=0;AUTO.p=0;t0g=0;VH();on();setTimeout(go,60)});
 var K=function(){return N/Math.max(400,innerHeight)*0.9};   /* una strisciata di tutto lo schermo = quasi tutto il volo */
 var go=function(){if(S!==0||document.querySelector(".cine-load"))return;S=1;root.classList.add("cine-playing");lt=0;requestAnimationFrame(run)};
 var move=function(df){if(S>=3)return;if(fp>=N-1&&df>0){tail=Math.min(1,tail+df/N*2.2)}else{fp=Math.max(0,Math.min(N-1,fp+df));if(fp<N-1)tail=0}lastIn=performance.now();if(S<3)on()};
 addEventListener("wheel",function(e){if(S>=3)return;if(e.cancelable)e.preventDefault();if(S===0){go();return}push+=e.deltaY*(e.deltaMode===1?16:1)*K()*.6;lastIn=performance.now()},{passive:false});
 addEventListener("touchstart",function(e){if(S>=3||!e.touches[0])return;ty=e.touches[0].clientY;tt=performance.now();drag=true;vel=0;fling=0},{passive:true});
 addEventListener("touchmove",function(e){if(S>=3)return;if(e.cancelable)e.preventDefault();var y=e.touches[0]?e.touches[0].clientY:ty,now=performance.now();
  if(S===0){go()}if(ty!==null){var df=(ty-y)*K();move(df);var d=Math.max(1,now-tt);vel=vel*.6+(df/d)*.4}ty=y;tt=now},{passive:false});
 addEventListener("touchend",function(){if(!drag)return;drag=false;ty=null;fling=Math.max(-3,Math.min(3,vel))},{passive:true});
 addEventListener("touchcancel",function(){drag=false;ty=null},{passive:true});
 st.addEventListener("click",function(){go()});
 addEventListener("keydown",function(e){if(S>=3)return;if(/^(ArrowDown|PageDown| |Spacebar)$/.test(e.key)){e.preventDefault();if(S===0)go();else push+=N*.12}else if(/^(ArrowUp|PageUp)$/.test(e.key)){e.preventDefault();push-=N*.12}else if(e.key==="End"){e.preventDefault();if(S===0)go();push+=N}});
 var finish=function(){if(S===3)return;S=3;var h=Math.round(st.getBoundingClientRect().height)||innerHeight;H.style.setProperty("--hd",h+"px");
  root.classList.remove("cine-lock","cine-playing");H.classList.add("cine-end");scrollTo(0,0);measure();on()};
 document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('a[href*="#"]');if(a&&S<3){AUTO.p=1;finish()}},true);
 /* aperto con un link a una sezione (es. #recensioni): niente volo, si va dritti alla sezione */
 var hs=location.hash.length>1?document.getElementById(decodeURIComponent(location.hash.slice(1))):null;
 if(hs&&!H.contains(hs))setTimeout(function(){AUTO.p=1;finish();requestAnimationFrame(function(){hs.scrollIntoView({behavior:"instant"})})},0);
 var t0g=0;function run(t){if(S===3)return;if(!t0g)t0g=t;if(fp===0&&t-t0g<1500){var rd=0;for(var q=0;q<12;q++)if(F[q])rd++;if(rd<10){requestAnimationFrame(run);return}}var dt=lt?Math.min(80,t-lt):16;lt=t;
  if(!drag){
   /* slancio dopo aver lasciato il dito, che si spegne in un attimo */
   if(Math.abs(fling)>.002){move(fling*dt);fling*=Math.exp(-dt/220)}else fling=0;
   /* rotella e tasti: risposta rapida ma morbida */
   if(Math.abs(push)>.01){var pk=push*Math.min(1,dt/45);push-=pk;move(pk)}
   var idle=t-lastIn>160&&!fling;
   if(idle&&fp<N-1){var ah=0,k0=Math.round(fp);while(ah<30&&k0+ah<N&&F[k0+ah])ah++;var sp=ah>=30||k0+ah>=N?1:Math.max(.4,Math.min(1,(ah-2)/14));var nx=Math.min(N-1,fp+dt*FPS*sp/1000),k=Math.round(nx);if(!F[k]&&hold<120){hold+=dt}else{hold=0;fp=nx}}
   if(idle&&fp>=N-1)tail=Math.min(1,tail+dt/1700)}
  if(fp>=N-1){if(S<2){S=2;root.classList.remove("cine-playing")}}else if(S===2){S=1;root.classList.add("cine-playing")}
  AUTO.p=fp>=N-1?T.a+(1-T.a)*tail:fp/(N-1)*T.a;pgi.style.transform="scaleX("+(fp/(N-1)).toFixed(4)+")";
  on();if(AUTO.p>=1&&!drag)setTimeout(finish,200);else requestAnimationFrame(run)}
})();
/* il volo segue solo lo scorrimento: avanti e indietro con il dito, nessuna partenza automatica */
})();
/* ---------- l'ambiente vivo: pulviscolo dorato, bolle di luce sfocate, rondini; in volo la luce scorre accanto a te ---------- */
(function(){
"use strict";
/* il video ora e' reale: nessuna particella disegnata sopra */return;var H=document.getElementById("cine");if(!H||H.classList.contains("still"))return;
if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var st=H.querySelector(".cine-st"),c=document.createElement("canvas");c.className="cine-fx";c.setAttribute("aria-hidden","true");st.insertBefore(c,st.querySelector(".cine-cv").nextSibling);
var x=c.getContext("2d"),W=0,Hh=0,mob=innerWidth<=700,P=[],O=[],B=[],nextB=1800,lastT=0,lastY=scrollY,vis=true,q=1,acc=0,cnt=0;
function sprite(c0,c1){var s=document.createElement("canvas");s.width=s.height=64;var g=s.getContext("2d"),rg=g.createRadialGradient(32,32,0,32,32,32);rg.addColorStop(0,c0);rg.addColorStop(.35,c1);rg.addColorStop(1,"rgba(255,180,90,0)");g.fillStyle=rg;g.fillRect(0,0,64,64);return s}
var spr=sprite("rgba(255,240,200,1)","rgba(255,206,130,.55)"),orb=sprite("rgba(255,214,160,.55)","rgba(255,170,120,.22)"),orb2=sprite("rgba(255,190,210,.45)","rgba(240,150,190,.18)");
function size(){mob=innerWidth<=700;var d=mob?1:Math.min(devicePixelRatio||1,1.5);W=c.width=Math.round(c.clientWidth*d);Hh=c.height=Math.round(c.clientHeight*d);c.dataset.d=d;fill()}
function fill(){var n=Math.round((mob?60:110)*q);P=[];for(var i=0;i<n;i++)P.push(mk(true));var m=Math.round((mob?7:11)*q);O=[];for(var j=0;j<m;j++)O.push(mo())}
function mk(any){return{x:Math.random()*W,y:any?Math.random()*Hh:Hh+10,z:.3+Math.random()*.9,s:Math.random()*6.28,v:.004+Math.random()*.012}}
function mo(){return{x:Math.random()*W,y:Math.random()*Hh,r:(mob?40:70)*(.6+Math.random()*1.1),s:Math.random()*6.28,v:.00025+Math.random()*.0004,k:Math.random()<.35}}
function bird(){var n=2+Math.floor(Math.random()*5),dir=Math.random()<.5?1:-1,y=Hh*(.06+Math.random()*.28),sp=(mob?.05:.07)*(.8+Math.random()*.5)*(+c.dataset.d||1);var f=[];for(var i=0;i<n;i++)f.push({dx:-i*18*dir+(Math.random()-.5)*12,dy:i*(6+Math.random()*7)*(i%2?1:-1),ph:Math.random()*6.28,sz:.7+Math.random()*.5});B.push({x:dir>0?-60:W+60,y:y,dir:dir,sp:sp,f:f})}
function frame(t){requestAnimationFrame(frame);if(!vis||document.hidden){lastT=t;return}var dt=Math.min(50,lastT?t-lastT:16);lastT=t;
 /* se il telefono fatica, si alleggerisce da solo */
 acc+=dt;cnt++;if(acc>1500){var avg=acc/cnt;acc=0;cnt=0;if(avg>22&&q>.3){q*=.7;fill()}else if(avg<18&&q<1){q=Math.min(1,q*1.15);fill()}}
 var dy=scrollY-lastY;lastY=scrollY;var V=Math.max(0,Math.min(2.5,(window.__cineV||0)*60));x.clearRect(0,0,W,Hh);var cxm=W/2,cym=Hh*.45;
 x.globalCompositeOperation="lighter";
 for(var j=0;j<O.length;j++){var o=O[j];o.s+=dt*o.v*6;o.x+=Math.sin(o.s)*.15+(o.x-cxm)*V*.004;o.y+=Math.cos(o.s*.8)*.12+(o.y-cym)*V*.004;if(o.x<-o.r*2||o.x>W+o.r*2||o.y<-o.r*2||o.y>Hh+o.r*2){O[j]=mo();continue}
  x.globalAlpha=.18+.12*Math.sin(o.s*1.7);x.drawImage(o.k?orb2:orb,o.x-o.r,o.y-o.r,o.r*2,o.r*2)}
 for(var i=0;i<P.length;i++){var p=P[i];p.s+=dt*.0012*p.z;
  p.x+=Math.sin(p.s)*.25*p.z+dt*.004+(p.x-cxm)*V*.02*p.z;p.y+=-dt*p.v*p.z*2-dy*.15*p.z+(p.y-cym)*V*.02*p.z;
  if(p.y<-20||p.x>W+20||p.x<-20||p.y>Hh+30){P[i]=mk(false);if(V>.2){P[i].x=cxm+(Math.random()-.5)*W*.5;P[i].y=cym+(Math.random()-.5)*Hh*.4}else P[i].x=Math.random()*W;continue}
  var a=(.35+.35*Math.sin(p.s*2.3))*p.z*(1-p.y/Hh*.5)*(1+V*.6),r=(mob?5:7)*p.z*(1+V*.5);x.globalAlpha=Math.max(0,Math.min(1,a));
  if(V>.4){var L=V*14*p.z,ux=p.x-cxm,uy=p.y-cym,ul=Math.hypot(ux,uy)||1;x.drawImage(spr,p.x-r-ux/ul*L*.5,p.y-r-uy/ul*L*.5,r*2+Math.abs(ux/ul*L),r*2+Math.abs(uy/ul*L))}else x.drawImage(spr,p.x-r,p.y-r,r*2,r*2)}
 x.globalCompositeOperation="source-over";x.globalAlpha=1;
 nextB-=dt;if(nextB<0){bird();nextB=5000+Math.random()*6000}
 x.strokeStyle="rgba(40,28,40,.75)";x.lineCap="round";
 for(var k=B.length-1;k>=0;k--){var b=B[k];b.x+=b.dir*b.sp*dt;b.y+=Math.sin(t*.0007+k)*.05-dy*.05;if((b.dir>0&&b.x>W+120)||(b.dir<0&&b.x<-120)){B.splice(k,1);continue}
  for(var m=0;m<b.f.length;m++){var f=b.f[m],bx=b.x+f.dx,by=b.y+f.dy,w=(mob?6:8)*f.sz,fl=Math.sin(t*.018+f.ph)*.9;x.lineWidth=1.4*f.sz;x.beginPath();x.moveTo(bx-w,by-w*.35*fl);x.quadraticCurveTo(bx-w*.4,by-w*.5*fl-2,bx,by);x.quadraticCurveTo(bx+w*.4,by-w*.5*fl-2,bx+w,by-w*.35*fl);x.stroke()}}}
if("IntersectionObserver" in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(H);
size();addEventListener("resize",size);requestAnimationFrame(frame);
})();
/* ---------- il resto del sito si muove con te: capitoli che affiorano, foto in parallasse, bollicine dopo il tuffo ---------- */
(function(){
"use strict";
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var secs=[].slice.call(document.querySelectorAll("main section"));
if(!RM&&"IntersectionObserver" in window){secs.forEach(function(s){s.classList.add("chap")});
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -18% 0px",threshold:.05});secs.forEach(function(s){io.observe(s)})}
if(RM)return;
var first=document.querySelector("main section");if(first){var b=document.createElement("div");b.className="bubbles";b.setAttribute("aria-hidden","true");var h="";for(var i=0;i<12;i++)h+='<i style="left:'+(5+Math.random()*90).toFixed(1)+'%;--s:'+(4+Math.random()*9).toFixed(1)+'px;animation-delay:-'+(Math.random()*7).toFixed(2)+'s;animation-duration:'+(5+Math.random()*4).toFixed(2)+'s"></i>';b.innerHTML=h;first.insertBefore(b,first.firstChild)}
var bands=[].slice.call(document.querySelectorAll(".band img")),vis=[],raf=0;
if("IntersectionObserver" in window){var bo=new IntersectionObserver(function(es){es.forEach(function(e){var i=vis.indexOf(e.target);if(e.isIntersecting&&i<0)vis.push(e.target);if(!e.isIntersecting&&i>=0)vis.splice(i,1)});on()});bands.forEach(function(im){bo.observe(im)})}
function tick(){raf=0;var vh=innerHeight;for(var i=0;i<vis.length;i++){var im=vis[i],r=im.parentNode.getBoundingClientRect(),k=(r.top+r.height/2-vh/2)/vh;im.style.transform="translate3d(0,"+(k*-9).toFixed(2)+"%,0) scale(1.18)"}}
function on(){if(!raf)raf=requestAnimationFrame(tick)}
addEventListener("scroll",on,{passive:true});on();
})();

/* ---------- l'ora del giorno: un piccolo sole tramonta lungo la pagina e diventa luna; il cielo dietro cambia colore per capitolo ---------- */
(function(){
"use strict";
var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var sky=document.createElement("div");sky.className="sky";sky.setAttribute("aria-hidden","true");sky.innerHTML="<i></i><i></i>";document.body.insertBefore(sky,document.body.firstChild);
var sun=document.createElement("div");sun.className="sunclock";sun.setAttribute("aria-hidden","true");sun.innerHTML="<i></i>";document.body.appendChild(sun);
var TONES={esperienza:"#1f7f86,#e2a15e",casa:"#2a6f86,#d98f6a",servizi:"#2f5f8f,#c7808a",dintorni:"#3c5590,#c97a96",recensioni:"#4a4c8e,#d0849c",host:"#56488a,#e29a7a",perche:"#5c4482,#e6a46c",come:"#4e3d76,#c98aa8",contatti:"#3b3263,#e0a86e",faq:"#2a2547,#9c86c8"};
var secs=[].slice.call(document.querySelectorAll("main section[id]"));
if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var t=(TONES[e.target.id]||"#1f7f86,#e2a15e").split(",");sky.style.setProperty("--c1",t[0]);sky.style.setProperty("--c2",t[1])}})},{rootMargin:"-45% 0px -45% 0px"});secs.forEach(function(s){io.observe(s)})}
var raf=0;function tick(){raf=0;var H=document.documentElement.scrollHeight-innerHeight,p=H>0?Math.max(0,Math.min(1,scrollY/H)):0;sun.style.setProperty("--p",p.toFixed(4));sun.classList.toggle("moon",p>.82);var c=document.getElementById("cine");sun.classList.toggle("off",!!c&&c.getBoundingClientRect().bottom>innerHeight*.6)}
function on(){if(!raf)raf=requestAnimationFrame(tick)}addEventListener("scroll",on,{passive:true});addEventListener("resize",on);tick();
if(RM)return;
/* titoli: le parole affiorano una dopo l'altra (il testo resta intero per i motori di ricerca) */
[].forEach.call(document.querySelectorAll("main section h2"),function(h){if(h.closest(".band-t")||h.querySelector("*"))return;var w=h.textContent.trim().split(/\s+/);h.setAttribute("aria-label",h.textContent.trim());h.innerHTML=w.map(function(x,i){return'<span class="wd" aria-hidden="true" style="--i:'+i+'">'+x.replace(/&/g,"&amp;").replace(/</g,"&lt;")+'</span>'}).join(" ")});
/* foto e schede si inclinano appena sotto il puntatore (solo con il mouse) */
if(matchMedia("(hover:hover) and (pointer:fine)").matches){[].forEach.call(document.querySelectorAll(".ex,.card,.gal figure,blockquote"),function(el){el.classList.add("tilt");el.addEventListener("pointermove",function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty("--rx",(-y*5).toFixed(2)+"deg");el.style.setProperty("--ry",(x*6).toFixed(2)+"deg");el.style.setProperty("--mx",((x+.5)*100).toFixed(1)+"%");el.style.setProperty("--my",((y+.5)*100).toFixed(1)+"%")});el.addEventListener("pointerleave",function(){el.style.setProperty("--rx","0deg");el.style.setProperty("--ry","0deg")})})}
})();
/* ---------- bande da cinemascope che si aprono sulle grandi foto, lucciole a fine pagina ---------- */
(function(){
"use strict";
if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var bands=[].slice.call(document.querySelectorAll(".band")),raf=0;
function tick(){raf=0;var vh=innerHeight;for(var i=0;i<bands.length;i++){var r=bands[i].getBoundingClientRect();if(r.bottom<0||r.top>vh)continue;var k=Math.max(0,Math.min(1,(vh-r.top)/(vh*.75)));bands[i].style.setProperty("--lb",(1-k*k*(3-2*k)).toFixed(3))}}
function on(){if(!raf)raf=requestAnimationFrame(tick)}addEventListener("scroll",on,{passive:true});addEventListener("resize",on);on();
false&&[].forEach.call(document.querySelectorAll("#faq,footer"),function(s){var f=document.createElement("div");f.className="ff";f.setAttribute("aria-hidden","true");var h="";for(var i=0;i<14;i++)h+='<i style="left:'+(Math.random()*96+2).toFixed(1)+'%;top:'+(Math.random()*80+10).toFixed(1)+'%;--x:'+(Math.random()*80-40).toFixed(0)+'px;--y:'+(-20-Math.random()*60).toFixed(0)+'px;--d:'+(7+Math.random()*6).toFixed(1)+'s;--w:-'+(Math.random()*8).toFixed(1)+'s"></i>';f.innerHTML=h;s.style.position=s.style.position||"relative";s.insertBefore(f,s.firstChild)})})();

/* ---------- scorrimento morbido con rotella/trackpad sul computer: la pagina scivola invece di scattare ---------- */
(function(){if(!window.matchMedia||!matchMedia("(pointer:fine)").matches||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 var root=document.documentElement,tgt=0,cur=0,on=false,lt=0;
 var scrollable=function(el){for(;el&&el!==document.body&&el!==root;el=el.parentElement){if(el.tagName==="DIALOG"||el.isContentEditable)return true;var cs=getComputedStyle(el);if(/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+1)return true}return false};
 var max=function(){return Math.max(0,root.scrollHeight-innerHeight)};
 var loop=function(t){var dt=lt?Math.min(50,t-lt):16;lt=t;cur+=(tgt-cur)*(1-Math.exp(-dt/85));if(Math.abs(tgt-cur)<.5){cur=tgt;on=false;lt=0}
  scrollTo({top:cur,behavior:"instant"});if(on)requestAnimationFrame(loop)};
 addEventListener("wheel",function(e){if(e.defaultPrevented||e.ctrlKey||root.classList.contains("cine-lock")||document.querySelector("dialog[open]")||Math.abs(e.deltaX)>Math.abs(e.deltaY)||scrollable(e.target))return;
  e.preventDefault();if(!on){tgt=cur=scrollY}var d=e.deltaY*(e.deltaMode===1?40:e.deltaMode===2?innerHeight:1);tgt=Math.max(0,Math.min(max(),tgt+d));if(!on){on=true;requestAnimationFrame(loop)}},{passive:false});
 /* se scorri in altro modo (tastiera, barra, link) la rotella riparte da li' */
 addEventListener("scroll",function(){if(!on)tgt=cur=scrollY},{passive:true});
})();

/* ---------- l'orizzonte del lago: il profilo vero del cratere (Monte Cavo con le antenne, l'orlo verso Rocca di Papa)
   si disegna tra un capitolo e l'altro; sotto, l'acqua luccica. Tutto vettoriale: nitido su qualunque schermo. ---------- */
(function(){
"use strict";
var NS="http://www.w3.org/2000/svg";
var P=[[0,58],[130,52],[270,60],[430,68],[570,72],[700,66],[820,53],[915,36],[985,24],[1040,18],[1078,20],[1125,29],[1205,43],[1325,52],[1455,56],[1600,50]];
function ridge(close,H){var d="M"+P[0][0]+","+P[0][1];for(var i=0;i<P.length-1;i++){var p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;
 d+=" C"+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+","+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+" "+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+","+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+" "+p2[0]+","+p2[1]}
 return close?d+" L1600,"+H+" L0,"+H+" Z":d}
var ANT='<path class="lk-ant" d="M1046,18 v-9 M1053,19 v-6 M1060,19 v-4"/>';
function water(y0,n,sp){var s="";for(var i=0;i<n;i++){var y=y0+i*sp;s+='<path class="lk-w" style="--k:'+i+'" d="M0,'+y+' H1600"/>'}return s}
var div='<svg class="lk-svg" viewBox="0 0 1600 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">'+
 '<path class="lk-fill" d="'+ridge(true,96)+'"/><path class="lk-r" pathLength="1" d="'+ridge(false)+'"/>'+ANT+
 '<path class="lk-line" d="M0,96 H1600"/>'+water(103,3,7)+'<path class="lk-g" d="M960,103 h90 M985,110 h46 M1000,117 h20"/></svg>';
var secs=[].slice.call(document.querySelectorAll("main section[id]:not(.has-band)"));
secs.forEach(function(s){var d=document.createElement("div");d.className="lk";d.innerHTML=div;s.insertBefore(d,s.firstChild)});
/* in fondo: il lago di notte, la luna sopra Monte Cavo e il suo riflesso che tremola */
var f=document.querySelector("footer");
if(f){var col="";for(var i=0;i<9;i++){var w=60-i*5;col+='<path class="lk-m" style="--k:'+i+'" d="M'+(1000-w/2)+','+(112+i*8)+' h'+w+'"/>'}
 var e=document.createElement("div");e.className="lk lk-foot";
 e.innerHTML='<svg class="lk-svg" viewBox="0 -64 1600 254" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">'+
 '<defs><linearGradient id="lkwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c178" stop-opacity=".10"/><stop offset="1" stop-color="#f0c178" stop-opacity="0"/></linearGradient></defs>'+
 '<circle class="lk-moon" cx="1000" cy="-22" r="12"/><g transform="translate(0,6)"><path class="lk-fill" d="'+ridge(true,96)+'"/><path class="lk-r" pathLength="1" d="'+ridge(false)+'"/>'+ANT+'</g>'+
 '<rect x="0" y="102" width="1600" height="88" fill="url(#lkwg)"/><path class="lk-line" d="M0,102 H1600"/>'+water(114,6,12)+col+'</svg>';
 f.insertBefore(e,f.firstChild)}
var all=[].slice.call(document.querySelectorAll(".lk,main section[id]"));
if(!("IntersectionObserver" in window)||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)){all.forEach(function(x){x.classList.add("lk-on","lk-in")});return}
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.target.classList.contains("lk")){x.target.classList.toggle("lk-on",x.isIntersecting);if(x.isIntersecting)x.target.classList.add("lk-in")}else if(x.isIntersecting)x.target.classList.add("lk-in")})},{rootMargin:"0px 0px -12% 0px"});
all.forEach(function(x){io.observe(x)});
})();
