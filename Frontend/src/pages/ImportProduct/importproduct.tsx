import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button, Col, Row, Table, Dropdown, message, Form, Input, Modal, Space, Card, InputNumber, DatePicker, Select } from "antd";
import {
    FileAddOutlined,
    FilePdfOutlined,
    HistoryOutlined,
    EditOutlined,
    DeleteOutlined,
    DashOutlined,
    InfoCircleOutlined,
    PlusOutlined

} from "@ant-design/icons";
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { CreateBillwithProduct, DeleteBill, GetAllBills, GetCategory, GetShelfByZoneID, GetSupply, GetUnitPerQuantity, GetZone } from "../../services/https";
import type { BillInterface } from "../../interfaces/Bill";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import type { CategoryInterface } from "../../interfaces/Category";
import type { ZoneInterface } from "../../interfaces/Zone";
import type { ShelfInterface } from "../../interfaces/Shelf";
import type { SupplyInterface } from "../../interfaces/Supply";
import { useNavigate } from "react-router-dom";
const { Option } = Select;

function ImportProduct() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Bills, setBillData] = useState<BillInterface[]>([]);
    const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
    const [Sups, setSupplyData] = useState<SupplyInterface[]>([]);
    const [Categorys, setCateData] = useState<CategoryInterface[]>([]);
    const [Zones, setZoneData] = useState<ZoneInterface[]>([]);
    const [shelfMap, setShelfMap] = useState<Record<number, ShelfInterface[]>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [productFields, setProductFields] = useState([{ key: Date.now() }]);

    const showCreateModal = () => setIsCreateModalOpen(true);
    const handleCreateCancel = () => setIsCreateModalOpen(false);

    const handleAddCard = () => {
        setProductFields([...productFields, { key: Date.now() }]);
    };

    const handleRemoveCard = (keyToRemove: number) => {
        const updatedFields = productFields.filter((item) => item.key !== keyToRemove);

        // เก็บค่าเก่า
        const oldValues = form.getFieldsValue();

        // หาค่าใหม่ที่จะใช้ (เคลียร์ field ที่หลอนออกไป)
        const newValues: Record<string, any> = {};
        updatedFields.forEach((item, newIndex) => {
            const oldIndex = productFields.findIndex((f) => f.key === item.key);
            newValues[`productName-${newIndex}`] = oldValues[`productName-${oldIndex}`];
            newValues[`productCode-${newIndex}`] = oldValues[`productCode-${oldIndex}`];
            newValues[`unit-${newIndex}`] = oldValues[`unit-${oldIndex}`];
            newValues[`category-${newIndex}`] = oldValues[`category-${oldIndex}`];
            newValues[`zone-${newIndex}`] = oldValues[`zone-${oldIndex}`];
            newValues[`shelfID-${newIndex}`] = oldValues[`shelfID-${oldIndex}`];
        });

        // ✅ เคลียร์ฟอร์มก่อน แล้วค่อยเซตใหม่
        const allProductFieldNames = Object.keys(oldValues).filter((key) =>
            key.startsWith("productName-") ||
            key.startsWith("productCode-") ||
            key.startsWith("unit-") ||
            key.startsWith("category-") ||
            key.startsWith("zone-") ||
            key.startsWith("shelfID-")
        );

        form.resetFields(allProductFieldNames);

        form.setFieldsValue(newValues); // เซตค่าที่ index ถูกต้องแล้ว

        setProductFields(updatedFields); // เซต state ใหม่
    };

    const handleModelCreateOk = () => {
        form
            .validateFields()
            .then((values) => {
                // แปลง Object form values เป็น array ของ products ตาม index
                const products = Object.entries(values).reduce((acc, [key, value]) => {
                    const [field, index] = key.split("-");
                    if (field && index !== undefined) {
                        if (!acc[index]) acc[index] = {};
                        acc[index][field] = value;
                    }
                    return acc;
                }, [] as any[]);

                const parsedProducts = products.map((product) => ({
                    ...product,
                    UnitPerQuantityID: Number(product.UnitPerQuantityID),
                    CategoryID: Number(product.CategoryID),
                    ShelfID: Number(product.ShelfID),
                }));

                // ดึง employeeID จาก localStorage
                const employeeID = localStorage.getItem("id");

                const billData = {
                    Bill: {
                        Title: values.Title,
                        SupplyID: Number(values.SupplyID),
                        DateImport: values.DateImport.toISOString(),
                        SummaryPrice: values.SummaryPrice,
                        EmployeeID: Number(employeeID),
                    },
                    Products: parsedProducts,
                    ProductsOfBill: parsedProducts.map((p) => ({
                        ManufacturerCode: p.ManufacturerCode,
                        Quantity: p.Quantity,
                        PricePerPiece: p.PricePerPiece,
                        Discount: p.Discount ?? 0,
                    })),
                };

                console.log(billData);

                // เรียก API
                CreateBillwithProduct(billData)
                    .then((res) => {
                        if (res && res.status === 201) {
                            message.success("สร้างบิลและสินค้าเรียบร้อย");
                            form.resetFields();
                            setIsCreateModalOpen(false);
                            getBillAll();
                        } else {
                            message.error("เกิดข้อผิดพลาดในการสร้างบิล");
                            console.log("Response ไม่ 201:", res);
                        }
                    })
                    .catch(() => {
                        message.error("เกิดข้อผิดพลาดในการสร้างบิล");
                    });
            })
            .catch((err) => {
                console.log("Validation Failed", err);
            });
    };

    const getSupply = async () => {
        try {
            const res = await GetSupply();
            if (res.status === 200) {
                const sups = res.data.map((item: SupplyInterface) => ({
                    ID: item.ID.toString(),
                    SupplyName: item.SupplyName || "-",
                }));
                setSupplyData(sups);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลบริษัทได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
        }
    };

    const getBillAll = async () => {
        try {
            const res = await GetAllBills();
            if (res.status === 200) {
                const bills = res.data.map((item: BillInterface) => ({
                    ID: item.ID.toString(),
                    Title: item.Title || "-",
                    DateImport: dayjs(item.DateImport).format("DD-MM-YYYY"),
                    Supply: item.Supply?.SupplyName || "-",
                    Employee: item.Employee?.FirstName || "-",
                }));
                setBillData(bills);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลรายการสินค้าได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า");
        }
    };

    const getUnitperQuantity = async () => {
        try {
            const res = await GetUnitPerQuantity();
            if (res.status === 200) {
                const unit = res.data.map((item: UnitPerQuantityInterface) => ({
                    ID: item.ID.toString(),
                    NameOfUnit: item.NameOfUnit || "-",
                }));
                setUnitData(unit);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลหน่วยของสินค้าได้");
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
                    ID: item.ID.toString(),
                    CategoryName: item.CategoryName || "-",
                }));
                setCateData(cate);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลประเภทสินค้าได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า");
        }
    };

    const getZone = async () => {
        try {
            const res = await GetZone();
            if (res.status === 200) {
                const zones = res.data.map((item: ZoneInterface) => ({
                    ID: item.ID.toString(),
                    ZoneName: item.ZoneName || "-",
                }));
                setZoneData(zones);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลตำแหน่งได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง");
        }
    };

    const handleZoneSelect = async (ZoneID: number, index: number) => {
        try {
            form.setFieldsValue({ [`shelfID-${index}`]: null }); // Reset shelf ของ index นี้
            const ShelfResponse = await GetShelfByZoneID(ZoneID);
            if (ShelfResponse.status === 200) {
                setShelfMap(prev => ({
                    ...prev,
                    [index]: ShelfResponse.data,
                }));
            } else {
                message.error(ShelfResponse.data.error || "ไม่สามารถโหลดข้อมูลชั้นวางได้");
            }
        } catch (error) {
            message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลชั้นวาง");
        }
    };

    const showDeleteConfirmModal = (id: number) => {
        Modal.confirm({
            title: "ยืนยันการลบข้อมูล",
            content: "คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?",
            okText: "ลบ",
            okType: "danger",
            cancelText: "ยกเลิก",
            onOk: async () => {
                try {
                    await DeleteBill(id); // เรียก API ลบข้อมูล
                    message.success("ลบข้อมูลเรียบร้อย");

                    await new Promise((resolve) => setTimeout(resolve, 2000));

                    await getBillAll();
                } catch (error) {
                    message.error("ลบข้อมูลล้มเหลว");
                }
            },
        });
    };



    const columns = [
        {
            title: 'ลำดับ',
            dataIndex: 'ID',
            key: 'ID',
        },
        {
            title: 'ชื่อรายการ',
            dataIndex: 'Title',
            key: 'Title',
        },
        {
            title: 'วันที่นำเข้าสินค้า',
            dataIndex: 'DateImport',
            key: 'DateImport',
        },
        {
            title: 'บริษัทขายส่ง',
            dataIndex: 'Supply',
            key: 'Supply',
        },
        {
            title: 'พนักงงานที่นำเข้า',
            dataIndex: 'Employee',
            key: 'Employee',
        },
        {
            title: "จัดการ",
            dataIndex: "Action",
            key: "Action",
            render: (_text: any, record: any) => {
                const ID = record.ID; // หรือชื่อฟิลด์จริงที่เก็บ id ใน data
                return (
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    label: "ดูใบสั่งซื้อสินค้า",
                                    key: "1",
                                    icon: <InfoCircleOutlined />,
                                    // onClick: () => {
                                    //     navigate(`/studentlist/edit/${ID}`);
                                    // },
                                },
                                {
                                    label: "แก้ไขข้อมูล",
                                    key: "2",
                                    icon: <EditOutlined />,
                                    // onClick: () => {
                                    //     navigate(`/studentlist/edit_education/${ID}`);
                                    // },
                                },
                                {
                                    label: "ลบข้อมูล",
                                    key: "3",
                                    icon: <DeleteOutlined />,
                                    onClick: () => {
                                        if (ID !== undefined) {
                                            showDeleteConfirmModal(ID);
                                        } else {
                                            message.error("ไม่พบ ID");
                                        }
                                    },
                                    danger: true,
                                },
                            ],
                        }}
                    >
                        <Button
                            icon={<DashOutlined />}
                            size={"small"}
                            className="btn"
                            shape="circle"
                        />
                    </Dropdown>
                );
            },
        },
    ];

    useEffect(() => {
        getBillAll();
        getUnitperQuantity();
        getSupply();
        getCategory();
        getZone();
    }, []);

    return (
        <>
            {contextHolder}
            <div
                className="Card-Header" style={{
                    marginTop: "5vh",
                    height: "10%",
                    width: "17%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                <span style={{ fontSize: 20, color: "white" }}>
                    <FileAddOutlined style={{ marginRight: 8, color: "white" }} />
                    นำเข้าข้อมูลสินค้า
                </span>
            </div>

            <Row style={{ display: "flex", justifyContent: "center", marginTop: "3%", marginBottom: "3%" }}>
                <Col style={{ marginRight: "10%" }}>
                    <Button
                        onClick={showCreateModal}
                        className="button-import" style={{
                            height: "auto",
                            width: "auto",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                        <span style={{
                            fontSize: 20, color: "white", display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                            <KeyboardIcon style={{ marginRight: 8, color: "white" }} />
                            เพิ่มข้อมูลด้วยตนเอง
                        </span>
                    </Button>
                </Col>

                <Col style={{ marginLeft: "10%" }}>
                    <Button
                        className="button-import" style={{
                            height: "auto",
                            width: "auto",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                        <span style={{ fontSize: 20, color: "white" }}>
                            <FilePdfOutlined style={{ marginRight: 8, color: "white" }} />
                            เพิ่มข้อมูลด้วย PDF
                        </span>
                    </Button>
                </Col>
            </Row>

            <div
                className="Card-Header" style={{
                    marginTop: "0",
                    height: "auto",
                    width: "18vw",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                <span style={{ fontSize: 20, color: "white" }}>
                    <HistoryOutlined style={{ marginRight: 8, color: "white", fontSize: 24 }} />
                    ประวัติการนำเข้าสินค้า
                </span>
            </div>

            <Table className="Table-historyimport-product" dataSource={Bills} columns={columns} pagination={{ pageSize: 4 }} />;

            <Modal
                open={isCreateModalOpen}
                onOk={handleModelCreateOk}
                onCancel={handleCreateCancel}
                okText="บันทึก"
                cancelText="ยกเลิก"
                width={700}
            >
                <Form form={form} layout="vertical" name="form">
                    <Row gutter={[8, 8]}>
                        <Col xl={12}>
                            <Form.Item
                                name="Title"
                                label="ชื่อรายการสั่งซื้อ"
                                rules={[{ required: true, message: "กรุณากรอกชื่อรายการสั่งซื้อ" }]}
                            >
                                <Input placeholder="กรอกชื่อรายการสั่งซื้อ" />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="SupplyID"
                                label="ชื่อบริษัทที่สั่งซื้อ"
                                rules={[{ required: true, message: "กรุณากรอกชื่อบริษัทที่สั่งซื้อ" }]}
                            >
                                <Select placeholder="เลือกหน่วยสินค้า">
                                    {Sups.map((sup) => (
                                        <Option key={sup.ID} value={sup.ID}>
                                            {sup.SupplyName}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="DateImport"
                                label="วันที่นำเข้าสินค้า"
                                rules={[{ required: true, message: "กรุณาเลือกวันที่นำเข้าสินค้า" }]}
                            >
                                <DatePicker
                                    style={{ width: "100%" }}
                                    placeholder="เลือกวันที่นำเข้าสินค้า"
                                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                                />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                name="SummaryPrice"
                                label="มูลค่ารวม (บาท)"
                                rules={[{ required: true, message: "กรุณากรอกมูลค่ารวม" }]}
                            >
                                <InputNumber
                                    min={0}
                                    step={0.01}
                                    style={{ width: "100%" }}
                                    placeholder="กรอกมูลค่ารวม"
                                    precision={2}
                                    onKeyPress={(e) => {
                                        const allowedChars = /^[0-9.]$/;
                                        if (!allowedChars.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Space direction="vertical" style={{ width: "100%" }}>
                        {productFields.map((item, index) => (
                            <Card
                                style={{ border: '2px solid #d9d9d9' }}
                                key={item.key}
                                title={`สินค้า #${index + 1}`}
                                extra={
                                    productFields.length > 1 && (
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveCard(item.key)}
                                            size="small"
                                        >
                                            ลบ
                                        </Button>
                                    )
                                }
                            >
                                <Row gutter={[8, 8]}>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`ProductName-${index}`}
                                            label="ชื่อสินค้า"
                                            rules={[{ required: true, message: "กรุณากรอกชื่อสินค้า" }]}
                                        >
                                            <Input placeholder="กรอกชื่อสินค้า" />
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`ProductCode-${index}`}
                                            label="รหัสสินค้า"
                                            rules={[{ required: true, message: "กรุณากรอกรหัสสินค้า" }]}
                                        >
                                            <Input placeholder="กรอกรหัสสินค้า" />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={12}>
                                        <Form.Item
                                            name={`SupplyProductCode-${index}`}
                                            label="รหัสสินค้าของบริษัทสั่งซื้อ"
                                        >
                                            <Input placeholder="กรอกรหัสสินค้าของบริษัทสั่งซื้อ" />
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`ManufacturerCode-${index}`}
                                            label="รหัสสินค้าของบริษัทที่ผลิต"
                                            rules={[{ required: true, message: "กรุณากรอกรหัสสินค้าของบริษัทที่ผลิต" }]}
                                        >
                                            <Input placeholder="กรอกรหัสสินค้าของบริษัทที่ผลิต" />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={24}>
                                        <Form.Item
                                            name={`Description-${index}`}
                                            label="คำอธิบายสินค้า"
                                            rules={[{ required: true, message: "กรุณากรอกคำอธิบายสินค้า" }]}
                                        >
                                            <Input placeholder="กรอกคำอธิบายสินค้า" />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={12}>
                                        <Form.Item
                                            name={`Quantity-${index}`}
                                            label="จำนวนของสินค้า"
                                            rules={[{ required: true, message: "กรุณากรอกจำนวนของสินค้า" }]}
                                        >
                                            <InputNumber
                                                placeholder="กรอกจำนวนของสินค้า"
                                                style={{ width: "100%" }}
                                                onKeyPress={(e) => {
                                                    const allowedChars = /^[0-9.]$/;
                                                    if (!allowedChars.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`UnitPerQuantityID-${index}`}
                                            label="หน่วยสินค้า"
                                            rules={[{ required: true, message: "กรุณาเลือกหน่วยสินค้า" }]}
                                        >
                                            <Select placeholder="เลือกหน่วยสินค้า">
                                                {Units.map((unit) => (
                                                    <Option key={unit.ID} value={unit.ID}>
                                                        {unit.NameOfUnit}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`PricePerPiece-${index}`}
                                            label="มูลค่าสินค้าต่อชิ้น"
                                            rules={[{ required: true, message: "กรุณากรอกมูลค่าสินค้าต่อชิ้น" }]}
                                        >
                                            <InputNumber
                                                min={0}
                                                step={0.01}
                                                style={{ width: "100%" }}
                                                placeholder="กรอกมูลค่าสินค้าต่อชิ้น"
                                                precision={2}
                                                onKeyPress={(e) => {
                                                    const allowedChars = /^[0-9.]$/;
                                                    if (!allowedChars.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`Discount-${index}`}
                                            label="ส่วนลด (ถ้ามี)"
                                        >
                                            <InputNumber
                                                min={0}
                                                step={0.01}
                                                style={{ width: "100%" }}
                                                placeholder="กรอกส่วนลด (ถ้ามี)"
                                                precision={2}
                                                onKeyPress={(e) => {
                                                    const allowedChars = /^[0-9.]$/;
                                                    if (!allowedChars.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`SalePrice-${index}`}
                                            label="มูลค่าราคาขาย"
                                            rules={[{ required: true, message: "กรุณากรอกมูลค่าราคาขาย" }]}
                                        >
                                            <InputNumber
                                                min={0}
                                                step={0.01}
                                                style={{ width: "100%" }}
                                                placeholder="กรอกมูลค่าราคาขาย"
                                                precision={2}
                                                onKeyPress={(e) => {
                                                    const allowedChars = /^[0-9.]$/;
                                                    if (!allowedChars.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={12}>
                                        <Form.Item
                                            name={`CategoryID-${index}`}
                                            label="ประเภทสินค้า"
                                            rules={[{ required: true, message: "กรุณาเลือกประเภทสินค้า" }]}
                                        >
                                            <Select placeholder="เลือกประเภทสินค้า">
                                                {Categorys.map((cate) => (
                                                    <Option key={cate.ID} value={cate.ID}>
                                                        {cate.CategoryName}
                                                    </Option>
                                                ))}
                                            </Select>

                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`zone-${index}`}
                                            label="ตำแหน่งสินค้า"
                                            rules={[{ required: true, message: "กรุณาเลือกตำแหน่งสินค้า" }]}
                                        >
                                            <Select placeholder="เลือกตำแหน่งสินค้า"
                                                onChange={(value) => handleZoneSelect(value, index)}>
                                                {(Zones).map((zone) => (
                                                    <Option key={zone.ID} value={zone.ID}>
                                                        {zone.ZoneName}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`ShelfID-${index}`}
                                            label="ตำแหน่งสินค้า"
                                            rules={[{ required: true, message: "กรุณาเลือกตำแหน่งสินค้า" }]}
                                        >
                                            <Select
                                                placeholder="เลือกตำแหน่งสินค้า"
                                                disabled={!form.getFieldValue(`zone-${index}`)}
                                            >
                                                {(shelfMap[index] || []).map((shelf) => (
                                                    <Option key={shelf.ID} value={shelf.ID}>
                                                        {shelf.ShelfName}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        ))}

                        <Button
                            onClick={handleAddCard}
                            type="dashed"
                            icon={<PlusOutlined />}
                            style={{ width: "100%" }}
                        >
                            เพิ่มสินค้าอีกชิ้น
                        </Button>
                    </Space>
                </Form>
            </Modal>

        </>
    );
}

export default ImportProduct;