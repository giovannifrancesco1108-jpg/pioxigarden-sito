#!/usr/bin/env python3
"""Foto SINTETICHE di documenti (dati inventati) per il collaudo della lettura foto, senza mai usare foto vere.
Carta d'identità elettronica italiana, patente, passaporto: impaginazione simile ai documenti veri, poi
le difficoltà delle foto vere: sfondo a trama, carta piccola dentro uno screenshot con barre e ora, rotazione
di 90°/270° o di pochi gradi, sfocatura, riflesso, colori dello sfondo azzurro/rosa.
Uso: python3 tests/collaudo/genera_foto.py /tmp/foto-sintetiche   (scrive le immagini e veri.json)"""
import json, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = random.Random(20261125)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONTB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONTM = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
def f(sz, b=False, m=False): return ImageFont.truetype(FONTM if m else FONTB if b else FONT, sz)

COG = ["ROSSINI", "DE LUCA", "D'AMATO", "FERRANTE", "LO PRESTI", "BIANCARDI", "MARCHETTI", "DI SALVO"]
NOMI_M = ["ALBERTO", "PIER LUIGI", "STEFANO", "GIANMARCO"]; NOMI_F = ["ELISA", "ANNA LISA", "CHIARA", "MARTINA"]
COMUNI = [("ALBANO LAZIALE", "RM"), ("VITERBO", "VT"), ("LECCE", "LE"), ("CREMONA", "CR"), ("TRAPANI", "TP"), ("ASTI", "AT")]
RIL = ["CIAMPINO", "MARINO", "VELLETRI", "FRASCATI"]
def data(a0, a1): return (R.randint(1, 28), R.randint(1, 12), R.randint(a0, a1))
def d(x, s="."): return f"{x[0]:02d}{s}{x[1]:02d}{s}{x[2]}"
def num_cie(): return "C" + R.choice("AB") + "".join(str(R.randint(0, 9)) for _ in range(5)) + "".join(R.choice("ABCDEFGHJKLMNPRSTUVZ") for _ in range(2))

def cie(p):
    W, H = 1700, 1080; im = Image.new("RGB", (W, H), (214, 232, 245)); g = ImageDraw.Draw(im)
    for y in range(0, H, 6): g.line([(0, y), (W, y + 30)], fill=(200, 222, 240), width=1)  # trama di sicurezza
    g.text((240, 60), "REPUBBLICA ITALIANA", font=f(64, True), fill=(30, 60, 150)); g.text((240, 130), "MINISTERO DELL'INTERNO", font=f(48, True), fill=(30, 60, 150))
    g.text((1250, 60), p["num"], font=f(50, m=True), fill=(40, 40, 40))
    g.text((240, 220), "CARTA DI IDENTITÀ / IDENTITY CARD", font=f(44, True), fill=(50, 50, 50))
    g.text((240, 270), "COMUNE DI / MUNICIPALITY", font=f(26), fill=(80, 80, 80)); g.text((240, 300), p["ril"], font=f(36, True), fill=(30, 30, 30))
    g.rectangle([60, 380, 470, 900], fill=(170, 170, 170))  # la foto
    x = 520; y = 370
    for et, val in [("COGNOME / SURNAME", p["c"]), ("NOME / NAME", p["n"]), ("LUOGO E DATA DI NASCITA / PLACE AND DATE OF BIRTH", f"{p['com'][0]} ({p['com'][1]}) {d(p['d'])}")]:
        g.text((x, y), et, font=f(26), fill=(90, 90, 90)); g.text((x, y + 30), val, font=f(40, True), fill=(20, 20, 20)); y += 90
    g.text((x, y), "SESSO / SEX", font=f(26), fill=(90, 90, 90)); g.text((x + 330, y), "STATURA / HEIGHT", font=f(26), fill=(90, 90, 90)); g.text((x + 700, y), "CITTADINANZA / NATIONALITY", font=f(26), fill=(90, 90, 90))
    g.text((x, y + 30), p["s"], font=f(40, True), fill=(20, 20, 20)); g.text((x + 330, y + 30), str(R.randint(150, 195)), font=f(40, True), fill=(20, 20, 20)); g.text((x + 700, y + 30), "ITA", font=f(40, True), fill=(20, 20, 20))
    y += 90; g.text((x, y), "EMISSIONE / ISSUING", font=f(26), fill=(90, 90, 90)); g.text((x + 700, y), "SCADENZA / EXPIRY", font=f(26), fill=(90, 90, 90))
    g.text((x, y + 30), d(data(2018, 2025)), font=f(40, True), fill=(20, 20, 20)); g.text((x + 700, y + 30), d(data(2028, 2035)), font=f(40, True), fill=(20, 20, 20))
    g.rectangle([0, H - 60, W, H - 40], fill=(60, 150, 80))
    return im, {"citt": "ITA", "ril": p["ril"], "luogo": p["com"][0]}

