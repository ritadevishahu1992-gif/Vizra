import fitz, re

doc = fitz.open("public/assets/aistudio/VIZRA_Blog_Batch_2Articles11-20_a81ccc98.pdf")

# Parse ToUnicode for every Type3 font xref
cmaps = {}
for p in doc:
    for f in p.get_fonts(full=True):
        xref = f[0]
        if f[2] == "Type3" and xref not in cmaps:
            obj = doc.xref_object(xref)
            m = re.search(r"/ToUnicode\s+(\d+)\s+0\s+R", obj)
            cm = {}
            if m:
                txt = doc.xref_stream(int(m.group(1))).decode("latin1", errors="ignore")
                for k, v in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", txt):
                    try: cm[int(k,16)] = bytes.fromhex(v).decode("utf-16-be")
                    except: pass
            cmaps[xref] = cm

def decode_page_runs(pno):
    p = doc[pno-1]
    fname_to_xref = {f[4]: f[0] for f in p.get_fonts(full=True)}
    raw = p.read_contents().decode("latin1", errors="ignore")
    # Tokenize Tf and Tj/TJ
    cur_xref = None
    runs = []
    for m in re.finditer(r"/([A-Za-z0-9]+)\s+[0-9.]+\s+Tf|<([0-9A-Fa-f]+)>\s*Tj|\[([^\]]+)\]\s*TJ", raw):
        if m.group(1):
            cur_xref = fname_to_xref.get(m.group(1))
        elif m.group(2) and cur_xref in cmaps:
            hx = m.group(2)
            cm = cmaps[cur_xref]
            # 1-byte codes for Type3
            s = "".join(cm.get(int(hx[i:i+2],16), "") for i in range(0, len(hx), 2))
            if s: runs.append((cur_xref, s))
        elif m.group(3) and cur_xref in cmaps:
            cm = cmaps[cur_xref]
            s = ""
            for hx in re.findall(r"<([0-9A-Fa-f]+)>", m.group(3)):
                s += "".join(cm.get(int(hx[i:i+2],16), "") for i in range(0, len(hx), 2))
            if s: runs.append((cur_xref, s))
    return runs

for pno, targets in [(1, ["Nature", "Science", "Publication:", "Editorial Standard:"]), (234, ["International", "Monetary", "Hybrid", "Established", "Responsible"])]:
    runs = decode_page_runs(pno)
    # Build text + xref per char
    chars = [(x, c) for x, s in runs for c in s]
    full = "".join(c for _, c in chars)
    print(f"=== PAGE {pno} ===")
    for t in targets:
        idx = full.find(t)
        if idx != -1:
            xs = sorted(set(x for x, _ in chars[idx:idx+len(t)]))
            print(f"  {t!r:22s} -> xrefs={xs}")
