import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Upload, Button, Col, Row, Table, Dropdown, message, Form, Input, Modal, Space, Card, InputNumber, DatePicker, Select, Steps } from "antd";
import {
    FileAddOutlined,
    FilePdfOutlined,
    HistoryOutlined,
    EditOutlined,
    DeleteOutlined,
    DashOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    FileExcelOutlined

} from "@ant-design/icons";
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { CreateBillwithProduct, DeleteBill, GetAllBills, GetCategory, GetShelfByZoneID, GetUnitPerQuantity, GetZone } from "../../services/https";
import type { BillInterface } from "../../interfaces/Bill";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import type { CategoryInterface } from "../../interfaces/Category";
import type { ZoneInterface } from "../../interfaces/Zone";
import type { ShelfInterface } from "../../interfaces/Shelf";
// import { useNavigate } from "react-router-dom";
const { Option } = Select;

function ImportProduct() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Bills, setBillData] = useState<BillInterface[]>([]);
    const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
    const [Categorys, setCateData] = useState<CategoryInterface[]>([]);
    const [Zones, setZoneData] = useState<ZoneInterface[]>([]);
    const [shelfMap, setShelfMap] = useState<Record<number, ShelfInterface[]>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [billForms, setBillForms] = useState<any[]>([{}]); //
    const [currentStep, setCurrentStep] = useState(0); // index ของบิลที่กำลังแก้
    const [form] = Form.useForm();
    const [productFields, setProductFields] = useState<{ key: number }[]>([]);
    const [productFieldsMap, setProductFieldsMap] = useState<Record<number, { key: number }[]>>({});


    const handleExcelUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            console.log("Raw Excel Data:", jsonData);

            const formValues: Record<string, any> = {};

            // อ่าน Supply, DateImport, Title
            jsonData.forEach(row => {
                if (row[0] === "ชื่อบริษัท") {
                    formValues["SupplyName"] = row[1];
                }
                if (row[0] === "วันที่นำเข้า") {
                    formValues["DateImport"] = dayjs(row[1], "DD/MM/YYYY");
                }
                if (row[0] === "ชื่อใบสั่งซื้อ") {
                    formValues["Title"] = row[1];
                }
            });

            // หาตำแหน่ง header row
            const headerIndex = jsonData.findIndex(
                row =>
                    row[0] === "ลำดับ" &&
                    row[1] === "รหัสสินค้าบริษัทที่ผลิต" &&
                    row[2] === "รหัสสินค้าของบริษัทสั่งซื้อ" &&
                    row[3] === "รายการ" &&
                    row[4] === "จำนวน" &&
                    row[5] === "หน่วย" &&
                    row[6] === "ราคาต่อหน่วย" &&
                    row[7] === "ส่วนลด %" &&
                    row[8] === "ราคารวม" &&
                    row[9] === "ราคาขายต่อหน่วย" &&
                    row[10] === "คำอธิบายสินค้า"
            );

            if (headerIndex === -1) {
                console.error("ไม่พบ header row ในไฟล์ Excel");
                return;
            }

            const rows = jsonData.slice(headerIndex + 1).filter(row => row.length > 0);

            const products: any[] = [];
            let summaryPrice: number | null = null;

            for (const row of rows) {
                if (row[3] === "จำนวนเงินรวมทั้งสิ้น") {
                    summaryPrice = row[8] !== undefined ? parseFloat(row[8].toString().replace(/,/g, "")) : 0;
                } else {
                    products.push({
                        ManufacturerCode: row[1] ?? "",
                        SupplyProductCode: row[2] ?? "",
                        ProductName: row[3] ?? "",
                        Quantity: row[4] ?? 0,
                        UnitPerQuantityID: row[5] ?? "",
                        PricePerPiece: row[6] ?? 0,
                        Discount: row[7] ?? 0,
                        SumPriceProduct: row[8] ?? 0,
                        SalePrice: row[9] ?? 0,
                        Description: row[10] ?? "",
                    });
                }
            }

            // สร้าง key คงที่สำหรับแต่ละ product
            const newProductFields = products.map((_, i) => ({ key: Date.now() + i }));

            // map products ลง form โดยใช้ key ของแต่ละ card
            products.forEach((p, i) => {
                const key = newProductFields[i].key;
                formValues[`ManufacturerCode-${key}`] = p.ManufacturerCode;
                formValues[`SupplyProductCode-${key}`] = p.SupplyProductCode;
                formValues[`ProductName-${key}`] = p.ProductName;
                formValues[`Quantity-${key}`] = p.Quantity;
                formValues[`UnitPerQuantityID-${key}`] = p.UnitPerQuantityID;
                formValues[`PricePerPiece-${key}`] = p.PricePerPiece;
                formValues[`Discount-${key}`] = p.Discount;
                formValues[`SumPriceProduct-${key}`] = p.SumPriceProduct;
                formValues[`SalePrice-${key}`] = p.SalePrice;
                formValues[`Description-${key}`] = p.Description;
            });

            if (summaryPrice !== null) {
                formValues["SummaryPrice"] = summaryPrice;
            }

            form.setFieldsValue(formValues);
            setProductFields(newProductFields);
            setIsCreateModalOpen(true);

            console.log("Form Values:", formValues);
        };

        reader.readAsArrayBuffer(file);
        return false;
    };

    // บันทึกบิลลง localStorage ตาม key
    const saveBillToStorage = (key: number, billData: any) => {
        const bills = JSON.parse(localStorage.getItem("billForms") || "{}");
        bills[key] = billData;
        localStorage.setItem("billForms", JSON.stringify(bills));
    };

    // ดึงบิลจาก localStorage ตาม key
    const getBillFromStorage = (key: number) => {
        const bills = JSON.parse(localStorage.getItem("billForms") || "{}");
        const bill = bills[key] || {};

        // แปลงวันที่เป็น dayjs สำหรับ DatePicker
        const newBill: Record<string, any> = { ...bill };
        Object.keys(newBill).forEach((field) => {
            if (field === "DateImport" && newBill[field]) {
                newBill[field] = dayjs(newBill[field]);
            }
        });

        return newBill;
    };

    const handleNextBill = () => {
        // 1. บันทึก form ปัจจุบันลง billForms
        const currentValues = form.getFieldsValue();
        const newBillForms = [...billForms];
        newBillForms[currentStep] = currentValues;
        setBillForms(newBillForms);

        // 2. บันทึก productFields ปัจจุบันลง map
        setProductFieldsMap(prev => ({
            ...prev,
            [currentStep]: [...productFields]
        }));

        // 3. ไปบิลถัดไป
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);

        // 4. โหลด form + productFields ของบิลถัดไป
        const nextBill = newBillForms[nextStep] || {};
        form.setFieldsValue(nextBill);
        const nextProductFields = productFieldsMap[nextStep] || [{ key: Date.now() }];
        setProductFields(nextProductFields);
    };

    const handlePrevBill = () => {
        // 1. บันทึก form ปัจจุบันลง billForms
        const currentValues = form.getFieldsValue();
        const newBillForms = [...billForms];
        newBillForms[currentStep] = currentValues;
        setBillForms(newBillForms);

        // 2. บันทึก productFields ปัจจุบันลง map
        setProductFieldsMap(prev => ({
            ...prev,
            [currentStep]: [...productFields]
        }));

        // 3. ไปบิลก่อนหน้า
        const prevStep = currentStep - 1;
        if (prevStep >= 0) {
            setCurrentStep(prevStep);

            // 4. โหลด form + productFields ของบิลก่อนหน้า
            const prevBill = newBillForms[prevStep] || {};
            form.setFieldsValue(prevBill);
            const prevProductFields = productFieldsMap[prevStep] || [{ key: Date.now() }];
            setProductFields(prevProductFields);
        }
    };

    const handleAddBill = () => {
        // บันทึกบิลปัจจุบันและ productFields ปัจจุบัน
        saveBillToStorage(currentStep, form.getFieldsValue());
        setProductFieldsMap(prev => ({ ...prev, [currentStep]: productFields }));

        const newIndex = billForms.length;
        setBillForms([...billForms, {}]); // เพิ่มบิลใหม่
        setCurrentStep(newIndex);

        // เริ่ม productFields ว่างสำหรับบิลใหม่
        setProductFields([]);
        form.resetFields();
    };




    const showCreateModal = () => setIsCreateModalOpen(true);
    const handleCreateCancel = () => setIsCreateModalOpen(false);

    const handleAddCard = () => {
        const newKey = productFields.length ? Math.max(...productFields.map(f => f.key)) + 1 : 1;
        setProductFields([...productFields, { key: newKey }]);
    };

    const handleRemoveCard = (keyToRemove: number) => {
        // ลบ card จาก state
        const updatedFields = productFields.filter(item => item.key !== keyToRemove);
        setProductFields(updatedFields);

        // ลบค่าของฟิลด์ที่เกี่ยวข้องกับ card นั้น
        const fieldsToRemove = [
            `ProductName-${keyToRemove}`,
            `ProductCode-${keyToRemove}`,
            `SupplyProductCode-${keyToRemove}`,
            `ManufacturerCode-${keyToRemove}`,
            `Description-${keyToRemove}`,
            `Quantity-${keyToRemove}`,
            `UnitPerQuantityID-${keyToRemove}`,
            `PricePerPiece-${keyToRemove}`,
            `Discount-${keyToRemove}`,
            `SumPriceProduct-${keyToRemove}`,
            `SalePrice-${keyToRemove}`,
            `CategoryID-${keyToRemove}`,
            `zone-${keyToRemove}`,
            `ShelfID-${keyToRemove}`
        ];

        form.resetFields(fieldsToRemove);
    };

    const handleSaveAll = async () => {
        try {
            const values = await form.validateFields();
            const newBills = [...billForms];
            newBills[currentStep] = values;
            setBillForms(newBills);

            for (const bill of newBills) {
                // --- โค้ดเหมือน handleModelCreateOk ---
                const products = Object.entries(bill).reduce((acc, [key, value]) => {
                    const [field, index] = key.split("-");
                    const idx = Number(index);
                    if (field && idx !== undefined) {
                        if (!acc[idx]) acc[idx] = {};
                        acc[idx][field] = value;
                    }
                    return acc;
                }, [] as any[]);

                const parsedProducts = products.map((product) => ({
                    ...product,
                    UnitPerQuantityID: Number(product.UnitPerQuantityID),
                    CategoryID: Number(product.CategoryID),
                    ShelfID: Number(product.ShelfID),
                }));

                const billData = {
                    Bill: {
                        Title: bill.Title,
                        SupplyName: bill.SupplyName,
                        DateImport: bill.DateImport.toISOString(),
                        SummaryPrice: bill.SummaryPrice,
                        EmployeeID: Number(localStorage.getItem("id")),
                    },
                    Products: parsedProducts,
                    ProductsOfBill: parsedProducts.map((p) => ({
                        ManufacturerCode: p.ManufacturerCode,
                        Quantity: p.Quantity,
                        PricePerPiece: p.PricePerPiece,
                        Discount: p.Discount ?? 0,
                    })),
                };

                console.log("บันทึกบิล:", billData);

                try {
                    const res = await CreateBillwithProduct(billData);
                    if (res && res.status === 201) {
                        message.success("สร้างบิลและสินค้าเรียบร้อย");
                    } else {
                        message.error("เกิดข้อผิดพลาดในการสร้างบิล");
                        console.log("Response ไม่ 201:", res);
                    }
                } catch (err) {
                    message.error("เกิดข้อผิดพลาดในการสร้างบิล");
                    console.log("API error:", err);
                }
            }

            // reset หลังจากบันทึกทุกบิลแล้ว
            form.resetFields();
            setIsCreateModalOpen(false);
            setBillForms([{}]);
            setCurrentStep(0);
            getBillAll();
        } catch (err) {
            console.log("Validation Failed", err);
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

    const handleZoneSelect = async (ZoneID: number, key: number) => {
        try {
            // Reset shelf ของ card นี้
            form.setFieldsValue({ [`ShelfID-${key}`]: null });

            const ShelfResponse = await GetShelfByZoneID(ZoneID);
            if (ShelfResponse.status === 200) {
                setShelfMap(prev => ({
                    ...prev,
                    [key]: ShelfResponse.data, // ใช้ key แทน index
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
        getCategory();
        getZone();
        const bill = getBillFromStorage(currentStep);
        form.setFieldsValue(bill);
    }, [currentStep]);

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

            <Row
                style={{
                    marginTop: "3%",
                    marginBottom: "3%",
                    display: "flex",
                    justifyContent: "center", // จัดให้อยู่ตรงกลางแนวนอน
                    gap: "10%",               // เว้นระยะระหว่างปุ่ม
                    alignItems: "center"
                }}>
                <Col>
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

                <Col>
                    <Upload
                        beforeUpload={handleExcelUpload}
                        showUploadList={false}
                        accept=".xls,.xlsx" // จำกัดให้เลือกแต่ Excel
                    >
                        <Button
                            className="button-import"
                            style={{
                                height: "auto",
                                width: "auto",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <span style={{
                                fontSize: 20, color: "white", display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <FileExcelOutlined style={{ marginRight: 8 }} />
                                เพิ่มข้อมูลด้วย Excel
                            </span>
                        </Button>
                    </Upload>
                </Col>

                <Col>
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
                onCancel={handleCreateCancel}
                okText="บันทึก"
                cancelText="ยกเลิก"
                footer={[
                    <Button key="prev" onClick={handlePrevBill} disabled={currentStep === 0}>ย้อนกลับ</Button>,
                    <Button key="next" onClick={handleNextBill} disabled={currentStep === billForms.length - 1}>ถัดไป</Button>,
                    <Button key="add" type="dashed" onClick={handleAddBill}>+ เพิ่มบิลใหม่</Button>,
                    <Button key="save" type="primary" onClick={handleSaveAll}>บันทึกทั้งหมด</Button>,
                ]}
                width={700}
            >

                {/* Steps แสดงทุกบิล */}
                <Steps
                    current={currentStep}
                    onChange={(step) => setCurrentStep(step)}
                    items={billForms.map((_, i) => ({ title: `บิลที่ ${i + 1}` }))}
                    style={{ marginBottom: 16 }}
                />
                <h2>บิลที่ {currentStep + 1}</h2> {/* แสดงเลขบิลปัจจุบัน */}
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
                                name="SupplyName"
                                label="ชื่อบริษัทที่สั่งซื้อ"
                                rules={[{ required: true, message: "กรุณากรอกชื่อบริษัทที่สั่งซื้อ" }]}
                            >
                                <Input placeholder="กรอกชื่อบริษัทที่สั่งซื้อ" />
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
                                            name={`ProductName-${item.key}`}
                                            label="ชื่อสินค้า"
                                            rules={[{ required: true, message: "กรุณากรอกชื่อสินค้า" }]}
                                        >
                                            <Input placeholder="กรอกชื่อสินค้า" />
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`ProductCode-${item.key}`}
                                            label="รหัสสินค้า"
                                            rules={[{ required: true, message: "กรุณากรอกรหัสสินค้า" }]}
                                        >
                                            <Input placeholder="กรอกรหัสสินค้า" />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={12}>
                                        <Form.Item
                                            name={`SupplyProductCode-${item.key}`}
                                            label="รหัสสินค้าของบริษัทสั่งซื้อ"
                                        >
                                            <Input placeholder="กรอกรหัสสินค้าของบริษัทสั่งซื้อ" />
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`ManufacturerCode-${item.key}`}
                                            label="รหัสสินค้าของบริษัทที่ผลิต"
                                            rules={[{ required: true, message: "กรุณากรอกรหัสสินค้าของบริษัทที่ผลิต" }]}
                                        >
                                            <Input placeholder="กรอกรหัสสินค้าของบริษัทที่ผลิต" />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={24}>
                                        <Form.Item
                                            name={`Description-${item.key}`}
                                            label="คำอธิบายสินค้า"
                                            rules={[{ required: true, message: "กรุณากรอกคำอธิบายสินค้า" }]}
                                        >
                                            <Input placeholder="กรอกคำอธิบายสินค้า" />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={12}>
                                        <Form.Item
                                            name={`Quantity-${item.key}`}
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
                                            name={`UnitPerQuantityID-${item.key}`}
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
                                            name={`PricePerPiece-${item.key}`}
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
                                            name={`Discount-${item.key}`}
                                            label="ส่วนลด %f (ถ้ามี)"
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
                                            name={`SumPriceProduct-${item.key}`}
                                            label="ราคารวม"
                                            rules={[{ required: true, message: "กรุณากรอกมูลราคารวม" }]}
                                        >
                                            <InputNumber
                                                min={0}
                                                step={0.01}
                                                style={{ width: "100%" }}
                                                placeholder="กรอกมูลค่าราคารวม"
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
                                            name={`SalePrice-${item.key}`}
                                            label="ราคาขายต่อหน่วย"
                                            rules={[{ required: true, message: "กรุณากรอกราคาขายต่อหน่วย" }]}
                                        >
                                            <InputNumber
                                                min={0}
                                                step={0.01}
                                                style={{ width: "100%" }}
                                                placeholder="กรอกราคาขายต่อหน่วย"
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
                                            name={`CategoryID-${item.key}`}
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
                                            name={`zone-${item.key}`}
                                            label="ตำแหน่งสินค้า"
                                            rules={[{ required: true, message: "กรุณาเลือกตำแหน่งสินค้า" }]}
                                        >
                                            <Select
                                                placeholder="เลือกตำแหน่งสินค้า"
                                                onChange={(value) => handleZoneSelect(value, item.key)}
                                            >
                                                {Zones.map((zone) => (
                                                    <Option key={zone.ID} value={zone.ID}>
                                                        {zone.ZoneName}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xl={12}>
                                        <Form.Item
                                            name={`ShelfID-${item.key}`}
                                            label="ชั้นวางสินค้า"
                                            rules={[{ required: true, message: "กรุณาเลือกชั้นวางสินค้า" }]}
                                        >
                                            <Select
                                                placeholder="เลือกชั้นวางสินค้า"
                                                disabled={!form.getFieldValue(`zone-${item.key}`)}
                                            >
                                                {(shelfMap[item.key] || []).map((shelf) => (
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