import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Select,
  Modal,
  Space,
  // Typography,
  Form,
  message,
  Tag,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DropboxOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import type { NotificationProduct } from "../../interfaces/NotificationProduct";
import {
  GetLimitQuantity,
  GetCategory,
} from "../../services/https/NotificaltionProduct/index";
import type { Category } from "../../interfaces/Category";
import type { UpdateNotificationProduct } from "../../interfaces/NotificationProduct";
import { UpdateLimitQuantity } from "../../services/https/NotificaltionProduct/index";
import NotificationBell from "../../components/NotificationBell";
import { notifyEvent } from "../../utils/eventBus";
import "./index.css"; // นำเข้าไฟล์ CSS

import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");

// const { Title } = Typography;
const { Option } = Select;

const StockAlertSetting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<NotificationProduct | null>(null);
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<NotificationProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredData, setFilteredData] = useState<NotificationProduct[]>([]);

  const fetchLimitQuantity = async () => {
    try {
      const response = await GetLimitQuantity();
      console.log("Response from GetLimitQuantity:", response);
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        // Assuming response.data is an array of NotificationProduct
        setDataSource(response.data);
        console.log("Data fetched:", response.data);
      } else if (response && response.error) {
        message.error(response.error);
      } else {
        message.error("ไม่สามารถดึงข้อมูลกำหนดการแจ้งเตือนได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      console.error(error);
    }
  };

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

  useEffect(() => {
    fetchLimitQuantity();
    fetchCategory();
  }, []);

  useEffect(() => {
    setFilteredData(dataSource);
  }, [dataSource]);

  // ฟังก์ชันค้นหาแบบ dynamic
  const onSearchDynamic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.trim().toLowerCase();

    if (!searchValue) {
      setFilteredData(dataSource);
      return;
    }

    const filtered = dataSource.filter(
      (item) =>
        item.product_name.toLowerCase().includes(searchValue) ||
        item.product_code.toLowerCase().includes(searchValue)
    );
    setFilteredData(filtered);
  };

  const handleEditClick = (record: NotificationProduct) => {
    setEditingProduct(record);
    console.log("Editing product:", record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingProduct(null);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (editingProduct) {
        const updatedData: UpdateNotificationProduct = {
          product_id: editingProduct.product_id,
          limit_quantity: Number(values.limit_quantity),
        };
        console.log("Updating limit quantity with data:", updatedData);
        LimitQuantity(updatedData);
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingProduct(null);
    });
  };

  const LimitQuantity = async (data: UpdateNotificationProduct) => {
    try {
      const result = await UpdateLimitQuantity(data);
      console.log("Update result:", result);
      if (result && result.status === 200) {
        message.success("อัปเดตจำนวนการแจ้งเตือนเรียบร้อยแล้ว");
        fetchLimitQuantity(); // Refresh the data after update
        notifyEvent("refreshNotifications"); // แจ้งให้ NotificationBell รีเฟรชข้อมูล
      } else if (result && result.error) {
        message.error(result.error);
      } else {
        message.error("ไม่สามารถอัปเดตจำนวนการแจ้งเตือนได้");
        console.error("ไม่สามารถอัปเดตจำนวนการแจ้งเตือนได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอัปเดตจำนวนการแจ้งเตือน");
      console.error("Error updating limit quantity:", error);
    }
  };

  const columns = [
    {
      title: "ชื่อสินค้า",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "โค้ดสินค้า",
      dataIndex: "product_code",
      key: "product_code",
    },
    {
      title: "บริษัทขายส่ง",
      dataIndex: "supplier_name",
      key: "supplier_name",
    },
    {
      title: "นำเข้าวันที่",
      dataIndex: "product_created_at",
      key: "product_created_at",
      render: (text: string) => {
        const date = dayjs(text);
        const buddhistYear = date.year() + 543;
        return `${date.date()} ${date.format("MMMM")} ${buddhistYear}`;
      },
    },
    {
      title: "จำนวนคงเหลือ",
      dataIndex: "quantity",
      key: "quantity",
      render: (val: number, record: any) =>
        val < record.limit_quantity ? (
          <Tag color="red">{val}</Tag>
        ) : (
          <Tag color="green">{val}</Tag>
        ),
    },

    {
      title: "แจ้งเตือนเมื่อต่ำกว่า",
      dataIndex: "limit_quantity",
      key: "limit_quantity",
    },
    {
      title: "หน่วย",
      dataIndex: "unit_per_quantity",
      key: "unit_per_quantity",
    },
    {
      title: "แก้ไข",
      key: "edit",
      render: (_: any, record: NotificationProduct) => (
        <Button
          icon={<EditOutlined />}
          type="text"
          onClick={() => handleEditClick(record)}
        />
      ),
    },
  ];

  return (
    <div
      className="layout"
      style={{
        padding: 24,
        backgroundColor: "#d9d9d9",
        minHeight: "100vh",
        display: "block",
      }}
    >
      <div
        className="header"
        style={{ width: "100%", height: "130px", display: "block" }}
      >
        <div 
          className="header-top"
          style={{
            display: "flex", // จัดเรียงแบบแถว
            justifyContent: "space-between", // เว้นระยะหัวซ้าย-ขวา
            alignItems: "center", // จัดให้อยู่กึ่งกลางแนวตั้ง
            width: "100%",
            marginBottom: 16,
          }}
        >
          <div
            className="header-title"
            style={{
              backgroundColor: "#2980B9",
              color: "white",
              borderRadius: 50,
              fontWeight: "bold",
              textAlign: "center",
              height: "60px",
              width: "564px",
              display: "flex", // ใช้ flex
              alignItems: "center", // vertical center
              justifyContent: "center", // horizontal center
              gap: "8px", // ช่องว่างระหว่าง icon กับ text
              fontSize: "30px", // ขนาดตัวอักษร
            }}
          >
            <DropboxOutlined />
            กำหนดการแจ้งเตือนเมื่อสินค้าต่ำ
          </div>

          <NotificationBell size={40} badgeSize="small"/>
        </div>
        <div>
          <Space style={{ marginBottom: 16, gap: "16px" }}>
            <Input
              placeholder="ค้นหาโค้ดสินค้า หรือ ชื่อสินค้า"
              allowClear
              style={{ width: 833, height: 50, borderRadius: 50 }}
              onChange={onSearchDynamic}
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
              onChange={(value) => console.log("เลือก:", value)}
            >
              <Option value="all">ทั้งหมด</Option>
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </Option>
              ))}
            </Select>
          </Space>
        </div>
      </div>
      <div className="conten" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          bordered={false} // ไม่ต้องใช้ bordered ของ antd
          pagination={false}
          className="custom-table"
        />
      </div>

      <Modal
        title={
          <div style={{ textAlign: "center", color: "red" }}>
            แก้ไขเกณฑ์แจ้งเตือน
          </div>
        }
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical">
          {/* แสดงชื่อสินค้าเป็น text ธรรมดา */}
          <span style={{ marginBottom: 10, display: "block" }}>
            <h1 style={{ fontSize: 18 }}>
              <strong>ชื่อสินค้า</strong> : {editingProduct?.product_name}
            </h1>
          </span>

          {/* ฟอร์มแก้ไข limit_quantity */}
          <Form.Item
            label="แจ้งเตือนเมื่อต่ำกว่า"
            name="limit_quantity"
            extra="ระบบจะแจ้งเตือนเมื่อจำนวนคงเหลือน้อยกว่าค่านี้"
            rules={[{ required: true, message: "กรุณาระบุจำนวน" }]}
          >
            <Input
              type="number"
              suffix="ชิ้น"
              min={1}
              style={{ width: "60%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StockAlertSetting;
