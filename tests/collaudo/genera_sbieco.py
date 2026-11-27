"""Foto SINTETICHE di documenti fotografati di sbieco (dati inventati), per provare la scansione «come le app scanner».
Crea in una cartella: NN.jpg (la foto), NN.rgba (pixel RGBA, per le prove in node) e angoli.json (angoli veri, w, h).
Uso: python3 tests/collaudo/genera_sbieco.py /tmp/sb  — poi: node tests/collaudo/sbieco.js /tmp/sb"""
import sys, os, json, random, importlib.util
from PIL import Image, ImageDraw, ImageFilter
spec = importlib.util.spec_from_file_location("gf", os.path.join(os.path.dirname(__file__), "genera_foto.py")); gf = importlib.util.module_from_spec(spec); spec.loader.exec_module(gf)
R = random.Random(11)

def coeff(dst, src):  # coefficienti PIL per Image.transform PERSPECTIVE (dalla foto alla carta)
    import numpy as np
    A = []; B = []
    for (x, y), (X, Y) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); B.append(X); A.append([0, 0, 0, x, y, 1, -Y * x, -Y * y]); B.append(Y)
    return list(np.linalg.solve(np.array(A, float), np.array(B, float)))

def sfondo(W, H):
    tipo = R.choice(["legno", "tavolo", "stoffa", "scuro", "chiaro"])
    col = {"legno": (150, 105, 65), "tavolo": (215, 215, 210), "stoffa": (70, 90, 140), "scuro": (40, 40, 45), "chiaro": (235, 232, 225)}[tipo]
    im = Image.new("RGB", (W, H), col); g = ImageDraw.Draw(im)
    for i in range(0, H, R.randint(9, 30)):
        d = R.randint(-25, 25); g.line([(0, i), (W, i + R.randint(-40, 40))], fill=tuple(max(0, min(255, c + d)) for c in col), width=R.randint(2, 8))
    return im.filter(ImageFilter.GaussianBlur(1.2)), tipo

def main(cart):
    os.makedirs(cart, exist_ok=True); veri = {}; dati = {}
    fn = [gf.cie] * 12 + [gf.patente] * 5 + [gf.passaporto] * 7
    for i, f in enumerate(fn, 1):
        s = R.choice("MF"); p = {"c": R.choice(gf.COG), "n": R.choice(gf.NOMI_M if s == "M" else gf.NOMI_F), "s": s, "d": gf.data(1950, 2005), "com": R.choice(gf.COMUNI), "ril": R.choice(gf.RIL), "num": gf.num_cie(), "citta": "LEEDS"}
        if f is gf.patente: p["num"] = R.choice(["RM", "VT"]) + "".join(str(R.randint(0, 9)) for _ in range(7)) + R.choice("ABCDEFG")
        if f is gf.passaporto: p["num"] = "".join(str(R.randint(0, 9)) for _ in range(9))
        card, extra = f(p); card = card.convert("RGB"); cw, ch = card.size
        tipo_ = "cie" if f is gf.cie else "patente" if f is gf.patente else "passaporto"
        vero = [p["c"], p["n"], None if extra.get("noSesso") else p["s"], gf.d(p["d"], "/"), extra["luogo"], None if extra.get("noCitt") else extra["citt"], p["num"], extra.get("ril")]
        if f is gf.patente: vero[7] = {"RM": "ROMA", "VT": "VITERBO", "LE": "LECCE", "CR": "CREMONA", "TP": "TRAPANI", "AT": "ASTI"}[p["com"][1]]
        W, H = 1500, 2000; bg, tipo = sfondo(W, H)
        # carta grande nella foto, di sbieco: ogni angolo spostato a caso
        lato = R.uniform(0.62, 0.9) * W; k = lato / cw; bw, bh = lato, ch * k
        cx, cy = W / 2 + R.uniform(-80, 80), H / 2 + R.uniform(-200, 200)
        base = [(cx - bw / 2, cy - bh / 2), (cx + bw / 2, cy - bh / 2), (cx + bw / 2, cy + bh / 2), (cx - bw / 2, cy + bh / 2)]
        j = R.uniform(0.04, 0.13) * bw
        Q = [(x + R.uniform(-j, j), y + R.uniform(-j, j)) for x, y in base]
        warped = card.transform((W, H), Image.PERSPECTIVE, coeff(Q, [(0, 0), (cw, 0), (cw, ch), (0, ch)]), Image.BICUBIC)
        mask = Image.new("L", (W, H), 0); ImageDraw.Draw(mask).polygon(Q, fill=255)
        bg.paste(warped, (0, 0), mask)
        # ombra della mano/telefono su una parte
        if R.random() < .5:
            om = Image.new("L", (W, H), 0); ImageDraw.Draw(om).ellipse([R.randint(-400, 600), R.randint(-300, 1200), R.randint(900, 1900), R.randint(1500, 2600)], fill=R.randint(50, 90))
            bg = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), bg, om.filter(ImageFilter.GaussianBlur(120)))
        if R.random() < .4: bg = bg.filter(ImageFilter.GaussianBlur(1.3))
        n = f"{i:02d}"; bg.save(os.path.join(cart, n + ".jpg"), quality=85)
        open(os.path.join(cart, n + ".rgba"), "wb").write(bg.convert("RGBA").tobytes())
        veri[n] = {"w": W, "h": H, "angoli": [[round(x), round(y)] for x, y in Q], "fondo": tipo}; dati[n + ".jpg"] = vero
    json.dump(veri, open(os.path.join(cart, "angoli.json"), "w"), indent=1); json.dump(dati, open(os.path.join(cart, "veri.json"), "w"), indent=1)  # veri.json: stesso formato di genera_foto.py, per voto.js
    print(len(fn), "foto di sbieco in", cart)

