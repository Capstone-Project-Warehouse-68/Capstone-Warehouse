import { Button, Card, Col, Form, Input, message, Modal, Row } from "antd";
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  GetUnitPerQuantity,
  CreateUnitOfQuantity,
  CreateCategory,
  GetCategory,
  UpdateCategory,
  UpdateUnitPerQuantity,
} from "../../services/https";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import { useEffect, useState } from "react";
import { EditOutlined } from "@ant-design/icons";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
} from "@mui/material";
import type { CategoryInterface } from "../../interfaces/Category";
import { SearchOutlined } from "@ant-design/icons";

function CreateUnitQuantity() {
  const [messageApi, contextHolder] = message.useMessage();
  const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
  const [Categorys, setCategorys] = useState<CategoryInterface[]>([]);
  const [form] = Form.useForm();
  const [categoryform] = Form.useForm();

  const [editUnitModalOpen, setEditUnitModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] =
    useState<UnitPerQuantityInterface | null>(null);
  const [currentCategory, setCurrentCategory] =
    useState<CategoryInterface | null>(null);

  const [unitSearch, setUnitSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const getUnitperQuantity = async () => {
    try {
      const res = await GetUnitPerQuantity();
      if (res.status === 200) {
        const unit = res.data.map((item: UnitPerQuantityInterface) => ({
          ID: item.ID,
          NameOfUnit: item.NameOfUnit || "-",
        }));
        setUnitData(unit);
      } else {
        messageApi.error(
          res.data.error || "ไม่สามารถดึงข้อมูลหน่วยของสินค้าได้"
        );
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยของสินค้า");
    }
  };

  const getCategory = async () => {
    try {
      const res = await GetCategory();
      if (res.status === 200) {
        const cate = res.data.map((item: CategoryInterface) => ({
          ID: item.ID,
          CategoryName: item.CategoryName || "-",
        }));
        setCategorys(cate);
      } else {
        messageApi.error(
          res.data.error || "ไม่สามารถดึงข้อมูลประเภทของสินค้าได้"
        );
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลประเภทของสินค้า");
    }
  };

  // ตรวจสอบซ้ำหน่วยสินค้า
  const isDuplicateUnit = (name: string, idToExclude?: number) => {
    return Units.some(
      (u) =>
        u.NameOfUnit.toLowerCase() === name.toLowerCase() &&
        u.ID !== idToExclude
    );
  };

  // ตรวจสอบซ้ำประเภทสินค้า
  const isDuplicateCategory = (name: string, idToExclude?: number) => {
    return Categorys.some(
      (c) =>
        c.CategoryName.toLowerCase() === name.toLowerCase() &&
        c.ID !== idToExclude
    );
  };

  // Create Unit
  const handleCreateUnit = async (values: UnitPerQuantityInterface) => {
    if (isDuplicateUnit(values.NameOfUnit!)) {
      messageApi.error("หน่วยสินค้านี้มีอยู่แล้ว");
      return;
    }
    try {
      const res = await CreateUnitOfQuantity(values);
      if (res.status === 200) {
        messageApi.success("สร้างหน่วยสำเร็จ");
        form.resetFields();
        getUnitperQuantity();
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการสร้างหน่วย");
    }
  };

  // Update Unit
  const handleUpdateUnit = async (values: UnitPerQuantityInterface) => {
    if (!currentUnit) return;
    if (isDuplicateUnit(values.NameOfUnit!, currentUnit.ID)) {
      messageApi.error("หน่วยสินค้านี้มีอยู่แล้ว");
      return;
    }
    try {
      const res = await UpdateUnitPerQuantity(currentUnit.ID, values);
      if (res.status === 200) {
        messageApi.success("แก้ไขหน่วยสำเร็จ");
        setEditUnitModalOpen(false);
        getUnitperQuantity();
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการแก้ไขหน่วย");
    }
  };

  // Create Category
  const handleCreateCategory = async (values: CategoryInterface) => {
    if (isDuplicateCategory(values.CategoryName!)) {
      messageApi.error("ประเภทสินค้านี้มีอยู่แล้ว");
      return;
    }
    try {
      const res = await CreateCategory(values);
      if (res.status === 200 || res.status === 201) {
        messageApi.success("สร้างประเภทสินค้าเรียบร้อย");
        categoryform.resetFields();
        getCategory();
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการสร้างประเภทสินค้า");
    }
  };

  // Update Category
  const handleUpdateCategory = async (values: CategoryInterface) => {
    if (!currentCategory) return;
    if (isDuplicateCategory(values.CategoryName!, currentCategory.ID)) {
      messageApi.error("ประเภทสินค้านี้มีอยู่แล้ว");
      return;
    }
    try {
      const res = await UpdateCategory(currentCategory.ID, values);
      if (res.status === 200) {
        messageApi.success("แก้ไขประเภทสำเร็จ");
        setEditCategoryModalOpen(false);
        getCategory();
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการแก้ไขประเภท");
    }
  };

  useEffect(() => {
    getUnitperQuantity();
    getCategory();
  }, []);

  const cardStyle = {
    marginTop: 16,
    marginBottom: 16,
    width: "95%",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    padding: 16,
    backgroundColor: "#fff",
  };

  return (
    <div
      style={{
        padding: 24,
        background: "#d3d3d3",
        height: "100vh",
        minWidth: "1200px",
      }}
    >
      {contextHolder}
      <div
        className="Card-Header"
        style={{
          height: 50,
          margin: 0,
          marginBottom: 16,
          width: "300px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 20, color: "white" }}>
          <InventoryIcon style={{ marginRight: 8, color: "white" }} />
          สร้างประเภทและหน่วยสินค้า
        </span>
      </div>
      <Row>
        <Col xl={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Card style={cardStyle}>
              <Form form={form} layout="inline" onFinish={handleCreateUnit}>
                <Form.Item
                  name="NameOfUnit"
                  rules={[
                    { required: true, message: "กรุณากรอกหน่วยสินค้า" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const duplicate = Units.some(
                          (u) =>
                            u.NameOfUnit.toLowerCase() === value.toLowerCase()
                        );
                        if (duplicate)
                          return Promise.reject("หน่วยสินค้านี้มีอยู่แล้ว");
                        return Promise.resolve();
                      },
                    },
                  ]}
                  style={{ flex: 1 , marginBottom:16}}
                >
                  <Input placeholder="กรอกหน่วยสินค้า" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    สร้างหน่วย
                  </Button>
                </Form.Item>
              </Form>

              <Input
                placeholder="ค้นหาหน่วยสินค้า"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                style={{ marginTop: 12, borderRadius: 8,border: "1px solid #1890ff", boxShadow: "none", }}
                suffix={
                  <SearchOutlined style={{ color: "#1890ff", fontSize: 20}} />
                }
              />
            </Card>
          </div>
        </Col>

        <Col xl={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Card style={cardStyle}>
              <Form
                form={categoryform}
                layout="vertical"
                onFinish={handleCreateCategory}
              >
                <Row align="bottom">
                  <Col>
                    <Form.Item
                      name="CategoryName"
                      rules={[
                        { required: true, message: "กรุณากรอกประเภทสินค้า" },
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            const duplicate = Categorys.some(
                              (c) =>
                                c.CategoryName.toLowerCase() ===
                                value.toLowerCase()
                            );
                            if (duplicate)
                              return Promise.reject(
                                "ประเภทสินค้านี้มีอยู่แล้ว"
                              );
                            return Promise.resolve();
                          },
                        },
                      ]}
                      style={{ flex: 1 }}
                    >
                      <Input
                        placeholder="กรอกประเภทสินค้า"
                        style={{ width: "320px", marginRight: "16px" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" block>
                        สร้างประเภทสินค้า
                      </Button>
                    </Form.Item>
                  </Col>

                  <Col>
                    <Input
                      placeholder="ค้นหาประเภทสินค้า"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      style={{ borderRadius: 8, width: "500px",border: "1px solid #1890ff", boxShadow: "none", }}
                      suffix={
                        <SearchOutlined
                          style={{ color: "#1890ff", fontSize: 20 }}
                        />
                      }
                    />
                  </Col>
                </Row>
              </Form>
            </Card>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xl={12} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <TableContainer
              component={Paper}
              style={{ maxHeight: 360, maxWidth: "95%" }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>หน่วยสินค้า</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Units.filter((u) =>
                    u.NameOfUnit.toLowerCase().includes(
                      unitSearch.toLowerCase()
                    )
                  ).map((unit) => (
                    <TableRow key={unit.ID}>
                      <TableCell>{unit.NameOfUnit}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setCurrentUnit(unit);
                            setEditUnitModalOpen(true);
                          }}
                        >
                          <EditOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </Col>

        <Col xl={12} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <TableContainer component={Paper} style={{ maxHeight: 360 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ประเภทสินค้า</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Categorys.filter((c) =>
                    c.CategoryName.toLowerCase().includes(
                      categorySearch.toLowerCase()
                    )
                  ).map((cate) => (
                    <TableRow key={cate.ID}>
                      <TableCell>{cate.CategoryName}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setCurrentCategory(cate);
                            setEditCategoryModalOpen(true);
                          }}
                        >
                          <EditOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </Col>
      </Row>

      <Modal
        title="แก้ไขหน่วยสินค้า"
        open={editUnitModalOpen}
        onCancel={() => setEditUnitModalOpen(false)}
        footer={null}
      >
        <Form initialValues={currentUnit || {}} onFinish={handleUpdateUnit}>
          <Form.Item
            label="หน่วยสินค้า"
            name="NameOfUnit"
            rules={[
              { required: true, message: "กรุณากรอกหน่วยสินค้า" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve(); // กรณีว่าง
                  const duplicate = Units.some(
                    (u) => u.NameOfUnit.toLowerCase() === value.toLowerCase()
                  );
                  if (duplicate) {
                    return Promise.reject("หน่วยสินค้านี้มีอยู่แล้ว");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="แก้ไขหน่วยสินค้า" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              บันทึก
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="แก้ไขประเภทสินค้า"
        open={editCategoryModalOpen}
        onCancel={() => setEditCategoryModalOpen(false)}
        footer={null}
      >
        <Form
          initialValues={currentCategory || {}}
          onFinish={handleUpdateCategory}
        >
          <Form.Item
            label="ประเภทสินค้า"
            name="CategoryName"
            rules={[
              { required: true, message: "กรุณากรอกประเภทสินค้า" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve(); // กรณีว่าง
                  const duplicate = Categorys.some(
                    (c) => c.CategoryName.toLowerCase() === value.toLowerCase()
                  );
                  if (duplicate) {
                    return Promise.reject("ประเภทสินค้านี้มีอยู่แล้ว");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="แก้ไขประเภทสินค้า" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              บันทึก
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CreateUnitQuantity;
