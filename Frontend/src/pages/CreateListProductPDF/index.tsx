import { useEffect, useState } from "react";
import { Table, Modal, Button, Input, Select, message } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");
import { GetCategory } from "../../services/https/NotificaltionProduct/index";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
const { Option } = Select;
import type { Category } from "../../interfaces/Category";
import pdfFonts from "../../../pdfmake/vfs_fonts";
import pdfMake from "pdfmake/build/pdfmake";
import { GetSupplySelect } from "../../services/https/ShowProduct/index";
import type { SupplySelect } from "../../interfaces/Supply";
import type { ProductPDF } from "../../interfaces/Product";
import { GetProductPDF } from "../../services/https/CreatePDF";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
  const [supplySelect, setSupplySelect] = useState<SupplySelect[]>([]);
  const [productPDF, setProductPDF] = useState<ProductPDF[]>([]);

  const fetchCategory = async () => {
    try {
      const response = await GetCategory();
      console.log("Response from GetCategory:", response);
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log("Categories fetched:", response.data);
        setCategories(response.data);
      } else if (response && response.error) {
        message.error(response.error);
      } else {
        message.error("ไม่สามารถดึงข้อมูลประเภทสินค้าได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า");
      console.error(error);
    }
  };

  const fetchProductPDF= async () => {
    try {
      const response = await GetProductPDF();
      console.log("Response from GetProductPDF:", response);
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log("GetProductPDF fetched:", response.data);
        setProductPDF(response.data);
      } else if (response && response.error) {
        message.error(response.error);
      } else {
        message.error("ไม่สามารถดึงข้อมูลสินค้าได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
      console.error(error);
    }
  };

  const fetchSupplySeleact = async () => {
    try {
      const response = await GetSupplySelect();
      console.log("Response from Supply:", response);
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log("Supply fetched:", response.data);
        setSupplySelect(response.data);
      } else if (response && response.error) {
        message.error(response.error);
      } else {
        message.error("ไม่สามารถดึงข้อมูลบริษัทได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
      console.error(error);
    }
  };
  useEffect(() => {
    fetchCategory();
    fetchSupplySeleact();
    fetchProductPDF();
  }, []);

  const columns = [
    { title: "ลำดับ",  dataIndex: "id", key: "id" },
    { title: "รหัสสินค้า", dataIndex: "product_code", key: "product_code" },
    { title: "ชื่อสินค้า", dataIndex: "product_name" , key: "product_name" },
    { title: "จำนวนคงเหลือ", dataIndex: "quantity" , key: "quantity" },
    { title: "ชื่อบริษัทขายส่ง", dataIndex: "supply_name" ,  key: "supply_name" },
    { title: "วันที่นำเข้า", dataIndex: "date_import", key: "date_import",
      render: (text: string) => {
            const date = dayjs(text);
            const buddhistYear = date.year() + 543;
            return `${date.date()} ${date.format("MMMM")} ${buddhistYear}`;
          },
     },
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
    const content: any[] = [{ text: "ใบสั่งซื้อสินค้า", style: "header" }];

    // รวมรายการสั่งซื้อแยกตาม supplier
    const ordersBySupplier = selectedOrders.reduce((acc: any, item) => {
      if (!acc[item.supplier]) acc[item.supplier] = [];
      acc[item.supplier].push(item);
      return acc;
    }, {});

    Object.entries(ordersBySupplier).forEach(([supplier, orders]: any) => {
      // ใส่หัวข้อ supplier + วันที่
      content.push({
        text: `บริษัทขายส่ง: ${supplier} วันที่: ${dayjs().format(
          "DD/MM/YYYY"
        )}`,
        style: "subheader",
      });

      // ใส่ตารางรายการสั่งซื้อ
      content.push({
        table: {
          widths: ["auto", "*", "*", "auto", "auto"],
          body: [
            ["ลำดับ", "รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "หน่วย"],
            ...orders.map((o: any, i: number) => [
              i + 1,
              o.code,
              o.name,
              o.orderQuantity,
              o.unit,
            ]),
          ],
        },
      });
    });

    // สร้างและดาวน์โหลด PDF
    // pdfMake.createPdf({
    //   content,
    //   defaultStyle: { font: 'THSarabunNew' },
    //   styles: {
    //     header: { fontSize: 18, bold: true, alignment: 'center' },
    //     subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
    //   }
    // }).download('Order.pdf');
    const docDefinition = {
      content,
      defaultStyle: { font: "THSarabunNew" },
      styles: {
        header: { fontSize: 18, bold: true, alignment: "center" },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      },
    };

    // พรีวิว PDF
    pdfMake.createPdf(docDefinition).open();
  };

  return (
    <div
      className="layout"
      style={{
        padding: 24,
        background: "#d3d3d3",
        minHeight: "100vh",
        minWidth: "1000px",
      }}
    >
      <div className="header" style={{ display: "block", height: 130 }}>
        <div
          className="sub-header"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <div
            className="title"
            style={{
              background: "#2980B9",
              color: "white",
              borderRadius: 50,
              display: "flex", // ใช้ flex
              alignItems: "center", // จัดกลางในแนวตั้ง
              justifyContent: "center", // จัดกลางในแนวนอน
              height: 60,
              padding: "0 20px", // ใช้ padding แทน width คงท
              textAlign: "center",
              flexShrink: 0, // ป้องกัน title ย่อเกินไป
            }}
          >
            <h1 style={{ margin: 0, fontSize: "36px" }}>
              สร้างใบสั่งซื้อสินค้า
            </h1>
          </div>
        </div>
        <div
          className="block-filter"
          style={{
            marginTop: 20,
            justifyContent: "start",
            alignItems: "center",
            display: "flex",
            marginLeft: 0,
            gap: 20,
          }}
        >
          <Input
            id="search-input"
            placeholder="ค้นหาโค้ดสินค้า หรือ ชื่อสินค้า"
            allowClear
            style={{ width: 833, height: 50, borderRadius: 50 }}
            // value={searchText}
            // onChange={handleSearchChange}
            suffix={
              <SearchOutlined style={{ color: "#1890ff", fontSize: 20 }} />
            }
          />
          <Select
            placeholder={
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FilterOutlined style={{ color: "#1890ff" }} />
                เลือกประเภทสินค้า
              </span>
            }
            style={{ width: 300, height: 50, borderRadius: 50 }}
            // value={selectedCategory}
            // onChange={handleCategoryChange}
            allowClear
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.category_name}>
                {cat.category_name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder={
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FilterOutlined style={{ color: "#1890ff" }} />
                เลือกบริษัทขายส่ง
              </span>
            }
            style={{ width: 300, height: 50, borderRadius: 50 }}
            // value={selectedSupply}
            // onChange={handleSupplyChange}
            allowClear
          >
            {supplySelect.map((sup) => (
              <Option key={sup.ID} value={sup.SupplyName}>
                {sup.SupplyName}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="layout" style={{ marginTop: 20 }}>
        <div className="table">
          <Table dataSource={productPDF} rowKey="id" columns={columns} />
        </div>
        <div className="modal-confirmation" style={{}}>
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
                    {
                      title: "ลำดับ",
                      render: (_: any, __: any, i: number) => i + 1,
                    },
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
        </div>

        <div
          className="button-confirm"
          style={{ textAlign: "right", marginTop: 20 }}
        >
          <Button
            style={{ marginRight: 8 , borderRadius: 50, color: 'red',height: 40}}
            >
            ล้างข้อมูล
          </Button>
          <Button
            type="primary"
            style={{ borderRadius: 50, height: 40}}
            onClick={() => setIsModalOpen(true)}
            disabled={selectedOrders.length === 0}
          >
            ยืนยันการสั่งซื้อ
          </Button>
        </div>
      </div>
    </div>
  );
};
export default OrderTable;
