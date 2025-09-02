// Frontend/src/components/generateOrderPDF/index.tsx
import pdfFonts from "../../pdfmake/vfs_fonts";
import pdfMake from "pdfmake/build/pdfmake";
import groupOrdersBySupplier from "./groupOrdersBySupplier";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");

// กำหนดฟอนต์ไทยสำหรับ pdfMake
pdfMake.vfs = pdfFonts.vfs;
pdfMake.fonts = {
  THSarabunNew: {
    normal: "THSarabunNew.ttf",
    bold: "THSarabunNew-Bold.ttf",
    italics: "THSarabunNew-Italic.ttf",
    bolditalics: "THSarabunNew-BoldItalic.ttf",
  },
};

const generateOrderPDF = (orders: any[]) => {
  const ordersBySupplier = groupOrdersBySupplier(orders);

  Object.entries(ordersBySupplier).forEach(
    ([supplier, supplierOrders]: any) => {
      const content: any[] = [
      { text: "ใบสั่งซื้อสินค้า", style: "header" },
      { text: `บริษัทขายส่ง: ${supplier}`, style: "subheader" },
      { text: `วันที่: ${dayjs().format("DD/MM/YYYY")}`, style: "date" },
      {
        table: {
          widths: ["auto", "auto", "*", "auto", "auto"],
          body: [
            [
              { text: "ลำดับ", fontSize: 14, bold: true },
              { text: "รหัสสินค้า", fontSize: 14, bold: true },
              { text: "ชื่อสินค้า", fontSize: 14, bold: true },
              { text: "จำนวน", fontSize: 14, bold: true },
              { text: "หน่วย", fontSize: 14, bold: true },
            ],
            ...supplierOrders.map((o: any, i: number) => [
              { text: i + 1, fontSize: 12 },
              { text: o.product_code, fontSize: 12 },
              { text: o.product_name, fontSize: 12 },
              { text: o.orderQuantity, fontSize: 12 },
              { text: o.unit, fontSize: 12 },
            ]),
          ],
        },
        layout: "lightHorizontalLines", // ใส่เส้นขอบสวย ๆ
      },
    ];
      

      const fileName = `รายการสั่งซื้อ_${supplier}_${dayjs().format(
        "DD-MM-YYYY"
      )}.pdf`;

      // เพิ่ม timeout เล็กน้อย เพื่อให้ browser โหลดไฟล์ต่อเนื่องกันได้
      pdfMake
        .createPdf({
          content,
          defaultStyle: { font: "THSarabunNew" },
          styles: {
            header: { fontSize: 18, bold: true, alignment: "center" },
            subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
          },
        })
        .getBlob((blob: any) => {
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank"); // เปิด PDF
          const a = document.createElement("a"); // ดาวน์โหลด
          a.href = url;
          a.download = fileName;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 500);
        });
    }
  );
};

export default generateOrderPDF;
