from flask import Flask, request, send_file, jsonify, after_this_request
from flask_cors import CORS
import os
import shutil
import tempfile
from ocr_pipeline import run_ocr_pipeline, CONFIG
from extract_items_and_build_form import process_ocr_result, OUT_DIR

app = Flask(__name__)
CORS(app)

# 📌 1) Upload PDF → OCR → สร้าง Excel → ลบเฉพาะ PDF
@app.route('/ocr', methods=['POST'])
def ocr_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Save PDF ชั่วคราว
        temp_pdf_path = os.path.join(CONFIG["out_dir"], "uploaded.pdf")
        file.save(temp_pdf_path)
        CONFIG["pdf_path"] = temp_pdf_path

        # Run OCR pipeline
        per_page_lines = run_ocr_pipeline()
        process_ocr_result(per_page_lines)

        # ตรวจสอบ Excel
        xlsx_path = os.path.join(OUT_DIR, "DataImport.xlsx")
        if not os.path.exists(xlsx_path):
            return jsonify({"error": "Excel file not found"}), 500

        # Copy Excel ไป temp file
        temp_xlsx = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        temp_xlsx_path = temp_xlsx.name
        temp_xlsx.close()
        shutil.copy2(xlsx_path, temp_xlsx_path)

        # Cleanup หลังส่ง
        @after_this_request
        def cleanup(response):
            try:
                if os.path.exists(temp_pdf_path):
                    os.remove(temp_pdf_path)
                if os.path.exists(temp_xlsx_path):
                    os.remove(temp_xlsx_path)
            except Exception as e:
                print(f"Cleanup error: {e}")
            return response

        # ส่ง ข้อมูล OCR
        # return send_file(
        #     temp_xlsx_path,
        #     as_attachment=True,
        #     download_name="DataImport.xlsx",
        #     mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        # )

        return jsonify({"status": "OCR: Already", "file": "ready_for_download"})

    except Exception as e:
        print("OCR PDF Error:", e)
        return jsonify({"error": str(e)}), 500


# 📌 2) ดาวน์โหลด Excel → ลบ Excel หลังดาวน์โหลด
@app.route('/download_excel', methods=["GET"])
def download_excel():
    xlsx_path = os.path.join(OUT_DIR, "DataImport.xlsx")

    if not os.path.exists(xlsx_path):
        return jsonify({'error': 'Excel file not found'}), 404

    # ✅ Copy ไปยัง temp file
    temp_xlsx = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    temp_xlsx_path = temp_xlsx.name
    temp_xlsx.close()
    shutil.copy2(xlsx_path, temp_xlsx_path)

    # ✅ ลบทั้งไฟล์ต้นฉบับและ temp file หลังส่งเสร็จ
    @after_this_request
    def cleanup(response):
        try:
            # ลบไฟล์ต้นฉบับ
            if os.path.exists(xlsx_path):
                os.remove(xlsx_path)
            # ลบ temp file
            if os.path.exists(temp_xlsx_path):
                os.remove(temp_xlsx_path)
        except Exception as e:
            print(f"Cleanup Excel error: {e}")
        return response

    return send_file(
        temp_xlsx_path,
        as_attachment=True,
        download_name="DataImport.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


if __name__ == "__main__":
    app.run(debug=True)