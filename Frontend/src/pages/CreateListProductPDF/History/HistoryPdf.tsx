import { useEffect, useState, useMemo } from "react";
import { Table, Modal, Button, message, DatePicker , ConfigProvider} from "antd";
import generateOrderPDF from "../../../utils/generateOrderPDF";
import {
  EyeOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { OrderBill } from "../../../interfaces/OrderBill";
import { GetAllOrderBills } from "../../../services/https/CreatePDF";
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

  useEffect(() => {
    fetchOrderBills();
  }, []);

  const columns = [
    {
      title: "รหัสใบสั่งซื้อ",
      dataIndex: "order_bill_id",
      key: "order_bill_id",
    },
    {
      title: "วันที่ทำรายการ",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (text: string) => {
        const date = dayjs(text);
        const buddhistYear = date.year() + 543;
         return `${date.date()} ${date.format("MMMM")} ${buddhistYear} เวลา ${date.format("HH:mm")} น.`;
      },
    },
    {
      title: "คำอธิบาย",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "ดูรายละเอียด",
      key: "actionView",
      render: (_: any, record: OrderBill) => (
        <Button
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
                    dataSource={record.products}
                    rowKey="product_id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: "รหัสสินค้า",
                        dataIndex: "product_id",
                        key: "product_id",
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
        <Button
          icon={<FilePdfOutlined />}
          onClick={() => generateOrderPDF(record.products)}
        >
          PDF
        </Button>
      ),
    },
    {
    title: "ลบใบสั่งซื้อ",
    key: "actionDelete",
    render: (_: any, record: OrderBill) => (
      <Button
        danger
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: "ยืนยันการลบ",
            content: `คุณต้องการลบใบสั่งซื้อ #${record.order_bill_id} ใช่หรือไม่?`,
            onOk: () => {
              setOrderBills((prev) =>
                prev.filter((o) => o.order_bill_id !== record.order_bill_id)
              );
              message.success("ลบใบสั่งซื้อเรียบร้อย");
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
              ประวัติรายการสั่งซื้อสินค้า
            </h1>
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
            value={selectedDay}
            onChange={handleDayChange}
            format="DD/MM/YYYY"
            placeholder="เลือกวันที่"
          />
          <DatePicker
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
          pagination={{ pageSize: 5 }}
        />
      </div>
    </div>
  );
};
export default HistoryPdf;
