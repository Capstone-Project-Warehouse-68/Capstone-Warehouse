import os, io, re, json
from dataclasses import dataclass
from typing import List, Dict, Optional
from collections import OrderedDict

import numpy as np
import pandas as pd
from tqdm import tqdm
from google.cloud import vision_v1 as vision
from google.oauth2 import service_account
from pdf2image import convert_from_path

# =========================================================
# CONFIG (แก้เฉพาะส่วนนี้)
# =========================================================
CONFIG = {
    "service_account_json": r"D:\Project\Capstone-Warehouse\Backend\Model\ServiceAcc\CapStoneKEY.json",
    "pdf_path": r"D:\Project\Capstone-Warehouse\Backend\Model\Data\8.pdf",
    "out_dir": r"D:\Project\Capstone-Warehouse\Backend\Model\Result\output",

    "dpi": 400,                 # 300–400 แนะนำ
    "lang_hints": ["th","en"],  # ไทย+อังกฤษ
    "billing_project_id": None,

    "y_tol": 14,
    "split_columns": False,
    "col_gap_px": 220,
    "pages": None,
    "save_intermediate_images": False,
    "fix_spacing": True,

    # *** Windows only ***
    "poppler_path": r"C:\poppler-24.02.0\Library\bin"  # <- Path ไปที่ poppler/bin
}

os.makedirs(CONFIG["out_dir"], exist_ok=True)

# =========================================================
# GOOGLE VISION CLIENT
# =========================================================
def make_vision_client(sa_json: str, quota_project: Optional[str] = None):
    if not os.path.exists(sa_json):
        raise FileNotFoundError(f"ไม่พบไฟล์ Service Account: {sa_json}")
    creds = service_account.Credentials.from_service_account_file(sa_json)
    if quota_project:
        creds = creds.with_quota_project(quota_project)
    return vision.ImageAnnotatorClient(credentials=creds)

client = make_vision_client(CONFIG["service_account_json"], CONFIG["billing_project_id"])

# =========================================================
# HELPER CLASS
# =========================================================
@dataclass
class WordBox:
    text: str
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    page_index: int
    @property
    def x_center(self): return (self.x_min + self.x_max) / 2
    @property
    def y_center(self): return (self.y_min + self.y_max) / 2

# =========================================================
# STEP 1 : PDF -> IMAGES
# =========================================================
def page_range_to_indices(pages, total):
    if pages is None: return list(range(total))
    return [p-1 for p in pages if 1 <= p <= total]

def pdf_to_images(pdf_path: str, dpi: int, pages: Optional[List[int]]):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"ไม่พบ PDF: {pdf_path}")
    all_pages = convert_from_path(pdf_path, dpi=dpi, poppler_path=CONFIG["poppler_path"])
    idxs = page_range_to_indices(pages, len(all_pages))
    if not idxs: idxs = list(range(len(all_pages)))
    return [all_pages[i] for i in idxs], idxs

# =========================================================
# STEP 2 : OCR
# =========================================================
def annotate_image(pil_image, lang_hints: List[str]):
    with io.BytesIO() as buf:
        pil_image.save(buf, format="PNG")
        content = buf.getvalue()
    img = vision.Image(content=content)
    ctx = vision.ImageContext(language_hints=lang_hints) if lang_hints else None
    resp = client.document_text_detection(image=img, image_context=ctx)
    if resp.error.message:
        raise RuntimeError(resp.error.message)

    # boxes = []
    # for page in resp.full_text_annotation.pages:
    #     for block in page.blocks:
    #         for para in block.paragraphs:
    #             for word in para.words:
    #                 txt = "".join([s.text or "" for s in word.symbols]).strip()
    #                 if not txt: continue
    #                 xs = [v.x for v in word.bounding_box.vertices]
    #                 ys = [v.y for v in word.bounding_box.vertices]
    #                 boxes.append(WordBox(
    #                     text=txt, x_min=min(xs), y_min=min(ys),
    #                     x_max=max(xs), y_max=max(ys), page_index=0
    #                 ))
    # return boxes

    word_boxes: List[WordBox] = []
    for page in resp.full_text_annotation.pages:
        for block in page.blocks:
            for para in block.paragraphs:
                for word in para.words:
                    txt = "".join([s.text or "" for s in word.symbols]).strip()
                    if not txt: continue
                    xs = [v.x for v in word.bounding_box.vertices]
                    ys = [v.y for v in word.bounding_box.vertices]
                    word_boxes.append(WordBox(
                        text=txt, x_min=min(xs), y_min=min(ys),
                        x_max=max(xs), y_max=max(ys), page_index=0
                    ))
    return word_boxes