def due(cart):
    """--due: in ogni foto DUE documenti di due persone inventate (affiancati, uno sopra l'altro, storti). angoli.json ha «docs»: un quadrilatero per documento."""
    os.makedirs(cart, exist_ok=True); veri = {}
    for i in range(1, 17):
        W, H = 1500, 2000; bg, tipo = sfondo(W, H); docs = []; persone = []
        disp = ["sopra", "sopra", "fianco", "storti"][i % 4]
        for k in range(2):
            s = R.choice("MF"); p = {"c": R.choice(gf.COG), "n": R.choice(gf.NOMI_M if s == "M" else gf.NOMI_F), "s": s, "d": gf.data(1950, 2005), "com": R.choice(gf.COMUNI), "ril": R.choice(gf.RIL), "num": gf.num_cie(), "citta": "LEEDS"}
            card = gf.cie(p)[0].convert("RGB"); cw, ch = card.size; persone.append([p["c"], p["n"]])
            if disp == "fianco": bw = W * 0.46; cx = W * (0.26 if k == 0 else 0.75); cy = H / 2 + R.uniform(-100, 100)
            else: bw = W * R.uniform(0.6, 0.75); cx = W / 2 + R.uniform(-80, 80); cy = H * (0.3 if k == 0 else 0.72)
            bh = ch * bw / cw
            base = [(cx - bw / 2, cy - bh / 2), (cx + bw / 2, cy - bh / 2), (cx + bw / 2, cy + bh / 2), (cx - bw / 2, cy + bh / 2)]
            j = (0.1 if disp == "storti" else 0.04) * bw
            Q = [(x + R.uniform(-j, j), y + R.uniform(-j, j)) for x, y in base]
            warped = card.transform((W, H), Image.PERSPECTIVE, coeff(Q, [(0, 0), (cw, 0), (cw, ch), (0, ch)]), Image.BICUBIC)
            mask = Image.new("L", (W, H), 0); ImageDraw.Draw(mask).polygon(Q, fill=255); bg.paste(warped, (0, 0), mask)
            docs.append([[round(x), round(y)] for x, y in Q])
        n = f"d{i:02d}"; bg.save(os.path.join(cart, n + ".jpg"), quality=85); open(os.path.join(cart, n + ".rgba"), "wb").write(bg.convert("RGBA").tobytes())
        veri[n] = {"w": W, "h": H, "docs": docs, "persone": persone, "fondo": tipo, "disposizione": disp}
    json.dump(veri, open(os.path.join(cart, "angoli.json"), "w"), indent=1); print(16, "foto con due documenti in", cart)

if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    (due if "--due" in sys.argv else main)(a[0] if a else "/tmp/sbieco")
