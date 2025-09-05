import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Upload, Button, Col, Row, Table, Dropdown, message, Form, Input, Modal, Card, InputNumber, DatePicker, Select } from "antd";
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

function ImportProduct() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Bills, setBillData] = useState<BillInterface[]>([]);
    const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
    const [Categorys, setCateData] = useState<CategoryInterface[]>([]);
    const [Zones, setZoneData] = useState<ZoneInterface[]>([]);
    const [shelfMap, setShelfMap] = useState<Record<number, ShelfInterface[]>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // index ของบิลที่กำลังแก้
    const [form] = Form.useForm();
    const [billForms, setBillForms] = useState<any[]>([{}]);
    const [tempBills, setTempBills] = useState<any[]>(() => {
        const saved = localStorage.getItem("tempBills");
        return saved ? JSON.parse(saved) : [];
    });

    const handleExcelUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const formValues: any = { bills: [] };

            workbook.SheetNames.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                let jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                jsonData = jsonData.filter(row => row && row.length > 0);

                const bill: any = {
                    Title: "",
                    SupplyName: "",
                    DateImport: null,
                    SummaryPrice: 0,
                    products: []
                };

                // อ่านค่า Title, SupplyName, DateImport
                jsonData.forEach(row => {
                    if (row[0] === "ชื่อบริษัท") bill.SupplyName = row[1];
                    if (row[0] === "วันที่นำเข้า") bill.DateImport = dayjs(row[1], "DD/MM/YYYY");
                    if (row[0] === "ชื่อใบสั่งซื้อ") bill.Title = row[1];
                });

                // หาตำแหน่ง header ของ products
                const headerIndex = jsonData.findIndex(
                    row => row[0] === "ลำดับ"
                );

                if (headerIndex !== -1) {
                    const productRows = jsonData.slice(headerIndex + 1).filter(row => row && row.length > 0);
                    const products: any[] = [];
                    let summaryPrice: number | null = null;

                    for (const row of productRows) {
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
                    bill.products = products;
                    if (summaryPrice !== null) bill.SummaryPrice = summaryPrice;
                }

                formValues.bills.push(bill);

            });
            console.log("Form Values (All Bills):", formValues);
            // ใส่ค่าเข้า form
            form.setFieldsValue(formValues);
            // บันทึกลง localStorage
            saveTempBills(formValues.bills);
            // ตั้งค่า state สำหรับ currentStep
            setTempBills(formValues.bills);
            setCurrentStep(0);
            setIsCreateModalOpen(true);
        };

        reader.readAsArrayBuffer(file);
        return false;
    };

    const saveTempBills = (bills: any[]) => {
        try {
            // ดึงข้อมูล tempBills ปัจจุบันจาก state
            const currentTempBills = tempBills || [];

            // แปลงเป็น string เพื่อเทียบกัน
            const newBillsString = JSON.stringify(bills);
            const currentBillsString = JSON.stringify(currentTempBills);

            // ถ้าเหมือนกันไม่ต้องบันทึกซ้ำ
            if (newBillsString === currentBillsString) {
                console.log("ข้อมูลเหมือนเดิม ไม่บันทึกซ้ำ");
                return;
            }

            // บันทึกลง localStorage
            localStorage.setItem("tempBills", newBillsString);

            // อัปเดต state
            setTempBills(bills);

            console.log("Saved tempBills:", bills);
        } catch (err) {
            console.error("Error saving tempBills to localStorage:", err);
        }
    };


    const removeCurrentBill = () => {
        if (tempBills.length <= 1) {
            message.warning("ต้องมีบิลอย่างน้อย 1 บิล");
            return;
        }

        const updatedBills = [...tempBills];
        updatedBills.splice(currentStep, 1); // ลบบิลปัจจุบัน
        saveTempBills(updatedBills); // update tempBills และ localStorage

        const newStep = currentStep >= updatedBills.length ? updatedBills.length - 1 : currentStep;
        setCurrentStep(newStep);
        form.setFieldsValue(updatedBills[newStep] || {}); // โหลดบิลใหม่
    };

    const showCreateModal = () => setIsCreateModalOpen(true);
    const handleCreateCancel = () => setIsCreateModalOpen(false);

    const handleSaveAll = async () => {
        try {
            // 1. ดึงค่าปัจจุบันจาก form
            const values = form.getFieldsValue(true); // { bills: [...] }
            const updatedBills = [...tempBills];

            // merge บิลปัจจุบันก่อน validate
            if (values.bills && values.bills[currentStep]) {
                updatedBills[currentStep] = {
                    ...updatedBills[currentStep],
                    ...values.bills[currentStep],
                };
            }

            setTempBills(updatedBills);
            saveTempBills(updatedBills); // บันทึกลง localStorage

            // 2. Validate ทุกบิล
            for (let i = 0; i < updatedBills.length; i++) {
                const bill = updatedBills[i];
                let missingFields: string[] = [];

                if (!bill.Title) missingFields.push("ชื่อรายการสั่งซื้อ");
                if (!bill.SupplyName) missingFields.push("ชื่อบริษัทที่สั่งซื้อ");
                if (!bill.DateImport) missingFields.push("วันที่นำเข้าสินค้า");

                if (missingFields.length > 0) {
                    message.error(`กรุณากรอก ${missingFields.join(", ")} ของบิลที่ ${i + 1}`);
                    return;
                }

                if (!bill.products || bill.products.length === 0) {
                    message.error(`กรุณาเพิ่มสินค้าในบิลที่ ${i + 1}`);
                    return;
                }

                for (const [idx, p] of bill.products.entries()) {
                    let missingProductFields: string[] = [];
                    if (!p.ProductName) missingProductFields.push("ชื่อสินค้า");
                    if (!p.ManufacturerCode) missingProductFields.push("รหัสสินค้าผู้ผลิต");

                    if (missingProductFields.length > 0) {
                        message.error(`กรุณากรอก ${missingProductFields.join(", ")} ของสินค้า #${idx + 1} ในบิลที่ ${i + 1}`);
                        return;
                    }
                }
            }

            // 3. ส่งทุกบิลไป API (เหมือนเดิม)
            for (const bill of updatedBills) {
                const products = bill.products || [];
                const parsedProducts = products.map((p: any) => ({
                    ...p,
                    UnitPerQuantityID: Number(p.UnitPerQuantityID),
                    CategoryID: Number(p.CategoryID),
                    ShelfID: Number(p.ShelfID),
                }));

                const billData = {
                    Bill: {
                        Title: bill.Title,
                        SupplyName: bill.SupplyName,
                        DateImport: bill.DateImport,
                        SummaryPrice: bill.SummaryPrice,
                        EmployeeID: Number(localStorage.getItem("id")),
                    },
                    Products: parsedProducts,
                    ProductsOfBill: parsedProducts.map((p: any) => ({
                        ManufacturerCode: p.ManufacturerCode,
                        Quantity: p.Quantity,
                        PricePerPiece: p.PricePerPiece,
                        Discount: p.Discount ?? 0,
                    })),
                };

                try {
                    const res = await CreateBillwithProduct(billData);
                    if (res && res.status === 201) {
                        message.success(`สร้างบิล "${bill.Title}" เรียบร้อย`);
                    } else {
                        message.error(`เกิดข้อผิดพลาดในการสร้างบิล "${bill.Title}"`);
                        console.log("Response ไม่ 201:", res);
                    }
                } catch (err) {
                    message.error(`เกิดข้อผิดพลาดในการสร้างบิล "${bill.Title}"`);
                    console.log("API error:", err);
                }
            }

            // 4. Reset form และ state
            form.resetFields();
            setIsCreateModalOpen(false);
            setBillForms([{ products: [{}] }]);
            setCurrentStep(0);
            setTempBills([]);
            localStorage.removeItem("tempBills");
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
        console.log("zone id", ZoneID);

        try {
            form.setFields([
                {
                    name: ['bills', currentStep, 'products', key, 'ShelfID'],
                    value: null,
                },
            ]);

            const ShelfResponse = await GetShelfByZoneID(ZoneID);
            if (ShelfResponse.status === 200) {
                setShelfMap(prev => ({
                    ...prev,
                    [key]: ShelfResponse.data,
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
                    <Button key="cancel" onClick={() => setIsCreateModalOpen(false)}>ยกเลิก</Button>,
                    <Button
                        key="prev"
                        disabled={currentStep === 0}
                        onClick={() => {
                            const values = form.getFieldsValue(true);
                            const updatedBills = [...tempBills];
                            updatedBills[currentStep] = values; // save ปัจจุบัน
                            saveTempBills(updatedBills);

                            const prevStep = currentStep - 1;
                            setCurrentStep(prevStep);

                            // โหลดบิลปัจจุบันลง form
                            form.setFieldsValue(updatedBills[prevStep]);
                        }}
                    >
                        ย้อนกลับ
                    </Button>,

                    // ปุ่มถัดไป
                    <Button
                        key="next"
                        type="primary"
                        onClick={() => {
                            const values = form.getFieldsValue(true);
                            const updatedBills = [...tempBills];
                            updatedBills[currentStep] = values; // save ปัจจุบัน
                            saveTempBills(updatedBills);

                            const nextStep = currentStep + 1;
                            setCurrentStep(nextStep);

                            // โหลดบิลถัดไปลง form
                            form.setFieldsValue(updatedBills[nextStep]);
                        }}
                        disabled={currentStep === tempBills.length - 1}
                    >
                        ถัดไป
                    </Button>,


                    <Button
                        key="addBill"
                        onClick={() => {
                            // ดึงค่าปัจจุบันจากฟอร์ม
                            const values = form.getFieldsValue(true);
                            console.log("Current form values before adding new bill:", values);

                            // อัปเดต tempBills
                            const updatedBills = [...tempBills];
                            updatedBills[currentStep] = values;

                            // สร้างบิลใหม่
                            const newBill = { Title: "", SupplyName: "", DateImport: null, SummaryPrice: 0, products: [] };
                            updatedBills.push(newBill);

                            // บันทึกลง localStorage
                            saveTempBills(updatedBills);

                            // เปลี่ยน currentStep ไปบิลใหม่
                            setCurrentStep(updatedBills.length - 1);

                            // โหลดบิลใหม่ลงฟอร์ม
                            form.setFieldsValue(updatedBills[updatedBills.length - 1]);

                            console.log("Added new bill. Updated tempBills:", updatedBills);
                        }}
                    >
                        เพิ่มบิล
                    </Button>,
                    <Button key="save" type="primary" onClick={handleSaveAll}>บันทึก</Button>
                ]}

                width={'70%'}
            >

                <Form form={form} layout="vertical" name="form">
                    {/* Bill List */}
                    <Card
                        title={`บิลที่ ${currentStep + 1}`}
                        extra={
                            (form.getFieldValue("bills") || []).length > 1 && (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    onClick={removeCurrentBill}
                                >
                                    ลบบิล
                                </Button>
                            )
                        }
                    >


                        <Row gutter={[8, 8]}>
                            <Col xl={12}>
                                <Form.Item
                                    name={['bills', currentStep, 'Title']}
                                    label="ชื่อรายการสั่งซื้อ"
                                    rules={[{ required: true, message: "กรุณากรอกชื่อรายการสั่งซื้อ" }]}
                                >
                                    <Input placeholder="กรอกชื่อรายการสั่งซื้อ" />
                                </Form.Item>
                            </Col>
                            <Col xl={12}>
                                <Form.Item
                                    name={['bills', currentStep, 'SupplyName']}
                                    label="ชื่อบริษัทที่สั่งซื้อ"
                                    rules={[{ required: true, message: "กรุณากรอกชื่อบริษัทที่สั่งซื้อ" }]}
                                >
                                    <Input placeholder="กรอกชื่อบริษัทที่สั่งซื้อ" />
                                </Form.Item>
                            </Col>
                            <Col xl={12}>
                                <Form.Item
                                    name={['bills', currentStep, 'DateImport']}
                                    label="วันที่นำเข้าสินค้า"
                                    rules={[{ required: true, message: "กรุณาเลือกวันที่นำเข้าสินค้า" }]}
                                >
                                    <DatePicker
                                        style={{ width: "100%" }}
                                        placeholder="เลือกวันที่นำเข้าสินค้า"
                                        disabledDate={(current) => current && current > dayjs().endOf("day")}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xl={12}>
                                <Form.Item
                                    name={['bills', currentStep, 'SummaryPrice']}
                                    label="มูลค่ารวม (บาท)"
                                    rules={[{ required: true, message: "กรุณากรอกมูลค่ารวม" }]}
                                >
                                    <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="กรอกมูลค่ารวม" precision={2} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>


                    <Form.List name={['bills', currentStep, 'products']}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <Card
                                        key={field.key} // ใช้ field.key ของ Form.List
                                        style={{ border: '2px solid #d9d9d9', marginBottom: 16 }}
                                        title={`สินค้า #${index + 1}`}
                                        extra={
                                            fields.length > 1 && (
                                                <Button
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => remove(field.name)}
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
                                                    {...field}
                                                    name={[field.name, 'ProductName']}
                                                    key={field.key}
                                                    label="ชื่อสินค้า"
                                                    rules={[{ required: true, message: 'กรุณากรอกชื่อสินค้า' }]}
                                                >
                                                    <Input placeholder="กรอกชื่อสินค้า" />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'ProductCode']}
                                                    key={field.key}
                                                    label="รหัสสินค้า"
                                                    rules={[{ required: true, message: 'กรุณากรอกรหัสสินค้า' }]}
                                                >
                                                    <Input placeholder="กรอกรหัสสินค้า" />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'SupplyProductCode']}
                                                    label="รหัสสินค้าของบริษัทสั่งซื้อ"
                                                >
                                                    <Input placeholder="กรอกรหัสสินค้าของบริษัทสั่งซื้อ" />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'ManufacturerCode']}
                                                    label="รหัสสินค้าของบริษัทที่ผลิต"
                                                    rules={[{ required: true, message: 'กรุณากรอกรหัสสินค้าของบริษัทที่ผลิต' }]}
                                                >
                                                    <Input placeholder="กรอกรหัสสินค้าของบริษัทที่ผลิต" />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'Description']}
                                                    label="คำอธิบายสินค้า"
                                                    rules={[{ required: true, message: 'กรุณากรอกคำอธิบายสินค้า' }]}
                                                >
                                                    <Input.TextArea rows={3} placeholder="กรอกคำอธิบายสินค้า" />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'Quantity']}
                                                    label="จำนวนของสินค้า"
                                                    rules={[{ required: true, message: 'กรุณากรอกจำนวนของสินค้า' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} placeholder="กรอกจำนวนของสินค้า" />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'UnitPerQuantityID']}
                                                    label="หน่วยสินค้า"
                                                    rules={[{ required: true, message: 'กรุณาเลือกหน่วยสินค้า' }]}
                                                >
                                                    <Select placeholder="เลือกหน่วยสินค้า">
                                                        {Units.map(unit => (
                                                            <Select.Option key={unit.ID} value={unit.ID}>
                                                                {unit.NameOfUnit}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'PricePerPiece']}
                                                    label="มูลค่าสินค้าต่อชิ้น"
                                                    rules={[{ required: true, message: 'กรุณากรอกมูลค่าสินค้าต่อชิ้น' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} placeholder="กรอกมูลค่าสินค้าต่อชิ้น" precision={2} />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'Discount']}
                                                    label="ส่วนลด (ถ้ามี)"
                                                >
                                                    <InputNumber style={{ width: '100%' }} placeholder="กรอกส่วนลด" precision={2} />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'SumPriceProduct']}
                                                    label="ราคารวม"
                                                    rules={[{ required: true, message: 'กรุณากรอกมูลราคารวม' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} placeholder="กรอกมูลราคารวม" precision={2} />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'SalePrice']}
                                                    label="ราคาขายต่อหน่วย"
                                                    rules={[{ required: true, message: 'กรุณากรอกราคาขายต่อหน่วย' }]}
                                                >
                                                    <InputNumber style={{ width: '100%' }} placeholder="กรอกราคาขายต่อหน่วย" precision={2} />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'CategoryID']}
                                                    label="ประเภทสินค้า"
                                                    rules={[{ required: true, message: 'กรุณาเลือกประเภทสินค้า' }]}
                                                >
                                                    <Select placeholder="เลือกประเภทสินค้า">
                                                        {Categorys.map(cate => (
                                                            <Select.Option key={cate.ID} value={cate.ID}>
                                                                {cate.CategoryName}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'zone']}
                                                    label="ตำแหน่งสินค้า"
                                                    rules={[{ required: true, message: 'กรุณาเลือกตำแหน่งสินค้า' }]}
                                                >
                                                    <Select
                                                        placeholder="เลือกตำแหน่งสินค้า"
                                                        onChange={(value) => handleZoneSelect(value, field.name)}
                                                    >
                                                        {Zones.map(zone => (
                                                            <Select.Option key={zone.ID} value={zone.ID}>
                                                                {zone.ZoneName}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12}>
                                                <Form.Item
                                                    {...field}
                                                    key={field.key}
                                                    name={[field.name, 'ShelfID']}
                                                    label="ชั้นวางสินค้า"
                                                    rules={[{ required: true, message: 'กรุณาเลือกชั้นวางสินค้า' }]}
                                                >
                                                    <Select
                                                        placeholder="เลือกชั้นวางสินค้า"
                                                        disabled={!form.getFieldValue(['bills', currentStep, 'products', field.name, 'zone'])}
                                                    >
                                                        {(shelfMap[field.name] || []).map((shelf: any) => (
                                                            <Select.Option key={shelf.ID} value={shelf.ID}>
                                                                {shelf.ShelfName}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}

                                <Button type="dashed" onClick={() => add()} style={{ width: '100%' }} icon={<PlusOutlined />}>
                                    เพิ่มสินค้าอีกชิ้น
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal >

        </>
    );
}

export default ImportProduct;