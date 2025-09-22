// Frontend\src\pages\ZoneShelf/CreateZoneShelf.tsx
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
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
import ShelvesIcon from "@mui/icons-material/Shelves";

import {
  GetZone,
  CreateZone,
  UpdateZone,
  GetShelf,
  CreateShelf,
  UpdateShelf,
} from "../../services/https";
import type { ZoneInterface } from "../../interfaces/Zone";
import type { ShelfInterface } from "../../interfaces/Shelf";

function CreateZoneShelf() {
  const [messageApi, contextHolder] = message.useMessage();
  const [Zones, setZones] = useState<ZoneInterface[]>([]);
  const [Shelves, setShelves] = useState<ShelfInterface[]>([]);

  const [formZone] = Form.useForm();
  const [formShelf] = Form.useForm();

  const [editZoneModalOpen, setEditZoneModalOpen] = useState(false);
  const [editShelfModalOpen, setEditShelfModalOpen] = useState(false);
  const [currentZone, setCurrentZone] = useState<ZoneInterface | null>(null);
  const [currentShelf, setCurrentShelf] = useState<ShelfInterface | null>(null);

  const [zoneSearch, setZoneSearch] = useState("");
  const [shelfSearch, setShelfSearch] = useState("");

  // Fetch Zone
  const fetchZones = async () => {
    try {
      const res = await GetZone();
      if (res.status === 200) setZones(res.data);
      else messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลโซนได้");
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลโซน");
    }
  };

  // Fetch Shelf
  const fetchShelves = async () => {
    try {
      const res = await GetShelf();
      if (res.status === 200) setShelves(res.data);
      else messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลชั้นได้");
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลชั้น");
    }
  };

  useEffect(() => {
    fetchZones();
    fetchShelves();
  }, []);

  const isDuplicateZone = (name: string, idToExclude?: number) =>
    Zones.some(
      (z) =>
        z.ZoneName?.toLowerCase() === name.toLowerCase() && z.ID !== idToExclude
    );

  const isDuplicateShelf = (name: string, idToExclude?: number) =>
    Shelves.some(
      (s) =>
        s.ShelfName?.toLowerCase() === name.toLowerCase() &&
        s.ID !== idToExclude
    );

  // Create / Update Zone
  const handleCreateZone = async (values: ZoneInterface) => {
    if (isDuplicateZone(values.ZoneName!))
      return messageApi.error("โซนนี้มีอยู่แล้ว");
    try {
      const res = await CreateZone(values);
      if (res.status === 200 || res.status === 201) {
        messageApi.success("สร้างโซนสำเร็จ");
        formZone.resetFields();
        fetchZones();
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการสร้างโซน");
    }
  };

  const handleUpdateZone = async (values: ZoneInterface) => {
    if (!currentZone) return;
    if (isDuplicateZone(values.ZoneName!, currentZone.ID))
      return messageApi.error("โซนนี้มีอยู่แล้ว");
    try {
      const res = await UpdateZone(currentZone.ID, values);
      if (res.status === 200) {
        messageApi.success("แก้ไขโซนสำเร็จ");
        setEditZoneModalOpen(false);
        fetchZones();
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการแก้ไขโซน");
    }
  };

  // Create / Update Shelf
  const handleCreateShelf = async (values: ShelfInterface) => {
    if (isDuplicateShelf(values.ShelfName!))
      return messageApi.error("ชั้นนี้มีอยู่แล้ว");
    try {
      const res = await CreateShelf(values);
      if (res.status === 200 || res.status === 201) {
        messageApi.success("สร้างชั้นสำเร็จ");
        formShelf.resetFields();
        fetchShelves();
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการสร้างชั้น");
    }
  };

  const handleUpdateShelf = async (values: ShelfInterface) => {
    if (!currentShelf) return;
    if (isDuplicateShelf(values.ShelfName!, currentShelf.ID))
      return messageApi.error("ชั้นนี้มีอยู่แล้ว");
    try {
      const res = await UpdateShelf(currentShelf.ID, values);
      if (res.status === 200) {
        messageApi.success("แก้ไขชั้นสำเร็จ");
        setEditShelfModalOpen(false);
        fetchShelves();
      }
    } catch {
      messageApi.error("เกิดข้อผิดพลาดในการแก้ไขชั้น");
    }
  };

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
          <ShelvesIcon style={{ marginRight: 8, color: "white" }} />
          สร้างโซนและชั้น
        </span>
      </div>

      <Row>
        {/* Zone */}
        <Col xl={12}>
          <Card style={cardStyle}>
            <Form form={formZone} layout="inline" onFinish={handleCreateZone}>
              <Form.Item
                name="ZoneName"
                rules={[
                  { required: true, message: "กรุณากรอกชื่อโซน" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      return isDuplicateZone(value)
                        ? Promise.reject("โซนนี้มีอยู่แล้ว")
                        : Promise.resolve();
                    },
                  },
                ]}
                style={{ flex: 1, marginBottom: 16 }}
              >
                <Input placeholder="กรอกชื่อโซน" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  สร้างโซน
                </Button>
              </Form.Item>
            </Form>

            <Input
              placeholder="ค้นหาโซน"
              value={zoneSearch}
              onChange={(e) => setZoneSearch(e.target.value)}
              style={{
                marginTop: 12,
                borderRadius: 8,
                border: "1px solid #1890ff",
              }}
              suffix={
                <SearchOutlined style={{ color: "#1890ff", fontSize: 20 }} />
              }
            />
          </Card>
        </Col>

        {/* Shelf */}
        <Col xl={12}>
          <Card style={cardStyle}>
            <Form form={formShelf} layout="inline" onFinish={handleCreateShelf}>
              <Form.Item
                name="ShelfName"
                rules={[{ required: true, message: "กรุณากรอกชื่อชั้น" }]}
                style={{ flex: 1, marginBottom: 16 }}
              >
                <Input placeholder="กรอกชื่อชั้น" />
              </Form.Item>

              <Form.Item
                name="ZoneID"
                rules={[{ required: true, message: "กรุณาเลือกโซน" }]}
                style={{ flex: 1, marginBottom: 16 }}
              >
                <Select
                  placeholder="-- เลือกโซน --"
                  onChange={(value:number) => formShelf.setFieldValue("ZoneID", value)}
                >
                  {Zones.map((z) => (
                    <Select.Option key={z.ID} value={z.ID}>
                      {z.ZoneName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  สร้างชั้น
                </Button>
              </Form.Item>
            </Form>

            <Input
              placeholder="ค้นหาชั้น"
              value={shelfSearch}
              onChange={(e) => setShelfSearch(e.target.value)}
              style={{
                marginTop: 12,
                borderRadius: 8,
                border: "1px solid #1890ff",
              }}
              suffix={
                <SearchOutlined style={{ color: "#1890ff", fontSize: 20 }} />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Zone Table */}
      <Row>
        <Col xl={12} style={{ marginTop: 16 }}>
          <TableContainer
            component={Paper}
            style={{ maxHeight: 360, maxWidth: "95%" }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>โซน</TableCell>
                  <TableCell>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Zones.filter((z) =>
                  z.ZoneName?.toLowerCase().includes(zoneSearch.toLowerCase())
                ).map((zone) => (
                  <TableRow key={zone.ID}>
                    <TableCell>{zone.ZoneName}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCurrentZone(zone);
                          setEditZoneModalOpen(true);
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
        </Col>

        {/* Shelf Table */}
        <Col xl={12} style={{ marginTop: 16 }}>
          <TableContainer
            component={Paper}
            style={{ maxHeight: 360, maxWidth: "95%" }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ชั้น</TableCell>
                  <TableCell>โซน</TableCell>
                  <TableCell>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Shelves.filter((s) =>
                  s.ShelfName?.toLowerCase().includes(shelfSearch.toLowerCase())
                ).map((shelf) => (
                  <TableRow key={shelf.ID}>
                    <TableCell>{shelf.ShelfName}</TableCell>
                    <TableCell>
                      {Zones.find((z) => z.ID === shelf.ZoneID)?.ZoneName ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCurrentShelf(shelf);
                          setEditShelfModalOpen(true);
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
        </Col>
      </Row>

      {/* Edit Modals */}
      <Modal
        title="แก้ไขโซน"
        open={editZoneModalOpen}
        onCancel={() => setEditZoneModalOpen(false)}
        footer={null}
      >
        <Form initialValues={currentZone || {}} onFinish={handleUpdateZone}>
          <Form.Item
            label="ชื่อโซน"
            name="ZoneName"
            rules={[
              { required: true, message: "กรุณากรอกชื่อโซน" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  return isDuplicateZone(value)
                    ? Promise.reject("โซนนี้มีอยู่แล้ว")
                    : Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="แก้ไขชื่อโซน" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              บันทึก
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="แก้ไขชั้น"
        open={editShelfModalOpen}
        onCancel={() => setEditShelfModalOpen(false)}
        footer={null}
      >
        <Form
          form={formShelf}
          initialValues={{
            ...currentShelf,
            ZoneID: currentShelf?.ZoneID ?? undefined,
          }}
          onFinish={handleUpdateShelf}
        >
          <Form.Item
            label="ชื่อชั้น"
            name="ShelfName"
            rules={[{ required: true, message: "กรุณากรอกชื่อชั้น" }]}
          >
            <Input placeholder="แก้ไขชื่อชั้น" />
          </Form.Item>

          <Form.Item
            label="โซน"
            name="ZoneID"
            rules={[{ required: true, message: "กรุณาเลือกโซน" }]}
          >
            <Select
              placeholder="-- เลือกโซน --"
              onChange={(value:number) => formShelf.setFieldValue("ZoneID", value)}
            >
              {Zones.map((z) => (
                <Select.Option key={z.ID} value={z.ID}>
                  {z.ZoneName}
                </Select.Option>
              ))}
            </Select>
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

export default CreateZoneShelf;