# =========================================================
# STEP 3 : GROUPING & CLEAN
# =========================================================
# def group_words_into_lines(word_boxes: List[WordBox], y_tol: int):
#     if not word_boxes: return []
#     word_boxes = sorted(word_boxes, key=lambda b: (b.y_center, b.x_center))
#     lines, current, current_y = [], [], None
#     for wb in word_boxes:
#         if current_y is None:
#             current, current_y = [wb], wb.y_center
#             continue
#         if abs(wb.y_center - current_y) <= y_tol:
#             current.append(wb)
#             current_y = float(np.median([w.y_center for w in current]))
#         else:
#             lines.append(sorted(current, key=lambda w: w.x_center))
#             current, current_y = [wb], wb.y_center
#     if current: lines.append(sorted(current, key=lambda w: w.x_center))
#     return lines

# def lines_to_text(lines):
#     return [" ".join([w.text for w in ln]).strip() for ln in lines]

# # Cleaning (เหมือนใน Notebook)
# _TH = r"\u0E00-\u0E7F"
# def _merge_thai_spaces(s: str) -> str:
#     s = re.sub(rf"(?<=[{_TH}])\s+(?=[{_TH}])", "", s)
#     s = re.sub(r"\s*-\s*", "-", s)
#     s = re.sub(r"\s*,\s*", ", ", s)
#     s = re.sub(r"\s{2,}", " ", s).strip()
#     return s

# def postprocess_lines(lines: List[str]) -> List[str]:
#     out = []
#     for ln in lines:
#         ln2 = _merge_thai_spaces(ln)
#         if re.fullmatch(r"[0#.,%\s]+", ln2):  # skip junk
#             continue
#         out.append(ln2)
#     return out
def group_words_into_lines(word_boxes: List[WordBox], y_tol: int):
    if not word_boxes: return []
    word_boxes = sorted(word_boxes, key=lambda b: (b.y_center, b.x_center))
    lines, current_line, current_y = [], [], None
    for wb in word_boxes:
        if current_y is None:
            current_line, current_y = [wb], wb.y_center
            continue
        if abs(wb.y_center - current_y) <= y_tol:
            current_line.append(wb)
            current_y = float(np.median([w.y_center for w in current_line]))
        else:
            lines.append(sorted(current_line, key=lambda w: w.x_center))
            current_line, current_y = [wb], wb.y_center
    if current_line:
        lines.append(sorted(current_line, key=lambda w: w.x_center))
    return lines

def split_lines_into_columns(lines: List[List[WordBox]], col_gap_px: int):
    if not lines: return [lines]
    line_with_x = []
    for ln in lines:
        line_with_x.append((min(w.x_min for w in ln), min(w.y_min for w in ln), ln))
    line_with_x.sort(key=lambda t: (t[0], t[1]))
    columns = [[]]
    prev_x = line_with_x[0][0]
    for x_min, y_min, ln in line_with_x:
        if abs(x_min - prev_x) > col_gap_px:
            columns.append([])
        columns[-1].append(ln)
        prev_x = x_min
    for c in columns:
        c.sort(key=lambda ln: min(w.y_min for w in ln))
    return columns

def lines_to_text(lines: List[List[WordBox]]):
    return [" ".join([w.text for w in ln]).strip() for ln in lines]

# ---------- FIX SPACING & NORMALIZE ----------
_TH = r"\u0E00-\u0E7F"  # ช่วงยูนิโค้ดอักษรไทย
UNIT_WORDS = ["ชุด","ตัว","ลูก","อัน","กล่อง","ดวง","จุด","ชิ้น"]

