import fitz, re

PUA_MAP = str.maketrans({"\ue071":"0","\ue072":"1","\ue073":"2","\ue074":"3","\ue075":"4","\ue076":"5","\ue077":"6","\ue078":"7","\ue079":"8","\ue07a":"9","\ue093":",","\ue094":"."})
doc = fitz.open("public/assets/aistudio/VIZRA_Blog_Batch_2Articles11-20_a81ccc98.pdf")

# Check page 234 bold runs ("International Monetary Fund" and "Hybrid reasoning")
p234 = doc[233]
print("=== PAGE 234 BOLD SPAN CHECK (get_text('rawdict') / 'dict') ===")
for b in p234.get_text("dict")["blocks"]:
    if b["type"] != 0: continue
    for ln in b["lines"]:
        ltxt = "".join(s["text"] for s in ln["spans"])
        if "International Monetary" in ltxt or "Hybrid reasoning" in ltxt or "Established trajectories" in ltxt:
            print("LINE:", ltxt)
            for s in ln["spans"]:
                print("  ", s["font"], round(s["size"],2), "flags=", s["flags"], f"#{s['color']:06x}", repr(s["text"]))

# Also check if PDF content stream distinguishes T3 font names (e.g. /F1 vs /F2) for bold/italic!
xref_fonts = p234.get_fonts(full=True)
print("\nPAGE 234 FONTS:", xref_fonts)

# Count ALL equation boxes (#f7f6f4 full-width boxes outside tables & visual briefs)
eq_boxes = []
for pno in range(3, 241):
    page = doc[pno-1]
    for d in page.get_drawings():
        fc = d.get("fill")
        if not fc: continue
        fc_hex = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
        r = d["rect"]
        # Full-width shaded box ~493pt wide, height 22..160pt
        if fc_hex == "#f7f6f4" and abs(r.x0 - 51.0) < 3 and r.width > 480 and 20 < r.height < 160:
            clip_txt = page.get_text("text", clip=r).translate(PUA_MAP).strip().replace("\n", " | ")
            if not clip_txt.startswith("Category:"):
                eq_boxes.append((pno, round(r.y0,1), round(r.height,1), clip_txt))

print(f"\n=== ALL FULL-WIDTH SHADED BOXES (EQUATIONS / CALLOUTS): {len(eq_boxes)} ===")
for pno, y0, h, t in eq_boxes:
    print(f"  p.{pno:3d} (y={y0:5.1f}, h={h:5.1f}): {t[:120]}")
