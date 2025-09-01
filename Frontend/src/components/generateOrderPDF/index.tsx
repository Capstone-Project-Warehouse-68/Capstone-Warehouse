// Frontend/src/components/generateOrderPDF/index.tsx
import pdfFonts from "../../../pdfmake/vfs_fonts";
import pdfMake from "pdfmake/build/pdfmake";
import groupOrdersBySupplier from "../../utils/groupOrdersBySupplier";
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
  const content: any[] = [{ text: "ใบสั่งซื้อสินค้า", style: "header" }];
  const ordersBySupplier = groupOrdersBySupplier(orders);

  Object.entries(ordersBySupplier).forEach(([supplier, orders]: any) => {
    content.push({
      text: `บริษัทขายส่ง: ${supplier} วันที่: ${dayjs().format("DD/MM/YYYY")}`,
      style: "subheader",
    });
    content.push({
      table: {
        widths: ["auto", "*", "*", "auto", "auto"],
        body: [
          ["ลำดับ", "รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "หน่วย"],
          ...orders.map((o: any, i: number) => [
            i + 1,
            o.product_code,
            o.product_name,
            o.orderQuantity,
            o.unit,
          ]),
        ],
      },
    });
  });

  pdfMake
    .createPdf({
      content,
      defaultStyle: { font: "THSarabunNew" },
      styles: {
        header: { fontSize: 18, bold: true, alignment: "center" },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      },
    })
    .open();
};

export default generateOrderPDF;
