import React, { useState, useEffect } from "react";
import {
  Input,
  Table,
  Select,
  Typography,
  Space,
  message,
} from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type {ProductItem} from "../../interfaces/Product";
import { GetProductsforShowlist } from "../../services/https/ShowProduct/index";
const { Title } = Typography;
const { Option } = Select;

const ProductList = () => {
  const [searchText, setSearchText] = useState("");
  const [company, setCompany] = useState<string | undefined>();
  const [dataSource, setDataSource] = useState<ProductItem[]>([]);

    const fetchLimitProducts = async () => {
    try {
      const response = await GetProductsforShowlist();
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
        message.error("ไม่สามารถดึงข้อมูลสินค้าได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      console.error(error);
    }
  };

    useEffect(() => {
      fetchLimitProducts();
    }, []);
  // const data = [
  //   {
  //     ID: 1,
  //     ProductCode: "PRD-001",
  //     ProductName: "ผ้าเบรกหน้า",
  //     Quantity: 50,
  //     NameOfUnit: "ชิ้น",
  //     SupplyProductCode: "SUP-A001",
  //     SupplyName: "บริษัท A",
  //     Shelf: "ชั้น A1",
  //     Zone: "โซน A",
  //     CreatedAt: "2025-07-30T12:47:44.5709295+07:00",
  //     Description: "ผ้าเบรกหน้ารถยนต์ญี่ปุ่น",
  //   },
  //   {
  //     ID: 2,
  //     ProductCode: "PRD-002",
  //     ProductName: "น้ำมันเครื่อง",
  //     Quantity: 30,
  //     NameOfUnit: "ลิตร",
  //     SupplyProductCode: "SUP-B002",
  //     SupplyName: "บริษัท B",
  //     Shelf: "ชั้น B2",
  //     Zone: "โซน B",
  //     CreatedAt: "2025-07-28T09:20:00.000+07:00",
  //     Description: "น้ำมันเครื่องเบนซินมาตรฐาน API SN",
  //   },
  //   {
  //     ID: 3,
  //     ProductCode: "PRD-003",
  //     ProductName: "กรองอากาศ",
  //     Quantity: 80,
  //     NameOfUnit: "ชิ้น",
  //     SupplyProductCode: "SUP-C003",
  //     SupplyName: "บริษัท C",
  //     Shelf: "ชั้น C3",
  //     Zone: "โซน C",
  //     CreatedAt: "2025-07-25T15:05:00.000+07:00",
  //     Description: "กรองอากาศสำหรับรถญี่ปุ่นรุ่นปี 2020+",
  //   },
  // ];

  const filteredData = dataSource.filter(
    (item) =>
      item.ProductName.includes(searchText) &&
      (!company || item.SupplyName === company)
  );

  const columns = [
    {
      title: "รหัสสินค้า",
      dataIndex: "ProductCode",
      key: "ProductCode",
    },
    {
      title: "ชื่อสินค้า",
      dataIndex: "ProductName",
      key: "ProductName",
    },
    {
      title: "จำนวน",
      dataIndex: "Quantity",
      key: "Quantity",
    },
    {
      title: "หน่วย",
      dataIndex: "NameOfUnit",
      key: "NameOfUnit",
    },
    {
      title: "รหัสบริษัทขายส่ง",
      dataIndex: "SupplyProductCode",
      key: "SupplyProductCode",
    },
    {
      title: "บริษัทขายส่ง",
      dataIndex: "SupplyName",
      key: "SupplyName",
    },
    {
      title: "โซนจัดเก็บสินค้า",
      dataIndex: "Zone",
      key: "Zone",
    },
    {
      title: "ชั้นจัดเก็บสินค้า",
      dataIndex: "Shelf",
      key: "Shelf",
    },
    {
      title: "วันที่เพิ่มสินค้า",
      dataIndex: "CreatedAt",
      key: "CreatedAt",
      render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "รายละเอียด",
      dataIndex: "Description",
      key: "Description",
    },
  ];

  return (
    <div style={{ padding: 24, background: "#d3d3d3", minHeight: "100vh" }}>
      <Title level={4} style={{ background: "#1890ff", color: "white", padding: 8, borderRadius: 6, display: "inline-block" }}>
        📋 แสดงรายการสินค้า
      </Title>

      <Space style={{ margin: "16px 0", display: "flex", flexWrap: "wrap" }}>
        <Input
          placeholder="ค้นหาชื่อสินค้า"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />

        <Select
          placeholder="บริษัท"
          allowClear
          onChange={(value) => setCompany(value)}
          style={{ width: 160 }}
          suffixIcon={<FilterOutlined />}
        >
          <Option value="บริษัท A">บริษัท A</Option>
          <Option value="บริษัท B">บริษัท B</Option>
          <Option value="บริษัท C">บริษัท C</Option>
        </Select>
      </Space>

      <Table
        rowKey="ID"
        columns={columns}
        dataSource={filteredData}
        pagination={false}
        bordered
      />
    </div>
  );
};

export default ProductList;
