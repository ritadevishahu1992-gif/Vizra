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
def norm_text(s): return s.translate(PUA_MAP)

BOLD_XREFS = {10, 11, 12, 13, 22, 23}
ITALIC_XREFS = {24, 25, 26, 56, 57, 77}

# Build ToUnicode CMaps for all Type3 fonts
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
                    try: cm[int(k, 16)] = bytes.fromhex(v).decode("utf-16-be")
                    except Exception: pass
            cmaps[xref] = cm

def get_t3_char_styles(page):
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
                    for c in norm_text(cm.get(int(hx[i:i+2], 16), "")):
                        if not c.isspace(): out.append((c, st))
            elif m.group(3):
                for hx in re.findall(r"<([0-9A-Fa-f]+)>", m.group(3)):
                    for i in range(0, len(hx), 2):
                        for c in norm_text(cm.get(int(hx[i:i+2], 16), "")):
                            if not c.isspace(): out.append((c, st))
    return out

def rect_overlap(r1, r2, pad=0.8):
    return not (r1[2] < r2[0]-pad or r1[0] > r2[2]+pad or r1[3] < r2[1]-pad or r1[1] > r2[3]+pad)

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

def match_eq_box(pno, r):
    for ep, ey in EQ_PAGES_Y:
        if ep == pno and abs(r.y0 - ey) < 8 and abs(r.x0 - 51.0) < 4 and r.width > 470:
            return f"eq_p{ep}_{ey}"
    return None

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
        # search forward up to 40 chars
        for k in range(pos, min(n, pos + 40)):
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