def patente(p):
    W, H = 1700, 1080; im = Image.new("RGB", (W, H), (245, 205, 220)); g = ImageDraw.Draw(im)
    for y in range(0, H, 9): g.text((900, y), "Patente di guida Driving Licence", font=f(18), fill=(235, 180, 200))
    g.text((420, 50), "PATENTE DI GUIDA     REPUBBLICA ITALIANA", font=f(52, True), fill=(30, 30, 60))
    g.rectangle([70, 300, 380, 700], fill=(160, 160, 160))
    righe = [("1.", p["c"]), ("2.", p["n"]), ("3.", f"{p['d'][0]:02d}/{p['d'][1]:02d}/{str(p['d'][2])[2:]}  {p['com'][0]} ({p['com'][1]})"), ("4a.", d(data(2018, 2024), "/") + "   4c. MC-" + p["com"][1]), ("4b.", d(data(2029, 2034), "/")), ("5.", p["num"])]
    y = 160
    for a, b in righe: g.text((420, y), a, font=f(42), fill=(40, 60, 160)); g.text((520, y), b, font=f(44), fill=(20, 20, 20)); y += 80
    return im, {"noSesso": True, "noCitt": True, "luogo": p["com"][0], "ril": None}

def passaporto(p):
    W, H = 1700, 1180; im = Image.new("RGB", (W, H), (236, 226, 240)); g = ImageDraw.Draw(im)
    g.text((60, 30), "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND", font=f(46, True), fill=(110, 40, 110))
    g.rectangle([60, 180, 470, 720], fill=(170, 170, 170))
    x, y = 520, 130
    g.text((x, y), "Type/Type     Code/Code      Passport No./Passeport No.", font=f(24), fill=(110, 40, 110)); g.text((x, y + 30), f"P          GBR          {p['num']}", font=f(38, m=True), fill=(30, 30, 30)); y += 85
    mm = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][p["d"][1] - 1]
    for et, val in [("Surname/Nom (1)", p["c"]), ("Given names/Prénoms (2)", p["n"]), ("Nationality/Nationalité (3)", "BRITISH CITIZEN"), ("Date of birth/Date de naissance (4)", f"{p['d'][0]:02d} {mm} /{mm} {str(p['d'][2])[2:]}"), ("Sex/Sexe (5)   Place of birth/Lieu de naissance (6)", f"{p['s']}        {p['citta']}")]:
        g.text((x, y), et, font=f(24), fill=(110, 40, 110)); g.text((x, y + 30), val, font=f(38, m=True), fill=(30, 30, 30)); y += 85
    return im, {"citt": "GBR", "ril": "GBR", "luogo": p["citta"]}

