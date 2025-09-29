import { useState, useEffect, useMemo, useCallback } from "react";
import { Input, Table, message, Select, Button, Dropdown, Modal, Spin, Form, InputNumber, Row, Col } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
  EditOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { GetCategory } from "../../services/https/NotificaltionProduct/index";
import type { Category } from "../../interfaces/Category";
import type { SupplySelect } from "../../interfaces/Supply";
import { GetSupplySelect } from "../../services/https/ShowProduct/index";
import type { ProductItem } from "../../interfaces/Product";
import { GetProductsforShowlist } from "../../services/https/ShowProduct/index";
import NotificationBell from "../../components/NotificationBell";
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import { Info } from "@mui/icons-material";
import "./index.css";

import dayjs from "dayjs";
import "dayjs/locale/th";
import { GetProductOfBillsByProductID, GetShelfByZoneID, GetZone, UpdateProduct } from "../../services/https";
import { Table as MTable, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
dayjs.locale("th");

const { Option } = Select;

const allColumns = [
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
    render: (text: string | null | undefined) => text || "-",
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
    render: (text: string | null | undefined) => text || "-",
  },
  {
    title: "ชั้นจัดเก็บสินค้า",
    dataIndex: "Shelf",
    key: "Shelf",
    render: (text: string | null | undefined) => text || "-",
  },
  {
    title: "วันที่นำเข้าล่าสุด",
    dataIndex: "UpdatedAt",
    key: "UpdatedAt",
    render: (text: string) => {
      const date = dayjs(text);
      const currentYear = dayjs().year();
      let displayYear = date.year();
      if (displayYear <= currentYear) {
        displayYear += 543;
      }
      return `${date.date()} ${date.format("MMMM")} ${displayYear} เวลา ${date.format("HH:mm")} น.`;
    },
  },
  {
    title: "ราคาขาย",
    dataIndex: "SalePrice",
    key: "SalePrice",
    render: (text: string | null | undefined) => text || "-",
  },
  {
    title: "รายละเอียด",
    dataIndex: "Description",
    key: "Description",
    render: (text: string | null | undefined) => text || "-",
  },
];