def spans_to_html(ln, page_links, t3_stream=None, t3_pos_ref=None, base_size=11.0):
    reg_ys = [sp["origin"][1] for sp in ln["spans"] if sp["size"] >= base_size - 1.2]
    base_y = sorted(reg_ys)[len(reg_ys)//2] if reg_ys else (ln["spans"][0]["origin"][1] if ln["spans"] else 0)
    parts = []
    for sp in ln["spans"]:
        txt = norm_text(sp["text"])
        if not txt: continue
        font = sp["font"]; sz = sp["size"]; flags = sp["flags"]; color = f"#{sp['color']:06x}"
        oy = sp["origin"][1]; bbox = sp["bbox"]
        matched_uri = None
        for l in page_links:
            if l.get("uri") and rect_overlap(bbox, l["from"], pad=0.4):
                matched_uri = l["uri"]; break
        stripped = txt.strip()
        if color == "#9a1b2f" and re.match(r"^\[\d+\](?:,\s*\[\d+\])*$", stripped):
            if font == "Unnamed-T3" and t3_stream is not None:
                align_t3_text(t3_stream, t3_pos_ref, txt)
            lead = " " if txt.startswith(" ") else ""
            trail = " " if txt.endswith(" ") else ""
            if matched_uri:
                parts.append(f'{lead}<a class="cite" href="{html.escape(matched_uri)}">{html.escape(stripped)}</a>{trail}')
            else:
                parts.append(f'{lead}<span class="cite">{html.escape(stripped)}</span>{trail}')
            continue
        is_sup = (flags & 1) or (sz <= base_size - 1.5 and oy < base_y - 1.7)
        is_sub = (sz <= base_size - 1.5 and oy > base_y + 1.3)
        if "Mono" in font:
            h = f"<code>{html.escape(txt)}</code>"
            if matched_uri: h = f'<a href="{html.escape(matched_uri)}">{h}</a>'
            parts.append(h); continue
        if font != "Unnamed-T3" or t3_stream is None:
            h = html.escape(txt)
            if "Bold" in font: h = f"<strong>{h}</strong>"
            elif "Italic" in font: h = f"<em>{h}</em>"
            if is_sup: h = f"<sup>{h}</sup>"
            elif is_sub: h = f"<sub>{h}</sub>"
            if matched_uri: h = f'<a href="{html.escape(matched_uri)}">{h}</a>'
            parts.append(h); continue
        runs = align_t3_text(t3_stream, t3_pos_ref, txt)
        sh = ""
        for rt, st in runs:
            rh = html.escape(rt)
            if st == "b": rh = f"<strong>{rh}</strong>"
            elif st == "i": rh = f"<em>{rh}</em>"
            sh += rh
        if is_sup: sh = f"<sup>{sh}</sup>"
        elif is_sub: sh = f"<sub>{sh}</sub>"
        if matched_uri: sh = f'<a href="{html.escape(matched_uri)}">{sh}</a>'
        parts.append(sh)
    res = "".join(parts)
    res = re.sub(r"</strong>(\s*)<strong>", r"\1", res)
    res = re.sub(r"</em>(\s*)<em>", r"\1", res)
    return res

def join_html_lines(lines_html, is_url_heavy=False):
    out = ""
    for l in lines_html:
        l = l.strip()
        if not l: continue
        if not out:
            out = l
        else:
            # Strip trailing tag to inspect last visible char
            plain_end = re.sub(r"<[^>]+>", "", out)
            plain_start = re.sub(r"<[^>]+>", "", l)
            if plain_end.endswith("-") and not plain_end.endswith("—") and not plain_end.endswith("–") and not plain_end.endswith(" -"):
                # Compound word hyphen at EOL: join without extra space!
                out = out + l
            elif plain_end.endswith("/") or (is_url_heavy and re.search(r"https?://\S*$", plain_end)):
                out = out + l
            else:
                out = out + " " + l
    # Clean adjacent duplicate bold/italic tags across line joins
    out = re.sub(r"</strong>(\s*)<strong>", r"\1", out)
    out = re.sub(r"</em>(\s*)<em>", r"\1", out)
    # Clean split URLs inside <a href="...">...</a>
    out = re.sub(r"</a>\s*<a href=\"([^\"]+)\">", lambda m: " " if not m.group(1).startswith("http") else "", out)
    return out

def detect_comparative_tables(page):
    """Detect ALL comparative tables and EVERY SINGLE ROW (both shaded and white rows!) accurately."""
    drawings = page.get_drawings()
    # 1. Dark header bands (#1c1f26)
    hrects = []
    for d in drawings:
        fc = d.get("fill")
        if not fc: continue
        hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
        r = d["rect"]
        if hx == "#1c1f26" and r.height >= 14 and r.width >= 20 and 45 < r.y0 < 785:
            hrects.append(r)
    uniq_h = []
    for r in sorted(hrects, key=lambda x: (round(x.y0,1), round(x.x0,1))):
        if uniq_h and abs(uniq_h[-1].x0 - r.x0) < 2 and abs(uniq_h[-1].y0 - r.y0) < 2: continue
        uniq_h.append(r)
    bands = []
    for r in uniq_h:
        if bands and abs(bands[-1][0].y0 - r.y0) < 3: bands[-1].append(r)
        else: bands.append([r])
    
    # Gather all text lines on page once
    dict_lines = []
    for blk in page.get_text("dict")["blocks"]:
        if blk["type"] != 0: continue
        for ln in blk["lines"]:
            yc = (ln["bbox"][1] + ln["bbox"][3]) / 2
            if 46 < yc < 792:
                dict_lines.append(ln)
    
    tables = []
    for b in bands:
        if len(b) < 2: continue
        b.sort(key=lambda r: r.x0)
        col_xs = [(r.x0, r.x1) for r in b]
        hy0 = min(r.y0 for r in b)
        hy1 = max(r.y1 for r in b)
        c0_x0, c0_x1 = col_xs[0]
        
        # Collect ALL candidate row-boundary y-coords below hy1:
        # (a) horizontal cell borders matching col 0 OR full width (not crimson #9a1b2f)
        # (b) top & bottom edges of #f7f6f4 shaded cells in col 0
        cand_ys = set()
        for d in drawings:
            r = d["rect"]
            fc = d.get("fill")
            sc = d.get("color")
            fhex = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc)) if fc else None
            shex = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in sc)) if sc else None
            if fhex == "#9a1b2f" or shex == "#9a1b2f": continue
            # Shaded col 0 cell
            if fhex == "#f7f6f4" and abs(r.x0 - c0_x0) < 3 and abs(r.x1 - c0_x1) < 4 and r.y0 >= hy1 - 3 and r.y1 < 792:
                cand_ys.add(round(r.y0, 1))
                cand_ys.add(round(r.y1, 1))
            # Thin horizontal border rect (either col0 width or full table width)
            if r.height <= 2.5 and r.y0 > hy1 + 5 and r.y0 < 792:
                if (abs(r.x0 - c0_x0) < 3 and abs(r.x1 - c0_x1) < 4) or (r.width > 450 and abs(r.x0 - c0_x0) < 4):
                    cand_ys.add(round((r.y0 + r.y1)/2, 1))
            # Line items (per-cell or full-width horizontal strokes)
            for item in d.get("items", []):
                if item[0] == "l":
                    p1, p2 = item[1], item[2]
                    if abs(p1.y - p2.y) < 1.5 and p1.y > hy1 + 5 and p1.y < 792:
                        lx0, lx1 = min(p1.x, p2.x), max(p1.x, p2.x)
                        if (abs(lx0 - c0_x0) < 3 and abs(lx1 - c0_x1) < 4) or (lx1 - lx0 > 450 and abs(lx0 - c0_x0) < 4):
                            cand_ys.add(round(p1.y, 1))
        
        # Deduplicate within 3pt
        clean_ys = []
        for y in sorted(cand_ys):
            if y > hy1 + 6 and (not clean_ys or y - clean_ys[-1] > 3.5):
                clean_ys.append(y)
        
        # Walk row by row until text crosses col0->col1 boundary or heading appears
        final_rows = []
        prev_y = round(hy1, 1)
        for y in clean_ys:
            crossed = False
            has_text = False
            for ln in dict_lines:
                yc = (ln["bbox"][1] + ln["bbox"][3]) / 2
                if prev_y + 1 < yc < y - 1:
                    has_text = True
                    for sp in ln["spans"]:
                        if sp["size"] >= 11.3:
                            crossed = True; break
                        if sp["bbox"][0] < c0_x1 - 5 and sp["bbox"][2] > c0_x1 + 8:
                            crossed = True; break
                if crossed: break
            if crossed or not has_text:
                break
            final_rows.append((prev_y, y))
            prev_y = y
        
        # ALSO check if there is ONE MORE unbordered white row right below prev_y (before prose/heading/page bottom)!
        # Find the first line below prev_y+2 that crosses c0_x1 or is a heading
        next_prose_y = 788.0
        for ln in sorted(dict_lines, key=lambda l: l["bbox"][1]):
            yc = (ln["bbox"][1] + ln["bbox"][3]) / 2
            if yc <= prev_y + 2: continue
            is_prose = False
            for sp in ln["spans"]:
                if sp["size"] >= 11.3 or (sp["bbox"][0] < c0_x1 - 5 and sp["bbox"][2] > c0_x1 + 8):
                    is_prose = True; break
            if is_prose:
                next_prose_y = ln["bbox"][1] - 2.0
                break
        # Check if there are table-column-aligned lines in (prev_y+2, next_prose_y)
        extra_lines = [ln for ln in dict_lines if prev_y + 2 < (ln["bbox"][1]+ln["bbox"][3])/2 < next_prose_y]
        if extra_lines:
            # Verify they fit cleanly inside col_xs and are ~10pt (table body size)
            if all(sp["size"] <= 10.6 for ln in extra_lines for sp in ln["spans"]):
                max_eb = max(ln["bbox"][3] for ln in extra_lines) + 4.0
                final_rows.append((prev_y, min(max_eb, next_prose_y)))
        
        if final_rows:
            tables.append({
                "y0": hy0,
                "y1": final_rows[-1][1],
                "col_xs": col_xs,
                "header_y": (hy0, hy1),
                "row_ys": final_rows,
            })
    return tables

