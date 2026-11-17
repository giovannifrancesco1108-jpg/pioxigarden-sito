/* Lo spot «Il tuffo»: la statua della terrazza si sveglia in soggiorno, esce dalla porta-finestra,
   sale sulla balaustra e si tuffa nel lago Albano. Cartone animato disegnato in tempo reale
   sul modello 3D dell'appartamento (ricostruzione indicativa, non in scala).
   Si carica vicino alla sezione, parte quando è a schermo e si ferma quando esce. */
import * as THREE from "./vendor/three-r160.module.min.js";

/* modello dell'appartamento (dal modello SketchUp, ricostruzione indicativa): metri, Z in alto */
function aptBuild(){
var C={muro:[240,238,232],cotto:[181,101,64],trav:[214,196,160],soff:[247,246,242],verde:[112,152,128],led:[70,120,255,1],
legno:[74,47,34],vetro:[175,208,226],vetroS:[220,228,232],ferro:[38,38,40],ottone:[176,141,74],noce:[104,56,34],ante:[124,70,44],
marmo:[222,210,192],piastrK:[150,116,90],acciaio:[176,178,182],nero:[26,26,28],bianco:[248,248,246],rad:[238,238,236],
lamp:[255,236,190,1],terrazzo:[226,223,216],sgBlu:[38,92,196],sgBia:[240,240,238],sgGri:[92,94,98],vellBlu:[30,74,98],
cusc:[92,106,128],vellGri:[186,189,192],metNero:[30,30,32],pelle:[26,46,72],panNero:[32,36,38],panGri:[176,186,180],
schermo:[16,16,18],arancio:[214,120,30],foglia:[58,110,62],orchidea:[208,60,150],candR:[200,60,50],candG:[230,190,60],
rovere:[138,104,72],rovAnte:[156,120,84],lenz:[244,244,240],asciug:[232,232,228],monstera:[34,78,44],vaso:[70,72,74],
piastrB:[182,128,92],pietra:[236,234,228],ceram:[251,251,251],specchio:[196,212,222],oblo:[60,64,70],prato:[118,150,92],cottoEst:[198,188,172]};

/* ---------------- costruzione delle geometrie (metri, Z in alto) ---------------- */
var BUF={main:{v:[],e:[]},ceil:{v:[],e:[]},glass:{v:[],e:[]}},cb=BUF.main;
var XF={c:1,s:0,tx:0,ty:0,tz:0};
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function norm(a){var l=Math.hypot(a[0],a[1],a[2]);return l>1e-12?[a[0]/l,a[1]/l,a[2]/l]:[0,0,1]}
function neg(a){return[-a[0],-a[1],-a[2]]}
function tp(p){return[XF.c*p[0]-XF.s*p[1]+XF.tx,XF.s*p[0]+XF.c*p[1]+XF.ty,p[2]+XF.tz]}
function tn(n){return[XF.c*n[0]-XF.s*n[1],XF.s*n[0]+XF.c*n[1],n[2]]}
function withXf(ang,tx,ty,tz,fn){var o=XF,r=ang*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
 XF={c:o.c*c-o.s*s,s:o.s*c+o.c*s,tx:o.c*tx-o.s*ty+o.tx,ty:o.s*tx+o.c*ty+o.ty,tz:tz+o.tz};fn();XF=o}
function use(b,fn){var o=cb;cb=BUF[b];fn();cb=o}
var CAP=null,OBS=[],WALLS=[],obsOn=true;
function hull(P){P=P.slice().sort(function(a,b){return a[0]-b[0]||a[1]-b[1]});if(P.length<3)return P;
 function cr(o,a,b){return(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])}
 var lo=[],up=[],i;for(i=0;i<P.length;i++){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],P[i])<=0)lo.pop();lo.push(P[i])}
 for(i=P.length-1;i>=0;i--){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],P[i])<=0)up.pop();up.push(P[i])}
 up.pop();lo.pop();return lo.concat(up)}
/* ogni mobile lascia la sua impronta a terra: serve all'omino per girarci intorno */
function capB(){CAP=[]}
function capE(){var c=CAP;CAP=null;if(!obsOn||!BUF||!c||!c.length||(cb!==BUF.main&&cb!==BUF.glass))return;
 var z0=1e9,z1=-1e9,P=[];c.forEach(function(p){if(p[2]<z0)z0=p[2];if(p[2]>z1)z1=p[2];P.push([p[0],p[1]])});OBS.push({poly:hull(P),z0:z0,z1:z1})}
function vert(p,n,col){var q=tp(p),m=tn(n);if(CAP)CAP.push(q);cb.v.push(q[0],q[1],q[2],m[0],m[1],m[2],col[0]/255,col[1]/255,col[2]/255,col[3]||0)}
function triN(a,b,c,na,nb,nc,col){vert(a,na,col);vert(b,nb,col);vert(c,nc,col)}
function qn(a,b,c,d,n,col){triN(a,b,c,n,n,n,col);triN(a,c,d,n,n,n,col)}
function quad(a,b,c,d,col){qn(a,b,c,d,norm(cross(sub(b,a),sub(c,a))),col)}
function edge(a,b){var p=tp(a),q=tp(b);cb.e.push(p[0],p[1],p[2],q[0],q[1],q[2])}

function box(x0,y0,z0,x1,y1,z1,col,noEdge){capB();
 var P=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
 quad(P[0],P[3],P[2],P[1],col);quad(P[4],P[5],P[6],P[7],col);quad(P[0],P[1],P[5],P[4],col);
 quad(P[3],P[7],P[6],P[2],col);quad(P[0],P[4],P[7],P[3],col);quad(P[1],P[2],P[6],P[5],col);
 if(!noEdge)[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(function(e){edge(P[e[0]],P[e[1]])});
 capE();
}
function rbox(cx,cy,z0,w,d,h,ang,col){withXf(ang,cx,cy,0,function(){box(-w/2,-d/2,z0,w/2,d/2,z0+h,col)})}
function lathe(prof,n,col,cx,cy,caps){capB();
 withXf(0,cx,cy,0,function(){
  var rings=prof.map(function(pr){var r=[];for(var k=0;k<n;k++){var a=2*Math.PI*k/n;r.push([pr[1]*Math.cos(a),pr[1]*Math.sin(a),pr[0]])}return r});
  for(var j=0;j<prof.length-1;j++){var z0=prof[j][0],r0=prof[j][1],z1=prof[j+1][0],r1=prof[j+1][1];
   for(var k=0;k<n;k++){var k2=(k+1)%n,a=2*Math.PI*k/n,a2=2*Math.PI*k2/n;
    var na=norm([Math.cos(a)*(z1-z0),Math.sin(a)*(z1-z0),-(r1-r0)]),nb=norm([Math.cos(a2)*(z1-z0),Math.sin(a2)*(z1-z0),-(r1-r0)]);
    var A=rings[j][k],B2=rings[j][k2],C2=rings[j+1][k2],D=rings[j+1][k];
    triN(A,B2,C2,na,nb,nb,col);triN(A,C2,D,na,nb,na,col)}}
  if(caps!==false){var b=rings[0],t=rings[rings.length-1];
   for(var k=1;k<n-1;k++){triN(b[0],b[k+1],b[k],[0,0,-1],[0,0,-1],[0,0,-1],col);triN(t[0],t[k],t[k+1],[0,0,1],[0,0,1],[0,0,1],col)}}
  [rings[0],rings[rings.length-1]].forEach(function(r){for(var k=0;k<n;k++)edge(r[k],r[(k+1)%n])});
 });capE();
}
function cyl(cx,cy,z0,z1,r,col,n){lathe([[z0,r],[z1,r]],n||16,col,cx,cy)}
function area2(p){var a=0;for(var i=0;i<p.length;i++){var q=p[i],w=p[(i+1)%p.length];a+=q[0]*w[1]-w[0]*q[1]}return a/2}
function inTri(p,a,b,c){function s(p1,p2,p3){return(p1[0]-p3[0])*(p2[1]-p3[1])-(p2[0]-p3[0])*(p1[1]-p3[1])}
 var d1=s(p,a,b),d2=s(p,b,c),d3=s(p,c,a);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))}
function earClip(pts){var idx=[],i;for(i=0;i<pts.length;i++)idx.push(i);if(area2(pts)<0)idx.reverse();var tris=[],guard=0;
 while(idx.length>3&&guard++<2000){var found=false;
  for(i=0;i<idx.length;i++){var i0=idx[(i+idx.length-1)%idx.length],i1=idx[i],i2=idx[(i+1)%idx.length],A=pts[i0],B2=pts[i1],C2=pts[i2];
   if((B2[0]-A[0])*(C2[1]-A[1])-(B2[1]-A[1])*(C2[0]-A[0])<=1e-12)continue;
   var inside=false;for(var j=0;j<idx.length;j++){var k=idx[j];if(k===i0||k===i1||k===i2)continue;if(inTri(pts[k],A,B2,C2)){inside=true;break}}
   if(inside)continue;tris.push([i0,i1,i2]);idx.splice(i,1);found=true;break}
  if(!found)break}
 if(idx.length===3)tris.push([idx[0],idx[1],idx[2]]);return tris}
