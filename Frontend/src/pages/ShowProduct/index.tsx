import { useState, useEffect } from "react";
import { Input, Table, message, Select } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { GetCategory } from "../../services/https/NotificaltionProduct/index";
import type { Category } from "../../interfaces/Category";
import type { SupplySelect } from "../../interfaces/Supply";
import { GetSupplySelect } from "../../services/https/ShowProduct/index";
import type { ProductItem } from "../../interfaces/Product";
import { GetProductsforShowlist } from "../../services/https/ShowProduct/index";
import NotificationBell from "../../components/NotificationBell";
import "./index.css";

import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");

const { Option } = Select;

const allColumns = [
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
    render: (text: string) => {
      const date = dayjs(text);
      const buddhistYear = date.year() + 543;
       return `${date.date()} ${date.format("MMMM")} ${buddhistYear} เวลา ${date.format("HH:mm")} น.`;
    },
  },
  {
    title: "รายละเอียด",
    dataIndex: "Description",
    key: "Description",
  },
];

const ProductList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [supplySelect, setSupplySelect] = useState<SupplySelect[]>([]);
  const [dataSource, setDataSource] = useState<ProductItem[]>([]);
  const [filteredData, setFilteredData] = useState<ProductItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [selectedSupply, setSelectedSupply] = useState<string | undefined>();

  // เก็บสถานะของคอลัมน์ที่แสดงผล
  const [visibleKeys, setVisibleKeys] = useState(
    allColumns.map((col) => col.key)
  );
  // เก็บสถานะของคอลัมน์ที่ถูก hover
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

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

  const fetchProducts = async () => {
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
        setFilteredData(response.data); // ตั้งค่า filteredData เริ่มต้น
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
    fetchCategory();
    fetchSupplySeleact();
    fetchProducts();
  }, []);

  // filter function
  const filterData = (search: string, category?: string, supply?: string) => {
    let data = [...dataSource];

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.ProductCode.toLowerCase().includes(lower) ||
          item.ProductName.toLowerCase().includes(lower)
      );
    }

    if (category) {
      data = data.filter((item) => item.CategoryName === category);
    }

    if (supply) {
      data = data.filter((item) => item.SupplyName === supply);
    }

    setFilteredData(data);
  };

  // handle input & select change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchText(val);
    filterData(val, selectedCategory, selectedSupply);
  };

  const handleCategoryChange = (value?: string) => {
    setSelectedCategory(value);
    filterData(searchText, value, selectedSupply);
  };

  const handleSupplyChange = (value?: string) => {
    setSelectedSupply(value);
    filterData(searchText, selectedCategory, value);
  };

  // เพิ่มปุ่ม ❌ บน header ของแต่ละ column
  const enhancedColumns = allColumns
    .filter((col) => visibleKeys.includes(col.key))
    .map((col) => ({
      ...col,
      title: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
          onMouseEnter={() => setHoveredCol(col.key)}
          onMouseLeave={() => setHoveredCol(null)}
        >
          <span>{col.title}</span>
          {hoveredCol === col.key && (
            <CloseOutlined
              style={{ cursor: "pointer", fontSize: 12, color: "red" }}
              onClick={(e) => {
                e.stopPropagation();
                setVisibleKeys(visibleKeys.filter((key) => key !== col.key));
              }}
            />
          )}
        </div>
      ),
    }));

  return (
    <div style={{ padding: 24, background: "#d3d3d3", minHeight: "100vh" ,minWidth: "1000px" }}>
      <div className="Header" style={{ display: "block", height: 130 }}>
        <div className="sub-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            className="Title"
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
            <h1 style={{ margin: 0, fontSize: "36px" }}>📋 แสดงรายการสินค้า</h1>
          </div>
          <div style={{flexShrink: 0, height: 60, width: 60 , display: "flex", alignItems: "center", justifyContent: "center", }}>
            <NotificationBell size={40} badgeSize="small" />
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
            value={searchText}
            onChange={handleSearchChange}
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
            value={selectedCategory}
            onChange={handleCategoryChange}
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
            value={selectedSupply}
            onChange={handleSupplyChange}
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
      <div className="content" style={{ marginTop: 20, marginBottom: 20 }}>
        <Table
          rowKey="ID"
          columns={enhancedColumns}
          dataSource={filteredData}
          pagination={{ pageSize: 7 }}
          bordered={false}
          rowClassName={() => "custom-row"}
        />
      </div>
    </div>
  );
};

export default ProductList;