def detect_seo_rows(page):
    """Detect SEO metadata 2-column table rows (left key cell #f7f6f4 x0=51..171)."""
    drawings = page.get_drawings()
    raw_rects = []
    for d in drawings:
        fc = d.get("fill")
        if not fc: continue
        hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
        r = d["rect"]
        if hx == "#f7f6f4" and abs(r.x0 - 51.0) < 2.5 and 100 < r.width < 160 and r.height >= 14 and 46 < r.y0 < 788:
            raw_rects.append(r)
    uniq = []
    for r in sorted(raw_rects, key=lambda x: round(x.y0, 1)):
        if uniq and abs(uniq[-1].y0 - r.y0) < 3: continue
        uniq.append(r)
    return uniq

def detect_callout_boxes(page, eq_rects):
    """Detect shaded callout boxes (like Featured Image Brief or Visual Suggestion cards): #f7f6f4 with dark/crimson left border."""
    drawings = page.get_drawings()
    boxes = []
    for d in drawings:
        fc = d.get("fill")
        if not fc: continue
        hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
        r = d["rect"]
        if hx == "#f7f6f4" and 49 <= r.x0 <= 55 and r.width > 475 and r.height > 20 and 46 < r.y0 < 788:
            # Skip if already an equation box
            if any(abs(r.y0 - er.y0) < 6 and abs(r.y1 - er.y1) < 6 for er in eq_rects):
                continue
            boxes.append(r)
    uniq = []
    for r in sorted(boxes, key=lambda x: round(x.y0, 1)):
        if uniq and abs(uniq[-1].y0 - r.y0) < 4 and abs(uniq[-1].y1 - r.y1) < 4: continue
        uniq.append(r)
    return uniq

