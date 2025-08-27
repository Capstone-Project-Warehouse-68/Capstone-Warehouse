import { useState } from "react";
import { Table, Modal, Button, Input, Select } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");
import { GetCategory } from "../../services/https/NotificaltionProduct/index";
const { Option } = Select;
import type { CategoryInterface } from "../../interfaces/Category";
import pdfFonts from "../../../pdfmake/vfs_fonts"; 
import pdfMake from "pdfmake/build/pdfmake";
pdfMake.vfs = pdfFonts.vfs;
pdfMake.fonts = {
  THSarabunNew: {
    normal: "THSarabunNew.ttf",
    bold: "THSarabunNew-Bold.ttf",
    italics: "THSarabunNew-Italic.ttf",
    bolditalics: "THSarabunNew-BoldItalic.ttf",
  },
};






const OrderTable = () => {
  const [categories, setCategories] = useState<CategoryInterface[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
  const data = [
    {
      id: 1,
      code: "C001",
      name: "ลูกปืน",
      stock: 50,
      supplier: "บริษัท A",
      importDate: "2025-08-01",
    },
    {
      id: 2,
      code: "C002",
      name: "เบรก",
      stock: 30,
      supplier: "บริษัท B",
      importDate: "2025-08-05",
    },
  ];

  const columns = [
    { title: "ลำดับ", render: (_: any, __: any, i: number) => i + 1 },
    { title: "รหัสสินค้า", dataIndex: "code" },
    { title: "ชื่อสินค้า", dataIndex: "name" },
    { title: "จำนวนคงเหลือ", dataIndex: "stock" },
    { title: "ชื่อบริษัทขายส่ง", dataIndex: "supplier" },
    { title: "วันที่นำเข้า", dataIndex: "importDate" },
    {
      title: "ดำเนินการ",
      render: (_: any, record: any) => {
        const isSelected = selectedOrders.find((o) => o.id === record.id);
        return isSelected ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              type="number"
              placeholder="จำนวน"
              onChange={(e) => {
                setSelectedOrders((prev) =>
                  prev.map((o) =>
                    o.id === record.id
                      ? { ...o, orderQuantity: e.target.value }
                      : o
                  )
                );
              }}
            />
            <Select
              style={{ width: 80 }}
              placeholder="หน่วย"
              onChange={(value) => {
                setSelectedOrders((prev) =>
                  prev.map((o) =>
                    o.id === record.id ? { ...o, unit: value } : o
                  )
                );
              }}
              options={[
                { value: "ชิ้น", label: "ชิ้น" },
                { value: "กล่อง", label: "กล่อง" },
              ]}
            />
          </div>
        ) : (
          <Button
            onClick={() =>
              setSelectedOrders([...selectedOrders, { ...record }])
            }
          >
            สั่งซื้อ
          </Button>
        );
      },
    },
  ];

const handleConfirm = () => {
  setIsModalOpen(false);

  // เตรียม content ของ PDF
  const content: any[] = [
    { text: 'ใบสั่งซื้อสินค้า', style: 'header' }
  ];

  // รวมรายการสั่งซื้อแยกตาม supplier
  const ordersBySupplier = selectedOrders.reduce((acc: any, item) => {
    if (!acc[item.supplier]) acc[item.supplier] = [];
    acc[item.supplier].push(item);
    return acc;
  }, {});

  Object.entries(ordersBySupplier).forEach(([supplier, orders]: any) => {
    // ใส่หัวข้อ supplier + วันที่
    content.push({
      text: `บริษัทขายส่ง: ${supplier} วันที่: ${dayjs().format('DD/MM/YYYY')}`,
      style: 'subheader'
    });

    // ใส่ตารางรายการสั่งซื้อ
    content.push({
      table: {
        widths: ['auto', '*', '*', 'auto', 'auto'],
        body: [
          ['ลำดับ', 'รหัสสินค้า', 'ชื่อสินค้า', 'จำนวน', 'หน่วย'],
          ...orders.map((o: any, i: number) => [
            i + 1,
            o.code,
            o.name,
            o.orderQuantity,
            o.unit
          ])
        ]
      }
    });
  });

  // สร้างและดาวน์โหลด PDF
  pdfMake.createPdf({
    content,
    defaultStyle: { font: 'THSarabunNew' },
    styles: {
      header: { fontSize: 18, bold: true, alignment: 'center' },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
    }
  }).download('Order.pdf');
};


  return (
    <div>
      <div
        className="header"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: 16,
          width: "100%",
          height: "50px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" , height : "20px"}}>
            <h1 style={{fontSize:"20px"}}>สร้างใบสั่งซื้อสินค้า</h1>
        </div>
        <div
          style={{
            width: "500px",
            marginLeft: 10,
            marginTop:10,
            justifyItems: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <Input placeholder="ค้นหา" width={200}/>
          <Select
            placeholder="เลือกประเภทสินค้า"
            style={{ width: 200 ,marginLeft:10}}
            onChange={(value) => console.log("เลือก:", value)}
          >
            <Option value="all">ทั้งหมด</Option>
            {categories.map((cat) => (
              <Option key={cat.ID} value={String(cat.ID)}>
                {cat.CategoryName}
              </Option>
            ))}
          </Select>
        </div>

      </div>
      <div className="layout" style={{marginTop:10,}}>
             <Table dataSource={data} rowKey="id" columns={columns} />
             <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleConfirm}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        title="ยืนยันรายการสั่งซื้อ"
      >
        {Object.entries(
          selectedOrders.reduce((acc: any, item) => {
            if (!acc[item.supplier]) acc[item.supplier] = [];
            acc[item.supplier].push(item);
            return acc;
          }, {})
        ).map(([supplier, orders]: any) => (
          <div key={supplier} style={{ marginBottom: 24 }}>
            <p>วันที่ : {dayjs().format("DD/MM/YYYY")}</p>
            <p>ชื่อบริษัทขายส่ง : {supplier}</p>
            <Table
              dataSource={orders}
              pagination={false}
              rowKey="id"
              columns={[
                { title: "ลำดับ", render: (_: any, __: any, i: number) => i + 1 },
                { title: "รหัสสินค้า", dataIndex: "code" },
                { title: "ชื่อสินค้า", dataIndex: "name" },
                { title: "จำนวนที่สั่ง", dataIndex: "orderQuantity" },
                { title: "หน่วย", dataIndex: "unit" },
              ]}
              size="small"
            />
          </div>
        ))}
      </Modal>

      <Button type="primary" onClick={() => setIsModalOpen(true)} disabled={selectedOrders.length === 0}>
        ยืนยันการสั่งซื้อ
      </Button>
      </div>
     
    </div>
  );
};
export default OrderTable;
