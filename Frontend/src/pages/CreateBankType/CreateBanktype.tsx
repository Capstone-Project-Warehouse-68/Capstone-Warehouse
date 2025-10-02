import {
  Row,
  Col,
  Card,
  message,
  Button,
  Form,
  Input,
  Modal,
  Upload,
  Dropdown,
} from "antd";
import { useEffect, useState, type JSX } from "react";
import {
  PlusOutlined,
  DeleteOutlined,
  DashOutlined,
  EditOutlined,
} from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import type { UploadFile, UploadProps } from "antd";
import { CreateBank, GetBankTypes, UpdateBankType } from "../../services/https";
import type { BankTypeInterface } from "../../interfaces/BankType";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

type FileType = Parameters<NonNullable<UploadProps["beforeUpload"]>>[0];

function CreateBankType() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [Banks, setBanks] = useState<BankTypeInterface[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [fileLists, setFileLists] = useState<{ [key: number]: UploadFile[] }>(
    {}
  );
  const [updateFileList, setUpdateFileList] = useState<UploadFile[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankTypeInterface | null>(
    null
  );

  // Update
  const openUpdateModal = (bank: BankTypeInterface) => {
    setSelectedBank(bank);
    setEditingId(bank.ID);
    setIsUpdateModalOpen(true);
    updateForm.setFieldsValue({
      BankTypeName: bank.BankTypeName,
      BankTypePicture: bank.BankTypePicture,
    });
    if (bank.BankTypePicture) {
      setUpdateFileList([
        {
          uid: "-1",
          name: "logo.png",
          status: "done",
          url: bank.BankTypePicture,
        },
      ]);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBank) return;
    try {
      const values = await updateForm.validateFields();
      const res = await UpdateBankType(selectedBank.ID, values);
      if (res.status === 200) {
        message.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
        setIsUpdateModalOpen(false);
        setSelectedBank(null);
        setUpdateFileList([]);
        getBankType();
      } else {
        message.error(res.data?.error || "แก้ไขไม่สำเร็จ");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาด");
    }
  };

  const showModal = () => setIsModalOpen(true);

  const getBankType = async () => {
    try {
      const res = await GetBankTypes();
      if (res.status === 200) {
        const bank = res.data.map((item: BankTypeInterface) => ({
          ID: item.ID.toString(),
          BankTypePicture: item.BankTypePicture || "-",
          BankTypeName: item.BankTypeName || "-",
        }));
        setBanks(bank);
      } else {
        messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลธนาคารได้");
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลธนาคาร");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setFileLists({});
    form.resetFields();
  };

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!file.url && !file.preview) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const onFinish = async () => {
    try {
      const values = await form.validateFields();

      for (let i = 0; i < values.banks.length; i++) {
        if (!values.banks[i].BankTypePicture) {
          messageApi.error(`กรุณาอัปโหลดโลโก้ธนาคารสำหรับบรรทัดที่ ${i + 1}`);
          return;
        }
      }

      const res = await CreateBank(values.banks);
      if (res.status === 201) {
        messageApi.success("บันทึกข้อมูลเรียบร้อยแล้ว");
        setIsModalOpen(false);
        form.resetFields();
        setFileLists({});
        getBankType(); // อัปเดต card หลังสร้าง
      } else if (res.status === 400 && res.data?.error) {
        messageApi.error(res.data.error);
      } else {
        messageApi.error("บันทึกไม่สำเร็จ");
      }
    } catch (error) {
      console.error("[Form Submit Error]", error);
      messageApi.error("เกิดข้อผิดพลาด");
    }
  };

  useEffect(() => {
    getBankType();
  }, []);

  const renderBankCards = () => {
    const cards: JSX.Element[] = Banks.map((bank) => (
      <Card
        key={bank.ID}
        hoverable
        style={{
          width: "100%",
          textAlign: "center",
          marginBottom: 16,
          position: "relative",
        }}
        cover={
          <img
            alt={bank.BankTypeName}
            src={bank.BankTypePicture}
            style={{ height: 120, objectFit: "contain", padding: 16 }}
          />
        }
      >
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
          <Dropdown
            menu={{
              items: [
                {
                  label: "แก้ไขข้อมูล",
                  key: "1",
                  icon: <EditOutlined />,
                  onClick: () => openUpdateModal(bank),
                },
              ],
            }}
          >
            <Button icon={<DashOutlined />} size="small" shape="circle" />
          </Dropdown>
        </div>

        <Card.Meta title={bank.BankTypeName} />
      </Card>
    ));

    const rows: JSX.Element[] = [];
    for (let i = 0; i < cards.length; i += 3) {
      const chunk = cards.slice(i, i + 3);
      let colSpan: number;

      // กำหนดขนาด col เท่า ๆ กัน
      if (chunk.length === 3) colSpan = 8;
      else if (chunk.length === 2) colSpan = 8; // จะมี gutter ข้างหน้าให้กลาง
      else colSpan = 8;

      rows.push(
        <Row
          key={i}
          gutter={[16, 16]}
          justify={
            chunk.length === 1
              ? "center"
              : chunk.length === 2
                ? "center"
                : "start"
          }
        >
          {chunk.map((card, idx) => (
            <Col span={colSpan} key={idx}>
              {card}
            </Col>
          ))}
        </Row>
      );
    }
    return rows;
  };

  return (
    <div
      style={{
        padding: 24,
        background: "#d3d3d3",
        height: "100vh",
        minWidth: "1200px",
        overflowY: 'auto'
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
          <AccountBalanceIcon style={{ marginRight: 8, color: "white" }} />
          สร้างข้อมูลธนาคาร
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={showModal} style={{ borderRadius: 50, }}>
          สร้างข้อมูลธนาคาร
        </Button>

        <div style={{ marginTop: 16 }}>{renderBankCards()}</div>
      </div>

      <Modal
        title="สร้างข้อมูลธนาคาร"
        open={isModalOpen}
        onOk={onFinish}
        onCancel={handleCancel}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={650}
        centered
      >
        <Form form={form} layout="vertical" initialValues={{ banks: [{}] }}>
          <Form.List name="banks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      border: "1px solid #bbb7b7ff",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      padding: 16,
                      position: "relative",
                    }}
                    bordered
                  >
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => {
                          remove(name);
                          setFileLists((prev) => {
                            const newLists = { ...prev };
                            delete newLists[key];
                            return newLists;
                          });
                        }}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          border: "1px solid #bbb7b7ff",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        }}
                      />
                    )}
                    <Row gutter={[8, 8]}>
                      <Col xl={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "BankTypePicture"]}
                          label="โลโก้ธนาคาร"
                          rules={[
                            {
                              required: true,
                              message: "กรุณาอัปโหลดโลโก้ธนาคาร",
                            },
                          ]}
                        >
                          <ImgCrop rotationSlider>
                            <Upload
                              listType="picture-card"
                              fileList={fileLists[name] || []}
                              onChange={({ fileList }) => {
                                const lastFile = fileList.slice(-1);
                                setFileLists((prev) => ({
                                  ...prev,
                                  [name]: lastFile,
                                }));

                                if (lastFile[0]?.originFileObj) {
                                  const reader = new FileReader();
                                  reader.readAsDataURL(
                                    lastFile[0].originFileObj
                                  );
                                  reader.onload = () => {
                                    const base64 = reader.result as string;
                                    form.setFields([
                                      {
                                        name: [
                                          "banks",
                                          name,
                                          "BankTypePicture",
                                        ],
                                        value: base64,
                                      },
                                    ]);
                                    lastFile[0].thumbUrl = base64;
                                    setFileLists((prev) => ({
                                      ...prev,
                                      [name]: lastFile,
                                    }));
                                  };
                                }
                              }}
                              onPreview={onPreview}
                              maxCount={1}
                            >
                              {!fileLists[name] || fileLists[name].length < 1
                                ? "+ Upload"
                                : null}
                            </Upload>
                          </ImgCrop>
                        </Form.Item>
                      </Col>

                      <Col xl={16}>
                        <Form.Item
                          {...restField}
                          name={[name, "BankTypeName"]}
                          label="ชื่อธนาคาร"
                          rules={[
                            { required: true, message: "กรุณากรอกชื่อธนาคาร" },
                            {
                              validator: async (_, value) => {
                                if (!value) return Promise.resolve();
                                const trimmed = value.trim();
                                const exists = Banks.some(
                                  (b) => b.BankTypeName.trim() === trimmed
                                );

                                if (exists) {
                                  return Promise.reject(
                                    new Error("มีธนาคารนี้อยู่แล้ว")
                                  );
                                }

                                return Promise.resolve();
                              },
                            },
                          ]}
                        >
                          <Input placeholder="กรุณากรอกชื่อธนาคาร" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    เพิ่มธนาคาร
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
      <Modal
        title="แก้ไขข้อมูลธนาคาร"
        open={isUpdateModalOpen}
        onOk={handleUpdate}
        onCancel={() => setIsUpdateModalOpen(false)}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={updateForm} layout="vertical">
          <Row>
            <Col xl={8}>
              <Form.Item
                name="BankTypePicture"
                label="โลโก้ธนาคาร"
                rules={[{ required: true, message: "กรุณาอัปโหลดโลโก้ธนาคาร" }]}
              >
                <ImgCrop rotationSlider>
                  <Upload
                    listType="picture-card"
                    fileList={updateFileList}
                    onChange={({ fileList }) => {
                      const lastFile = fileList.slice(-1);
                      setUpdateFileList(lastFile);
                      if (lastFile[0]?.originFileObj) {
                        const reader = new FileReader();
                        reader.readAsDataURL(lastFile[0].originFileObj);
                        reader.onload = () => {
                          const base64 = reader.result as string;
                          updateForm.setFieldsValue({
                            BankTypePicture: base64,
                          });
                        };
                      }
                    }}
                    onPreview={onPreview}
                    maxCount={1}
                  >
                    {updateFileList.length < 1 ? "+ Upload" : null}
                  </Upload>
                </ImgCrop>
              </Form.Item>
            </Col>
            <Col xl={16}>
              <Form.Item
                name="BankTypeName"
                label="ชื่อธนาคาร"
                rules={[
                  { required: true, message: "กรุณากรอกชื่อธนาคาร" },
                  {
                    validator: async (_, value) => {
                      if (!value) return Promise.resolve();

                      const trimmed = value.trim();

                      const exists = Banks.some(
                        (b) =>
                          b.BankTypeName.trim() === trimmed &&
                          b.ID !== editingId // 👈 ข้ามตัวเอง (id ต้องเป็น unique key ของ bank)
                      );

                      if (exists) {
                        return Promise.reject(new Error("มีธนาคารนี้อยู่แล้ว"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}

              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default CreateBankType;