function prismGen(pts,map,mapN,w0,w1,n0,n1,col,smooth){capB();
 var n=pts.length,tris=earClip(pts),ccw=area2(pts)>0,i;
 tris.forEach(function(t){triN(map(pts[t[0]],w0),map(pts[t[1]],w0),map(pts[t[2]],w0),n0,n0,n0,col);triN(map(pts[t[0]],w1),map(pts[t[1]],w1),map(pts[t[2]],w1),n1,n1,n1,col)});
 var en=[];for(i=0;i<n;i++){var p=pts[i],q=pts[(i+1)%n],dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy)||1;en.push(ccw?[dy/l,-dx/l]:[-dy/l,dx/l])}
 var vn=[];for(i=0;i<n;i++){var e0=en[(i+n-1)%n],e1=en[i],d=e0[0]*e1[0]+e0[1]*e1[1];if(smooth&&d>0.8){var s=[e0[0]+e1[0],e0[1]+e1[1]],l2=Math.hypot(s[0],s[1])||1;vn.push([s[0]/l2,s[1]/l2])}else vn.push(null)}
 for(i=0;i<n;i++){var i2=(i+1)%n,A=map(pts[i],w0),B2=map(pts[i2],w0),C2=map(pts[i2],w1),D=map(pts[i],w1),NA=mapN(vn[i]||en[i]),NB=mapN(vn[i2]||en[i]);
  triN(A,B2,C2,NA,NB,NB,col);triN(A,C2,D,NA,NB,NA,col);
  edge(A,B2);edge(D,C2);if(!vn[i])edge(A,D)}
 capE();
}
function prismXY(pts,z0,z1,col,smooth){prismGen(pts,function(p,w){return[p[0],p[1],w]},function(v){return[v[0],v[1],0]},z0,z1,[0,0,-1],[0,0,1],col,smooth)}
function prismXZ(pts,y0,y1,col,smooth){prismGen(pts,function(p,w){return[p[0],w,p[1]]},function(v){return[v[0],0,v[1]]},y0,y1,[0,-1,0],[0,1,0],col,smooth)}
function ellipse(a,b,n,cx,cy){var p=[];for(var k=0;k<n;k++){var t=2*Math.PI*k/n;p.push([(cx||0)+a*Math.cos(t),(cy||0)+b*Math.sin(t)])}return p}
function circleXZ(cx,cz,r,n){var p=[];for(var k=0;k<n;k++){var t=2*Math.PI*k/n;p.push([cx+r*Math.cos(t),cz+r*Math.sin(t)])}return p}
/* muro con aperture: holes = {l,r,zb,top:[[a,z],...]} con il bordo alto come spezzata */
function rectHole(l,zb,r,zt){return{l:l,r:r,zb:zb,top:[[l,zt],[r,zt]]}}
function archHole(ac,rad,zb,zs,N){var t=[[ac-rad,zs]];for(var k=N-1;k>=1;k--){var th=Math.PI*k/N;t.push([ac+rad*Math.cos(th),zs+rad*Math.sin(th)])}t.push([ac+rad,zs]);return{l:ac-rad,r:ac+rad,zb:zb,top:t,arch:true}}
function wall(axis,a0,a1,t0,t1,z0,z1,holes,col){
 WALLS.push({axis:axis,a0:a0,a1:a1,t0:t0,t1:t1,z1:z1,holes:holes.map(function(h){var zt=1e9;h.top.forEach(function(p){zt=Math.min(zt,p[1])});return{l:h.l,r:h.r,zb:h.zb,zt:zt}})});
 var M=axis==="x"?function(a,t,z){return[a,t,z]}:function(a,t,z){return[t,a,z]};
 var Nt=axis==="x"?[0,1,0]:[1,0,0],Na=axis==="x"?[1,0,0]:[0,1,0];
 function topAt(h,a){var T=h.top;for(var i=0;i<T.length-1;i++){if(a>=T[i][0]-1e-9&&a<=T[i+1][0]+1e-9){var dx=T[i+1][0]-T[i][0];var f=dx>1e-12?(a-T[i][0])/dx:0;return T[i][1]+f*(T[i+1][1]-T[i][1])}}return T[T.length-1][1]}
 var xs=[a0,a1];holes.forEach(function(h){xs.push(h.l,h.r);h.top.forEach(function(p){xs.push(p[0])})});
 xs.sort(function(a,b){return a-b});var ux=[];xs.forEach(function(x){if(!ux.length||x-ux[ux.length-1]>1e-6)ux.push(x)});
 [t0,t1].forEach(function(t,side){var n=side?Nt:neg(Nt);
  for(var i=0;i<ux.length-1;i++){var xa=ux[i],xb=ux[i+1],h=null;holes.forEach(function(hh){if(hh.l<=xa+1e-9&&hh.r>=xb-1e-9)h=hh});
   if(!h)qn(M(xa,t,z0),M(xb,t,z0),M(xb,t,z1),M(xa,t,z1),n,col);
   else{if(h.zb>z0+1e-9)qn(M(xa,t,z0),M(xb,t,z0),M(xb,t,h.zb),M(xa,t,h.zb),n,col);
    var ta=topAt(h,xa),tb=topAt(h,xb);if(ta<z1-1e-9||tb<z1-1e-9)qn(M(xa,t,ta),M(xb,t,tb),M(xb,t,z1),M(xa,t,z1),n,col)}}
  edge(M(a0,t,z0),M(a1,t,z0));edge(M(a1,t,z0),M(a1,t,z1));edge(M(a1,t,z1),M(a0,t,z1));edge(M(a0,t,z1),M(a0,t,z0));
  holes.forEach(function(h){edge(M(h.l,t,h.zb),M(h.r,t,h.zb));edge(M(h.l,t,h.zb),M(h.l,t,topAt(h,h.l)));edge(M(h.r,t,h.zb),M(h.r,t,topAt(h,h.r)));
   for(var k=0;k<h.top.length-1;k++)edge(M(h.top[k][0],t,h.top[k][1]),M(h.top[k+1][0],t,h.top[k+1][1]))});
 });
 qn(M(a0,t0,z0),M(a0,t1,z0),M(a0,t1,z1),M(a0,t0,z1),neg(Na),col);qn(M(a1,t0,z0),M(a1,t1,z0),M(a1,t1,z1),M(a1,t0,z1),Na,col);
 qn(M(a0,t0,z1),M(a1,t0,z1),M(a1,t1,z1),M(a0,t1,z1),[0,0,1],col);qn(M(a0,t0,z0),M(a1,t0,z0),M(a1,t1,z0),M(a0,t1,z0),[0,0,-1],col);
 [[a0,z0],[a0,z1],[a1,z0],[a1,z1]].forEach(function(p){edge(M(p[0],t0,p[1]),M(p[0],t1,p[1]))});
 holes.forEach(function(h){
  qn(M(h.l,t0,h.zb),M(h.r,t0,h.zb),M(h.r,t1,h.zb),M(h.l,t1,h.zb),[0,0,1],col);
  var tl=topAt(h,h.l),tr=topAt(h,h.r);
  qn(M(h.l,t0,h.zb),M(h.l,t1,h.zb),M(h.l,t1,tl),M(h.l,t0,tl),Na,col);
  qn(M(h.r,t0,h.zb),M(h.r,t1,h.zb),M(h.r,t1,tr),M(h.r,t0,tr),neg(Na),col);
  for(var k=0;k<h.top.length-1;k++){var p=h.top[k],q=h.top[k+1],dx=q[0]-p[0],dz=q[1]-p[1],l=Math.hypot(dx,dz)||1,nx=dz/l,nz=-dx/l;
   var nn=[Na[0]*nx,Na[1]*nx,nz];qn(M(p[0],t0,p[1]),M(q[0],t0,q[1]),M(q[0],t1,q[1]),M(p[0],t1,p[1]),nn,col)}
  [[h.l,h.zb],[h.r,h.zb]].concat(h.arch?[]:[[h.l,tl],[h.r,tr]]).forEach(function(p){edge(M(p[0],t0,p[1]),M(p[0],t1,p[1]))});
 });
}

