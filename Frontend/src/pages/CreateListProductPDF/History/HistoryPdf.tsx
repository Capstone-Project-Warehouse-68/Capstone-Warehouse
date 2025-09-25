import { useEffect, useState } from "react";
import HistoryIcon from '@mui/icons-material/History';
import {
  Table,
  Modal,
  Button,
  message,
  DatePicker,
  ConfigProvider,
} from "antd";
import generateOrderPDF from "../../../utils/generateOrderPDF";
import type { SelectedOrderPdf } from "../../../interfaces/Product";
import {
  EyeOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { OrderBill } from "../../../interfaces/OrderBill";
import {
  GetAllOrderBills,
  DeleteOrderBill,
} from "../../../services/https/CreatePDF";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");
import thTH from "antd/es/locale/th_TH";

const HistoryPdf = () => {
  const [orderBills, setOrderBills] = useState<OrderBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<OrderBill[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);

  const fetchOrderBills = async () => {
    setLoading(true);
    try {
      const response = await GetAllOrderBills();
      console.log("Response from OrderBills:", response);
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log("OrderBills fetched:", response.data);
        setOrderBills(response.data);
        setFilteredBills(response.data);
      } else if (response && response.error) {
        message.error(response.error);
      } else {
        message.error("ไม่สามารถดึงข้อมูลใบสั่งซื้อได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลใยสั่งซื้อ");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const DeleteHistory = async (id: number) => {
    try {
      const result = await DeleteOrderBill(id);
      if (result.error) {
        console.error("Delete failed:", result.error);
        message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      } else {
        console.log("Delete successful:", result.message);
        message.success(result.message);
      }
    } catch (error: unknown) {
      console.error("Unexpected error:", error);
      message.error("เกิดข้อผิดพลาดที่ไม่ทราบ");
    }
    fetchOrderBills();
  };

  useEffect(() => {
    fetchOrderBills();
  }, []);

  const CreatePdf = (record: OrderBill) => {
    // สร้าง array สำหรับ PDF
    let allProducts: SelectedOrderPdf[] = [];

    // ใส่ products ปกติ
    if (record.products && record.products.length > 0) {
      allProducts = record.products.map((p) => ({
        category_name: p.category_name,
        date_import: record.updated_at,
        name_of_unit: p.unit_name,
        orderQuantity: p.quantity,
        supply_product_code: p.supply_product_code,
        product_id: p.product_id,
        product_name: p.product_name,
        quantity: p.quantity,
        supply_name: record.supply_name,
        unit: p.unit_name,
        supply_id: record.supply_id,
      }));
    }

    // ต่อท้าย products_draft ถ้ามี
    if (record.products_draft && record.products_draft.length > 0) {
      const draftProducts = record.products_draft.map((p) => ({
        category_name: p.category_name,
        date_import: record.updated_at,
        name_of_unit: p.unit_draf_name,
        orderQuantity: p.quantity,
        supply_product_code: "-", // draft ไม่มีรหัส
        product_id: 0, // draft ไม่มี ID
        product_name: p.product_draft_name,
        quantity: p.quantity,
        supply_name: p.supply_draft_name, // ใช้ชื่อ supplier ของ draft
        unit: p.unit_draf_name,
        supply_id: record.supply_id,
      }));

      allProducts = allProducts.concat(draftProducts);
    }

    console.log("data for pdf", allProducts);
    generateOrderPDF(allProducts);
  };

  const columns = [
    {
      title: "รหัสใบสั่งซื้อ",
      dataIndex: "order_bill_id",
      key: "order_bill_id",
      sorter: (a: { order_bill_id: number }, b: { order_bill_id: number }) =>
        a.order_bill_id - b.order_bill_id,
    },
    {
      title: "วันที่ทำรายการ",
      dataIndex: "updated_at",
      sorter: (a: any, b: any) =>
        dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
      key: "updated_at",
      render: (text: string) => {
        const date = dayjs(text);
        const buddhistYear = date.year() + 543;
        return `${date.date()} ${date.format(
          "MMMM"
        )} ${buddhistYear} เวลา ${date.format("HH:mm")} น.`;
      },
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
      render: (text: string | null | undefined) => text || "-",
    },
    {
      title: "ดูรายละเอียด",
      key: "actionView",
      render: (_: any, record: OrderBill) => (
        <Button
          id={`view-details-button-${record.order_bill_id}`} // 🔹 ใช้ id unique
          icon={<EyeOutlined />}
          onClick={() => {
            Modal.info({
              title: `รายละเอียดใบสั่งซื้อ #${record.order_bill_id}`,
              content: (
                <div>
                  <p>บริษัท: {record.supply_name}</p>
                  <p>รายละเอียด: {record.description}</p>
                  <p>
                    วันที่:{" "}
                    {dayjs(record.updated_at).format("DD/MM/YYYY HH:mm")}
                  </p>
                  <Table
                    dataSource={[
                      ...(record.products || []),
                      ...(record.products_draft || []).map((p) => ({
                        product_id: 0,
                        product_name: p.product_draft_name || "-",
                        quantity: p.quantity,
                        unit_name: p.unit_draf_name,
                        supply_product_code: "-",
                        category_name: p.category_name || "-",
                        isDraft: true,
                      })),
                    ]}
                    rowKey={(item) => `${item.product_id}-${item.product_name}`}
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: "รหัสสินค้า",
                        dataIndex: "supply_product_code",
                        key: "supply_product_code",
                        render: (_, record) =>
                          (record as any).isDraft
                            ? "ยังไม่มีสินค้าจริง"
                            : record.supply_product_code,
                      },
                      {
                        title: "ชื่อสินค้า",
                        dataIndex: "product_name",
                        key: "product_name",
                      },
                      {
                        title: "จำนวน",
                        dataIndex: "quantity",
                        key: "quantity",
                      },
                      {
                        title: "หน่วย",
                        dataIndex: "unit_name",
                        key: "unit_name",
                      },
                      {
                        title: "ประเภท",
                        dataIndex: "category_name",
                        key: "category_name",
                      },
                    ]}
                  />
                </div>
              ),
              width: 700,
            });
          }}
        />
      ),
    },
    {
      title: "พิมพ์ใบสั่งซื้อ",
      key: "actionPrint",
      render: (_: any, record: OrderBill) => (
        <Button id={`print-order-button-${record.order_bill_id}`} // 🔹 ใช้ id unique
        icon={<FilePdfOutlined />} onClick={() => CreatePdf(record)}>
          PDF
        </Button>
      ),
    },
    {
      title: "ลบใบสั่งซื้อ",
      key: "actionDelete",
      render: (_: any, record: OrderBill) => (
        <Button
          id={`delete-order-button-${record.order_bill_id}`} // 🔹 ใช้ id unique
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: "ยืนยันการลบ",
              content: `คุณต้องการลบใบสั่งซื้อรหัสรายการ #${record.order_bill_id} ใช่หรือไม่?`,
              onOk: () => {
                DeleteHistory(record.order_bill_id);
              },
            });
          }}
        />
      ),
    },
  ];

  // ฟังก์ชันกรองตามวันและเดือน
  const filterOrders = (day: Dayjs | null, month: Dayjs | null) => {
    let filtered = [...orderBills];
    if (day) {
      filtered = filtered.filter((bill) =>
        dayjs(bill.updated_at).isSame(day, "day")
      );
    }
    if (month) {
      filtered = filtered.filter((bill) =>
        dayjs(bill.updated_at).isSame(month, "month")
      );
    }
    setFilteredBills(filtered);
  };

  const handleDayChange = (date: Dayjs | null) => {
    setSelectedDay(date);
    filterOrders(date, selectedMonth);
  };

  const handleMonthChange = (date: Dayjs | null) => {
    setSelectedMonth(date);
    filterOrders(selectedDay, date);
  };
  return (
    <div
      className="layout"
      style={{
        background: "#d3d3d3",
        height: "100vh",
        minWidth: "1000px",
        padding: 24,
      }}
    >
      <div
        className="header"
        style={{ height: "130px", alignItems: "center", display: "block" }}
      >
        <div
          className="sub-header"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <div
            className="title"
            style={{
              backgroundColor: "#2980B9",
              color: "white",
              borderRadius: 50,
              fontWeight: "bold",
              textAlign: "center",
              height: "60px",
              padding: "0 20px",
              display: "flex", // ใช้ flex
              alignItems: "center", // vertical center
              justifyContent: "center", // horizontal center
              gap: "8px", // ช่องว่างระหว่าง icon กับ text
              fontSize: "30px", // ขนาดตัวอักษร
            }}
          >
            <HistoryIcon/>
              ประวัติรายการสั่งซื้อสินค้า
            
          </div>
        </div>
        <div
          className="block-filter"
          style={{
            marginTop: 20,
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <ConfigProvider locale={thTH}>
            <DatePicker
              id="date-picker-day"
              style={{ height: 50, width: 150, borderRadius: 50 }}
              value={selectedDay}
              onChange={handleDayChange}
              format="DD/MM/YYYY"
              placeholder="เลือกวันที่"
            />
            <DatePicker
              id="date-picker-month"
              style={{ height: 50, width: 150, borderRadius: 50 }}
              value={selectedMonth}
              onChange={handleMonthChange}
              picker="month"
              format="MM/YYYY"
              placeholder="เลือกเดือน"
            />
          </ConfigProvider>
        </div>
      </div>
      <div className="content" style={{ marginTop: 20 }}></div>
      <div className="table" style={{}}>
        <Table
          columns={columns}
          dataSource={filteredBills}
          rowKey="order_bill_id"
          loading={loading}
          className="custom-table"
          pagination={{ pageSize: 5 }}
        />
      </div>
    </div>
  );
};
export default HistoryPdf;