def extract_cell_html(page, rect, page_links, t3_stream):
    """Extract cell text preserving links, sup, sub, code, bold (using simple stream scan per page or bold col0)."""
    d = page.get_text("dict", clip=rect)
    lines = []
    for b in d["blocks"]:
        if b["type"] != 0: continue
        for ln in b["lines"]:
            yc = (ln["bbox"][1] + ln["bbox"][3]) / 2
            xc = (ln["bbox"][0] + ln["bbox"][2]) / 2
            if rect.y0 - 2 <= yc <= rect.y1 + 2 and rect.x0 - 2 <= xc <= rect.x1 + 2:
                lines.append(ln)
    lines.sort(key=lambda l: (round(l["bbox"][1], 1), l["bbox"][0]))
    lhtml = [spans_to_html(ln, page_links, None, None, base_size=10.0) for ln in lines]
    return join_html_lines(lhtml, is_url_heavy=False)

RANGES = {11:(3,26),12:(27,49),13:(50,73),14:(74,96),15:(97,121),16:(122,147),17:(148,173),18:(174,194),19:(195,217),20:(218,240)}

corpus = []
print("=== EXTRACTING ALL 10 ARTICLES ===")
for num, (sp, ep) in RANGES.items():
    article = {
        "number": num,
        "orig_start_page": sp,
        "orig_end_page": ep,
        "kicker": "",
        "title": "",
        "deck": "",
        "meta_bar": "",
        "seo_rows": [],
        "blocks": [],
        "raw_word_count": 0,
    }
    raw_txt_all = []
    cur_section = "HEADER"
    
    for pno in range(sp, ep+1):
        page = doc[pno-1]
        page_links = page.get_links()
        t3_stream = get_t3_char_styles(page)
        t3_pos = [0]
        
        # Raw word count baseline (stripping running headers/footers & ghost brackets)
        ptxt = norm_text(page.get_text("text"))
        raw_lines = [l for l in ptxt.splitlines()
                     if l.strip() not in ("VIZRA BLOG | BATCH 2: MACHINE LEARNING & ADVANCED AI", "ARTICLES 11–20 • EDITORIAL EDITION")
                     and not re.match(r"^Page \d+ of 243$", l.strip())
                     and not re.match(r"^\[\s*\](\s*\[\s*\])*$", l.strip())]
        raw_txt_all.append("\n".join(raw_lines))
        
        # 1. Detect equation boxes on this page
        eq_boxes = []
        for d in page.get_drawings():
            fc = d.get("fill")
            if not fc: continue
            hx = "#{:02x}{:02x}{:02x}".format(*(int(round(c*255)) for c in fc))
            r = d["rect"]
            if hx == "#f7f6f4":
                eq_id = match_eq_box(pno, r)
                if eq_id and not any(e["id"] == eq_id for e in eq_boxes):
                    eq_boxes.append({"id": eq_id, "rect": r, "y0": r.y0, "y1": r.y1})
        
        # 2. Detect SEO table rows (only on first 2 pages of article)
        seo_rects = detect_seo_rows(page) if pno <= sp + 1 else []
        seo_band_y = (min(r.y0 for r in seo_rects) - 2, max(r.y1 for r in seo_rects) + 2) if seo_rects else None
        for r in seo_rects:
            k = extract_cell_html(page, r, page_links, t3_stream)
            vrect = fitz.Rect(r.x1 + 1, r.y0, 545.0, r.y1)
            v = extract_cell_html(page, vrect, page_links, t3_stream)
            k_plain = re.sub(r"<[^>]+>", "", k).strip()
            if k_plain:
                article["seo_rows"].append({"key": k_plain, "val_html": v, "page": pno})
        
        # 3. Detect comparative tables
        comp_tables = detect_comparative_tables(page)
        
        # 4. Detect callout boxes (Metadata bar on page sp, Featured Image Brief, Visual Suggestions boxes)
        callout_rects = detect_callout_boxes(page, [e["rect"] for e in eq_boxes])
        
        # Build vertical exclusion zones (tables, eq boxes, seo rows, meta bar)
        # We will emit ALL page items sorted by y0!
        page_items = []
        
        for eq in eq_boxes:
            page_items.append((eq["y0"], "equation", {"id": eq["id"], "page": pno, "raw": norm_text(page.get_text("text", clip=eq["rect"])).strip()}))
        
        for t in comp_tables:
            hdrs = [extract_cell_html(page, fitz.Rect(x0, t["header_y"][0], x1, t["header_y"][1]), page_links, t3_stream) for x0, x1 in t["col_xs"]]
            rows = []
            for ry0, ry1 in t["row_ys"]:
                rows.append([extract_cell_html(page, fitz.Rect(x0, ry0, x1, ry1), page_links, t3_stream) for x0, x1 in t["col_xs"]])
            page_items.append((t["y0"], "table", {"page": pno, "headers": hdrs, "rows": rows}))
        
        # Identify meta bar rect on opening page
        meta_bar_rect = None
        if pno == sp:
            for cr in callout_rects:
                ct = norm_text(page.get_text("text", clip=cr)).strip()
                if ct.startswith("Category:"):
                    meta_bar_rect = cr
                    article["meta_bar"] = ct
                    break
        
        def in_special_zone(y_mid):
            if y_mid < 46 or y_mid > 792: return True
            if seo_band_y and seo_band_y[0] <= y_mid <= seo_band_y[1]: return True
            if meta_bar_rect and meta_bar_rect.y0 - 2 <= y_mid <= meta_bar_rect.y1 + 2: return True
            for eq in eq_boxes:
                if eq["y0"] - 2 <= y_mid <= eq["y1"] + 2: return True
            for t in comp_tables:
                if t["y0"] - 2 <= y_mid <= t["y1"] + 2: return True
            return False
        
        # Check if a y_mid is inside a non-meta callout box (like Featured Image Brief)
        active_callouts = [cr for cr in callout_rects if cr != meta_bar_rect]
        def which_callout(y_mid):
            for idx_c, cr in enumerate(active_callouts):
                if cr.y0 - 2 <= y_mid <= cr.y1 + 2:
                    return idx_c
            return None
        
        # Extract all remaining text lines sorted top-to-bottom
        text_lines = []
        for blk in page.get_text("dict")["blocks"]:
            if blk["type"] != 0: continue
            for ln in blk["lines"]:
                yc = (ln["bbox"][1] + ln["bbox"][3]) / 2
                # Always advance t3 stream? Better: advance only for non-header/footer lines, or align cleanly!
                raw_l = "".join(norm_text(s["text"]) for s in ln["spans"]).strip()
                if not raw_l: continue
                if yc < 46 or yc > 792:
                    # Skip running header/footer (still advance t3 cursor past header text so page alignment stays locked!)
                    if yc < 46:
                        align_t3_text(t3_stream, t3_pos, raw_l)
                    continue
                # Skip ghost pagination-bleed empty brackets at bottom of page (y > 774)
                if ln["bbox"][1] > 774 and re.match(r"^[\[\]\s,]+$", raw_l):
                    continue
                if in_special_zone(yc):
                    # Advance t3 cursor for Unnamed-T3 text inside skipped zones so following paragraphs align!
                    for s in ln["spans"]:
                        if s["font"] == "Unnamed-T3":
                            align_t3_text(t3_stream, t3_pos, norm_text(s["text"]))
                    continue
                text_lines.append((ln["bbox"][1], ln["bbox"][0], ln))
        
        text_lines.sort(key=lambda x: (round(x[0], 1), x[1]))
        
        # Group lines into semantic paragraphs/headings/list items!
        idx = 0
        while idx < len(text_lines):
            y0, x0, ln = text_lines[idx]
            sp0 = ln["spans"][0]
            sz = sp0["size"]
            font = sp0["font"]
            col = f"#{sp0['color']:06x}"
            raw_l = "".join(norm_text(s["text"]) for s in ln["spans"]).strip()
            
            # Article opener elements on page sp
            if pno == sp and y0 < 300:
                if col == "#9a1b2f" and "ARTICLE" in raw_l and "VIZRA" in raw_l:
                    article["kicker"] = raw_l
                    align_t3_text(t3_stream, t3_pos, raw_l)
                    idx += 1; continue
                if "NotoSerifDisplay" in font and sz >= 20:
                    # May span 2 lines
                    tlines = [raw_l]
                    idx += 1
                    while idx < len(text_lines) and "NotoSerifDisplay" in text_lines[idx][2]["spans"][0]["font"]:
                        tlines.append("".join(norm_text(s["text"]) for s in text_lines[idx][2]["spans"]).strip())
                        idx += 1
                    article["title"] = " ".join(tlines)
                    continue
                if "NotoSerif-Italic" in font and sz >= 11:
                    dlines = [raw_l]
                    idx += 1
                    while idx < len(text_lines) and "NotoSerif-Italic" in text_lines[idx][2]["spans"][0]["font"]:
                        dlines.append("".join(norm_text(s["text"]) for s in text_lines[idx][2]["spans"]).strip())
                        idx += 1
                    article["deck"] = " ".join(dlines)
                    continue
            
            # Major section H1 (NotoSerif-Bold >= 14.5pt): A., B., C., D., E.
            if "NotoSerif-Bold" in font and sz >= 14.5:
                hlines = [raw_l]
                hy0 = y0
                idx += 1
                while idx < len(text_lines) and "NotoSerif-Bold" in text_lines[idx][2]["spans"][0]["font"] and text_lines[idx][2]["spans"][0]["size"] >= 14.5 and text_lines[idx][0] - text_lines[idx-1][0] < 24:
                    hlines.append("".join(norm_text(s["text"]) for s in text_lines[idx][2]["spans"]).strip())
                    idx += 1
                htxt = " ".join(hlines)
                page_items.append((hy0, "section_h1", {"text": htxt, "page": pno}))
                continue
            
            # H2 (NotoSerif-Bold >= 12.5pt)
            if "NotoSerif-Bold" in font and sz >= 12.5:
                hlines = [raw_l]
                hy0 = y0
                idx += 1
                while idx < len(text_lines) and "NotoSerif-Bold" in text_lines[idx][2]["spans"][0]["font"] and 12.5 <= text_lines[idx][2]["spans"][0]["size"] < 14.5 and text_lines[idx][0] - text_lines[idx-1][0] < 22:
                    hlines.append("".join(norm_text(s["text"]) for s in text_lines[idx][2]["spans"]).strip())
                    idx += 1
                htxt = " ".join(hlines)
                page_items.append((hy0, "h2", {"text": htxt, "page": pno, "in_callout": which_callout((hy0 + ln["bbox"][3])/2) is not None}))
                continue
            
            # H3 (#9a1b2f crimson subheading, size >= 11.3)
            if col == "#9a1b2f" and sz >= 11.3:
                hlines = [raw_l]
                hy0 = y0
                align_t3_text(t3_stream, t3_pos, raw_l)
                idx += 1
                while idx < len(text_lines):
                    nsp0 = text_lines[idx][2]["spans"][0]
                    if f"#{nsp0['color']:06x}" == "#9a1b2f" and nsp0["size"] >= 11.3 and text_lines[idx][0] - text_lines[idx-1][0] < 20:
                        nr = "".join(norm_text(s["text"]) for s in text_lines[idx][2]["spans"]).strip()
                        align_t3_text(t3_stream, t3_pos, nr)
                        hlines.append(nr)
                        idx += 1
                    else:
                        break
                page_items.append((hy0, "h3", {"text": " ".join(hlines), "page": pno}))
                continue
            
            # Regular body / list / callout / FAQ / Reference paragraph
            c_idx = which_callout((y0 + ln["bbox"][3]) / 2)
            # Detect bullet or numbered marker
            is_bullet = raw_l.startswith("•") or raw_l.startswith("◦") or (x0 > 57 and c_idx is None and not re.match(r"^\d+\.\s", raw_l))
            num_m = re.match(r"^(\d+)\.\s+(.*)$", raw_l)
            is_num = bool(num_m)
            
            group_lines = [ln]
            gy0 = y0
            gx0 = x0
            idx += 1
            while idx < len(text_lines):
                ny0, nx0, nln = text_lines[idx]
                nsp0 = nln["spans"][0]
                nsz = nsp0["size"]
                nfont = nsp0["font"]
                ncol = f"#{nsp0['color']:06x}"
                nraw = "".join(norm_text(s["text"]) for s in nln["spans"]).strip()
                # Stop on headings
                if ("NotoSerif-Bold" in nfont and nsz >= 12.5) or (ncol == "#9a1b2f" and nsz >= 11.3):
                    break
                # Stop on callout boundary change
                nc_idx = which_callout((ny0 + nln["bbox"][3]) / 2)
                if nc_idx != c_idx:
                    break
                # Stop on vertical paragraph gap (normal line spacing is ~16-18pt; paragraph gap is >= 21pt)
                prev_y0 = group_lines[-1]["bbox"][1]
                dy = ny0 - prev_y0
                if dy > 20.5:
                    break
                # Stop on new bullet or new numbered list item!
                if nraw.startswith("•") or nraw.startswith("◦"):
                    break
                if re.match(r"^\d+\.\s+", nraw) and (nx0 < gx0 + 5 or dy > 16.5):
                    # Wait: check if it's a real numbered list item (not a wrapped year like "2024.")
                    nm2 = re.match(r"^(\d+)\.\s+", nraw)
                    if nm2 and int(nm2.group(1)) <= 45:
                        break
                # Also stop inside a Featured Image Brief callout when a bold label like "Composition & layout:" starts a new bullet/field
                if c_idx is not None and re.match(r"^(?:Main Visual Subject|Visual Concept|Composition|Color Palette|Lighting|Typography|Style|Aspect [Rr]atio|Mood|Avoid|Target|Educational [Vv]alue|Placement|Suggested|Diagram|Chart)", nraw) and dy > 17.0:
                    break
                group_lines.append(nln)
                idx += 1
            
            # Render group_lines to HTML
            base_sz = group_lines[0]["spans"][0]["size"]
            rendered = [spans_to_html(gl, page_links, t3_stream, t3_pos, base_size=base_sz) for gl in group_lines]
            # Check if URL heavy (References section)
            joined_plain = " ".join("".join(norm_text(s["text"]) for s in gl["spans"]) for gl in group_lines)
            is_ref_like = ("http://" in joined_plain or "https://" in joined_plain) and (sz <= 10.2)
            html_content = join_html_lines(rendered, is_url_heavy=is_ref_like)
            
            if is_bullet and html_content.startswith("•"):
                html_content = re.sub(r"^•\s*", "", html_content)
                btype = "ul_item"
            elif is_bullet and (gx0 > 57 and c_idx is None):
                btype = "ul_cont"
            elif is_num:
                btype = "ol_item"
            elif c_idx is not None:
                btype = "callout_p"
            else:
                btype = "p"
            
            page_items.append((gy0, btype, {
                "html": html_content,
                "page": pno,
                "x0": round(gx0, 1),
                "size": round(base_sz, 1),
                "callout_id": f"p{pno}_c{c_idx}" if c_idx is not None else None,
            }))
        
        # Sort all items on this page by vertical position y0 and append to article["blocks"]
        page_items.sort(key=lambda x: x[0])
        for _, itype, idata in page_items:
            # Merge comparative table continuation across page break
            if itype == "table" and article["blocks"] and article["blocks"][-1]["type"] == "table":
                prev_t = article["blocks"][-1]
                if prev_t["headers"] == idata["headers"] and idata["page"] <= prev_t["end_page"] + 1:
                    prev_t["rows"].extend(idata["rows"])
                    prev_t["end_page"] = idata["page"]
                    continue
            if itype == "table":
                article["blocks"].append({"type": "table", "start_page": idata["page"], "end_page": idata["page"], "headers": idata["headers"], "rows": idata["rows"]})
            else:
                article["blocks"].append({"type": itype, **idata})
    
    # Post-pass: Merge paragraphs/list items/refs that broke across page breaks!
    merged = []
    for blk in article["blocks"]:
        if merged:
            prev = merged[-1]
            # Merge continuation paragraph across page break
            if prev["type"] in ("p", "ul_item", "ol_item", "callout_p") and blk["type"] in ("p", "ul_cont", "callout_p") and blk.get("page", 0) == prev.get("page", 0) + 1:
                p_plain = re.sub(r"<[^>]+>", "", prev["html"]).strip()
                b_plain = re.sub(r"<[^>]+>", "", blk["html"]).strip()
                # Does prev end mid-sentence (not terminal punctuation, or ends with comma/hyphen/word) AND blk starts lowercase or citation [n] or continuation?
                ends_terminal = bool(re.search(r"[.!?:\"”\)]\s*(?:\[\d+\](?:,\s*\[\d+\])*\s*\.?)?$", p_plain))
                starts_cite_or_lower = bool(re.match(r"^(?:[a-z0-9\(\[\$]|\[|\—|\–)", b_plain))
                is_same_kind = (prev["type"] == "callout_p" and blk["type"] == "callout_p") or (prev["type"] != "callout_p" and blk["type"] != "callout_p")
                if is_same_kind and (not ends_terminal or starts_cite_or_lower):
                    # Don't merge if blk starts a new FAQ/Visual label or new numbered item
                    if not re.match(r"^(?:\d+\.\s+|Main Visual|Visual Concept|Composition|Color Palette|Lighting|Typography|Style|Aspect Ratio)", b_plain):
                        is_url_h = ("http" in p_plain[-40:]) and prev.get("size", 11) <= 10.2
                        prev["html"] = join_html_lines([prev["html"], blk["html"]], is_url_heavy=is_url_h)
                        prev["page"] = blk["page"]
                        continue
            # Also merge ul_cont on same page into previous ul_item
            if prev["type"] == "ul_item" and blk["type"] == "ul_cont":
                prev["html"] = join_html_lines([prev["html"], blk["html"]])
                continue
        if blk["type"] == "ul_cont":
            blk["type"] = "p"
        merged.append(blk)
    article["blocks"] = merged
    
    # Word conservation audit!
    raw_wc = len(re.findall(r"\b\w+(?:['’-]\w+)*\b", "\n".join(raw_txt_all)))
    ext_parts = [article["kicker"], article["title"], article["deck"], article["meta_bar"]]
    for sr in article["seo_rows"]:
        ext_parts.append(sr["key"] + " " + re.sub(r"<[^>]+>", " ", sr["val_html"]))
    for b in article["blocks"]:
        if b["type"] == "table":
            ext_parts.append(" ".join(re.sub(r"<[^>]+>", " ", h) for h in b["headers"]))
            for row in b["rows"]:
                ext_parts.append(" ".join(re.sub(r"<[^>]+>", " ", c) for c in row))
        elif b["type"] == "equation":
            ext_parts.append(b["raw"])
        elif "text" in b:
            ext_parts.append(b["text"])
        elif "html" in b:
            ext_parts.append(re.sub(r"<[^>]+>", " ", b["html"]))
    ext_wc = len(re.findall(r"\b\w+(?:['’-]\w+)*\b", " ".join(ext_parts)))
    ratio = (ext_wc / raw_wc * 100) if raw_wc else 0
    article["raw_word_count"] = raw_wc
    article["extracted_word_count"] = ext_wc
    tbl_cnt = sum(1 for b in article["blocks"] if b["type"] == "table")
    tbl_rows = [len(b["rows"]) for b in article["blocks"] if b["type"] == "table"]
    eq_cnt = sum(1 for b in article["blocks"] if b["type"] == "equation")
    print(f"Art {num:2d}: raw={raw_wc:5,} | ext={ext_wc:5,} ({ratio:5.1f}%) | seo={len(article['seo_rows']):2d} | tbls={tbl_cnt} rows={tbl_rows} | eqs={eq_cnt:2d} | blks={len(article['blocks']):3d}")
    corpus.append(article)

with open(".b2_work/corpus.json", "w") as f:
    json.dump(corpus, f)
print(f"\nSaved .b2_work/corpus.json | Total articles: {len(corpus)}, Total tables: {sum(sum(1 for b in a['blocks'] if b['type']=='table') for a in corpus)}, Total eqs: {sum(sum(1 for b in a['blocks'] if b['type']=='equation') for a in corpus)}")