/* ---------------- l'appartamento ---------------- */
function B(x0,y0,z0,x1,y1,z1,k,noEdge){box(x0,y0,z0,x1,y1,z1,C[k],noEdge)}
function build(){
 var H=2.85;
 /* pavimenti e struttura */
 obsOn=false;B(0,0,-0.12,8.4,5.0,0,"cotto");B(0,0,0,2.5,5.0,0.34,"cotto");
 B(8.527,-0.6,-0.12,10.0,5.0,0.34,"cotto");B(10.127,-1.6,-0.12,14.6,2.6,0.34,"cotto");B(10.127,2.727,-0.12,12.9,5.0,0.34,"cotto");obsOn=true;
 wall("y",-0.127,5.127,-0.127,0,0,H,[],C.muro);
 wall("x",0,8.4,-0.127,0,0,H,[rectHole(4.6,0.12,6.0,2.42)],C.muro);
 wall("x",0,13.027,5.0,5.127,0,H,[rectHole(11.4,1.84,12.1,2.44)],C.muro);
 wall("y",-0.727,5.0,8.4,8.527,0,H,[archHole(2.6,0.6,0.34,2.05,16)],C.muro);
 wall("x",8.527,10.0,-0.727,-0.6,0,H,[rectHole(8.85,0.355,9.75,2.45)],C.muro);
 wall("y",-1.727,5.0,10.0,10.127,0,H,[rectHole(1.15,0.355,2.0,2.45),rectHole(3.2,0.355,3.95,2.45)],C.muro);
 wall("x",10.127,14.727,-1.727,-1.6,0,H,[rectHole(13.2,1.24,14.2,2.54)],C.muro);
 wall("y",-1.6,2.727,14.6,14.727,0,H,[],C.muro);
 wall("x",10.127,14.6,2.6,2.727,0,H,[],C.muro);
 wall("y",2.727,5.0,12.9,13.027,0,H,[],C.muro);
 B(10.127,2.595,0.34,14.6,2.6,H,"verde",true);
 obsOn=false;B(2.8,1.9,0,3.1,3.2,0.17,"trav");B(2.5,1.9,0,2.8,3.2,0.34,"trav");B(7.8,2.0,0,8.1,3.2,0.17,"trav");B(8.1,2.0,0,8.4,3.2,0.34,"trav");
 B(4.5,0,0,6.1,0.22,0.12,"trav");obsOn=true;
 B(2.5,0,0,2.75,1.9,1.26,"muro");B(2.5,3.2,0,2.75,5.0,1.26,"muro");
 B(2.2,0,1.26,2.85,1.95,1.30,"trav");B(2.45,3.2,1.26,2.85,4.6,1.30,"trav");B(2.75,0,1.22,2.80,1.9,1.26,"led",true);
 /* soffitti (nascosti nella vista dall'alto) */
 use("ceil",function(){
  B(0,0,H,8.4,5.0,2.97,"soff");B(8.527,-0.6,H,10.0,5.0,2.97,"soff");B(10.127,-1.6,H,14.6,2.6,2.97,"soff");B(10.127,2.727,H,12.9,5.0,2.97,"soff");
  B(2.5,0,2.55,2.9,5.0,H,"soff");
  /* lampadari appesi al soffitto */
  cyl(5.3,2.6,2.45,2.85,0.01,C.metNero,8);rbox(5.3,2.6,2.43,0.80,0.02,0.02,30,C.metNero);rbox(5.3,2.6,2.43,0.80,0.02,0.02,-30,C.metNero);
  [30,210,-30,150].forEach(function(t){var r=t*Math.PI/180;cyl(5.3+0.4*Math.cos(r),2.6+0.4*Math.sin(r),2.36,2.43,0.035,C.lamp,12)});
  [1.6,3.5].forEach(function(cy){B(1.295,cy-0.005,2.06,1.305,cy+0.005,H,"nero",true);cyl(1.30,cy,1.94,2.06,0.055,C.terrazzo,16);cyl(1.30,cy,1.86,1.94,0.04,C.lamp,12)});
  [[0,0,0],[0.17,0.08,0.05],[0.06,-0.16,0.08]].forEach(function(d){rbox(12.35+d[0],0.50+d[1],2.67+d[2],0.18,0.18,0.18-d[2],0,C.bianco)});
 });
 /* infissi */
 B(4.60,-0.09,0.12,4.67,-0.03,2.42,"legno");B(5.93,-0.09,0.12,6.00,-0.03,2.42,"legno");B(4.67,-0.09,2.35,5.93,-0.03,2.42,"legno");
 
 var i,x;
 
 B(13.20,-1.69,1.24,13.26,-1.63,2.54,"legno");B(14.14,-1.69,1.24,14.20,-1.63,2.54,"legno");B(13.26,-1.69,2.48,14.14,-1.63,2.54,"legno");
 B(13.26,-1.69,1.24,14.14,-1.63,1.30,"legno");B(13.67,-1.69,1.30,13.73,-1.63,2.48,"legno");
 B(11.40,5.03,1.84,11.45,5.09,2.44,"legno");B(12.05,5.03,1.84,12.10,5.09,2.44,"legno");B(11.45,5.03,2.39,12.05,5.09,2.44,"legno");B(11.45,5.03,1.84,12.05,5.09,1.89,"legno");
 B(8.87,-0.68,0.36,9.73,-0.64,2.43,"legno");B(9.60,-0.64,1.02,9.70,-0.62,1.05,"ottone",true);
 B(8.78,-0.60,0.34,8.85,-0.58,2.45,"legno");B(9.75,-0.60,0.34,9.82,-0.58,2.45,"legno");B(8.78,-0.60,2.45,9.82,-0.58,2.52,"legno");
 B(10.127,1.15,0.36,10.947,1.19,2.43,"legno");B(10.85,1.19,1.02,10.93,1.21,1.05,"ottone",true);
 B(9.98,1.08,0.34,10.0,1.15,2.45,"legno");B(9.98,2.0,0.34,10.0,2.07,2.45,"legno");B(9.98,1.08,2.45,10.0,2.07,2.52,"legno");
 B(10.127,3.91,0.36,10.847,3.95,2.43,"legno");B(10.75,3.89,1.02,10.83,3.91,1.05,"ottone",true);
 B(9.98,3.13,0.34,10.0,3.2,2.45,"legno");B(9.98,3.95,0.34,10.0,4.02,2.45,"legno");B(9.98,3.13,2.45,10.0,4.02,2.52,"legno");
 use("glass",function(){
  
  B(13.26,-1.665,1.30,13.67,-1.655,2.48,"vetro",true);B(13.73,-1.665,1.30,14.14,-1.655,2.48,"vetro",true);
  B(11.45,5.055,1.89,12.05,5.065,2.39,"vetroS",true);
  B(12.0,2.737,0.39,12.008,3.55,2.30,"vetro",true);B(12.008,3.542,0.39,12.89,3.55,2.30,"vetro",true);
  B(0.35,1.50,1.86,0.37,1.93,2.53,"vetro",true);
 });
 /* cucina */
 B(0,0,0.34,0.62,0.6,2.55,"noce");B(0,0.6,0.34,0.60,4.45,1.20,"noce");
 [[0.62,1.17],[1.19,1.74],[1.76,2.18],[2.80,3.35],[3.37,3.92],[3.94,4.43]].forEach(function(y){B(0.60,y[0],0.44,0.62,y[1],1.18,"ante")});
 B(0.60,2.22,0.50,0.62,2.78,1.10,"nero");B(0.62,2.27,1.03,0.64,2.73,1.05,"ottone",true);
 B(0,0.6,1.20,0.63,4.45,1.24,"marmo");B(0,0.6,1.24,0.012,4.45,1.84,"piastrK",true);
 B(0,0.6,1.84,0.35,1.95,2.55,"noce");B(0,3.05,1.84,0.35,4.45,2.55,"noce");
 [[0.62,1.06],[1.08,1.48],[3.07,3.52],[3.54,3.98],[4.00,4.43]].forEach(function(y){B(0.35,y[0],1.86,0.37,y[1],2.53,"ante")});
 B(0,2.05,1.84,0.52,2.95,2.08,"bianco");B(0.52,2.05,1.84,0.55,2.95,1.94,"noce");B(0,2.30,2.08,0.30,2.70,2.55,"bianco");
 B(0.08,2.20,1.24,0.56,2.80,1.25,"acciaio");[[0.20,2.35],[0.20,2.65],[0.44,2.35],[0.44,2.65]].forEach(function(p){cyl(p[0],p[1],1.25,1.27,0.045,C.nero,12)});
 B(0.10,1.25,1.24,0.50,1.70,1.245,"acciaio");cyl(0.07,1.475,1.245,1.50,0.015,C.acciaio,10);B(0.08,3.90,1.24,0.36,4.12,1.56,"bianco");
 [[0.45,"sgBlu"],[0.95,"sgBia"],[1.45,"sgGri"]].forEach(function(s){cyl(1.98,s[0],0.34,0.36,0.20,C.acciaio,20);cyl(1.98,s[0],0.36,0.98,0.03,C.acciaio,12);lathe([[0.98,0.10],[1.03,0.17],[1.06,0.19]],20,C[s[1]],1.98,s[0])});
 /* termosifoni a elementi */
 for(i=0;i<16;i++){var a=0.38+i*0.06;B(8.31,a-0.0225,0.12,8.39,a+0.0225,0.72,"rad",true)}
 for(i=0;i<15;i++){a=3.53+i*0.06;B(2.41,a-0.0225,0.40,2.49,a+0.0225,1.00,"rad",true)}
 for(i=0;i<16;i++){a=13.23+i*0.06;B(a-0.0225,-1.59,0.46,a+0.0225,-1.51,1.06,"rad",true)}
 /* soggiorno */
 B(2.75,0.15,0,3.55,1.90,0.38,"muro");B(2.75,0,0,3.55,0.15,0.62,"muro");B(2.75,0.15,0.38,3.50,1.90,0.50,"vellBlu");
 B(2.75,0.17,0.50,2.95,1.02,0.95,"vellBlu");B(2.75,1.04,0.50,2.95,1.88,0.95,"vellBlu");
 rbox(3.04,0.55,0.50,0.14,0.42,0.36,0,C.cusc);rbox(3.04,1.50,0.50,0.14,0.42,0.36,0,C.cusc);
 withXf(0,5.3,2.6,0,function(){prismXY(ellipse(0.85,0.5,40),0.735,0.765,C.bianco,true)});
 B(5.24,2.54,0.05,5.36,2.66,0.735,"bianco");rbox(5.3,2.6,0,1.10,0.08,0.05,28,C.bianco);rbox(5.3,2.6,0,1.10,0.08,0.05,-28,C.bianco);
 cyl(5.3,2.6,0.765,0.88,0.06,C.bianco,16);cyl(5.3,2.6,0.88,1.22,0.006,C.foglia,6);
 [[0.03,1.20],[0.07,1.17],[0.10,1.12],[-0.02,1.16],[0.05,1.08]].forEach(function(f){rbox(5.3+f[0],2.6,f[1],0.06,0.012,0.05,0,C.orchidea)});
 rbox(5.37,2.6,0.88,0.14,0.05,0.012,15,C.foglia);rbox(5.23,2.62,0.88,0.14,0.05,0.012,-20,C.foglia);
 var shell=[[-0.21,0.50],[0.21,0.50],[0.24,0.80]];[0.18,0.06,-0.06,-0.18].forEach(function(cx){for(var k=1;k<=8;k++){var th=Math.PI*k/8;shell.push([cx+0.06*Math.cos(th),0.80+0.075*Math.sin(th)])}});
 [[4.95,3.27,0],[5.65,3.27,0],[4.95,1.93,180],[5.65,1.93,180],[4.28,2.6,90],[6.32,2.6,-90]].forEach(function(s){withXf(s[2],s[0],s[1],0,function(){
  box(-0.23,-0.22,0.40,0.23,0.22,0.50,C.vellGri);prismXZ(shell,0.215,0.285,C.vellGri,true);
  [[-0.19,-0.18],[0.19,-0.18],[-0.19,0.18],[0.19,0.18]].forEach(function(l){box(l[0]-0.01,l[1]-0.01,0,l[0]+0.01,l[1]+0.01,0.40,C.metNero,true)})})});
 [[7.60,0.85,-135],[6.55,0.62,180]].forEach(function(s){withXf(s[2],s[0],s[1],0,function(){var p=C.pelle;
  box(-0.42,-0.40,0,0.42,0.45,0.25,p);box(-0.27,-0.45,0.25,0.27,0.30,0.45,p);box(-0.42,-0.40,0.25,-0.27,0.45,0.62,p);box(0.27,-0.40,0.25,0.42,0.45,0.62,p);
  box(-0.30,0.30,0.25,0.30,0.45,0.95,p);box(-0.25,0.28,0.95,0.25,0.46,1.08,p)})});
 [2.75,4.15,6.00,6.70,7.55].forEach(function(x){B(x,4.60,0,x+0.06,5.0,2.45,"muro")});
 B(2.75,4.60,2.45,7.61,5.0,2.51,"muro");B(2.81,4.60,0,4.15,5.0,0.55,"muro");B(2.81,4.60,1.35,4.15,5.0,1.39,"muro");B(2.81,4.60,1.90,4.15,5.0,1.94,"muro");
 B(3.38,4.66,0.55,3.58,4.82,0.62,"nero");B(2.98,4.70,0.62,3.98,4.76,1.22,"schermo");
 cyl(3.15,4.80,1.94,2.24,0.05,C.arancio,16);cyl(3.50,4.80,1.94,2.27,0.04,C.nero,12);
 B(4.21,4.62,0,6.00,5.0,2.45,"muro",true);B(6.76,4.62,0,7.55,5.0,2.45,"muro",true);
 var rh=2.45/4;
 for(var c=0;c<2;c++){var xa=4.21+c*0.895,xb=xa+0.895;for(var r=0;r<4;r++)B(xa+0.003,4.60,r*rh+0.003,xb-0.003,4.62,(r+1)*rh-0.003,(c+r)%2===0?"panNero":"panGri")}
 for(r=0;r<4;r++)B(6.763,4.60,r*rh+0.003,7.547,4.62,(r+1)*rh-0.003,r%2===0?"panGri":"panNero");
 [0,0.5,1.0,1.5,2.0].forEach(function(z){B(6.06,4.60,z,6.70,5.0,z+0.04,"muro")});
 [0.54,1.04,1.54].forEach(function(z){cyl(6.38,4.80,z,z+0.10,0.035,C.foglia,10)});
 [[3.40,"candR"],[3.52,"candG"],[3.64,"arancio"]].forEach(function(s){cyl(2.65,s[0],1.30,1.37,0.03,C[s[1]],12)});
 /* camera da letto */
 B(11.60,2.52,0.34,13.50,2.595,1.40,"rovere");B(11.68,0.56,0.44,13.42,2.52,0.66,"rovere");
 [[11.70,0.58],[13.30,0.58],[11.70,2.40],[13.30,2.40]].forEach(function(p){B(p[0],p[1],0.34,p[0]+0.10,p[1]+0.10,0.44,"rovere")});
 B(11.67,0.55,0.66,13.43,2.50,0.88,"lenz");B(11.63,0.51,0.48,13.47,0.55,0.88,"lenz");B(11.63,0.55,0.50,11.67,2.40,0.88,"lenz");B(13.43,0.55,0.50,13.47,2.40,0.88,"lenz");
 B(11.80,2.05,0.88,12.48,2.45,1.02,"lenz");B(12.62,2.05,0.88,13.30,2.45,1.02,"lenz");
 B(12.00,1.60,0.88,12.35,1.85,0.94,"asciug");B(12.80,1.00,0.88,13.15,1.25,0.95,"asciug");
 B(11.08,2.15,0.34,11.53,2.58,0.84,"rovere");B(13.57,2.15,0.34,14.02,2.58,0.84,"rovere");
 B(10.127,-0.60,0.34,10.577,0.40,1.14,"rovere");[[0.37,0.62],[0.63,0.88],[0.89,1.12]].forEach(function(z){B(10.577,-0.58,z[0],10.592,0.38,z[1],"rovAnte")});
 B(10.127,0.48,0.34,10.577,0.98,1.59,"rovere");for(i=0;i<5;i++){var z0=0.37+i*0.24;B(10.577,0.50,z0,10.592,0.96,z0+0.22,"rovAnte")}
 B(10.47,-1.60,0.34,10.98,-1.08,1.34,"nero");B(10.45,-1.60,0.34,10.47,-1.08,1.34,"acciaio");
 cyl(11.30,-1.20,0.34,0.37,0.18,C.nero,16);cyl(11.30,-1.20,0.37,1.25,0.015,C.nero,8);prismXZ(circleXZ(11.30,1.48,0.22,20),-1.24,-1.18,C.nero,true);
 B(10.65,-1.60,1.68,10.75,-1.50,1.78,"nero");B(10.40,-1.50,1.55,11.05,-1.46,1.95,"schermo");
 B(10.30,-1.60,1.30,11.10,-1.42,1.33,"verde");B(10.30,-1.60,2.05,11.10,-1.42,2.08,"verde");
 withXf(0,-0.07,0.05,0,function(){lathe([[0.34,0.13],[0.62,0.17]],20,C.vaso,14.28,-1.28);cyl(14.28,-1.28,0.62,0.63,0.16,C.nero,20);
  [[-0.12,0.10,0.95,30],[0.10,0.12,1.10,-40],[-0.05,-0.12,1.25,80],[0.14,-0.06,0.85,10],[-0.16,-0.02,1.05,120]].forEach(function(f){
   cyl(14.28+f[0]/2,-1.28+f[1]/2,0.63,f[2],0.006,C.foglia,6);rbox(14.28+f[0],-1.28+f[1],f[2],0.36,0.26,0.012,f[3],C.monstera)})});
 /* bagno */
 B(10.137,4.99,0.34,12.89,5.0,1.80,"piastrB",true);B(12.89,2.737,0.34,12.9,5.0,2.10,"piastrB",true);B(10.127,2.727,0.34,12.89,2.737,2.10,"piastrB",true);
 B(10.127,2.737,0.34,10.137,3.2,2.10,"piastrB",true);B(10.127,3.95,0.34,10.137,5.0,2.10,"piastrB",true);
 B(10.95,4.45,1.10,11.95,4.99,1.18,"pietra");lathe([[1.18,0.12],[1.24,0.19],[1.32,0.21]],24,C.ceram,11.45,4.72);
 cyl(11.45,4.93,1.18,1.42,0.012,C.nero,10);B(11.44,4.80,1.40,11.46,4.93,1.42,"nero",true);cyl(11.85,4.85,1.18,1.36,0.035,C.nero,12);cyl(11.10,4.88,1.18,1.30,0.03,C.oblo,12);
 prismXZ(circleXZ(11.45,1.98,0.345,32),4.975,4.99,C.nero,true);prismXZ(circleXZ(11.45,1.98,0.33,32),4.968,4.975,C.specchio,true);
 B(12.70,3.90,0.74,12.89,4.35,1.10,"ceram");withXf(0,12.45,4.125,0,function(){prismXY(ellipse(0.25,0.19,24),0.34,0.74,C.ceram,true);prismXY(ellipse(0.25,0.19,24),0.74,0.77,C.bianco,true)});
 B(12.0,2.737,0.34,12.89,3.55,0.39,"ceram");cyl(12.60,2.95,2.02,2.04,0.11,C.acciaio,20);B(12.59,2.737,2.04,12.61,2.95,2.06,"acciaio",true);
 B(10.137,4.39,0.34,10.737,4.99,1.19,"bianco");prismXZ(circleXZ(10.437,0.80,0.17,24),4.375,4.39,C.oblo,true);
 B(10.40,2.737,0.90,10.425,2.77,1.70,"rad");B(10.875,2.737,0.90,10.90,2.77,1.70,"rad");for(i=0;i<6;i++){z0=0.95+i*0.13;B(10.425,2.745,z0,10.875,2.765,z0+0.02,"rad",true)}
 /* esterno */
 
}
build();
return BUF;
}


