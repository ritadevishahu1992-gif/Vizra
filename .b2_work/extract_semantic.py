import fitz, json, re, html
from collections import defaultdict

PDF_PATH = "public/assets/aistudio/VIZRA_Blog_Batch_2Articles11-20_a81ccc98.pdf"
doc = fitz.open(PDF_PATH)

PUA_MAP = str.maketrans({
    "\ue071": "0", "\ue072": "1", "\ue073": "2", "\ue074": "3", "\ue075": "4",
    "\ue076": "5", "\ue077": "6", "\ue078": "7", "\ue079": "8", "\ue07a": "9",
    "\ue093": ",", "\ue094": ".",
    "\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl", "\ufb03": "ffi", "\ufb04": "ffl",
})

def norm_text(s):
    return s.translate(PUA_MAP)

# Style xrefs verified from PDF content stream
BOLD_XREFS = {10, 11, 12, 13, 22, 23}
ITALIC_XREFS = {24, 25, 26, 56, 57, 77}

# Build ToUnicode CMaps for all Type3 fonts once
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
                    try:
                        cm[int(k, 16)] = bytes.fromhex(v).decode("utf-16-be")
                    except Exception:
                        pass
            cmaps[xref] = cm

def get_t3_char_styles(page):
    """Return list of (non_space_char, style_tag) in content stream order for Type3 text."""
    fname_to_xref = {f[4]: f[0] for f in page.get_fonts(full=True)}
    raw = page.read_contents().decode("latin1", errors="ignore")
    cur_xref = None
    out = []
    for m in re.finditer(r"/([A-Za-z0-9]+)\s+[0-9.]+\s+Tf|<([0-9A-Fa-f]+)>\s*Tj|\[([^\]]+)\]\s*TJ", raw):
        if m.group(1):
            cur_xref = fname_to_xref.get(m.group(1))
        elif cur_xref in cmaps:
            cm = cmaps[cur_xref]
            st = "b" if cur_xref in BOLD_XREFS else ("i" if cur_xref in ITALIC_XREFS else "")
            if m.group(2):
                hx = m.group(2)
                for i in range(0, len(hx), 2):
                    ch = norm_text(cm.get(int(hx[i:i+2], 16), ""))
                    for c in ch:
                        if not c.isspace():
                            out.append((c, st))
            elif m.group(3):
                for hx in re.findall(r"<([0-9A-Fa-f]+)>", m.group(3)):
                    for i in range(0, len(hx), 2):
                        ch = norm_text(cm.get(int(hx[i:i+2], 16), ""))
                        for c in ch:
                            if not c.isspace():
                                out.append((c, st))
    return out

def rect_overlap(r1, r2, pad=1.0):
    return not (r1[2] < r2[0]-pad or r1[0] > r2[2]+pad or r1[3] < r2[1]-pad or r1[1] > r2[3]+pad)

def point_in_rect(x, y, r, pad=1.5):
    return (r[0]-pad <= x <= r[2]+pad) and (r[1]-pad <= y <= r[3]+pad)

# Exact 35 Display Equation Boxes (page, approx_y0) verified earlier
EQ_PAGES_Y = {
    (10, 172), (10, 436), (11, 57), (12, 155), (12, 370),
    (34, 650), (37, 173),
    (54, 311), (54, 486), (55, 103), (55, 341), (55, 641),
    (56, 520), (57, 301), (57, 350), (59, 57), (60, 243),
    (77, 574), (77, 686), (78, 194), (78, 551), (78, 716),
    (128, 269), (129, 224), (129, 335), (130, 124), (131, 118),
    (152, 57), (153, 103), (154, 533), (158, 222), (160, 507),
    (200, 57), (201, 57), (201, 148),
}

def is_eq_box(pno, r):
    for ep, ey in EQ_PAGES_Y:
        if ep == pno and abs(r.y0 - ey) < 8 and abs(r.x0 - 51.0) < 4 and r.width > 470:
            return f"eq_p{ep}_{ey}"
    return None

