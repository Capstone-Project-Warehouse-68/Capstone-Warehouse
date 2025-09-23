import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Upload, Button, Col, Row, message, Form, Input, Modal, Card, InputNumber, DatePicker, Spin, Select as AntdSelect, FloatButton } from "antd";
import {
    FileAddOutlined,
    FilePdfOutlined,
    HistoryOutlined,
    DeleteOutlined,
    FileExcelOutlined,
    DownloadOutlined

} from "@ant-design/icons";
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { CreateBillwithProduct, DeleteBill, DownloadTemplateFile, GetAllBills, GetBillAllDataById, GetSupply, GetUnitPerQuantity, UpdateBillWithProduct } from "../../services/https";
import type { BillInterface, ProductInterface } from "../../interfaces/Bill";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import {
    Table, TableHead, TableRow, TableCell, TableBody,
    IconButton, MenuItem, Select,
    Menu, TablePagination, TableContainer, Paper,
    TextField
} from "@mui/material";
import { Delete, Add, Info, Edit, MoreVert } from "@mui/icons-material";
import React from "react";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import type { SupplyInterface } from "../../interfaces/Supply";

function ImportProduct() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Bills, setBillData] = useState<BillInterface[]>([]);
    const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isModalDataOpen, setIsModalDataOpen] = useState(false);
    const [Supplyer, setSupplyer] = useState<SupplyInterface[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [tempBills, setTempBills] = useState<any[]>(() => {
        const saved = localStorage.getItem("tempBills");
        return saved ? JSON.parse(saved) : [];
    });
    const [products, setProducts] = useState<any[]>([]);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = React.useState<any>(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(4);
    const [selectedBill, setSelectedBill] = useState<BillInterface | null>(null);
    const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

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
                    SupplyID: undefined,
                    DateImport: null,
                    SummaryPrice: 0,
                    products: []
                };

                // อ่าน header ข้อมูลบิล
                jsonData.forEach(row => {
                    if (row[0] === "ชื่อบริษัท") {
                        const supply = Supplyer.find(s => s.SupplyName === row[1]);
                        if (!supply) {
                            messageApi.error("กรุณาเพิ่มข้อมูลบริษัทหรือเลือกบริษัทที่มีอยู่: " + row[1]);
                            return;
                        }
                        bill.SupplyID = supply.ID;
                    }
                    if (row[0] === "วันที่นำเข้า") bill.DateImport = row[1] ? dayjs(row[1], "DD/MM/YYYY") : null;
                    if (row[0] === "ชื่อใบสั่งซื้อ") bill.Title = row[1];
                });

                const headerIndex = jsonData.findIndex(row => row[0] === "ลำดับ");
                if (headerIndex !== -1) {
                    const productRows = jsonData.slice(headerIndex + 1).filter(row => row && row.length > 0);
                    let summaryPrice: number | null = null;

                    bill.products = productRows
                        .map(row => {
                            if (row[3] === "จำนวนเงินรวมทั้งสิ้น") {
                                summaryPrice = row[8] ? parseFloat(row[8].toString().replace(/,/g, "")) : 0;
                                return null;
                            }
                            const unit = Units.find(u => u.NameOfUnit === row[5]);
                            return {
                                ManufacturerCode: row[1] ?? "",
                                SupplyProductCode: row[2] ?? "",
                                ProductName: row[3] ?? "",
                                Quantity: row[4] ?? 0,
                                UnitPerQuantityID: unit?.ID || "",
                                PricePerPiece: row[6] ?? 0,
                                Discount: row[7] ?? 0,
                                SumPriceProduct: row[8] ?? 0,
                                Description: row[10] ?? "",
                            };
                        })
                        .filter(p => p !== null);

                    if (summaryPrice !== null) bill.SummaryPrice = summaryPrice;
                }

                formValues.bills.push(bill);
            });

            if (formValues.bills.length === 0) return; // ไม่มีบิลถูกต้อง

            setTempBills(formValues.bills);
            saveTempBills(formValues.bills);
            setCurrentStep(0);
            setProducts(formValues.bills[0]?.products || []);
            form.setFieldsValue({
                bills: formValues.bills.map((b: BillInterface) => ({
                    ...b,
                    DateImport: b.DateImport || null
                }))
            });
            setIsCreateModalOpen(true);
        };
        reader.readAsArrayBuffer(file);
    };


    const clearTempBills = () => {
        localStorage.removeItem("tempBills"); // ลบจาก localStorage
        setTempBills([]); // เคลียร์ state
    };

    // save tempBills
    const saveTempBills = (bills: any[]) => {
        localStorage.setItem("tempBills", JSON.stringify(bills));
        setTempBills(bills);
    };

    const removeBillByStep = (step?: number) => {
        const bills: BillInterface[] = form.getFieldValue("bills") || [];

        if (bills.length <= 1) {
            message.warning("ต้องมีบิลอย่างน้อย 1 บิล");
            return;
        }

        if (step === undefined || step < 0 || step >= bills.length) {
            message.warning("ไม่พบบิลที่ต้องการลบ");
            return;
        }

        // ลบบิลตาม index
        const updatedBills = bills.filter((_, idx) => idx !== step);

        // อัปเดต form
        form.setFieldsValue({ bills: updatedBills });

        // อัปเดต state
        setTempBills(updatedBills);
        saveTempBills(updatedBills);

        // อัปเดต currentStep
        const newStep = Math.min(currentStep, updatedBills.length - 1);
        setCurrentStep(newStep);

        // อย่า set products ใหม่ตรง ๆ แต่ใช้ form.getFieldValue สำหรับ currentStep
        const newProducts = form.getFieldValue(['bills', newStep, 'products']) || [];
        setProducts(newProducts);
    };


    const handleAddProduct = () => {
        const newProducts = [
            ...products,
            {
                ProductName: "",
                ProductCode: "",
                SupplyProductCode: "",
                ManufacturerCode: "",
                Description: "",
                Quantity: undefined,
                UnitPerQuantityID: "",
                PricePerPiece: undefined,
                Discount: undefined,
                SumPriceProduct: undefined,
            }
        ];
        setProducts(newProducts);

        const updatedBills = [...tempBills];
        updatedBills[currentStep] = {
            ...updatedBills[currentStep],
            products: newProducts
        };
        saveTempBills(updatedBills);

        // อัพเดตค่า Form ให้ตรงกับ state ใหม่
        form.setFieldsValue({
            bills: updatedBills.map((b, i) => ({
                ...b,
                products: i === currentStep ? newProducts : b.products
            }))
        });
    };

    const handleRemoveProduct = (index: number) => {
        const newProducts = [...products];
        newProducts.splice(index, 1);
        setProducts(newProducts);

        const updatedBills = [...tempBills];
        updatedBills[currentStep] = {
            ...updatedBills[currentStep],
            products: newProducts
        };
        saveTempBills(updatedBills);

        // เคลียร์ค่า field ที่ถูกลบ
        form.setFieldsValue({
            bills: updatedBills.map((b, i) => ({
                ...b,
                products: i === currentStep ? newProducts : b.products
            }))
        });
    };

    const handleCreateCancel = () => setIsCreateModalOpen(false);

    const handleSaveAll = async () => {
        try {
            // Validate ทั้งหมด
            await form.validateFields();

            // ดึงค่าจาก Form
            const values = form.getFieldsValue(true); // { bills: [...] }
            const bills: BillInterface[] = values.bills || [];

            for (let bIndex = 0; bIndex < bills.length; bIndex++) {
                const bill = bills[bIndex];
                const missingBillFields: string[] = [];

                if (!bill.Title) missingBillFields.push("ชื่อบิล");
                if (!bill.SupplyID) missingBillFields.push("บริษัทผู้สั่งซื้อ");
                if (!bill.DateImport) missingBillFields.push("วันที่นำเข้า");

                if (missingBillFields.length > 0) {
                    message.error(
                        `บิลที่ ${bIndex + 1} ("${bill.Title || 'ไม่มีชื่อบิล'}") ยังไม่ได้กรอก: ${missingBillFields.join(", ")}`
                    );
                    return;
                }

                for (let pIndex = 0; pIndex < (bill.products || []).length; pIndex++) {
                    const p = bill.products[pIndex];
                    const missingProductFields: string[] = [];

                    if (!p.ProductName) missingProductFields.push("ชื่อสินค้า");
                    if (p.Quantity == null || p.Quantity <= 0) missingProductFields.push("จำนวน");
                    if (!p.UnitPerQuantityID) missingProductFields.push("หน่วย");
                    if (p.PricePerPiece == null || p.PricePerPiece <= 0) missingProductFields.push("ราคาต่อชิ้น");

                    if (missingProductFields.length > 0) {
                        message.error(
                            `บิล "${bill.Title}" สินค้าที่ ${pIndex + 1} ("${p.ProductName || 'ไม่มีชื่อสินค้า'}") ยังไม่ได้กรอก: ${missingProductFields.join(", ")}`
                        );
                        return;
                    }
                }
            }

            const parsedBills = bills.map((bill: any) => ({
                ...bill,
                products: (bill.products || []).map((p: ProductInterface) => ({
                    ...p,
                    Quantity: Number(p.Quantity),
                    PricePerPiece: Number(p.PricePerPiece),
                    Discount: Number(p.Discount || 0),
                    SumPriceProduct: Number(p.SumPriceProduct || 0), // <- ใช้ค่าผู้ใช้กรอก
                    UnitPerQuantityID: Number(p.UnitPerQuantityID),
                })),
            }));

            // ส่งไป API
            for (const bill of parsedBills) {
                const billData = {
                    Bill: {
                        Title: bill.Title,
                        SummaryPrice: Number(bill.SummaryPrice || 0),
                        EmployeeID: Number(localStorage.getItem("id")),
                        SupplyID: Number(bill.SupplyID),
                        DateImport: bill.DateImport ? new Date(bill.DateImport) : null, // ✅ แก้ให้เป็น Date object
                    },
                    Products: bill.products,
                    ProductsOfBill: bill.products.map((p: ProductInterface) => ({
                        ProductID: p.ID || null, // ✅ ต้องส่ง ProductID ด้วย (backend เอาไปผูก)
                        ManufacturerCode: p.ManufacturerCode,
                        Quantity: p.Quantity,
                        PricePerPiece: p.PricePerPiece,
                        Discount: p.Discount,
                        SumPriceProduct: p.SumPriceProduct,
                    }))
                };
                console.log("ส่งไป backend:", billData);

                try {
                    const res = await CreateBillwithProduct(billData);
                    if (res?.status === 201) {
                        messageApi.success(`สร้างบิล "${bill.Title}" เรียบร้อย`);
                    } else {
                        messageApi.error(res.data?.error || `เกิดข้อผิดพลาดในการสร้างบิล "${bill.Title}"`);
                        console.log("Response ไม่ 201:", res);
                    }
                } catch (apiErr) {
                    messageApi.error(`เกิดข้อผิดพลาด: ${(apiErr as any).message || "เกิดข้อผิดพลาดในการสร้างบิล"}`);
                }
            }

            // Reset form และ state
            form.resetFields();
            setIsCreateModalOpen(false);
            setCurrentStep(0);
            setTempBills([]);
            localStorage.removeItem("tempBills");
            getBillAll();

        } catch (err) {
            console.log("Validation Failed", err);
            message.error("กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็นก่อนบันทึก");
        }
    };

    const onFinishUpdate = async () => {
        try {
            // ดึงค่าจาก form ทั้งหมด
            const values = await form.validateFields();

            const billid = Number(localStorage.getItem("BillID"));
            if (!billid) {
                message.error("ไม่พบ ID บิลที่จะอัปเดต");
                return;
            }

            // ดึง products จาก Form.List ให้ตรงกับ currentStep
            const formProducts: ProductInterface[] = (values.bills?.[currentStep]?.products || []).map((p: any) => ({
                ...p,
                Quantity: Number(p.Quantity),
                PricePerPiece: Number(p.PricePerPiece),
                Discount: Number(p.Discount || 0),
                SumPriceProduct: Number(p.SumPriceProduct || 0),
                UnitPerQuantityID: Number(p.UnitPerQuantityID),
            }));

            const payload = {
                Bill: {
                    ID: billid,
                    Title: values.Title,
                    SupplyID: values.SupplyID,
                    DateImport: values.DateImport ? values.DateImport.toDate() : null,
                    SummaryPrice: values.SummaryPrice,
                    EmployeeID: Number(localStorage.getItem("id")),
                },
                Products: formProducts,
                ProductsOfBill: formProducts.map(p => ({
                    ProductID: p.ID,
                    ManufacturerCode: p.ManufacturerCode,
                    PricePerPiece: p.PricePerPiece,
                    Quantity: p.Quantity,
                    Discount: p.Discount,
                    SumPriceProduct: p.SumPriceProduct,
                })),
            };

            console.log("update data: ", payload);

            const res = await UpdateBillWithProduct(billid, payload as any);
            if (res.status === 200) {
                message.success("อัปเดตสำเร็จ");
                setIsUpdateModalOpen(false);
                setSelectedBillId(null);
                localStorage.removeItem("BillID");
            } else {
                message.error(res.data.error || "อัปเดตไม่สำเร็จ");
            }

            form.resetFields();
            setCurrentStep(0);
            setTempBills([]);
            localStorage.removeItem("tempBills");
            getBillAll();
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBillData = async (id: number) => {
        try {
            const res = await GetBillAllDataById(id);
            if (res.status === 200) {
                const billData: BillInterface = {
                    ...res.data,
                    DateImport: res.data.DateImport ? new Date(res.data.DateImport) : undefined,
                    products: res.data.Products.map((p: any) => ({
                        ...p,
                    }))
                };
                setSelectedBill(billData);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลรายการสินค้าได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า");
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

    const getSupply = async () => {
        try {
            const res = await GetSupply();
            if (res.status === 200) {
                const sup = res.data.map((item: SupplyInterface) => ({
                    ID: item.ID,
                    SupplyName: item.SupplyName || "-",
                    SupplyAbbrev: item.SupplyAbbrev || "-",
                    Address: item.Address || "-",
                    PhoneNumberSale: item.PhoneNumberSale || "-",
                    SaleName: item.SaleName || "-",
                    BankTypeID: item.BankTypeID || "-",
                    BankAccountNumber: item.BankAccountNumber || "-",
                    LineIDSale: item.LineIDSale || "-",
                }));
                setSupplyer(sup);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลบริษัทที่สั่งซื้อได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลบริษัทที่สั่งซื้อ");
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

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, row: any) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    const handleDelete = (id: number) => {
        showDeleteConfirmModal(id);
        handleMenuClose();
    };

    const handleOpenUpdateModal = async (billID: number) => {
        try {
            const res = await GetBillAllDataById(billID);
            if (res.status !== 200) return;

            const billData: BillInterface = {
                ...res.data,
                DateImport: res.data.DateImport ? new Date(res.data.DateImport) : undefined,
                products: res.data.Products.map((p: any) => ({ ...p }))
            };

            const mappedProducts = await Promise.all(
                billData.products.map(async (p) => {
                    return {
                        ...p,
                        ID: p.ID
                    };
                })
            );

            form.setFieldsValue({
                Title: billData.Title,
                SupplyID: billData.SupplyID, // ต้องใช้ SupplyID ไม่ใช่ SupplyName
                DateImport: billData.DateImport ? dayjs(billData.DateImport) : null,
                SummaryPrice: billData.SummaryPrice,
                bills: [{ products: mappedProducts }]
            });

            setSelectedBill(billData);
            setIsUpdateModalOpen(true);
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า");
        }
    };

    useEffect(() => {
        getBillAll();
        getUnitperQuantity();
        getSupply();
        if (tempBills.length > 0) {
            setProducts(tempBills[currentStep]?.products || []);
            form.setFieldsValue(tempBills[currentStep] || {});
        }
        if (selectedBillId) {
            fetchBillData(selectedBillId);
        }
    }, [currentStep, tempBills, selectedBillId]);

    return (
        <>
            {contextHolder}
            <FloatButton
                tooltip={<div>Download Template for Import Data</div>}
                onClick={DownloadTemplateFile}
                icon={<DownloadOutlined />}
            />
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
                        onClick={() => {
                            // เคลียร์ tempBills และฟอร์ม
                            form.resetFields();
                            clearTempBills();

                            // สร้าง default product 1 รายการ
                            const defaultProduct = {
                                ProductID: undefined,
                                ProductName: "",
                                ProductCode: "",
                                SupplyProductCode: "",
                                ManufacturerCode: "",
                                Description: "",
                                Quantity: undefined,
                                UnitPerQuantityID: undefined,
                                PricePerPiece: undefined,
                                Discount: undefined,
                                SumPriceProduct: undefined,
                            };

                            // สร้างบิลเริ่มต้น 1 ใบ
                            const newBill = {
                                Title: "",
                                SupplyName: "",
                                DateImport: null,
                                SummaryPrice: undefined,
                                products: [defaultProduct]
                            };

                            // ตั้งค่า tempBills และ form
                            saveTempBills([newBill]);
                            setCurrentStep(0);
                            setProducts([defaultProduct]);

                            form.setFieldsValue({
                                bills: [newBill]
                            });

                            // เปิด modal
                            setIsCreateModalOpen(true);
                        }}
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

            <TableContainer component={Paper}>
                <Table className="Table-historyimport-product">
                    <TableHead>
                        <TableRow>
                            <TableCell>ลำดับ</TableCell>
                            <TableCell>ชื่อรายการ</TableCell>
                            <TableCell>วันที่นำเข้าสินค้า</TableCell>
                            <TableCell>บริษัทขายส่ง</TableCell>
                            <TableCell>พนักงานที่นำเข้า</TableCell>
                            <TableCell align="center">จัดการ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Bills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row: any) => (
                            <TableRow key={row.ID}>
                                <TableCell>{row.ID}</TableCell>
                                <TableCell>{row.Title}</TableCell>
                                <TableCell>{row.DateImport}</TableCell>
                                <TableCell>{row.Supply}</TableCell>
                                <TableCell>{row.Employee}</TableCell>
                                <TableCell align="center">
                                    <IconButton onClick={(e) => handleMenuClick(e, row)}>
                                        <MoreVert />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <TablePagination
                    component="div"
                    count={Bills.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[4, 10, 25]}
                />
            </TableContainer>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        setSelectedBillId(selectedRow?.ID || null);
                        fetchBillData(selectedRow?.ID || null);
                        setIsModalDataOpen(true);
                        handleMenuClose();
                    }}
                >
                    <Info fontSize="small" style={{ marginRight: 8 }} /> ดูใบสั่งซื้อสินค้า
                </MenuItem>
                <MenuItem onClick={() => {
                    handleMenuClose();
                    localStorage.setItem("BillID", selectedRow.ID)
                    if (selectedRow?.ID) {
                        handleOpenUpdateModal(selectedRow.ID); // เรียกผ่านฟังก์ชัน
                    }
                }}>
                    <Edit fontSize="small" style={{ marginRight: 8 }} /> แก้ไขข้อมูล
                </MenuItem>
                <MenuItem onClick={() => selectedRow && handleDelete(selectedRow.ID)} sx={{ color: "error.main" }}>
                    <Delete fontSize="small" style={{ marginRight: 8 }} /> ลบข้อมูล
                </MenuItem>
            </Menu>

            <Modal
                open={isCreateModalOpen}
                onCancel={handleCreateCancel}
                okText="บันทึก"
                cancelText="ยกเลิก"
                width="90%"
                centered
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

                            // สร้าง default product 1 รายการ
                            const defaultProduct = {
                                ProductName: "",
                                ProductCode: "",
                                SupplyProductCode: "",
                                ManufacturerCode: "",
                                Description: "",
                                Quantity: undefined,
                                UnitPerQuantityID: "",
                                PricePerPiece: undefined,
                                Discount: undefined,
                                SumPriceProduct: undefined,
                            };

                            //  newBill มี product = 1 รายการเริ่มต้น
                            const newBill = {
                                Title: "",
                                SupplyName: "",
                                DateImport: null,
                                SummaryPrice: undefined,
                                products: [defaultProduct]
                            };

                            updatedBills.push(newBill);

                            // บันทึกลง localStorage
                            saveTempBills(updatedBills);

                            // เปลี่ยน currentStep ไปบิลใหม่
                            setCurrentStep(updatedBills.length - 1);

                            // โหลดบิลใหม่ลงฟอร์ม
                            form.setFieldsValue({
                                bills: updatedBills
                            });

                            console.log("Added new bill with default product. Updated tempBills:", updatedBills);
                        }}
                    >
                        เพิ่มบิล
                    </Button>,
                    <Button key="save" type="primary" onClick={handleSaveAll}>บันทึก</Button>
                ]}

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
                                    onClick={() => removeBillByStep(currentStep)}
                                >
                                    ลบบิล
                                </Button>
                            )
                        }
                    >

                        <Row gutter={[8, 0]}>
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
                                    name={['bills', currentStep, 'SupplyID']}
                                    label="บริษัทที่สั่งซื้อ"
                                    rules={[{ required: true, message: "กรุณาเลือกบริษัทที่มีอยู่" }]}
                                >
                                    <AntdSelect
                                        placeholder="เลือกบริษัทที่มีอยู่"
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {Supplyer.map(s => (
                                            <AntdSelect.Option key={s.ID} value={s.ID}>
                                                {s.SupplyName}
                                            </AntdSelect.Option>
                                        ))}
                                    </AntdSelect>
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
                                        format="YYYY-MM-DD"
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

                    <SimpleBar style={{ maxHeight: 500, maxWidth: "100%" }} autoHide={false}>
                        <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 500 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                        <TableCell>ลำดับ</TableCell>
                                        <TableCell>ชื่อสินค้า</TableCell>
                                        <TableCell>รหัสบริษัทสั่งซื้อ</TableCell>
                                        <TableCell>รหัสผู้ผลิต</TableCell>
                                        <TableCell>จำนวน</TableCell>
                                        <TableCell>หน่วย</TableCell>
                                        <TableCell>ราคาต่อชิ้น</TableCell>
                                        <TableCell>ส่วนลด (%)</TableCell>
                                        <TableCell>ราคารวม</TableCell>
                                        <TableCell align="center">จัดการ</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {products.map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            {/* ชื่อสินค้า */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'ProductName']}
                                                    rules={[{ required: true, message: 'กรุณากรอกชื่อสินค้า' }]}
                                                >
                                                    <TextField
                                                        label="ชื่อสินค้า"
                                                        variant="standard"
                                                        fullWidth
                                                        required
                                                    />
                                                </Form.Item>
                                            </TableCell>

                                            {/* รหัสบริษัทสั่งซื้อ */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'SupplyProductCode']}
                                                >
                                                    <TextField label="รหัสบริษัทสั่งซื้อ" variant="standard" fullWidth />
                                                </Form.Item>
                                            </TableCell>

                                            {/* รหัสผู้ผลิต */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'ManufacturerCode']}
                                                >
                                                    <TextField label="รหัสผู้ผลิต" variant="standard" fullWidth />
                                                </Form.Item>
                                            </TableCell>

                                            {/* จำนวน */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'Quantity']}
                                                    rules={[{ required: true, message: 'กรุณากรอกจำนวน' }]}
                                                    getValueFromEvent={e => Number(e.target.value)}
                                                >
                                                    <TextField
                                                        variant="standard"
                                                        type="number"
                                                        fullWidth
                                                        required
                                                        label="จำนวน"
                                                        inputProps={{
                                                            min: 1,       // กำหนดขั้นต่ำเป็น 1
                                                            step: 1       // กำหนดเป็นจำนวนเต็ม
                                                        }}
                                                    />
                                                </Form.Item>
                                            </TableCell>

                                            {/* หน่วย */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'UnitPerQuantityID']}
                                                    rules={[{ required: true, message: 'กรุณาเลือกหน่วย' }]}
                                                >
                                                    <Select label="หน่วย" required variant="standard" fullWidth>
                                                        {Units.map(u => (
                                                            <MenuItem key={u.ID} value={u.ID}>{u.NameOfUnit}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </TableCell>

                                            {/* ราคาต่อชิ้น */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'PricePerPiece']}
                                                    rules={[{ required: true, message: 'กรุณากรอกราคาต่อชิ้น' }]}
                                                    getValueFromEvent={e => Number(e.target.value)}
                                                >
                                                    <TextField label="ราคาต่อชิ้น" required variant="standard" type="number" fullWidth />
                                                </Form.Item>
                                            </TableCell>

                                            {/* ส่วนลด */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'Discount']}
                                                    rules={[
                                                        {
                                                            type: 'number',
                                                            min: 0,
                                                            max: 100,
                                                            message: 'ส่วนลดต้องอยู่ระหว่าง 0–100',
                                                        },
                                                    ]}
                                                >
                                                    <TextField
                                                        label="ส่วนลด (%)"
                                                        variant="standard"
                                                        type="number"
                                                        fullWidth
                                                        inputProps={{
                                                            min: 0,
                                                            max: 100,
                                                            step: 0.01
                                                        }}
                                                        onChange={e => {
                                                            let value = Number(e.target.value);
                                                            if (value < 0) value = 0;
                                                            if (value > 100) value = 100;
                                                            form.setFieldValue(['bills', currentStep, 'products', index, 'Discount'], value);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </TableCell>

                                            {/* ราคารวม */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'SumPriceProduct']}
                                                    rules={[{ required: true, message: 'กรุณากรอกราคารวม' }]}
                                                >
                                                    <TextField
                                                        label="ราคารวม"
                                                        variant="standard"
                                                        fullWidth
                                                        type="number"
                                                        inputProps={{ min: 0, step: 0.01 }}
                                                        required
                                                    />
                                                </Form.Item>
                                            </TableCell>

                                            {/* ลบ */}
                                            <TableCell align="center">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleRemoveProduct(index)}
                                                    disabled={products.length === 1}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* ปุ่มเพิ่มสินค้า */}
                                    <TableRow>
                                        <TableCell colSpan={15} align="center">
                                            <IconButton color="primary" onClick={handleAddProduct}>
                                                <Add /> เพิ่มสินค้า
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>

                            </Table>
                        </TableContainer>
                    </SimpleBar>

                </Form>
            </Modal >

            <Modal
                open={isModalDataOpen}
                onCancel={() => setIsModalDataOpen(false)}
                title={`รายละเอียดบิล: ${selectedBill?.Title}`}
                width={1400}
                footer={[
                    <Button key="cancel" onClick={() => setIsModalDataOpen(false)}>
                        ปิด
                    </Button>
                ]}
            >
                {selectedBill ? (
                    <>
                        {/* ข้อมูลบิลด้านบน */}
                        <div style={{ marginBottom: 16 }}>
                            <Row gutter={[16, 8]}>
                                <Col span={12}>
                                    <strong>ชื่อบิล:</strong> {selectedBill.Title || "-"}
                                </Col>
                                <Col span={12}>
                                    <strong>บริษัทที่สั่งซื้อ:</strong> {selectedBill.SupplyName || "-"}
                                </Col>
                                <Col span={12}>
                                    <strong>วันที่นำเข้า:</strong>{" "}
                                    {selectedBill.DateImport && selectedBill.DateImport
                                        ? dayjs(selectedBill.DateImport).format("DD/MM/YYYY")
                                        : "-"}
                                </Col>
                                <Col span={12}>
                                    <strong>มูลค่ารวม (บาท):</strong> {selectedBill.SummaryPrice ?? "-"}
                                </Col>
                            </Row>
                        </div>

                        {/* ตารางสินค้า */}
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ลำดับ</TableCell>
                                        <TableCell>ชื่อสินค้า</TableCell>
                                        <TableCell>รหัสสินค้า</TableCell>
                                        <TableCell>รหัสบริษัทสั่งซื้อ</TableCell>
                                        <TableCell>รหัสผู้ผลิต</TableCell>
                                        <TableCell>จำนวน</TableCell>
                                        <TableCell>หน่วย</TableCell>
                                        <TableCell>ราคาต่อชิ้น</TableCell>
                                        <TableCell>ส่วนลด (%)</TableCell>
                                        <TableCell>ราคารวม</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedBill.products.map((p, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{p.ProductName}</TableCell>
                                            <TableCell>{p.ProductCode}</TableCell>
                                            <TableCell>{p.SupplyProductCode}</TableCell>
                                            <TableCell>{p.ManufacturerCode}</TableCell>
                                            <TableCell>{p.Description}</TableCell>
                                            <TableCell>{p.Quantity}</TableCell>
                                            <TableCell>{p.NameOfUnit}</TableCell>
                                            <TableCell>{p.PricePerPiece}</TableCell>
                                            <TableCell>{p.Discount}</TableCell>
                                            <TableCell>{p.SumPriceProduct}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : (
                    <Spin />
                )}
            </Modal>
            <Modal
                open={isUpdateModalOpen}
                onCancel={() => setIsUpdateModalOpen(false)}
                title="แก้ไขบิล"
                width="90%"
                footer={[
                    <Button key="cancel" onClick={() => setIsUpdateModalOpen(false)}>ยกเลิก</Button>,
                    <Button key="save" type="primary" onClick={onFinishUpdate}>บันทึก</Button>
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        Title: selectedBill?.Title,
                        SupplyID: selectedBill?.SupplyID,
                        DateImport: selectedBill?.DateImport ? dayjs(selectedBill.DateImport) : null,
                        SummaryPrice: selectedBill?.SummaryPrice,
                        bills: [
                            {
                                products: selectedBill?.products || []
                            }
                        ]
                    }}
                    onValuesChange={(_, allValues) => {
                        const bills = allValues.bills || [];
                        if (bills.length === 0) return;

                        const products = bills[currentStep]?.products || [];
                        let summaryTotal = 0;

                        const newProducts = products.map((p: any) => {
                            const quantity = Number(p.Quantity) || 0;
                            const pricePerPiece = Number(p.PricePerPiece) || 0;
                            const discount = Number(p.Discount) || 0;

                            // คำนวณราคารวมก่อนหักส่วนลด
                            const subtotal = quantity * pricePerPiece;

                            // คำนวณส่วนลดเป็นเปอร์เซ็นต์
                            const discountAmount = (subtotal * discount) / 100;

                            // ราคารวมหลังหักส่วนลด
                            const sumPrice = subtotal - discountAmount;

                            summaryTotal += sumPrice;

                            return {
                                ...p,
                                SumPriceProduct: Math.round(sumPrice * 100) / 100, // ปัดทศนิยม 2 ตำแหน่ง
                            };
                        });

                        // อัปเดตเฉพาะ step ปัจจุบัน
                        const updatedBills = [...bills];
                        updatedBills[currentStep] = {
                            ...updatedBills[currentStep],
                            products: newProducts,
                        };

                        form.setFieldsValue({
                            bills: updatedBills,
                            SummaryPrice: Math.round(summaryTotal * 100) / 100, // ปัดทศนิยม 2 ตำแหน่ง
                        });
                    }}
                >
                    <Row gutter={[8, 8]}>
                        <Col xl={12}>
                            <Form.Item
                                name='Title'
                                label="ชื่อรายการสั่งซื้อ"
                                rules={[{ required: true, message: "กรุณากรอกชื่อรายการสั่งซื้อ" }]}
                            >
                                <Input placeholder="กรอกชื่อรายการสั่งซื้อ" />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name='SupplyID'
                                label="บริษัทที่สั่งซื้อ"
                                rules={[{ required: true, message: "กรุณาเลือกบริษัทที่มีอยู่" }]}
                            >
                                <AntdSelect placeholder="เลือกบริษัทที่มีอยู่" showSearch optionFilterProp="children">
                                    {Supplyer.map(s => (
                                        <AntdSelect.Option key={s.ID} value={s.ID}>
                                            {s.SupplyName}
                                        </AntdSelect.Option>
                                    ))}
                                </AntdSelect>
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                name='DateImport'
                                label="วันที่นำเข้าสินค้า"
                                rules={[{ required: true, message: "กรุณาเลือกวันที่นำเข้าสินค้า" }]}
                            >
                                <DatePicker
                                    style={{ width: "100%" }}
                                    format="YYYY-MM-DD"
                                    placeholder="เลือกวันที่นำเข้าสินค้า"
                                    disabledDate={(current) => current && current > dayjs().endOf("day")}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name='SummaryPrice'
                                label="มูลค่ารวม (บาท)"
                                rules={[{ required: true, message: "กรุณากรอกมูลค่ารวม" }]}
                            >
                                <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="กรอกมูลค่ารวม" precision={2} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Products Table using Form.List */}
                    <Form.List name={['bills', currentStep, 'products']}>
                        {(fields, { add, remove }) => (
                            <SimpleBar style={{ maxHeight: 500, maxWidth: "100%" }} autoHide={false}>
                                <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 500 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                                <TableCell>ลำดับ</TableCell>
                                                <TableCell>ชื่อสินค้า</TableCell>
                                                <TableCell>รหัสบริษัทสั่งซื้อ</TableCell>
                                                <TableCell>รหัสผู้ผลิต</TableCell>
                                                <TableCell>จำนวน</TableCell>
                                                <TableCell>หน่วย</TableCell>
                                                <TableCell>ราคาต่อชิ้น</TableCell>
                                                <TableCell>ส่วนลด (%)</TableCell>
                                                <TableCell>ราคารวม</TableCell>
                                                <TableCell align="center">จัดการ</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {fields.map((field, index) => (
                                                <TableRow key={field.key}>
                                                    <TableCell>{index + 1}</TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'ProductName']}
                                                            rules={[{ required: true, message: 'กรุณากรอกชื่อสินค้า' }]}
                                                        >
                                                            <TextField label="ชื่อสินค้า" variant="standard" fullWidth />
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'SupplyProductCode']}
                                                        >
                                                            <TextField label="รหัสบริษัทสั่งซื้อ" variant="standard" fullWidth />
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'ManufacturerCode']}
                                                        >
                                                            <TextField label="รหัสผู้ผลิต" variant="standard" fullWidth />
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'Quantity']}
                                                            rules={[{ required: true, message: 'กรุณากรอกจำนวน' }]}
                                                            getValueFromEvent={e => Number(e.target.value)}
                                                        >
                                                            <TextField label="จำนวน" variant="standard" type="number" fullWidth />
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'UnitPerQuantityID']}
                                                            rules={[{ required: true, message: 'กรุณาเลือกหน่วย' }]}
                                                        >
                                                            <Select variant="standard" fullWidth>
                                                                {Units.map(u => (
                                                                    <MenuItem key={u.ID} value={u.ID}>{u.NameOfUnit}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'PricePerPiece']}
                                                            rules={[{ required: true, message: 'กรุณากรอกราคาต่อชิ้น' }]}
                                                            getValueFromEvent={e => Number(e.target.value)}
                                                        >
                                                            <TextField label="ราคาต่อชิ้น" variant="standard" type="number" fullWidth />
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'Discount']}
                                                        >
                                                            <TextField
                                                                label="ส่วนลด (%)"
                                                                variant="standard"
                                                                type="number"
                                                                fullWidth
                                                                inputProps={{ min: 0, max: 100, step: 0.01 }}
                                                            />
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'SumPriceProduct']}
                                                            rules={[{ required: true, message: 'กรุณากรอกราคารวม' }]}
                                                        >
                                                            <TextField label="ราคารวม" variant="standard" type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} />
                                                        </Form.Item>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <IconButton color="error" onClick={() => remove(field.name)}>
                                                            <Delete />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* เพิ่มสินค้า */}
                                            <TableRow>
                                                <TableCell colSpan={16} align="center">
                                                    <IconButton color="primary" onClick={() => add({ Quantity: 1 })}>
                                                        <Add /> เพิ่มสินค้า
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </SimpleBar>
                        )}
                    </Form.List>
                </Form>
            </Modal>

        </>
    );
}

export default ImportProduct;