const root = document.getElementById("spot");
const stage = root.querySelector(".sp-stage");
const canvas = stage.querySelector("canvas");
const RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches), TEST = /[?&]spottest/.test(location.search);

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
catch (e) { root.classList.add("sp-off"); throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 2400);
const HAZE = new THREE.Color("#e3ad96"), FOGN = 170, FOGF = 1100;
scene.fog = new THREE.Fog(HAZE, FOGN, FOGF);

/* ---------- materiali da cartone: tre toni di luce e contorno a inchiostro ---------- */
const GRAD = (() => { const d = new Uint8Array([104, 104, 104, 255, 182, 182, 182, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const toon = (o = {}) => new THREE.MeshToonMaterial(Object.assign({ gradientMap: GRAD }, o));
const pause = () => new Promise((r) => setTimeout(r, 0));
const INK = new THREE.Color("#2b221c");
function inkMat(w) {
  return new THREE.ShaderMaterial({
    uniforms: { uO: { value: w }, uC: { value: INK }, uF: { value: HAZE }, uN: { value: FOGN }, uX: { value: FOGF } },
    side: THREE.BackSide,
    vertexShader: `uniform float uO; varying float vD;
      void main(){ vec4 p = vec4(position + normal * uO, 1.0);
      #ifdef USE_INSTANCING
        p = instanceMatrix * p;
      #endif
        vec4 mv = modelViewMatrix * p; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uC, uF; uniform float uN, uX; varying float vD;
      void main(){ gl_FragColor = vec4(mix(uC, uF, smoothstep(uN, uX, vD)), 1.0);
      #include <colorspace_fragment>
      }`
  });
}
const INK1 = inkMat(0.011), INK2 = inkMat(0.022), INK3 = inkMat(0.06);
const lineMat = new THREE.LineBasicMaterial({ color: "#3b2f28", transparent: true, opacity: 0.5 });

/* ---------- utilità ---------- */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));
function merge(list) {
  const P = [], N = [];
  for (const [g0, m] of list) { const g = g0.index ? g0.toNonIndexed() : g0.clone(); if (m) g.applyMatrix4(m); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); }
  const cat = (a) => { let n = 0; a.forEach((x) => (n += x.length)); const o = new Float32Array(n); let k = 0; a.forEach((x) => { o.set(x, k); k += x.length; }); return o; };
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(cat(P), 3)); g.setAttribute("normal", new THREE.BufferAttribute(cat(N), 3));
  return g;
}
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
           L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- l'appartamento (stessa geometria del modello 3D, Z in alto → Y in alto) ---------- */
const APT = aptBuild();
function aptGeo(b) {
  const v = b.v, n = v.length / 10, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C3 = new Float32Array(n * 3), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const o = i * 10, k = i * 3, e = v[o + 9] > 0 ? 1.3 : 1;
    P[k] = v[o]; P[k + 1] = v[o + 2]; P[k + 2] = -v[o + 1];
    N[k] = v[o + 3]; N[k + 1] = v[o + 5]; N[k + 2] = -v[o + 4];
    c.setRGB(Math.min(1, v[o + 6] * e), Math.min(1, v[o + 7] * e), Math.min(1, v[o + 8] * e), THREE.SRGBColorSpace);
    C3[k] = c.r; C3[k + 1] = c.g; C3[k + 2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.BufferAttribute(N, 3)); g.setAttribute("color", new THREE.BufferAttribute(C3, 3));
  return g;
}
function aptLines(e) {
  const n = e.length / 3, P = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { P[i * 3] = e[i * 3]; P[i * 3 + 1] = e[i * 3 + 2]; P[i * 3 + 2] = -e[i * 3 + 1]; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); return g;
}
const house = new THREE.Group(); scene.add(house);
house.add(new THREE.Mesh(aptGeo(APT.main), toon({ vertexColors: true, side: THREE.DoubleSide })));
house.add(new THREE.LineSegments(aptLines(APT.main.e), lineMat));
house.add(new THREE.Mesh(aptGeo(APT.ceil), toon({ vertexColors: true, side: THREE.DoubleSide })));
house.add(new THREE.LineSegments(aptLines(APT.ceil.e), lineMat));
house.add(new THREE.Mesh(aptGeo(APT.glass), toon({ vertexColors: true, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false })));

const mStone = toon({ color: "#dcd1b9" }), mCotto = toon({ color: "#c98a63" }), mWallOld = toon({ color: "#b8a98d" });
const mWhite = toon({ color: "#f3efe6" }), mRoof = toon({ color: "#b8664b" }), mWood = toon({ color: "#5a3a28" });
function boxM(w, h, d, x, y, z, mat, edges = true, parent = scene) {
  const g = new THREE.BoxGeometry(w, h, d), m = new THREE.Mesh(g, mat); m.position.set(x, y, z); parent.add(m);
  if (edges) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(g), lineMat); l.position.copy(m.position); parent.add(l); }
  return m;
}
/* tetto: lastre sulle quattro parti della pianta, con un cornicione */
[[-0.127, -0.127, 8.527, 5.127], [8.4, -0.727, 10.127, 5.127], [10.0, -1.727, 14.727, 2.727], [10.0, 2.6, 13.027, 5.127]].forEach(([x0, y0, x1, y1]) => {
  boxM(x1 - x0 + 0.3, 0.2, y1 - y0 + 0.3, (x0 + x1) / 2, 3.05, -(y0 + y1) / 2, mWhite, true, house);
  boxM(x1 - x0 + 0.1, 0.14, y1 - y0 + 0.1, (x0 + x1) / 2, 3.22, -(y0 + y1) / 2, mRoof, true, house);
});
/* porta-finestra aperta: due ante che girano verso la terrazza */
const leaves = [];
[[4.67, 1], [5.93, -1]].forEach(([hx, s]) => {
  const hinge = new THREE.Group(); hinge.position.set(hx, 0.17, 0.0); house.add(hinge);
  const w = 0.6, fr = 0.055;
  const g = new THREE.Group(); hinge.add(g);
  boxM(fr, 2.18, 0.05, s * fr / 2, 1.09, 0, mWood, false, g); boxM(fr, 2.18, 0.05, s * (w - fr / 2), 1.09, 0, mWood, false, g);
  boxM(w, fr, 0.05, s * w / 2, fr / 2, 0, mWood, false, g); boxM(w, fr, 0.05, s * w / 2, 2.18 - fr / 2, 0, mWood, false, g);
  boxM(w, fr * 0.8, 0.05, s * w / 2, 0.75, 0, mWood, false, g);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * fr, 2.18 - 2 * fr), toon({ color: "#bcd8e6", transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  gl.position.set(s * w / 2, 1.09, 0); g.add(gl);
  hinge.userData.s = s; leaves.push(hinge);
});
/* targa "Pio XI" accanto alla porta-finestra */
(function plaque() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 192; const x = c.getContext("2d");
  const draw = () => { x.fillStyle = "#17464d"; x.fillRect(0, 0, 512, 192); x.strokeStyle = "#f0c178"; x.lineWidth = 10; x.strokeRect(12, 12, 488, 168);
    x.fillStyle = "#f0c178"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "600 112px 'Cormorant Garamond', Georgia, serif"; x.fillText("Pio XI", 256, 100); tex.needsUpdate = true; };
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.25), new THREE.MeshBasicMaterial({ map: tex }));
  m.position.set(7.3, 1.72, 0.135); house.add(m);
})();

