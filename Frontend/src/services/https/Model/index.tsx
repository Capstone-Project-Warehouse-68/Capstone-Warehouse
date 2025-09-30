// services/api.ts

const apiUrl = "http://127.0.0.1:5000";

async function uploadPdfForOcr(file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiUrl}/ocr`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json(); // ✅ parse JSON
      return data;
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error: any) {
    console.error("Error Upload PDF for OCR:", error);
    throw new Error(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
  }
}

/**
 * ดาวน์โหลดไฟล์ Excel ที่สร้างไว้แล้ว
 * @returns Promise<Blob> - ไฟล์ Excel
 */
async function downloadExcel(): Promise<Blob> {
  try {
    const response = await fetch(`${apiUrl}/download_excel`, {
      method: "GET",
    });

    if (response.ok) {
      const blob = await response.blob();
      return blob;
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error: any) {
    console.error("Error Download Excel:", error);
    throw new Error(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
  }
}

/**
 * Helper function: ดาวน์โหลดไฟล์ Blob ลงเครื่อง
 */
function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Export API Service
export {
  uploadPdfForOcr,
  downloadExcel,
  downloadBlobAsFile,
};