def foto(card, modo):
    """mette la carta in una foto «brutta»"""
    card = card.convert("RGB")
    if modo["riflesso"]:
        lay = Image.new("L", card.size, 0); ImageDraw.Draw(lay).ellipse([card.width * .5, -200, card.width * 1.2, card.height * .6], fill=90); card = Image.composite(Image.new("RGB", card.size, (255, 255, 255)), card, lay.filter(ImageFilter.GaussianBlur(60)))
    scala = modo["scala"]; card = card.resize((int(card.width * scala), int(card.height * scala)))
    if modo["storta"]: card = card.rotate(modo["storta"], expand=True, fillcolor=(0, 0, 0, 0))
    W, H = (1206, 2622) if modo["screenshot"] else (1932, 2576)
    sfondo = Image.new("RGB", (W, H), modo["fondo"]); g = ImageDraw.Draw(sfondo)
    for i in range(0, W + H, 22): g.line([(i, 0), (i - H, H)], fill=tuple(max(0, c - 25) for c in modo["fondo"]), width=6)  # trama del tavolo/tessuto
    cx, cy = (W - card.width) // 2, int(H * R.uniform(.25, .45))
    sfondo.paste(card, (max(0, cx), cy))
    if modo["screenshot"]:  # barre nere, ora, pulsanti
        g.rectangle([0, 0, W, 300], fill=(0, 0, 0)); g.rectangle([0, H - 330, W, H], fill=(0, 0, 0))
        g.text((80, 60), f"{R.randint(0, 23):02d}:{R.randint(0, 59):02d}", font=f(70, True), fill=(255, 255, 255)); g.text((W - 300, 2380), "Rispondi", font=f(50), fill=(255, 255, 255))
    img = sfondo.rotate(modo["giro"], expand=True) if modo["giro"] else sfondo
    if modo["sfoca"]: img = img.filter(ImageFilter.GaussianBlur(modo["sfoca"]))
    return img

def main(cartella):
    os.makedirs(cartella, exist_ok=True); veri = {}
    piano = [("cie", cie)] * 14 + [("patente", patente)] * 5 + [("passaporto", passaporto)] * 5
    for i, (tipo, fn) in enumerate(piano, 1):
        s = R.choice("MF"); p = {"c": R.choice(COG), "n": R.choice(NOMI_M if s == "M" else NOMI_F), "s": s, "d": data(1950, 2005), "com": R.choice(COMUNI), "ril": R.choice(RIL),
             "num": num_cie() if tipo == "cie" else (R.choice(["RM", "VT"]) + "".join(str(R.randint(0, 9)) for _ in range(7)) + R.choice("ABCDEFG")) if tipo == "patente" else "".join(str(R.randint(0, 9)) for _ in range(9)),
             "citta": R.choice(["LONDON", "EPPING", "LEEDS"])}
        card, extra = fn(p)
        modo = {"screenshot": R.random() < .6, "scala": R.uniform(.55, .7), "storta": R.choice([0, 0, 2, -3]), "giro": R.choice([0, 0, 0, 90, 270]), "sfoca": R.choice([0, 0, 1, 1.6]),
                "riflesso": R.random() < .3, "fondo": R.choice([(205, 190, 160), (230, 230, 225), (160, 120, 80), (240, 200, 210)])}
        img = foto(card, modo); nome = f"{i:02d}-{tipo}.jpg"; img.save(os.path.join(cartella, nome), quality=82)
        veri[nome] = [p["c"], p["n"], None if extra.get("noSesso") else p["s"], d(p["d"], "/"), extra["luogo"], None if extra.get("noCitt") else extra["citt"], p["num"], extra.get("ril") or ("ROMA" if False else None)]
        if tipo == "patente": veri[nome][7] = {"RM": "ROMA", "VT": "VITERBO", "LE": "LECCE", "CR": "CREMONA", "TP": "TRAPANI", "AT": "ASTI"}[p["com"][1]]
    json.dump(veri, open(os.path.join(cartella, "veri.json"), "w"), indent=1)
    print(len(piano), "foto sintetiche in", cartella)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/foto-sintetiche")