/* persiane verdi aperte ai lati della porta-finestra */
(function shutters() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256; const x = c.getContext("2d");
  x.fillStyle = "#3e6b52"; x.fillRect(0, 0, 64, 256); x.fillStyle = "#2c4f3c"; for (let y = 6; y < 256; y += 9) x.fillRect(5, y, 54, 3);
  x.strokeStyle = "#2a4a39"; x.lineWidth = 6; x.strokeRect(3, 3, 58, 250); x.fillRect(3, 124, 58, 6);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = toon({ map: tex });
  [4.27, 6.33].forEach((cx) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.62, 2.3, 0.04), m); p.position.set(cx, 1.27, 0.15); house.add(p);
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(p.geometry), lineMat); l.position.copy(p.position); house.add(l); });
})();
await pause();
/* ---------- la terrazza con balaustra, vasi, lampione e margherite ---------- */
const terr = new THREE.Group(); scene.add(terr);
boxM(5.8, 0.18, 3.47, 5.8, -0.21, 1.865, mCotto, true, terr);
(function tiles() { const P = []; for (let x = 3.15; x < 8.7; x += 0.5) P.push(x, -0.115, 0.13, x, -0.115, 3.25); for (let z = 0.4; z < 3.3; z += 0.5) P.push(2.9, -0.115, z, 8.7, -0.115, z);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); terr.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: "#8d5638", transparent: true, opacity: 0.45 }))); })();
boxM(6.4, 2.6, 0.5, 5.8, -1.6, 3.85, mWallOld, true, terr);                 // muro di contenimento sul pendio
const RAIL = 0.92, PED = 1.16, PZ = 3.43;
function railRun(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = Math.atan2(x1 - x0, z1 - z0);
  const plinth = boxM(0.34, 0.16, len, cx, -0.04, cz, mStone, true, terr); plinth.rotation.y = ry; terr.children[terr.children.length - 1].rotation.y = ry;
  const rail = boxM(0.38, 0.14, len + 0.04, cx, RAIL - 0.07, cz, mStone, true, terr); rail.rotation.y = ry; terr.children[terr.children.length - 1].rotation.y = ry;
  const pts = []; const n = Math.floor(len / 0.22);
  for (let i = 1; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, z0 + (z1 - z0) * t]); }
  return pts;
}
const balPts = [].concat(railRun(3.09, PZ, 8.51, PZ), railRun(3.09, 0.3, 3.09, PZ), railRun(8.51, 0.3, 8.51, PZ));
const balG = new THREE.LatheGeometry([[0.068, 0], [0.074, 0.04], [0.05, 0.075], [0.06, 0.15], [0.088, 0.32], [0.082, 0.44], [0.05, 0.56], [0.044, 0.61], [0.064, 0.67], [0.058, 0.7], [0.072, 0.74]].map((p) => new THREE.Vector2(p[0], p[1])), 10);
const pillarX = [3.09, 4.3, 6.6, 8.51];
const bal = balPts.filter(([x, z]) => !(Math.abs(z - PZ) < 0.01 && pillarX.some((px) => Math.abs(px - x) < 0.3)) && !(z > PZ - 0.25 && (x < 3.3 || x > 8.3)) && !(z < 0.56 && (x < 3.3 || x > 8.3)));
const balI = new THREE.InstancedMesh(balG, mStone, bal.length), balO = new THREE.InstancedMesh(balG, INK1, bal.length);
bal.forEach(([x, z], i) => { const m = M4(x, 0.04, z); balI.setMatrixAt(i, m); balO.setMatrixAt(i, m); });
terr.add(balI, balO);
pillarX.forEach((x) => boxM(0.42, 1.12, 0.42, x, 0.44, PZ, mStone, true, terr));
[[3.09, 0.3], [8.51, 0.3]].forEach(([x, z]) => boxM(0.42, 1.12, 0.42, x, 0.44, z, mStone, true, terr));
boxM(0.52, 0.16, 0.5, 6.6, 1.08, PZ, mStone, true, terr);     // piedistallo vuoto: qui sta di solito la statua
/* vaso classico con gerani rossi sul pilastro di sinistra */
(function urn() {
  const g = new THREE.LatheGeometry([[0.001, 0], [0.11, 0], [0.12, 0.04], [0.07, 0.08], [0.062, 0.14], [0.13, 0.2], [0.22, 0.3], [0.25, 0.4], [0.24, 0.46], [0.275, 0.5], [0.275, 0.55], [0.001, 0.53]].map((p) => new THREE.Vector2(p[0], p[1])), 20);
  const m = new THREE.Mesh(g, mStone); m.position.set(4.3, 1.0, PZ); terr.add(m); const o = new THREE.Mesh(g, INK1); o.position.copy(m.position); terr.add(o);
  const leaf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), toon({ color: "#4f8a3a" }), 4), red = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), toon({ color: "#d9473e" }), 12);
  for (let i = 0; i < 4; i++) leaf.setMatrixAt(i, M4(4.3 + Math.cos(i * 1.6) * 0.12, 1.62, PZ + Math.sin(i * 1.6) * 0.12, 0, 0, 0, 0.17, 0.12, 0.17));
  for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 0.05 + (i % 3) * 0.06; red.setMatrixAt(i, M4(4.3 + Math.cos(a) * r, 1.7 + (i % 2) * 0.05, PZ + Math.sin(a) * r, 0, 0, 0, 0.05)); }
  terr.add(leaf, red);
})();
/* lampione con la lanterna accesa */
(function lamp() {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 2.3, 8), toon({ color: "#2c2a28" })); post.position.set(3.35, 1.03, 3.05); terr.add(post);
  const lan = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), new THREE.MeshBasicMaterial({ color: "#ffd889" })); lan.position.set(3.35, 2.32, 3.05); terr.add(lan);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 4), toon({ color: "#2c2a28" })); cap.rotation.y = Math.PI / 4; cap.position.set(3.35, 2.56, 3.05); terr.add(cap);
})();
/* fioriera con margherite gialle */
(function daisies() {
  boxM(1.0, 0.4, 0.6, 8.05, 0.08, 0.75, mCotto, true, terr);
  const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), toon({ color: "#4f7f37" }), 6);
  for (let i = 0; i < 6; i++) bush.setMatrixAt(i, M4(7.65 + i * 0.16, 0.42, 0.75 + (i % 2 ? 0.1 : -0.1), 0, 0, 0, 0.2, 0.17, 0.2)); terr.add(bush);
  const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), toon({ color: "#f3c63d" }), 22);
  for (let i = 0; i < 22; i++) fl.setMatrixAt(i, M4(7.6 + rnd() * 0.9, 0.5 + rnd() * 0.16, 0.5 + rnd() * 0.5, 0, 0, 0, 0.045, 0.02, 0.045)); terr.add(fl);
})();

/* ---------- la statua: pietra chiara con macchie di muschio, occhi da cartone ---------- */
const STONE = new THREE.Color("#e4dac6"), MOSS = new THREE.Color("#6d6b57");
function weather(g, amt = 0.85, sc = 8) {
  const p = g.attributes.position, c = new Float32Array(p.count * 3), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const f = vnoise(x * sc + 3.1, y * sc, z * sc) * 0.62 + vnoise(x * sc * 2.6, y * sc * 2.6 + 7, z * sc * 2.6) * 0.38;
    t.copy(STONE).lerp(MOSS, sm(0.5, 0.78, f) * amt * (0.55 + 0.45 * sm(1.6, 0.2, y)));
    c[i * 3] = t.r; c[i * 3 + 1] = t.g; c[i * 3 + 2] = t.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3)); return g;
}
const mStat = toon({ vertexColors: true });
function part(g, parent, ink = INK1, mat = mStat) { const m = new THREE.Mesh(g, mat); parent.add(m); if (ink) parent.add(new THREE.Mesh(g, ink)); return m; }
function makeStatue() {
  const S = {};
  S.root = new THREE.Group(); S.pitch = new THREE.Group(); S.pitch.position.y = 0.9; S.root.add(S.pitch);
  S.body = new THREE.Group(); S.body.position.y = -0.9; S.pitch.add(S.body);
  /* veste lunga con le pieghe */
  const robe = new THREE.LatheGeometry([[0.001, 0], [0.29, 0], [0.305, 0.05], [0.286, 0.2], [0.257, 0.45], [0.226, 0.72], [0.2, 0.93], [0.205, 1.05], [0.216, 1.15], [0.21, 1.24], [0.19, 1.31], [0.14, 1.37], [0.075, 1.41], [0.001, 1.43]].map((p) => new THREE.Vector2(p[0], p[1])), 44);
  robe.rotateY(Math.PI);
  const rp = robe.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    let x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i); const r = Math.hypot(x, z); if (r < 0.01) continue;
    const a = Math.atan2(z, x), fold = 0.016 * Math.sin(a * 9 + y * 2.4) * Math.max(0, 1 - y / 1.0) + 0.006 * Math.sin(a * 17 - y * 6) * Math.max(0, 1 - y / 0.6);
    const k = (r + fold) / r; x *= k; z *= k * 0.86; if (y > 1.04 && y < 1.33 && z > 0) z *= 1.1; rp.setXYZ(i, x, y, z);
  }
  robe.computeVertexNormals();
  const sash = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.17, 1.33, 0.02), V(-0.06, 1.2, 0.185), V(0.09, 1.04, 0.18), V(0.205, 0.93, 0.05)]), 16, 0.03, 8);
  const girdle = new THREE.TorusGeometry(0.205, 0.022, 8, 36).rotateX(Math.PI / 2).scale(1, 1, 0.88).translate(0, 0.95, 0);
  const neck = new THREE.CylinderGeometry(0.052, 0.064, 0.14, 14).translate(0, 1.46, 0);
  const bodyG = weather(merge([[robe], [sash], [girdle], [neck]]));
  part(bodyG, S.body);
  /* piedi che spuntano sotto l'orlo */
  const footG = weather(merge([[new THREE.SphereGeometry(1, 14, 10), M4(0, 0, 0, 0, 0, 0, 0.066, 0.042, 0.11)]]));
  S.footP = new THREE.Group(); S.footN = new THREE.Group(); S.body.add(S.footP, S.footN);
  part(footG, S.footP); part(footG, S.footN);
  /* testa con riccioli, chignon, occhi e palpebre */
  S.head = new THREE.Group(); S.head.position.y = 1.585; S.body.add(S.head);
  const hl = [[new THREE.SphereGeometry(0.152, 30, 22), M4(0, 0, 0, 0, 0, 0, 1, 1.06, 1)], [new THREE.SphereGeometry(1, 12, 10), M4(0, -0.016, 0.148, 0, 0, 0, 0.021, 0.03, 0.03)]];
  const ring = [[0.12, 12], [0.55, 11], [0.95, 8], [1.32, 4]];
  ring.forEach(([e, n], ri) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + ri * 0.4; if (Math.cos(a) > 0.3 && e < 0.9) continue;
    const r = 0.158, x = Math.sin(a) * Math.cos(e) * r, y = Math.sin(e) * r * 1.06 + 0.012, z = Math.cos(a) * Math.cos(e) * r; const s = 0.046 + (k % 3) * 0.004;
    hl.push([new THREE.SphereGeometry(1, 10, 8), M4(x, y, z, 0, 0, 0, s)]); } });
  for (let k = 0; k < 7; k++) { const a = -0.95 + k * 0.32; hl.push([new THREE.SphereGeometry(1, 10, 8), M4(Math.sin(a) * 0.15, 0.115 - Math.abs(a) * 0.03, Math.cos(a) * 0.118, 0, 0, 0, 0.04)]); }
  hl.push([new THREE.SphereGeometry(0.078, 14, 10), M4(0, 0.1, -0.135)]);
  hl.push([new THREE.CapsuleGeometry(0.034, 0.17, 4, 8), M4(0.128, -0.13, -0.035, 0, 0, 0.12)], [new THREE.CapsuleGeometry(0.034, 0.17, 4, 8), M4(-0.128, -0.13, -0.035, 0, 0, -0.12)]);
  part(weather(merge(hl), 0.7, 11), S.head);
  const white = toon({ color: "#fbf8f1" }), dark = new THREE.MeshBasicMaterial({ color: "#2a2420" });
  S.lids = []; S.pupils = [];
  [1, -1].forEach((s) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), white); eye.scale.set(0.036, 0.044, 0.022); eye.position.set(0.056 * s, 0.022, 0.13); S.head.add(eye);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.0185, 10, 8), dark); pu.position.set(0.054 * s, 0.014, 0.149); S.head.add(pu); S.pupils.push(pu);
    const lid = new THREE.Mesh(weather(new THREE.SphereGeometry(1, 14, 10), 0.5, 11), mStat); lid.scale.set(0.04, 0.048, 0.026); lid.position.set(0.056 * s, 0.022, 0.132); S.head.add(lid); S.lids.push(lid);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.04, 2, 6), dark); brow.rotation.z = Math.PI / 2 + 0.18 * s; brow.position.set(0.056 * s, 0.086, 0.14); S.head.add(brow);
  });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0068, 6, 14, Math.PI), dark); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.062, 0.142); S.head.add(mouth); S.mouth = mouth;
  /* braccia: spalla → gomito → mano; a sinistra (+X) il grappolo d'uva */
  const upper = weather(merge([[new THREE.CapsuleGeometry(0.047, 0.2, 4, 10), M4(0, -0.147, 0)], [new THREE.CylinderGeometry(0.082, 0.064, 0.15, 12), M4(0, -0.055, 0)]]));
  const fore = weather(merge([[new THREE.CapsuleGeometry(0.042, 0.18, 4, 10), M4(0, -0.132, 0)], [new THREE.SphereGeometry(1, 12, 10), M4(0, -0.272, 0.006, 0, 0, 0, 0.05, 0.058, 0.042)]]));
  [["P", 1], ["N", -1]].forEach(([k, s]) => {
    const sh = new THREE.Group(); sh.position.set(0.205 * s, 1.3, 0); S.body.add(sh); part(upper, sh);
    const el = new THREE.Group(); el.position.y = -0.27; sh.add(el); part(fore, el);
    S["arm" + k] = sh; S["elb" + k] = el;
  });
  const gr = [];
  [[0, 6, 0.052], [-0.042, 5, 0.042], [-0.08, 4, 0.03], [-0.114, 2, 0.015], [-0.14, 1, 0]].forEach(([y, n, r]) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; gr.push([new THREE.SphereGeometry(0.027, 9, 7), M4(Math.cos(a) * r, y, Math.sin(a) * r)]); } });
  gr.push([new THREE.SphereGeometry(1, 8, 6), M4(0.04, 0.035, 0, 0, 0, 0.5, 0.06, 0.012, 0.045)], [new THREE.SphereGeometry(1, 8, 6), M4(-0.04, 0.035, 0.01, 0, 0, -0.5, 0.06, 0.012, 0.045)]);
  const grapes = new THREE.Group(); grapes.position.set(0, -0.31, 0.05); S.elbP.add(grapes); part(weather(merge(gr), 0.9, 14), grapes);
  /* scintille del risveglio */
  S.sparks = [];
  const spM = new THREE.MeshBasicMaterial({ color: "#ffd56b" });
  for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), spM); const a = (i / 7) * Math.PI * 2; m.userData.a = a; m.visible = false; S.head.add(m); S.sparks.push(m); }
  return S;
}
await pause();
const ST = makeStatue(); scene.add(ST.root);
await pause();

