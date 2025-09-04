import { useEffect, useState, useMemo } from "react";
import { Table, Modal, Button, Input, Select, message, Pagination } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");

import { GetCategory } from "../../services/https/NotificaltionProduct/index";
import { GetSupplySelect } from "../../services/https/ShowProduct/index";
import { GetProductPDF } from "../../services/https/CreatePDF";

import {
  FilterOutlined,
  SearchOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import pdfFonts from "../../../pdfmake/vfs_fonts";
import pdfMake from "pdfmake/build/pdfmake";

import type { Category } from "../../interfaces/Category";
import type { SupplySelect } from "../../interfaces/Supply";
import type { ProductPDF } from "../../interfaces/Product";
import type { SelectedOrderPdf } from "../../interfaces/Product";
import generateOrderPDF from "../../utils/generateOrderPDF";
import groupOrdersBySupplier from "../../utils/groupOrdersBySupplier";
import type { MultiOrderBillInput } from "../../interfaces/OderProduct";
import { AddOrderBillWithProducts } from "../../services/https/CreatePDF";
import { GetUnitPerQuantity } from "../../services/https/index";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";

import "./index.css";

const { Option } = Select;

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

const OrderTable = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [unitPerQuantity, setUnitPerQuantity] = useState<
    UnitPerQuantityInterface[]
  >([]);
  const [supplySelect, setSupplySelect] = useState<SupplySelect[]>([]);
  const [productPDF, setProductPDF] = useState<ProductPDF[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);

  //เก็บหน้าปัจจุบันของ modal
  const [modalPage, setModalPage] = useState(1);

  // สำหรับ search + filter
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedSupply, setSelectedSupply] = useState<string | undefined>(
    undefined
  );

  // ฟังก์ชันดึงข้อมูล
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
  const fetchProductPDF = async () => {
    try {
      const response = await GetProductPDF();
      console.log("Response from ProductPDF:", response);
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log("ProductPDF fetched:", response.data);
        setProductPDF(response.data);
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

  const fetchUnitPerQuantity = async () => {
    try {
      const response = await GetUnitPerQuantity();
      console.log("Response from GetUnitPerQuantity:", response);

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log("UnitPerQuantity fetched:", response.data);
        setUnitPerQuantity(response.data);
      } else if (response && response.error) {
        message.error(response.error);
      } else {
        message.error("ไม่สามารถดึงข้อมูลหน่วยได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลหน่วย");
      console.error(error);
    }
  };

  const grouped = Object.entries(groupOrdersBySupplier(selectedOrders));
  const [supplier, orders]: any = grouped[modalPage - 1] || [];
  console.log("orders---", orders);

  useEffect(() => {
    fetchCategory();
    fetchSupplySeleact();
    fetchProductPDF();
    fetchUnitPerQuantity();
  }, []);

  // 🟢 Filter ข้อมูลก่อนแสดงใน Table
  const filteredData = useMemo(() => {
    return productPDF.filter((item) => {
      const matchSearch =
        item.supply_product_code.toLowerCase().includes(searchText.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchText.toLowerCase());

      const matchCategory = selectedCategory
        ? item.category_name === selectedCategory
        : true;
      const matchSupply = selectedSupply
        ? item.supply_name === selectedSupply
        : true;

      return matchSearch && matchCategory && matchSupply;
    });
  }, [productPDF, searchText, selectedCategory, selectedSupply]);

  // Table columns
  const columns = [
    {
      title: "ลำดับ",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "รหัสสินค้าบริษัทขายส่ง",
      dataIndex: "supply_product_code",
      key: "supply_product_code",
      width: 130,
    },
    {
      title: "ชื่อสินค้า",
      dataIndex: "product_name",
      key: "product_name",
      width: 150,
    },
    {
      title: "จำนวนคงเหลือ",
      dataIndex: "quantity",
      key: "quantity",
      width: 130,
    },
    {
      title: "หน่วย",
      dataIndex: "name_of_unit",
      key: "name_of_unit",
      width: 100,
    },
    {
      title: "ชื่อบริษัทขายส่ง",
      dataIndex: "supply_name",
      key: "supply_name",
      width: 150,
    },
    {
      title: "วันที่นำเข้า",
      dataIndex: "date_import",
      key: "date_import",
      sorter: (a: any, b: any) =>
        dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
      with: 80,
      render: (text: string) => {
        const date = dayjs(text);
        const buddhistYear = date.year() + 543;
        return `${date.date()} ${date.format(
          "MMMM"
        )} ${buddhistYear} เวลา ${date.format("HH:mm")} น.`;
      },
    },
    {
      title: "ดำเนินการ",
      width: 300,
      render: (_: any, record: ProductPDF) => {
        const currentOrder = selectedOrders.find(
          (o) => o.product_id === record.product_id
        );

        const isSelected = !!currentOrder;

        return isSelected ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              width: 300,
            }}
          >
            <Input
              type="number"
              placeholder="จำนวน"
              style={{ width: 80 }}
              value={currentOrder?.orderQuantity || 0}
              onChange={(e) =>
                setSelectedOrders((prev) =>
                  prev.map((o) =>
                    o.product_id === record.product_id
                      ? { ...o, orderQuantity: Number(e.target.value) }
                      : o
                  )
                )
              }
            />
            <Select
              style={{
                width: 100,
              }}
              status={
                currentOrder &&
                (!currentOrder.unit || currentOrder.unit.trim() === "")
                  ? "error"
                  : undefined
              }
              placeholder="หน่วย"
              value={currentOrder?.unit || undefined}
              onChange={(value) =>
                setSelectedOrders((prev) =>
                  prev.map((o) =>
                    o.product_id === record.product_id
                      ? { ...o, unit: value }
                      : o
                  )
                )
              }
              options={unitPerQuantity.map((u) => ({
                value: u.NameOfUnit,
                label: u.NameOfUnit,
              }))}
            />
            {/* ปุ่มลบ สำหรับยกเลิก row */}
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() =>
                setSelectedOrders((prev) =>
                  prev.filter((o) => o.product_id !== record.product_id)
                )
              }
            >
              ลบ
            </Button>
          </div>
        ) : (
          <Button
            onClick={() =>
              setSelectedOrders((prev) => [
                ...prev,
                { ...record, orderQuantity: 1, unit: undefined },
              ])
            }
          >
            สั่งซื้อ
          </Button>
        );
      },
    },
  ];

  const addOrderBill = async (data: MultiOrderBillInput) => {
    try {
      const response = await AddOrderBillWithProducts(data);

      if (response && response.error) {
        message.error(response.error);
      } else {
        message.success("เพิ่มใบสั่งซื้อสำเร็จ");
        setSelectedOrders([]); // ล้างข้อมูลหลังบันทึกสำเร็จ
      }
    } catch (error: any) {
      console.error("addOrderBill error:", error);
      message.error(error.error || "เกิดข้อผิดพลาดในการเพิ่มใบสั่งซื้อ");
    }
  };
  // สร้าง PDF
  const handleConfirm = async () => {
    const invalidOrders = selectedOrders.filter((o) => !o.unit);
    if (invalidOrders.length > 0) {
      message.error("กรุณาเลือกหน่วยในรายการที่ยังว่าง");
      return;
    }
    setIsModalOpen(false);

    try {
      if (selectedOrders.length === 0) {
        message.warning("กรุณาเลือกสินค้าก่อนสร้างใบสั่งซื้อ");
        return;
      }
      // สร้าง map ของหน่วย -> ID
      const unitMap = unitPerQuantity.reduce<Record<string, number>>(
        (acc, u) => {
          if (u.NameOfUnit) acc[u.NameOfUnit] = u.ID;
          return acc;
        },
        {}
      );

      // แบ่ง selectedOrders ตาม supplier
      const ordersBySupplier: Record<number, typeof selectedOrders> = {};
      selectedOrders.forEach((o) => {
        if (!ordersBySupplier[o.supply_id]) ordersBySupplier[o.supply_id] = [];
        ordersBySupplier[o.supply_id].push(o);
      });

      const multiOrderData: MultiOrderBillInput = {
        employee_id: 1, // ตัวอย่าง
        orders: Object.values(
          selectedOrders.reduce(
            (acc: Record<string, typeof selectedOrders>, o) => {
              if (!acc[o.supply_name]) acc[o.supply_name] = [];
              acc[o.supply_name].push(o);
              return acc;
            },
            {}
          )
        ).map((items) => ({
          employee_id: 1,
          supply_id:
            supplySelect.find((s) => s.SupplyName === items[0].supply_name)
              ?.ID ?? 0,
          description: `สั่งซื้อจาก supplier ${items[0].supply_name}`,
          products: items.map((o) => ({
            product_id: o.product_id,
            unit_per_quantity_id: unitMap[o.unit] ?? 0,
            quantity: o.orderQuantity,
          })),
        })),
      };

      await addOrderBill(multiOrderData);

      const pdfDocGenerator: SelectedOrderPdf[] = [...selectedOrders];
      console.log("pdfDocGenerator =:", pdfDocGenerator);
      generateOrderPDF(pdfDocGenerator);
      setSelectedOrders([]);
    } catch (error: any) {
      console.error("handleConfirm error:", error);
      message.error(error.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
    }
  };

  return (
    <div
      style={{
        padding: 24,
        background: "#d3d3d3",
        minHeight: "100vh",
        minWidth: "1000px",
      }}
    >
      {/* Header */}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 60,
              padding: "0 20px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <h1 style={{ margin: 0, fontSize: "36px" }}>
              สร้างใบสั่งซื้อสินค้า
            </h1>
          </div>
        </div>

        {/* Filter/Search */}
        <div
          className="block-filter"
          style={{
            marginTop: 20,
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <Input
            placeholder="ค้นหาโค้ดสินค้า หรือ ชื่อสินค้า"
            allowClear
            style={{ width: 833, height: 50, borderRadius: 50 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
            allowClear
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value)}
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
            allowClear
            value={selectedSupply}
            onChange={(value) => setSelectedSupply(value)}
          >
            {supplySelect.map((sup) => (
              <Option key={sup.ID} value={sup.SupplyName}>
                {sup.SupplyName}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div style={{ marginTop: 20 }}>
        <Table
          dataSource={filteredData}
          rowKey="id"
          columns={columns}
          pagination={false}
          scroll={{ y: window.innerHeight * 0.6 }} // 60% ของความสูงหน้าจอ
          bordered={false}
          rowClassName={() => "custom-row"}
        />
      </div>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null} // ปิด footer default
        width={900}
        title="ยืนยันรายการสั่งซื้อ"
      >
        {supplier && (
          <div style={{ marginBottom: 24 }}>
            <p>วันที่ : {dayjs().format("DD/MM/YYYY")}</p>
            <p>ชื่อบริษัทขายส่ง : {supplier}</p>
            <Table
              dataSource={orders}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 300 }} // ~7 row (ปรับได้)
              style={{ minHeight: 200 }}
              columns={[
                {
                  title: "ลำดับ",
                  render: (_: any, __: any, i: number) => i + 1,
                },
                { title: "รหัสสินค้าบริษัทขายส่ง", dataIndex: "supply_product_code" },
                { title: "ชื่อสินค้า", dataIndex: "product_name" },
                { title: "จำนวนที่สั่ง", dataIndex: "orderQuantity" },
                {
                  title: "หน่วย",
                  dataIndex: "unit",
                  render: (_: string, record: any) => {
                    if (!record.unit || record.unit.trim() === "") {
                      return (
                        <span style={{ color: "red" }}>กรุณาเลือกหน่วย</span>
                      );
                    }
                    return record.unit;
                  },
                },
              ]}
            />
          </div>
        )}

        {/* Pagination สำหรับเปลี่ยนบริษัท */}
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
        >
          <Pagination
            current={modalPage}
            pageSize={1} // 1 บริษัทต่อหน้า
            total={grouped.length}
            onChange={(p: any) => setModalPage(p)}
          />
        </div>

        {/* ปุ่มยืนยัน/ยกเลิก */}
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <Button
            onClick={() => setIsModalOpen(false)}
            style={{ marginRight: 8 }}
          >
            ยกเลิก
          </Button>
          <Button type="primary" onClick={handleConfirm}>
            ยืนยัน
          </Button>
        </div>
      </Modal>

      {/* ปุ่ม */}
      <div style={{ textAlign: "right", marginTop: 20 }}>
        <Button
          style={{ marginRight: 8, borderRadius: 50, color: "red", height: 40 }}
          onClick={() => setSelectedOrders([])}
        >
          ล้างข้อมูล
        </Button>
        <Button
          type="primary"
          style={{ borderRadius: 50, height: 40 }}
          onClick={() => setIsModalOpen(true)}
          disabled={selectedOrders.length === 0}
        >
          ยืนยันการสั่งซื้อ
        </Button>
      </div>
    </div>
  );
};

export default OrderTable;
