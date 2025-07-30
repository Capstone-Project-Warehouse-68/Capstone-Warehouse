import React, { useState } from "react";
import { Table, Input, Button, Select, Modal, Space, Typography, Form } from "antd";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

interface Product {
  key: string;
  name: string;
  code: string;
  supplier: string;
  importDate: string;
  alertBelow: number;
  unit: string;
}

const StockAlertSetting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const dataSource: Product[] = [
    {
      key: "1",
      name: "ลูกปืน",
      code: "C001",
      supplier: "บริษัท A",
      importDate: "20/3/68",
      alertBelow: 3,
      unit: "ชิ้น",
    },
  ];

  const handleEditClick = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue({ alertBelow: record.alertBelow });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      console.log("New alert value:", values.alertBelow);
      setIsModalOpen(false);
    });
  };

  const columns = [
    {
      title: "ชื่อสินค้า",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "โค้ดสินค้า",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "บริษัทขายส่ง",
      dataIndex: "supplier",
      key: "supplier",
    },
    {
      title: "นำเข้าวันที่",
      dataIndex: "importDate",
      key: "importDate",
    },
    {
      title: "แจ้งเตือนเมื่อต่ำกว่า",
      dataIndex: "alertBelow",
      key: "alertBelow",
    },
    {
      title: "หน่วย",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "แก้ไข",
      key: "edit",
      render: (_: any, record: Product) => (
        <Button icon={<EditOutlined />} type="text" onClick={() => handleEditClick(record)} />
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: "#d9d9d9", minHeight: "100vh" }}>
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
        <Select defaultValue="ประเภทสินค้า" style={{ width: 200 }}>
          <Option value="all">ทั้งหมด</Option>
          <Option value="category1">ประเภทที่ 1</Option>
          <Option value="category2">ประเภทที่ 2</Option>
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
        bodyStyle={{ backgroundColor: "#d9d9d9" }}
      >
        {editingProduct && (
          <Form form={form} layout="horizontal">
            <Form.Item label="ชื่อสินค้า">
              <span>{editingProduct.name}</span>
            </Form.Item>
            <Form.Item label="โค้ดสินค้า">
              <span>{editingProduct.code}</span>
            </Form.Item>
            <Form.Item
              label="แจ้งเตือนเมื่อต่ำกว่า"
              name="alertBelow"
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