/* ---------- il cratere: pendio boscoso sotto la terrazza, paese sul bordo, Monte Cavo, lago grande ---------- */
const WY = -38, LC = new THREE.Vector2(6, 230), LA = 300, LB = 196, TH0 = -Math.PI / 2;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const n2 = (x, z) => Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.05) * 2.2 + Math.sin(x * 0.13 - z * 0.11) * 0.9 + Math.cos(x * 0.31 + z * 0.23) * 0.35;
const RRN = (LC.y - 3.95) / LB;                                   // il bordo passa proprio sotto la balaustra
function rim(x, z) {
  const a = Math.atan2(z - LC.y, x - LC.x), d = wrap(a - TH0), near = Math.exp(-(d * d) / 0.12);
  let H = -0.35 + 46 * Math.pow(Math.min(1, Math.abs(d) / 2.6), 1.3);
  const dc = wrap(a - 0.85); H += 120 * Math.exp(-(dc * dc) / 0.05);   // Monte Cavo, oltre il lago
  return { a, d, near, rr: lerp(1.28, RRN, near), H };
}
const lakeR = (x, z) => Math.hypot((x - LC.x) / LA, (z - LC.y) / LB);
function natural(x, z) {
  const r = lakeR(x, z), R = rim(x, z), nz = n2(x, z) * (1 - R.near * 0.9);
  if (r < 1) return WY - 2 - 14 * (1 - r);
  if (r < R.rr) { const t = (r - 1) / (R.rr - 1); return WY + (R.H - WY) * Math.pow(t, 1.5) + nz * Math.sin(Math.PI * t) * 1.6; }
  return R.H - (r - R.rr) * 70 * (1 - R.near) + nz * 0.8;
}
function height(x, z) {
  const h = natural(x, z); if (z >= 3.95) return h;
  const dx = Math.max(-8 - x, 0, x - 21), dz = Math.max(-16 - z, 0), m = sm(0, 1, Math.hypot(dx, dz) / 14);
  return -0.35 + (h + 0.35) * m;
}
(function terrain() {
  const axis = (a, b, f0, f1, fs, cs) => { const o = []; let v = a; while (v < b) { o.push(v); v += v >= f0 && v < f1 ? fs : cs; } o.push(b); return o; };
  const XS = axis(-520, 560, -90, 100, 2.5, 9), ZS = axis(-180, 700, -30, 90, 1.6, 9), nx = XS.length, nz = ZS.length;
  const P = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), idx = [], c = new THREE.Color();
  const cWood = new THREE.Color("#3f6e3e"), cWood2 = new THREE.Color("#2e5432"), cField = new THREE.Color("#819f52"), cLawn = new THREE.Color("#8ab65c"), cSand = new THREE.Color("#c2a877"), cRock = new THREE.Color("#8e8670");
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = XS[i], z = ZS[j], y = height(x, z), k = (j * nx + i) * 3; P[k] = x; P[k + 1] = y; P[k + 2] = z;
    const r = lakeR(x, z), R = rim(x, z), nn = vnoise(x * 0.03, 0, z * 0.03);
    if (y < WY + 1.2) c.copy(cSand); else if (r < R.rr) c.copy(cWood).lerp(cWood2, nn); else c.copy(cField).lerp(cWood, sm(0.45, 0.8, nn) * 0.7);
    if (x > -40 && x < 54 && z < 4 && z > -40) c.lerp(cLawn, 0.55);
    if (y > 60) c.lerp(cWood2, 0.5); if (y > 95) c.lerp(cRock, sm(95, 120, y));
    col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, d = a + nx, e = d + 1; idx.push(a, d, b, b, d, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, toon({ vertexColors: true })));
})();
await pause();
/* alberi: tondi sui pendii, pini a ombrello e cipressi sul bordo */
(function trees() {
  const round = [], pines = [], cyp = [];
  for (let i = 0; i < 9000 && round.length < 760; i++) {
    const x = -470 + rnd() * 980, z = -60 + rnd() * 720, r = lakeR(x, z), R = rim(x, z);
    if (r < 1.015 || r > R.rr + 0.06) continue;
    if (Math.abs(x - 7) < 18 && z < 36) continue;                       // vista libera dalla terrazza al lago
    if (x > -16 && x < 30 && z < 9) continue;                            // l'appartamento
    const y = height(x, z); if (y < WY + 1.5) continue;
    if (r < R.rr) round.push([x, y, z]); else if (rnd() < 0.5) pines.push([x, y, z]); else cyp.push([x, y, z]);
  }
  [[-13, -6], [26, -4], [-16, 2.5], [29, 1.5], [-24, -14]].forEach(([x, z]) => pines.push([x, height(x, z), z]));
  const m1 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), toon({ color: "#ffffff" }), round.length), cc = new THREE.Color(), tones = ["#41733f", "#37633b", "#4d7c40", "#2f5835", "#5a8544"];
  round.forEach(([x, y, z], i) => { const s = (3 + rnd() * 3.2) * (0.55 + 0.45 * sm(20, 70, Math.hypot(x - 7, z - 4))); m1.setMatrixAt(i, M4(x, y + s * 0.75, z, 0, rnd() * 3, 0, s, s * (0.8 + rnd() * 0.35), s)); m1.setColorAt(i, cc.set(tones[i % tones.length])); });
  scene.add(m1);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.36, 1, 6), toon({ color: "#5b4433" }), pines.length);
  const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 8), toon({ color: "#3f6b3a" }), pines.length);
  pines.forEach(([x, y, z], i) => { const h = 8 + rnd() * 4; trunk.setMatrixAt(i, M4(x, y + h / 2, z, 0, 0, (rnd() - 0.5) * 0.2, 1, h, 1)); crown.setMatrixAt(i, M4(x, y + h + 0.7, z, 0, rnd() * 3, 0, 4.6 + rnd() * 1.4, 1.7, 4.6 + rnd() * 1.4)); });
  scene.add(trunk, crown);
  const cy = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 8), toon({ color: "#2c5030" }), cyp.length);
  cyp.forEach(([x, y, z], i) => { const h = 9 + rnd() * 5; cy.setMatrixAt(i, M4(x, y + h / 2 - 0.5, z, 0, 0, 0, 1.2, h, 1.2)); });
  scene.add(cy);
})();
await pause();
/* il paese sul bordo, il Palazzo Pontificio con le cupole della Specola, San Tommaso; Monte Cavo con le antenne */
const rimPos = (a, rOff = 0) => { const R = rim(LC.x + Math.cos(a) * LA * 1.3, LC.y + Math.sin(a) * LB * 1.3), rr = R.rr + rOff, x = LC.x + Math.cos(a) * LA * rr, z = LC.y + Math.sin(a) * LB * rr; return [x, height(x, z), z]; };
const PAL_A = TH0 - 0.3;
(function town() {
  const H = [];
  for (let i = 0; i < 6000 && H.length < 150; i++) {
    const a = TH0 + (rnd() - 0.5) * 1.5, [x, y, z] = rimPos(a, 0.012 + rnd() * 0.16);
    if (x > -14 && x < 27 && z > -22 && z < 8) continue;
    if (Math.abs(wrap(a - PAL_A)) < 0.07) continue;
    if (H.some((h) => Math.hypot(h[0] - x, h[2] - z) < 10)) continue;
    H.push([x, y, z, 6 + rnd() * 4, 6 + rnd() * 7, 6 + rnd() * 4, Math.atan2(LC.x - x, LC.y - z) + (rnd() - 0.5) * 0.4]);
  }
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), roof = new THREE.ConeGeometry(0.75, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0);
  const mb = new THREE.InstancedMesh(box, toon({ color: "#ffffff" }), H.length), mr = new THREE.InstancedMesh(roof, toon({ color: "#ffffff" }), H.length), c = new THREE.Color();
  const pal = ["#f2e6cd", "#ebd1a8", "#f3dcc4", "#e7c6a2", "#f6eedf", "#e0bb93", "#f0d4ba"], rp = ["#bb644b", "#ab5c45", "#c56f50", "#a15641"];
  H.forEach(([x, y, z, w, h, d, r], i) => { mb.setMatrixAt(i, M4(x, y - 1.5, z, 0, r, 0, w, h + 1.5, d)); mb.setColorAt(i, c.set(pal[i % pal.length])); mr.setMatrixAt(i, M4(x, y + h, z, 0, r, 0, w * 1.02, 2.4, d * 1.02)); mr.setColorAt(i, c.set(rp[i % rp.length])); });
  scene.add(mb, mr);
  const [px, py, pz] = rimPos(PAL_A, 0.05), P = new THREE.Group(); P.position.set(px, py, pz); P.rotation.y = Math.atan2(LC.x - px, LC.y - pz); scene.add(P);
  boxM(40, 19, 18, 0, 8, 0, toon({ color: "#eee2c8" }), true, P); boxM(41, 1.4, 19, 0, 18.2, 0, toon({ color: "#dbc9a8" }), true, P);
  const dome = (x, z, r, col, par, y = 18.9) => { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon({ color: col })); d.position.set(x, y, z); par.add(d); const o = new THREE.Mesh(d.geometry, INK3); o.position.copy(d.position); par.add(o); };
  dome(-11, 2, 3, "#f6f3ec", P); dome(12, -2, 2.5, "#f6f3ec", P);
  const ch = new THREE.Group(); ch.position.set(-31, -0.5, 8); P.add(ch);
  boxM(13, 13, 13, 0, 5.5, 0, toon({ color: "#ecdfc3" }), true, ch);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 4.5, 22), toon({ color: "#e5d6b8" })); drum.position.y = 14.2; ch.add(drum);
  const cup = new THREE.Mesh(new THREE.SphereGeometry(5.1, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon({ color: "#9ea7aa" })); cup.position.y = 16.4; ch.add(cup);
  const ln = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 3, 10), toon({ color: "#e5d6b8" })); ln.position.y = 22.6; ch.add(ln);
  [drum, cup, ln].forEach((m) => { const o = new THREE.Mesh(m.geometry, INK3); o.position.copy(m.position); ch.add(o); });
  let best = [0, -1e9, 0]; for (let a = 0.6; a < 1.1; a += 0.02) { const p = rimPos(a, 0.04); if (p[1] > best[1]) best = p; }
  const mA = toon({ color: "#ece7de" });
  for (let i = 0; i < 4; i++) { const h = 22 + i * 7, a = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, h, 6), mA); a.position.set(best[0] + i * 6 - 9, best[1] + h / 2 - 1, best[2] + (i % 2) * 5); scene.add(a); }
})();