def render_line_spans_html(ln, page_links, t3_stream, t3_pos_ref, base_size=11.0):
    """Convert one PyMuPDF line dict into clean HTML preserving bold, italic, code, sup, sub, links."""
    # Determine median baseline origin y of regular-sized spans in this line
    reg_ys = [sp["origin"][1] for sp in ln["spans"] if sp["size"] >= base_size - 1.2]
    base_y = sorted(reg_ys)[len(reg_ys)//2] if reg_ys else (ln["spans"][0]["origin"][1] if ln["spans"] else 0)
    
    parts = []
    for sp in ln["spans"]:
        txt = norm_text(sp["text"])
        if not txt:
            continue
        font = sp["font"]
        sz = sp["size"]
        flags = sp["flags"]
        color = f"#{sp['color']:06x}"
        oy = sp["origin"][1]
        bbox = sp["bbox"]
        
        # Check hyperlink overlap
        matched_uri = None
        for l in page_links:
            if l.get("uri") and rect_overlap(bbox, l["from"], pad=0.5):
                matched_uri = l["uri"]
                break
        
        # Citation link? e.g. [14] in crimson #9a1b2f
        stripped = txt.strip()
        if color == "#9a1b2f" and re.match(r"^\[\d+\](?:,\s*\[\d+\])*$", stripped):
            # Advance t3_stream past these non-space chars if Type3
            if font == "Unnamed-T3":
                t3_pos_ref[0] = advance_t3(t3_stream, t3_pos_ref[0], txt)
            lead_sp = " " if txt.startswith(" ") else ""
            trail_sp = " " if txt.endswith(" ") else ""
            if matched_uri:
                parts.append(f'{lead_sp}<a class="cite" href="{html.escape(matched_uri)}">{html.escape(stripped)}</a>{trail_sp}')
            else:
                parts.append(f'{lead_sp}<span class="cite">{html.escape(stripped)}</span>{trail_sp}')
            continue
        
        # Determine sup / sub
        is_sup = False
        is_sub = False
        if (flags & 1) or (sz <= base_size - 1.5 and oy < base_y - 1.8):
            is_sup = True
        elif sz <= base_size - 1.5 and oy > base_y + 1.4:
            is_sub = True
        
        # Monospace code
        if "Mono" in font:
            h = f"<code>{html.escape(txt)}</code>"
            if matched_uri:
                h = f'<a href="{html.escape(matched_uri)}">{h}</a>'
            parts.append(h)
            continue
        
        # Non-Type3 font (NotoSerif, NotoSansMath, DejaVuSans)
        if font != "Unnamed-T3":
            h = html.escape(txt)
            if "Bold" in font:
                h = f"<strong>{h}</strong>"
            elif "Italic" in font:
                h = f"<em>{h}</em>"
            if is_sup:
                h = f"<sup>{h}</sup>"
            elif is_sub:
                h = f"<sub>{h}</sub>"
            if matched_uri:
                h = f'<a href="{html.escape(matched_uri)}">{h}</a>'
            parts.append(h)
            continue
        
        # Unnamed-T3: align per-char style from t3_stream
        styled_runs = align_t3_text(t3_stream, t3_pos_ref, txt)
        span_html = ""
        for run_txt, st in styled_runs:
            rh = html.escape(run_txt)
            if st == "b":
                rh = f"<strong>{rh}</strong>"
            elif st == "i":
                rh = f"<em>{rh}</em>"
            span_html += rh
        if is_sup:
            span_html = f"<sup>{span_html}</sup>"
        elif is_sub:
            span_html = f"<sub>{span_html}</sub>"
        if matched_uri:
            span_html = f'<a href="{html.escape(matched_uri)}">{span_html}</a>'
        parts.append(span_html)
    
    res = "".join(parts)
    # Merge adjacent identical tags </strong><strong>, </em><em>
    res = re.sub(r"</strong>(\s*)<strong>", r"\1", res)
    res = re.sub(r"</em>(\s*)<em>", r"\1", res)
    return res

def advance_t3(stream, pos, txt):
    n = len(stream)
    for c in txt:
        if c.isspace():
            continue
        # look ahead up to 12 chars
        for k in range(pos, min(n, pos + 12)):
            if stream[k][0] == c:
                pos = k + 1
                break
    return pos

def align_t3_text(stream, pos_ref, txt):
    pos = pos_ref[0]
    n = len(stream)
    runs = []
    cur_st = None
    buf = []
    for c in txt:
        if c.isspace():
            buf.append(c)
            continue
        found_st = cur_st if cur_st is not None else ""
        for k in range(pos, min(n, pos + 15)):
            if stream[k][0] == c:
                found_st = stream[k][1]
                pos = k + 1
                break
        if found_st != cur_st:
            if buf:
                runs.append(("".join(buf), cur_st or ""))
                buf = []
            cur_st = found_st
        buf.append(c)
    if buf:
        runs.append(("".join(buf), cur_st or ""))
    pos_ref[0] = pos
    return runs

# Helper to extract a structured region (like a table cell) cleanly
def extract_rect_html(page, rect, page_links, t3_stream_full, base_size=10.0):
    """Extract lines strictly inside rect as clean HTML, using a fresh cursor scan on page."""
    # Get dict clipped to rect
    d = page.get_text("dict", clip=rect)
    lines = []
    for b in d["blocks"]:
        if b["type"] != 0: continue
        for ln in b["lines"]:
            # Only lines whose vertical center is inside rect
            yc = (ln["bbox"][1] + ln["bbox"][3]) / 2
            xc = (ln["bbox"][0] + ln["bbox"][2]) / 2
            if rect.y0 - 2 <= yc <= rect.y1 + 2 and rect.x0 - 2 <= xc <= rect.x1 + 2:
                lines.append(ln)
    lines.sort(key=lambda l: (round(l["bbox"][1], 1), l["bbox"][0]))
    # Build text from spans without consuming main cursor (use lightweight inline bold detection for cell)
    out_lines = []
    for ln in lines:
        reg_ys = [sp["origin"][1] for sp in ln["spans"] if sp["size"] >= base_size - 1.2]
        base_y = sorted(reg_ys)[len(reg_ys)//2] if reg_ys else ln["spans"][0]["origin"][1]
        parts = []
        for sp in ln["spans"]:
            txt = norm_text(sp["text"])
            if not txt: continue
            font = sp["font"]; sz = sp["size"]; flags = sp["flags"]; color = f"#{sp['color']:06x}"
            oy = sp["origin"][1]; bbox = sp["bbox"]
            matched_uri = None
            for l in page_links:
                if l.get("uri") and rect_overlap(bbox, l["from"], pad=0.5):
                    matched_uri = l["uri"]; break
            stripped = txt.strip()
            if color == "#9a1b2f" and re.match(r"^\[\d+\]$", stripped):
                lead = " " if txt.startswith(" ") else ""
                trail = " " if txt.endswith(" ") else ""
                if matched_uri:
                    parts.append(f'{lead}<a class="cite" href="{html.escape(matched_uri)}">{html.escape(stripped)}</a>{trail}')
                else:
                    parts.append(f'{lead}<span class="cite">{html.escape(stripped)}</span>{trail}')
                continue
            is_sup = (flags & 1) or (sz <= base_size - 1.2 and oy < base_y - 1.5)
            is_sub = (sz <= base_size - 1.2 and oy > base_y + 1.2)
            h = html.escape(txt)
            if "Mono" in font: h = f"<code>{h}</code>"
            elif "Bold" in font: h = f"<strong>{h}</strong>"
            elif "Italic" in font: h = f"<em>{h}</em>"
            if is_sup: h = f"<sup>{h}</sup>"
            elif is_sub: h = f"<sub>{h}</sub>"
            if matched_uri: h = f'<a href="{html.escape(matched_uri)}">{h}</a>'
            parts.append(h)
        s = "".join(parts).strip()
        if s:
            out_lines.append(s)
    # Join wrapped lines inside cell cleanly
    joined = ""
    for l in out_lines:
        if not joined:
            joined = l
        elif joined.endswith("-") and not joined.endswith("—") and not joined.endswith("–"):
            # Keep hyphen only if it's a compound word, remove if hyphenated wrap? Actually preserve hyphen unless mid-URL
            if "http" in joined[-30:] or "/blog/" in joined[-30:] or joined.endswith("- "):
                joined = joined + l
            else:
                # Most PDF lines in Skia don't insert soft hyphens unless real hyphen! So join directly without space!
                joined = joined + l
        else:
            joined = joined + " " + l
    return joined

def detect_tables_on_page(page):
    """Detect all comparative tables (dark #1c1f26 header + body rows) and SEO tables on a page."""
    drawings = page.get_drawings()
    # 1. Detect dark header bands (#1c1f26)
    hrects = []
    for d in drawings:
        fc = d.get("fill")
        if not fc: continue
        hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
        r = d["rect"]
        if hx == "#1c1f26" and r.height >= 14 and r.width >= 20 and 45 < r.y0 < 785:
            hrects.append(r)
    # Deduplicate overlapping rects
    uniq_h = []
    for r in sorted(hrects, key=lambda x: (round(x.y0,1), round(x.x0,1))):
        if uniq_h and abs(uniq_h[-1].x0 - r.x0) < 2 and abs(uniq_h[-1].y0 - r.y0) < 2:
            continue
        uniq_h.append(r)
    bands = []
    for r in uniq_h:
        if bands and abs(bands[-1][0].y0 - r.y0) < 3:
            bands[-1].append(r)
        else:
            bands.append([r])
    
    # Collect all horizontal rules (thin rects or stroke lines spanning ~490pt width) for row boundaries!
    hlines = []
    for d in drawings:
        r = d["rect"]
        if r.width > 400 and r.height <= 2.5 and 48 < r.y0 < 790:
            hlines.append(round((r.y0 + r.y1)/2, 1))
        for item in d.get("items", []):
            if item[0] == "l":
                p1, p2 = item[1], item[2]
                if abs(p1.y - p2.y) < 1.5 and abs(p2.x - p1.x) > 350 and 48 < p1.y < 790:
                    hlines.append(round(p1.y, 1))
    # Also collect filled alternating row rects (#f7f6f4) spanning partial col widths
    row_y_edges = set(hlines)
    for d in drawings:
        fc = d.get("fill")
        if not fc: continue
        hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
        r = d["rect"]
        if hx == "#f7f6f4" and 48 < r.y0 < 790 and r.height >= 14 and r.width < 470:
            row_y_edges.add(round(r.y0, 1))
            row_y_edges.add(round(r.y1, 1))
    
    # Deduplicate y_edges within 2pt
    sorted_ys = []
    for y in sorted(row_y_edges):
        if not sorted_ys or y - sorted_ys[-1] > 2.5:
            sorted_ys.append(y)
    
    tables = []
    for b in bands:
        if len(b) < 2: continue
        b.sort(key=lambda r: r.x0)
        col_xs = [(r.x0, r.x1) for r in b]
        hy0 = min(r.y0 for r in b)
        hy1 = max(r.y1 for r in b)
        # Find row y-boundaries below hy1 belonging to this table!
        # A table row continues while there is a horizontal rule / shaded cell at exact col_xs without a big gap
        # Actually, let's check horizontal strokes that span [col_xs[0][0], col_xs[-1][1]]!
        # In Skia PDF, every table row has a bottom border line spanning the full table width (~493.5pt)!
        tbl_x0 = col_xs[0][0]
        tbl_x1 = col_xs[-1][1]
        # Collect ALL horizontal border y's matching table width (or cell width starting at tbl_x0)
        row_ys = [round(hy1, 1)]
        # Also get non-table text blocks below hy1 to stop if normal prose starts
        # Check strokes/rects starting at tbl_x0
        cand_ys = set()
        for d in drawings:
            r = d["rect"]
            fc = d.get("fill")
            hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc)) if fc else None
            # Row bottom hairline border (width > 480, height <= 2)
            if r.width > 480 and r.height <= 2.0 and r.y0 > hy1 + 5 and r.y0 < 790:
                # Ignore crimson section-header underline (#9a1b2f)
                if hx != "#9a1b2f":
                    cand_ys.add(round(r.y0, 1))
            if hx == "#f7f6f4" and abs(r.x0 - tbl_x0) < 2 and abs(r.x1 - col_xs[0][1]) < 3 and r.y0 >= hy1 - 2:
                cand_ys.add(round(r.y0, 1))
                cand_ys.add(round(r.y1, 1))
        # Also check line items
        for d in drawings:
            sc = d.get("color")
            sc_hex = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in sc)) if sc else None
            if sc_hex == "#9a1b2f": continue
            for item in d.get("items", []):
                if item[0] == "l":
                    p1, p2 = item[1], item[2]
                    if abs(p1.y - p2.y) < 1.5 and abs(p2.x - p1.x) > 450 and p1.y > hy1 + 5 and p1.y < 790:
                        cand_ys.add(round(p1.y, 1))
        # Deduplicate cand_ys
        clean_cand = []
        for y in sorted(cand_ys):
            if not clean_cand or y - clean_cand[-1] > 3.0:
                if y > hy1 + 6:
                    clean_cand.append(y)
        # Filter clean_cand: stop if a line inside [prev_y, y] is a Heading (size >= 11.4) or full-width paragraph (width > col_xs[0][1]-tbl_x0 + 40 in a single span crossing col boundaries!)
        dict_lines = []
        for blk in page.get_text("dict")["blocks"]:
            if blk["type"] != 0: continue
            for ln in blk["lines"]:
                dict_lines.append(ln)
        
        final_rows = []
        prev_y = round(hy1, 1)
        for y in clean_cand:
            # Check if any text line between prev_y and y crosses column 0->1 boundary as a single span (meaning we left the table!)
            crossed = False
            has_text = False
            for ln in dict_lines:
                yc = (ln["bbox"][1] + ln["bbox"][3]) / 2
                if prev_y + 1 < yc < y - 1:
                    has_text = True
                    # Check if any span has size >= 11.3 (heading) or starts in col0 and ends past col0.x1 + 10
                    for sp in ln["spans"]:
                        if sp["size"] >= 11.3:
                            crossed = True; break
                        if sp["bbox"][0] < col_xs[0][1] - 5 and sp["bbox"][2] > col_xs[0][1] + 8:
                            crossed = True; break
                if crossed: break
            if crossed or not has_text:
                break
            final_rows.append((prev_y, y))
            prev_y = y
        
        if final_rows:
            tables.append({
                "y0": hy0,
                "y1": final_rows[-1][1],
                "col_xs": col_xs,
                "header_rect_y": (hy0, hy1),
                "row_ys": final_rows,
            })
    return tables