COMMON_REPLACE = [
    (r"(\d+)\s*ตวง\b", r"\1 ดวง"),
    (r"(\d+)\s*อน\b",  r"\1 อัน"),
    (r"(\d+)\s*ชิน\b",  r"\1 ชิ้น"),
    (r"Dragon\s*-\s*eyes", "Dragon-eyes"),
]

def _merge_thai_spaces(s: str) -> str:
    s = re.sub(rf"(?<=[{_TH}])\s+(?=[{_TH}])", "", s)  # ไทยติดกัน
    s = re.sub(r"\s*/\s*", "/", s)
    s = re.sub(r"\s*-\s*", "-", s)
    s = re.sub(r"\s*:\s*", ": ", s)
    s = re.sub(r"\s*,\s*", ", ", s)
    s = re.sub(r"(?<=\d),\s+(?=\d)", ",", s)
    s = re.sub(r"\s*%\b", "%", s)
    s = re.sub(r"(\d)\s*,\s*(\d{2})\b", r"\1.\2", s)
    s = re.sub(r"\s{2,}", " ", s).strip()
    return s

def fix_line_spacing_v2(line: str) -> str:
    line = re.sub(rf"^-\s*(?=[{_TH}A-Za-z0-9])", "", line)  # ตัด - นำหน้า
    line = _merge_thai_spaces(line)
    for pat, rep in COMMON_REPLACE:
        line = re.sub(pat, rep, line, flags=re.IGNORECASE)
    line = re.sub(rf"(\d+)\s*({'|'.join(UNIT_WORDS)})\b", r"\1 \2", line)  # 4อัน -> 4 อัน
    return line

def postprocess_lines(lines: List[str]) -> List[str]:
    out = []
    for ln in lines:
        ln2 = fix_line_spacing_v2(ln)
        if re.fullmatch(r"[0#.,%\s]+", ln2):  # ตัดแถวขยะ
            continue
        if ln2.strip() == "0":
            continue
        out.append(ln2)
    return out

# =========================================================
# STEP 4 : MAIN PIPELINE
# =========================================================
def run_ocr_pipeline():
    images, page_indices = pdf_to_images(CONFIG["pdf_path"], CONFIG["dpi"], CONFIG["pages"])
    per_page_lines: OrderedDict[int, List[str]] = OrderedDict()
    line_rows = []

    for pil_img, pidx in tqdm(list(zip(images, page_indices)), desc="OCR pages"):
        word_boxes = annotate_image(pil_img, CONFIG["lang_hints"])
        for wb in word_boxes:
            wb.page_index = pidx

        raw_lines = group_words_into_lines(word_boxes, y_tol=CONFIG["y_tol"])
        lines_text = lines_to_text(raw_lines)

        if CONFIG["fix_spacing"]:
            lines_text = postprocess_lines(lines_text)

        per_page_lines[pidx] = lines_text
        for i, ln in enumerate(lines_text, start=1):
            line_rows.append({"page": pidx + 1, "line_no": i, "text": ln})

    # export
    # txt_path  = os.path.join(CONFIG["out_dir"], "ocr_merged_lines.txt")
    # json_path = os.path.join(CONFIG["out_dir"], "ocr_per_page_lines.json")
    # csv_path  = os.path.join(CONFIG["out_dir"], "ocr_lines.csv")

    merged_lines = []
    for pidx in sorted(per_page_lines.keys()):
        merged_lines.append(f"===== PAGE: {pidx+1} =====")
        merged_lines.extend(per_page_lines[pidx])

    # with open(txt_path, "w", encoding="utf-8") as f:
    #     f.write("\n".join(merged_lines))
    # with open(json_path, "w", encoding="utf-8") as f:
    #     json.dump({int(k)+1: v for k, v in per_page_lines.items()}, f, ensure_ascii=False, indent=2)
    # pd.DataFrame(line_rows).to_csv(csv_path, index=False, encoding="utf-8-sig")

    print("\n✅ OCR Completed!")
    # print("TXT :", txt_path)
    # print("JSON:", json_path)
    # print("CSV :", csv_path)
    return per_page_lines   # <--- เพิ่มบรรทัดนี้

# =========================================================
# ENTRY POINT
# =========================================================
if __name__ == "__main__":
    run_ocr_pipeline()