await pause();
/* nuvole rosate */
(function clouds() {
  const m = toon({ color: "#ffe9de", emissive: "#d9a3a6", fog: false }), g = new THREE.SphereGeometry(1, 16, 10);
  [[-420, 260, 1100, 4], [180, 330, 1250, 5], [620, 280, 980, 3.6], [-120, 380, 1400, 6], [900, 360, 520, 4.2], [-900, 320, 600, 4.5], [380, 420, -700, 4.4]].forEach(([x, y, z, s]) => {
    const c = new THREE.Group(); c.position.set(x, y, z); scene.add(c);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(g, m); b.position.set((i - 2) * 9 * s, (i % 2) * 3 * s, (rnd() - 0.5) * 6); b.scale.set(9 * s * (1 - Math.abs(i - 2) * 0.18), 5 * s, 7 * s); c.add(b); }
  });
})();

/* ---------- acqua a bande da cartone, riflesso del sole e cerchi del tuffo ---------- */
const SUN = V(-0.42, 0.22, 1).normalize();
const wU = { uT: { value: 0 }, uDeep: { value: new THREE.Color("#1d5f72") }, uSky: { value: new THREE.Color("#d3a3a6") }, uGlint: { value: new THREE.Color("#fff1c9") }, uFoam: { value: new THREE.Color("#f6fbff") },
  uSun: { value: SUN }, uCam: { value: V(0, 0, 0) }, uSplash: { value: new THREE.Vector4(0, 0, 0, -1) }, uF: { value: HAZE }, uN: { value: FOGN }, uX: { value: FOGF } };
