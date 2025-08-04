import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Select,
  Modal,
  Space,
  Typography,
  Form,
  message,
} from "antd";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import type { NotificationProduct } from "../../interfaces/NotificationProduct";
import {
  GetLimitQuantity,
  GetCategory,
} from "../../services/https/NotificaltionProduct/index";
import type { Category } from "../../interfaces/Category";
import type { UpdateNotificationProduct } from "../../interfaces/NotificationProduct";
import { UpdateLimitQuantity } from "../../services/https/NotificaltionProduct/index";

import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");

const { Title } = Typography;
const { Option } = Select;

const StockAlertSetting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<NotificationProduct | null>(null);
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<NotificationProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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

  const handleEditClick = (record: NotificationProduct) => {
    setEditingProduct(record);
    console.log("Editing product:", record);
    form.setFieldsValue({ limit_quantity: record.limit_quantity });
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
      } else if (result && result.error) {
        message.error(result.error);
      } else {
        message.error("ไม่สามารถอัปเดตจำนวนการแจ้งเตือนได้");
        console.error("ไม่สามารถอัปเดตจำนวนการแจ้งเตือนได้" );
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
      style={{ padding: 24, backgroundColor: "#d9d9d9", minHeight: "100vh" }}
    >
      <div
        style={{
          backgroundColor: "#1890ff",
          color: "white",
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <strong>กำหนดการแจ้งเตือนเมื่อสินค้าต่ำ</strong>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="ค้นหาชื่อสินค้า"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Select
          placeholder="เลือกประเภทสินค้า"
          style={{ width: 200 }}
          onChange={(value) => console.log("เลือก:", value)} // ทำสิ่งที่ต้องการตอนเลือก
        >
          <Option value="all">ทั้งหมด</Option>
          {categories.map((cat) => (
            <Option key={cat.id} value={cat.id}>
              {cat.category_name}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        bordered
        pagination={false}
        style={{ backgroundColor: "white" }}
      />

      <Modal
        title="แก้ไขจำนวนการแจ้งเตือนเมื่อสินค้าต่ำกว่า"
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        centered
        // bodyStyle={{ backgroundColor: "#d9d9d9" }}
      >
        {editingProduct && (
          <Form form={form} layout="horizontal">
            <Form.Item label="ชื่อสินค้า">
              <span>{editingProduct.product_name}</span>
            </Form.Item>
            <Form.Item label="โค้ดสินค้า">
              <span>{editingProduct.product_code}</span>
            </Form.Item>
            <Form.Item
              label="แจ้งเตือนเมื่อต่ำกว่า"
              name="limit_quantity"
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
        )}
      </Modal>
    </div>
  );
};

export default StockAlertSetting;
