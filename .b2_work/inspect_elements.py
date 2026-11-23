import fitz, json

doc = fitz.open("public/assets/aistudio/VIZRA_Blog_Batch_2Articles11-20_a81ccc98.pdf")

for pno in [3, 7, 10, 15, 22, 54, 60, 78, 129, 154, 160]:
    page = doc[pno-1]
    print(f"\n================ PAGE {pno} ================")
    # Check unique fill/stroke colors in drawings
    fills = set()
    rects = []
    for d in page.get_drawings():
        fc = d.get("fill")
        sc = d.get("color")
        r = d["rect"]
        fc_hex = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc)) if fc else None
        sc_hex = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in sc)) if sc else None
        if r.height > 3 and r.width > 50:
            rects.append((round(r.x0,1), round(r.y0,1), round(r.x1,1), round(r.y1,1), fc_hex, sc_hex))
    print(f"Large rects ({len(rects)}): {rects[:8]}")
    # Print distinct (font, round(size,1), flags, color) used on page
    styles = {}
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0: continue
        for ln in b["lines"]:
            for sp in ln["spans"]:
                key = (sp["font"], round(sp["size"],1), sp["flags"], f"#{sp['color']:06x}")
                if key not in styles:
                    styles[key] = sp["text"][:40]
    for k, sample in sorted(styles.items()):
        print(f"  {k}: {repr(sample)}")