const ProductList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [supplySelect, setSupplySelect] = useState<SupplySelect[]>([]);
  const [dataSource, setDataSource] = useState<ProductItem[]>([]);
  // const [filteredData, setFilteredData] = useState<ProductItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [selectedSupply, setSelectedSupply] = useState<string | undefined>();

  const [modalUpdateOpen, setModalUpdateOpen] = useState(false); // เปลี่ยนชื่อ
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ProductID, setProductID] = useState(0);

  // เก็บสถานะของคอลัมน์ที่แสดงผล
  const [visibleKeys, setVisibleKeys] = useState(
    allColumns.map((col) => col.key)
  );
  // เก็บสถานะของคอลัมน์ที่ถูก hover
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  const [isModalDataOpen, setIsModalDataOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [shelves, setShelves] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  // เวลาเลือก Zone
  // แก้ handleZoneChange ไปเรียก API โดยตรง
  const handleZoneChange = async (zoneId: number) => {
    setSelectedZone(zoneId);
    form.setFieldsValue({ ShelfID: undefined });

    try {
      const res = await GetShelfByZoneID(zoneId);
      if (res.status === 200) {
        setShelves(res.data || []); 
      } else {
        setShelves([]);
        message.error(res.data?.error || "ไม่สามารถดึงข้อมูลชั้นเก็บได้");
      }
    } catch (error) {
      console.error("โหลด shelf ล้มเหลว:", error);
      setShelves([]);
      message.error("เกิดข้อผิดพลาดในการโหลดชั้นเก็บ");
    }
  };

  const handleViewProduct = async (record: any) => {
    setLoadingProduct(true);
    try {
      const res = await GetProductOfBillsByProductID(record.ID);
      if (res.status === 200) {
        setSelectedProduct(res.data.data);
        setIsModalDataOpen(true);
      }
    } catch (error) {
      console.error("โหลดข้อมูลบิลล้มเหลว", error);
    } finally {
      setLoadingProduct(false);
    }
  };

  // const fetchCategory = async () => {
  //   try {
  //     const response = await GetCategory();
  //     console.log("Response from GetCategory:", response);
  //     if (
  //       response.data &&
  //       Array.isArray(response.data) &&
  //       response.data.length > 0
  //     ) {
  //       console.log("Categories fetched:", response.data);
  //       setCategories(response.data);
  //     } else if (response && response.error) {
  //       message.error(response.error);
  //     } else {
  //       message.error("ไม่สามารถดึงข้อมูลประเภทสินค้าได้");
  //     }
  //   } catch (error) {
  //     message.error("เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า");
  //     console.error(error);
  //   }
  // };

  // const fetchSupplySeleact = async () => {
  //   try {
  //     const response = await GetSupplySelect();
  //     console.log("Response from Supply:", response);
  //     if (
  //       response.data &&
  //       Array.isArray(response.data) &&
  //       response.data.length > 0
  //     ) {
  //       console.log("Supply fetched:", response.data);
  //       setSupplySelect(response.data);
  //     } else if (response && response.error) {
  //       message.error(response.error);
  //     } else {
  //       message.error("ไม่สามารถดึงข้อมูลบริษัทได้");
  //     }
  //   } catch (error) {
  //     message.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
  //     console.error(error);
  //   }
  // };

  // const fetchProducts = async () => {
  //   try {
  //     const response = await GetProductsforShowlist();
  //     console.log("Response from GetLimitQuantity:", response);
  //     if (
  //       response.data &&
  //       Array.isArray(response.data) &&
  //       response.data.length > 0
  //     ) {
  //       // Assuming response.data is an array of NotificationProduct
  //       setDataSource(response.data);
  //       console.log("Data fetched:", response.data);
  //     } else if (response && response.error) {
  //       message.error(response.error);
  //     } else {
  //       message.error("ไม่สามารถดึงข้อมูลสินค้าได้");
  //     }
  //   } catch (error) {
  //     message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
  //     console.error(error);
  //   }
  // };

  useEffect(() => {
    fetchAll();
    fetchData();
  }, []);


  // filter function
  const filteredData = useMemo(() => {
    let data = [...dataSource];

    if (searchText) {
      const lower = searchText.toLowerCase();
      data = data.filter(
        (item) =>
          item.ProductCode.toLowerCase().includes(lower) ||
          item.ProductName.toLowerCase().includes(lower)
      );
    }

    if (selectedCategory) {
      data = data.filter((item) => item.CategoryName === selectedCategory);
    }

    if (selectedSupply) {
      data = data.filter((item) => item.SupplyName === selectedSupply);
    }

    return data;
  }, [dataSource, searchText, selectedCategory, selectedSupply]);

  // handle input & select change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    []
  );

  const handleCategoryChange = useCallback((value?: string) => {
    setSelectedCategory(value);
  }, []);

  const handleSupplyChange = useCallback((value?: string) => {
    setSelectedSupply(value);
  }, []);

  const handleMouseEnter = useCallback((key: string) => setHoveredCol(key), []);
  const handleMouseLeave = useCallback(() => setHoveredCol(null), []);
  const handleRemoveColumn = useCallback((key: string) => {
    setVisibleKeys((prev) => prev.filter((k) => k !== key));
  }, []);

  // เพิ่มปุ่ม ❌ บน header ของแต่ละ column
  const enhancedColumns = useMemo(() => {
    const baseCols = allColumns
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
            onMouseEnter={() => handleMouseEnter(col.key)}
            onMouseLeave={handleMouseLeave}
          >
            <span>{col.title}</span>
            {hoveredCol === col.key && (
              <CloseOutlined
                style={{ cursor: "pointer", fontSize: 12, color: "red" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveColumn(col.key);
                }}
              />
            )}
          </div>
        ),
      }));

    // เพิ่ม actions column ตายตัว
    const actionCol = {
      title: "จัดการ",
      key: "actions",
      fixed: "right" as const,
      render: (_: any, record: any) => {
        const items = [
          {
            key: "view",
            label: "ดูรายละเอียด",
            icon: <Info style={{ fontSize: 18 }} />,
            onClick: () => {
              console.log("ดูรายละเอียด", record);
              handleViewProduct(record); // ส่ง ID เข้าไป
            },
          },
          {
            key: "edit",
            label: "แก้ไขข้อมูลสินค้า",
            icon: <EditOutlined style={{ fontSize: 18 }} />,
            onClick: () => {
              setProductID(record.ID);
              handleEdit(record); // ส่ง ID เข้าไป
            },
          },
        ];
        return (
          <Dropdown
            menu={{
              items,
              onClick: (info) => {
                const action = items.find((i) => i.key === info.key);
                action?.onClick?.();
              },
            }}
            trigger={["hover"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} style={{ color: "black" }} />
          </Dropdown>
        );
      },
    };

    return [...baseCols, actionCol];
  }, [visibleKeys, hoveredCol, handleMouseEnter, handleMouseLeave, handleRemoveColumn]);

  const handleEdit = (record: any) => {
    setSelectedProduct(record);

    // เซ็ตค่า CategoryID + ZoneID ก่อน
    form.setFieldsValue({
      ProductName: record?.ProductName,
      Description: record?.Description,
      SalePrice: record?.SalePrice,
      CategoryID: record?.CategoryID ? Number(record?.CategoryID) : undefined,
      ZoneID: record?.ZoneID ? Number(record?.ZoneID) : undefined,
    });

    setSelectedZone(record?.ZoneID);
    handleZoneChange(record?.ZoneID);

    setTimeout(() => {
      form.setFieldsValue({
        ShelfID: record?.ShelfID ? Number(record?.ShelfID) : undefined,
      });
    }, 0);

    setModalUpdateOpen(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const res = await UpdateProduct(ProductID, {
        Description: values.Description,
        SalePrice: values.SalePrice,
        CategoryID: values.CategoryID,
        ShelfID: values.ShelfID,
      });

      if (res.status === 200) {
        message.success("อัปเดตสินค้าสำเร็จ");
        await fetchAll();
        setModalUpdateOpen(false);
      } else {
        message.error(res.data?.error || "อัปเดตสินค้าไม่สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    try {
      const [categoriesRes, supplyRes, productsRes] = await Promise.all([
        GetCategory(),
        GetSupplySelect(),
        GetProductsforShowlist(),
      ]);

      // set categories
      if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
        setCategories(categoriesRes.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลประเภทสินค้าได้");
      }

      // set supply
      if (supplyRes && Array.isArray(supplyRes)) {
        setSupplySelect(supplyRes);
      } else {
        message.error("ไม่สามารถดึงข้อมูลบริษัทได้");
      }

      // set products
      if (productsRes?.data && Array.isArray(productsRes.data)) {
        setDataSource(productsRes.data);
      } else {
        message.error("ไม่สามารถดึงข้อมูลสินค้าได้");
      }
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  const fetchData = async () => {
    try {
      const [zoneRes] = await Promise.all([
        GetZone(),
      ]);

      if (zoneRes.status === 200) {
        setZones(zoneRes.data || []);
      } else {
        setZones([]);
        message.error(zoneRes.data.error || "ไม่สามารถดึงข้อมูลโซนได้");
      }
    } catch (error) {
      setZones([]);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };


  return (
    <div
      style={{
        padding: 24,
        background: "#d3d3d3",
        minHeight: "100vh",
        minWidth: "1200px",
      }}
    >
      <div className="Header" style={{ display: "block", height: 130 }}>
        <div
          className="sub-header"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
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
            <FeaturedPlayListIcon style={{ fontSize: "36px", marginRight: 10 }} />
            <h1 style={{ margin: 0, fontSize: "36px" }}>แสดงรายการสินค้า</h1>
          </div>
          <div
            style={{
              flexShrink: 0,
              height: 60,
              width: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
          pagination={{ pageSize: 5 }}
          bordered={false}
          // rowClassName={() => "custom-row"}
          className="custom-table"
        />
        <Modal
          open={isModalDataOpen}
          onCancel={() => setIsModalDataOpen(false)}
          title="รายละเอียดบิล"
          width={1000}
          footer={[
            <Button key="cancel" onClick={() => setIsModalDataOpen(false)}>
              ปิด
            </Button>,
          ]}
        >
          {loadingProduct ? (
            <Spin />
          ) : (
            <>
              {console.log("selectedProduct", selectedProduct)}
              <TableContainer component={Paper}>
                <MTable>
                  <TableHead>
                    <TableRow>
                      <TableCell>ลำดับ</TableCell>
                      <TableCell>ชื่อสินค้า</TableCell>
                      <TableCell>รหัสสินค้า</TableCell>
                      <TableCell>จำนวน</TableCell>
                      <TableCell>ราคาต่อชิ้น</TableCell>
                      <TableCell>ส่วนลด (%)</TableCell>
                      <TableCell>ราคารวม</TableCell>
                      <TableCell>วันที่นำเข้า</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(selectedProduct) && selectedProduct.length > 0 ? (
                      selectedProduct.map((p, index) => (
                        <TableRow key={p.ID}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{p.ProductName}</TableCell>
                          <TableCell>{p.ProductCode}</TableCell>
                          <TableCell>{p.Quantity}</TableCell>
                          <TableCell>{p.PricePerPiece}</TableCell>
                          <TableCell>{p.Discount}</TableCell>
                          <TableCell>{p.SumPriceProduct}</TableCell>
                          <TableCell>
                            {dayjs(p.DateImport).format("DD MMMM YYYY")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          ไม่มีข้อมูล
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </MTable>
              </TableContainer>
            </>
          )}
        </Modal>

        <Modal
          title={
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>
              แก้ไขสินค้า: {selectedProduct?.ProductName || ""}
            </span>
          }
          open={modalUpdateOpen}
          onCancel={() => setModalUpdateOpen(false)}
          width="60%"
          footer={[
            <Button key="cancel" onClick={() => setModalUpdateOpen(false)}>
              ยกเลิก
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={loading}
              onClick={handleSubmitUpdate}
            >
              บันทึก
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical">
            <Row gutter={[8, 8]}>

              <Col xl={24}>
                <Form.Item
                  name="Description"
                  label="รายละเอียดสินค้า"
                  rules={[{ required: true, message: "กรุณากรอกรายละเอียดสินค้า" }]}
                >
                  <Input.TextArea rows={3} placeholder="กรอกรายละเอียดสินค้า" />
                </Form.Item>
              </Col>

              <Col xl={24}>
                <Form.Item
                  name="SalePrice"
                  label="ราคาขาย"
                  rules={[{ required: true, message: "กรอกราคาขาย" }]}
                >
                  <InputNumber<number>
                    style={{ width: "100%" }}
                    min={0}
                    step={0.01}
                    placeholder="กรอกราคาขาย"
                    onKeyPress={(e) => {
                      const allowed = /[0-9.]/
                      if (!allowed.test(e.key)) {
                        e.preventDefault()
                      }
                    }}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", " "].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                    formatter={(value) => {
                      if (!value) return ""
                      return `${value}`.replace(/(\.\d{2})\d+$/, "$1") // จำกัดทศนิยม 2 ตำแหน่ง
                    }}
                    parser={(value) => {
                      const cleaned = value?.replace(/[^\d.]/g, "")
                      return cleaned ? parseFloat(cleaned) : 0 //  ต้อง return number เสมอ
                    }}
                  />
                </Form.Item>

              </Col>

              <Col xl={24}>
                <Form.Item name="CategoryID" label="หมวดหมู่">
                  <Select placeholder="เลือกหมวดหมู่">
                    {categories.map((cat) => (
                      <Option key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xl={12}>
                <Form.Item name="ZoneID" label="โซนจัดเก็บสินค้า">
                  <Select placeholder="เลือกโซน" onChange={handleZoneChange}>
                    {zones.map((z) => (
                      <Select.Option key={z.ID} value={z.ID}>
                        {z.ZoneName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xl={12}>
                <Form.Item name="ShelfID" label="ชั้นจัดเก็บสินค้า">
                  <Select placeholder="เลือกชั้นเก็บ" disabled={!selectedZone}>
                    {shelves.map((s) => (
                      <Select.Option key={s.ID} value={s.ID}>
                        {s.ShelfName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </div >
  );
};

export default ProductList;