const water = new THREE.Mesh(new THREE.CircleGeometry(1, 120).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
  uniforms: wU,
  vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uT, uN, uX; uniform vec3 uDeep, uSky, uGlint, uFoam, uSun, uCam, uF; uniform vec4 uSplash; varying vec3 vP;
    void main(){
      vec2 p = vP.xz;
      vec3 n = normalize(vec3(cos(p.x*.09+uT*.9)*.05 + cos((p.x+p.y)*.31+uT*1.5)*.03, 1., cos(p.y*.12-uT*.8)*.05));
      vec3 v = normalize(uCam - vP);
      float fr = pow(1. - max(dot(n, v), 0.), 3.);
      vec3 c = mix(uDeep, uSky, smoothstep(.2, .95, fr) * .6 + .04);
      float bd = sin(p.x*.07 + sin(p.y*.045 + uT*.3)*3. + uT*.5) * sin(p.y*.05 + uT*.2);
      c = mix(c, uDeep * .8, step(.35, bd) * .3);
      vec3 h = normalize(uSun + v);
      float sp = pow(max(dot(n, h), 0.), 120.);
      c = mix(c, uGlint, step(.4, sp));
      float s = sin(p.x*.16 + sin(p.y*.06 + uT*.4)*2.6 + uT*.6) * sin(p.y*.11 - uT*.35);
      c = mix(c, uFoam, step(.94, s) * .4);
      if (uSplash.w >= 0.) {
        float d = distance(p, uSplash.xz), t = uSplash.w;
        for (int i = 0; i < 3; i++) { float r = (t - float(i)*.42) * 6.; if (r > 0.) { float a = 1. - smoothstep(.0, .55, abs(d - r)); c = mix(c, uFoam, a * clamp(1. - r/34., 0., 1.) * .9); } }
        c = mix(c, uFoam, (1. - smoothstep(1.5, 3.4, d)) * clamp(1.3 - t*.45, 0., 1.));
      }
      c = mix(c, uF, smoothstep(uN, uX, distance(uCam, vP)));
      gl_FragColor = vec4(c, 1.);
      #include <colorspace_fragment>
    }`
}));
water.scale.set(LA * 1.04, 1, LB * 1.04); water.position.set(LC.x, WY, LC.y); scene.add(water);

/* ---------- cielo al tramonto ---------- */
const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color("#303a6e") }, mid: { value: new THREE.Color("#c8789a") }, hor: { value: new THREE.Color("#f7b66e") }, sun: { value: SUN }, sc: { value: new THREE.Color("#fff0c4") } },
  side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `uniform vec3 top, mid, hor, sun, sc; varying vec3 vD;
    void main(){ vec3 d = normalize(vD); float h = d.y;
      vec3 c = h > .16 ? mix(mid, top, smoothstep(.16, .7, h)) : mix(hor, mid, smoothstep(-.05, .16, h));
      vec3 s2 = normalize(vec3(sun.x, .055, sun.z)); float s = max(dot(d, s2), 0.);
      c = mix(c, sc, step(.9993, s)); c += sc * pow(s, 18.) * .45;
      gl_FragColor = vec4(c, 1.);
      #include <colorspace_fragment>
    }`
}));
sky.frustumCulled = false; scene.add(sky);

/* ---------- luci ---------- */
const hemi = new THREE.HemisphereLight("#f6f2ea", "#6c6a80", 1.15); scene.add(hemi);
const sunL = new THREE.DirectionalLight("#ffd9ae", 1.9); sunL.position.copy(SUN).multiplyScalar(100); scene.add(sunL);
const fill = new THREE.DirectionalLight("#cdd8ff", 0.4); fill.position.set(30, 20, -60); scene.add(fill);

/* ---------- lo spruzzo: corona, colonna, gocce ---------- */
const SPL = V(8.0, WY, 46.0);
const crownG = new THREE.CylinderGeometry(1, 0.8, 1, 30, 3, true);
(function jag() { const p = crownG.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0.4) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, 0.5 + 0.38 * Math.max(0, Math.sin(a * 7)) + 0.12 * Math.sin(a * 13)); } } crownG.translate(0, 0.5, 0); crownG.computeVertexNormals(); })();
const mFoam = toon({ color: "#ffffff", emissive: "#7f9aa8", side: THREE.DoubleSide, transparent: true });
const crown = new THREE.Mesh(crownG, mFoam); crown.position.copy(SPL); crown.visible = false; scene.add(crown);
const jet = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 3, 6, 14), toon({ color: "#ffffff", emissive: "#7f9aa8" })); jet.visible = false; scene.add(jet);
const NDROP = 46, drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), toon({ color: "#ffffff", emissive: "#7f9aa8" }), NDROP); drops.visible = false; scene.add(drops);
const DV = []; for (let i = 0; i < NDROP; i++) { const a = rnd() * Math.PI * 2, sp = 3 + rnd() * 7; DV.push([Math.cos(a) * sp, 9 + rnd() * 9, Math.sin(a) * sp, 0.16 + rnd() * 0.3]); }

/* ---------- regia: percorso della statua e della camera ---------- */
const PATH = [[7.3, -2.2], [5.3, -0.75], [5.3, 0.35], [5.4, 1.4], [6.6, 3.05]];
const SEG = []; let PLEN = 0; for (let i = 0; i < PATH.length - 1; i++) { const l = Math.hypot(PATH[i + 1][0] - PATH[i][0], PATH[i + 1][1] - PATH[i][1]); SEG.push(l); PLEN += l; }
function along(d) { d = clamp(d, 0, PLEN); for (let i = 0; i < SEG.length; i++) { if (d <= SEG[i] || i === SEG.length - 1) { const t = SEG[i] ? d / SEG[i] : 0, a = PATH[i], b = PATH[i + 1]; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), Math.atan2(b[0] - a[0], b[1] - a[1])]; } d -= SEG[i]; } return [PATH[0][0], PATH[0][1], 0]; }
const T = { wake: 0.65, walk0: 1.2, walk1: 5.15, hop0: 5.2, hop1: 5.95, turn0: 6.0, wink: 6.45, arms: 6.6, back: 6.95, crouch: 7.1, launch: 7.42, impact: 9.82, pop: 10.75, end: 11.9, len: 12.9 };
const FLY = T.impact - T.launch, L0 = V(6.6, PED, PZ), VZ = (SPL.z - L0.z) / FLY, VX = (SPL.x - L0.x) / FLY, VY0 = 11, G = (2 * (VY0 * FLY + (L0.y - WY))) / (FLY * FLY);
const pose = { sq: 0, bob: 0, sway: 0, aPx: -0.15, aPz: 0.1, ePx: -1.45, aNx: 0.05, aNz: -0.1, eNx: -0.25, hx: 0, hy: 0, lidP: 1, lidN: 1, fz: 0, fl: 0, fphase: 0 };
const HEADW = V(), STW = V();
function statueAt(t) {
  const S = ST, P = Object.assign(pose, { sq: 0, bob: 0, sway: 0, aPx: -0.15, aPz: 0.1, ePx: -1.45, aNx: 0.05, aNz: -0.1, eNx: -0.25, hx: 0, hy: 0, lidP: 1, lidN: 1, fphase: 0, walk: 0 });
  let x = PATH[0][0], y = 0, z = PATH[0][1], yaw = Math.atan2(6.18 - 7.3, -1.12 + 2.2), pitch = 0, vis = true;
  /* risveglio: le palpebre si aprono, scintille, piccolo saltello */
  const open = sm(T.wake, T.wake + 0.22, t); P.lidP = P.lidN = 1 - open;
  if (t > T.wake + 0.1 && t < T.walk0) { const k = (t - T.wake - 0.1) / (T.walk0 - T.wake - 0.1); P.sq = Math.sin(k * Math.PI * 2) * 0.35 * (1 - k); y = Math.max(0, Math.sin(k * Math.PI)) * 0.08; P.hy = Math.sin(k * Math.PI) * 0.25; }
  S.sparks.forEach((m, i) => { const k = (t - T.wake + 0.05 - i * 0.03) / 0.7; m.visible = k > 0 && k < 1; if (m.visible) { const r = 0.2 + k * 0.16, a = m.userData.a + k * 1.5; m.position.set(Math.cos(a) * r, 0.1 + Math.sin(a) * r * 0.8, 0.08); m.scale.setScalar(Math.sin(k * Math.PI) * 1.3); m.rotation.set(k * 6, k * 4, 0); } });
  /* camminata fino alla balaustra */
  if (t >= T.walk0) {
    const k = clamp((t - T.walk0) / (T.walk1 - T.walk0)), A8 = 0.08, q = k < A8 ? k * k / (2 * A8 * (1 - A8)) : k > 1 - A8 ? 1 - (1 - k) * (1 - k) / (2 * A8 * (1 - A8)) : (k - A8 / 2) / (1 - A8), d = PLEN * q;
    const a = along(d); x = a[0]; z = a[1]; y = z > 0.13 ? -0.12 : 0;
    const ty = a[2]; yaw = t < T.walk0 + 0.25 ? lerp(yaw, ty, ease((t - T.walk0) / 0.25)) : ty;
    if (t < T.walk1) { const ph = d * 5.4; P.walk = 1; P.fphase = ph; P.bob = Math.abs(Math.sin(ph)) * 0.04; P.sway = Math.sin(ph) * 0.07; P.aNx = 0.05 + Math.sin(ph) * 0.5; P.aPx = -0.15 - Math.sin(ph) * 0.08; P.hy = Math.sin(ph * 0.5) * 0.06; }
    if (t > 1.8 && t < 2.6) P.hy += Math.sin((t - 1.8) / 0.8 * Math.PI) * -0.55;        // guarda la camera
    if (t > 3.9 && t < 4.9) P.hx = -Math.sin((t - 3.9) / 1 * Math.PI) * 0.25;            // guarda giù, verso il lago
  }
  /* salto sul piedistallo */
  if (t >= T.hop0) {
    const W = PATH[PATH.length - 1];
    if (t < T.hop0 + 0.2) { P.sq = sm(T.hop0, T.hop0 + 0.2, t) * 0.5; x = W[0]; z = W[1]; y = -0.12; yaw = 0; }
    else if (t < T.hop1 - 0.18) { const k = (t - T.hop0 - 0.2) / (T.hop1 - 0.18 - T.hop0 - 0.2); x = W[0]; z = lerp(W[1], PZ, k); y = lerp(-0.12, PED, k) + Math.sin(k * Math.PI) * 0.75; P.sq = -0.35 * Math.sin(k * Math.PI); yaw = 0; P.aPz = 0.1 + Math.sin(k * Math.PI) * 0.6; P.aNz = -0.1 - Math.sin(k * Math.PI) * 0.9; }
    else { const k = clamp((t - (T.hop1 - 0.18)) / 0.3); x = W[0]; z = PZ; y = PED; P.sq = Math.sin(k * Math.PI) * 0.45 * (1 - k * 0.5); yaw = 0; }
  }
  /* si gira verso la camera, occhiolino, braccia in alto, si rigira verso il lago */
  if (t >= T.turn0) {
    x = 6.6; z = PZ; y = PED;
    yaw = lerp(0, -1.0, ease(sm(T.turn0, T.turn0 + 0.3, t))) * (1 - ease(sm(T.back, T.back + 0.22, t))) + 0.035 * ease(sm(T.back, T.back + 0.22, t));
    const w = sm(T.wink, T.wink + 0.08, t) * (1 - sm(T.wink + 0.3, T.wink + 0.4, t)); P.lidN = w;
    const up = ease(sm(T.arms, T.arms + 0.35, t));
    P.aPz = lerp(0.1, 2.95, up); P.aNz = lerp(-0.1, -2.95, up); P.ePx = lerp(-1.45, -0.2, up); P.eNx = lerp(-0.25, 0, up); P.aPx = lerp(-0.15, 0, up);
    if (t > T.crouch && t < T.launch) P.sq = sm(T.crouch, T.launch - 0.05, t) * 0.55;
  }
  /* volo: parabola, capriola, entrata di testa */
  if (t >= T.launch && t < T.impact) {
    const f = t - T.launch, vy = VY0 - G * f;
    x = L0.x + VX * f; z = L0.z + VZ * f; y = L0.y + VY0 * f - 0.5 * G * f * f;
    const align = Math.atan2(VZ, vy), k = f / FLY;
    pitch = align * ease(clamp(f / 0.3)) + Math.PI * 2 * ease(clamp((k - 0.05) / 0.75));
    P.sq = f < 0.15 ? -0.4 * (f / 0.15) : -0.4 + 0.25 * k;
    P.aPz = 2.95; P.aNz = -2.95; P.ePx = -0.1; P.eNx = 0; P.aPx = 0;
    yaw = 0.035;
  }
  if (t >= T.impact) vis = false;
  /* riaffiora: testa fuori dall'acqua, saluta */
  if (t >= T.pop) {
    vis = true; const k = ease(sm(T.pop, T.pop + 0.35, t));
    x = SPL.x - 2.0; z = SPL.z - 2.5; y = WY - 1.26 - (1 - k) * 0.9 + Math.sin(t * 2.4) * 0.05; pitch = 0;
    yaw = Math.atan2(cam.position.x - x, cam.position.z - z);
    P.aNz = -2.2 + Math.sin(t * 10) * 0.35; P.eNx = -0.35; P.aPz = 0.35; P.lidP = P.lidN = 0; P.hx = -0.12; P.hy = Math.sin(t * 1.3) * 0.12;
  }
  /* applica */
  S.root.visible = vis; S.root.position.set(x, y, z); S.root.rotation.y = yaw; S.pitch.rotation.x = pitch;
  S.body.scale.set(1 + P.sq * 0.14, 1 - P.sq * 0.22, 1 + P.sq * 0.14); S.body.position.y = -0.9 + P.bob; S.body.rotation.z = P.sway;
  S.armP.rotation.set(P.aPx, 0, P.aPz); S.elbP.rotation.x = P.ePx; S.armN.rotation.set(P.aNx, 0, P.aNz); S.elbN.rotation.x = P.eNx;
  S.head.rotation.set(P.hx, P.hy, 0);
  S.lids.forEach((l, i) => { const c = i === 0 ? P.lidP : P.lidN; l.scale.set(0.04, 0.048 * (0.16 + 0.84 * c), 0.026); l.position.y = 0.022 + 0.036 * (1 - c); S.pupils[i].visible = c < 0.55; });
  const ph = P.fphase, fw = P.walk;
  S.footP.position.set(0.085, 0.035 + fw * Math.max(0, Math.cos(ph)) * 0.05, 0.13 + fw * Math.sin(ph) * 0.1);
  S.footN.position.set(-0.085, 0.035 + fw * Math.max(0, -Math.cos(ph)) * 0.05, 0.13 - fw * Math.sin(ph) * 0.1);
  S.root.updateMatrixWorld(true); S.head.getWorldPosition(HEADW); S.pitch.getWorldPosition(STW);
}
/* camera: inquadrature con stacchi; in ognuna punti chiave (tempo, posizione, punto guardato: "H" testa, "B" corpo) */
const SHOTS = [
  [0, [[0, [6.18, 1.62, -1.12], "H"], [1.2, [6.42, 1.67, -1.42], "H"]]],
  [1.2, [[1.2, [5.12, 1.5, -0.32], "H"], [2.2, [5.22, 1.52, 0.5], "H"], [3.05, [5.32, 1.58, 1.85], "H"]]],
  [3.05, [[3.05, [3.55, 1.65, 2.8], "H"], [4.1, [3.7, 2.25, 1.55], "H"], [4.6, [4.4, 2.8, 1.0], "H"], [5.15, [5.35, 3.3, 0.6], [7.2, -4, 18]]]],
  [5.15, [[5.15, [4.12, 2.05, 5.75], [6.5, 1.1, 3.2]], [6.3, [4.3, 2.15, 5.45], [6.55, 1.8, 3.4]]]],
  [6.3, [[6.3, [5.4, 2.86, 4.27], "H"], [6.95, [5.5, 2.87, 4.16], "H"]]],
  [6.95, [[6.95, [6.25, 3.0, 0.85], [6.9, 0.6, 12]], [7.5, [6.3, 3.05, 0.95], [6.9, 0.6, 12]], [7.95, { o: [-1.7, 2.3, -4.6] }, "B"], [9.0, { o: [-1.5, 2.4, -3.6] }, "B"], [9.5, { o: [-1.3, 2.9, -2.8] }, "B"]]],
  [9.5, [[9.5, [12.6, -35.4, 59.5], [8.2, -30.8, 46]], [10.7, [11.8, -35.6, 56.8], [8.1, -31.6, 46.1]]]],
  [10.7, [[10.7, [4.55, -36.95, 41.0], [7.0, -37.1, 46.5]], [11.6, [4.25, -36.75, 40.4], [7.8, -36.4, 49]], [12.9, [3.5, -36.35, 38.9], [9.2, -35.4, 54]]]]
].map(([t, K]) => ({ t, K: K.map(([kt, p, l]) => ({ t: kt, p: Array.isArray(p) ? V(...p) : null, o: Array.isArray(p) ? null : V(...p.o), l })) }));
const posOf = (k) => (k.o ? STW.clone().add(k.o) : k.p);
const LOOK = V();
function cr(p0, p1, p2, p3, u, o) { const u2 = u * u, u3 = u2 * u;
  return o.set(0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
    0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
    0.5 * (2 * p1.z + (-p0.z + p2.z) * u + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * u2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * u3)); }
const lookOf = (l) => (l === "H" ? HEADW.clone() : l === "B" ? STW.clone() : V(...l));
function camAt(t) {
  let s = 0; while (s < SHOTS.length - 1 && t >= SHOTS[s + 1].t) s++;
  const K = SHOTS[s].K; let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
  const u = clamp((t - K[i].t) / (K[i + 1].t - K[i].t)), a = Math.max(0, i - 1), d = Math.min(K.length - 1, i + 2);
  cr(posOf(K[a]), posOf(K[i]), posOf(K[i + 1]), posOf(K[d]), u, cam.position);
  cr(lookOf(K[a].l), lookOf(K[i].l), lookOf(K[i + 1].l), lookOf(K[d].l), u, LOOK);
  if (t > T.impact && t < T.impact + 0.45) { const k = (1 - (t - T.impact) / 0.45) * 0.3; cam.position.x += Math.sin(t * 61) * k; cam.position.y += Math.cos(t * 47) * k; }
  cam.lookAt(LOOK);
}
/* effetti dell'acqua */
const dm = new THREE.Matrix4();
function splashAt(t) {
  const f = t - T.impact;
  wU.uSplash.value.set(SPL.x, SPL.y, SPL.z, f >= 0 ? f : -1);
  crown.visible = f >= 0 && f < 0.88; if (crown.visible) { const k = f / 0.88; crown.scale.set(1.2 + k * 3.8, Math.sin(Math.min(1, k * 1.25) * Math.PI) * 4.2 + 0.01, 1.2 + k * 3.8); mFoam.opacity = 1 - sm(0.6, 1, k); }
  jet.visible = f > 0.1 && f < 0.85; if (jet.visible) { const k = (f - 0.1) / 0.75, h = Math.sin(k * Math.PI) * 7; jet.position.set(SPL.x, WY + h / 2 - 1.2, SPL.z); jet.scale.set(1 - k * 0.4, Math.max(0.05, h / 4.5), 1 - k * 0.4); }
  drops.visible = f >= 0 && f < 0.9;
  if (drops.visible) for (let i = 0; i < NDROP; i++) { const [vx, vy, vz, s] = DV[i], y = WY + vy * f - 9.8 * f * f, sc = y < WY ? 0.0001 : s * (1 - f / 2.2) * 2.2; dm.compose(V(SPL.x + vx * f, y, SPL.z + vz * f), new THREE.Quaternion(), V(sc, sc, sc)); drops.setMatrixAt(i, dm); }
  drops.instanceMatrix.needsUpdate = true;
}
function doorsAt() { leaves.forEach((h) => { h.rotation.y = h.userData.s * 1.7; }); }

/* ---------- inquadrature per telefono e computer ---------- */
let W = 0, H = 0;
function size() {
  W = stage.clientWidth; H = stage.clientHeight; if (!W || !H) return;
  renderer.setSize(W, H, false); cam.aspect = W / H;
  cam.fov = cam.aspect < 1 ? 66 : cam.aspect < 1.4 ? 58 : 50; cam.updateProjectionMatrix(); draw(time);
}

/* ---------- riproduzione ---------- */
let time = RM ? T.len : 0, playing = false, visible = false, raf = 0, last = 0, ready = false;
const bill = []; scene.traverse((o) => { if (o.userData && o.userData.bill) bill.push(o); });
function draw(t) {
  if (!W) return;
  doorsAt(); statueAt(t); camAt(t); splashAt(t);
  wU.uT.value = performance.now() / 1000; wU.uCam.value.copy(cam.position);
  bill.forEach((b) => b.quaternion.copy(cam.quaternion));
  renderer.render(scene, cam);
  root.classList.toggle("sp-k", t > 0.15 && t < 2.3 && playing);
  root.classList.toggle("sp-end", t >= T.end);
}
function frame(now) {
  raf = 0; const dt = Math.min(0.05, (now - last) / 1000); last = now;
  time += dt;
  if (playing && time >= T.len) { playing = false; root.classList.remove("sp-run"); }
  draw(time);
  if (visible && (playing || (!RM && time >= T.end))) raf = requestAnimationFrame(frame);
}
function kick() { if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
function play() { time = 0; playing = true; root.classList.add("sp-run"); root.classList.remove("sp-end", "sp-rm"); kick(); }
if (RM) root.classList.add("sp-rm");
root.querySelectorAll(".sp-re,.sp-play").forEach((b) => b.addEventListener("click", play));
let started = false;
new IntersectionObserver((es) => {
  const e = es[0]; visible = e.isIntersecting;
  if (visible && !started && e.intersectionRatio >= 0.5 && !RM && !TEST) { started = true; play(); }
  if (visible) kick();
}, { threshold: [0, 0.5] }).observe(stage);
new ResizeObserver(size).observe(stage);
document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
window.PXspot = { seek(t) { playing = false; time = t; draw(t); }, play };
size(); ready = true; root.classList.add("sp-on"); draw(time);
