import fitz, re

PUA_MAP = str.maketrans({"\ue071":"0","\ue072":"1","\ue073":"2","\ue074":"3","\ue075":"4","\ue076":"5","\ue077":"6","\ue078":"7","\ue079":"8","\ue07a":"9","\ue093":",","\ue094":"."})
doc = fitz.open("public/assets/aistudio/VIZRA_Blog_Batch_2Articles11-20_a81ccc98.pdf")
RANGES = {11:(3,26),12:(27,49),13:(50,73),14:(74,96),15:(97,121),16:(122,147),17:(148,173),18:(174,194),19:(195,217),20:(218,240)}

# 1. Verify all 30 comparative tables
tot_tables = 0
for num, (sp, ep) in RANGES.items():
    headers = []
    for pno in range(sp, ep+1):
        page = doc[pno-1]
        hrects = []
        for d in page.get_drawings():
            fc = d.get("fill")
            if not fc: continue
            hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
            r = d["rect"]
            if hx == "#1c1f26" and r.height >= 14 and r.width >= 25:
                hrects.append(r)
        bands = []
        for r in sorted(hrects, key=lambda x: (round(x.y0,0), x.x0)):
            if bands and abs(bands[-1][0].y0 - r.y0) < 3:
                bands[-1].append(r)
            else:
                bands.append([r])
        for b in bands:
            if len(b) >= 2:
                cols = [page.get_text("text", clip=c).translate(PUA_MAP).strip().replace("\n", " ") for c in b]
                headers.append((pno, round(b[0].y0,1), cols))
    uniq = []
    for h in headers:
        if uniq and uniq[-1][2] == h[2] and h[0] <= uniq[-1][0] + 2:
            continue
        uniq.append(h)
    tot_tables += len(uniq)
    print(f"Art {num}: {len(uniq)} tables -> {[u[2][0][:22] for u in uniq]}")
print(f"TOTAL COMPARATIVE TABLES: {tot_tables}")

# 2. Check ALL 10 SEO tables (how many rows in each, and exact Slug & Internal Links & Image Filename)
print("\n=== SEO TABLE ROW CHECK ===")
for num, (sp, ep) in RANGES.items():
    # SEO table is on page sp and sp+1, left column x0=51..171 filled #f7f6f4
    rows = []
    for pno in (sp, sp+1):
        page = doc[pno-1]
        for d in page.get_drawings():
            fc = d.get("fill")
            if not fc: continue
            hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
            r = d["rect"]
            if hx == "#f7f6f4" and abs(r.x0 - 51.0) < 2 and 100 < r.width < 150 and r.height >= 14:
                k = page.get_text("text", clip=r).translate(PUA_MAP).strip().replace("\n", " ")
                vrect = fitz.Rect(r.x1, r.y0, 545.0, r.y1)
                v = page.get_text("text", clip=vrect).translate(PUA_MAP).strip().replace("\n", " ")
                rows.append((k, v))
    print(f"Art {num}: {len(rows)} SEO rows | keys={[r[0] for r in rows]}")
    for k, v in rows:
        if k in ("URL Slug", "Internal Links", "Suggested Internal Links", "Image Filename", "Featured Image Filename"):
            print(f"   {k}: {v}")