# Quick test on all 10 articles to verify ALL 30 tables extract every single row cleanly!
RANGES = {11:(3,26),12:(27,49),13:(50,73),14:(74,96),15:(97,121),16:(122,147),17:(148,173),18:(174,194),19:(195,217),20:(218,240)}
tot_t = 0
for num, (sp, ep) in RANGES.items():
    art_tables = []
    for pno in range(sp, ep+1):
        page = doc[pno-1]
        links = page.get_links()
        tbls = detect_tables_on_page(page)
        for t in tbls:
            hdrs = [extract_rect_html(page, fitz.Rect(x0, t["header_rect_y"][0], x1, t["header_rect_y"][1]), links, None) for x0, x1 in t["col_xs"]]
            rows = []
            for ry0, ry1 in t["row_ys"]:
                rows.append([extract_rect_html(page, fitz.Rect(x0, ry0, x1, ry1), links, None) for x0, x1 in t["col_xs"]])
            # Merge if continuation of previous table on previous page
            if art_tables and art_tables[-1]["headers"] == hdrs and pno <= art_tables[-1]["end_page"] + 1:
                art_tables[-1]["rows"].extend(rows)
                art_tables[-1]["end_page"] = pno
            else:
                art_tables.append({"start_page": pno, "end_page": pno, "headers": hdrs, "rows": rows})
    tot_t += len(art_tables)
    summary = [(len(t["headers"]), len(t["rows"]), t["start_page"]) for t in art_tables]
    print(f"Art {num}: {len(art_tables)} merged tables -> (cols, rows, start_p) = {summary}")
print(f"TOTAL MERGED TABLES: {tot_t}")
