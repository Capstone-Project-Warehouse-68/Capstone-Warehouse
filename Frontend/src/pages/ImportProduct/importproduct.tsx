import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Upload, Button, Col, Row, message, Form, Input, Modal, Card, InputNumber, Typography, DatePicker, Spin, Select as AntdSelect, FloatButton, Pagination } from "antd";
import {
    FileAddOutlined,
    FilePdfOutlined,
    DeleteOutlined,
    FileExcelOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { CalculatePrice, CreateBillwithProduct, DeleteBill, DownloadTemplateFile, GetAllBills, GetBillAllDataById, GetSupply, GetUnitPerQuantity, UpdateBillWithProduct } from "../../services/https";
import type { BillInterface, ProductInterface } from "../../interfaces/Bill";
import { uploadPdfForOcr, downloadExcel, downloadBlobAsFile } from "../../services/https/Model/index"
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import {
    Table, TableHead, TableRow, TableCell, TableBody,
    IconButton, MenuItem, Select,
    Menu, TableContainer, Paper,
    TextField
} from "@mui/material";
import { Delete, Add, Info, Edit, MoreVert } from "@mui/icons-material";
import React from "react";
import type { SupplyInterface } from "../../interfaces/Supply";
import DiscountField from "./handleInputNum"

const { Title } = Typography;

function ImportProduct() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Bills, setBillData] = useState<BillInterface[]>([]);
    const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isModalDataOpen, setIsModalDataOpen] = useState(false);
    const [isManualCreate, setIsManualCreate] = useState(false);
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
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 3;
    const [selectedBill, setSelectedBill] = useState<BillInterface | null>(null);
    const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

    const handleExcelUpload = async (file: File) => {
        if (!Units || Units.length === 0) {
            await getUnitperQuantity();
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const formValues: any = { bills: [] };
            let hasError = false;

            workbook.SheetNames.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                let jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                jsonData = jsonData.filter(row => row && row.length > 0);

                // ตรวจสอบ sheet เปล่า
                if (jsonData.length === 0) {
                    messageApi.error("พบ sheet เปล่า กรุณาตรวจสอบไฟล์ Excel");
                    hasError = true;
                    return;
                }

                // ตรวจสอบ bill ซ้ำใน sheet เดียว
                const billTitleCount = jsonData.filter(row => row[0] === "ชื่อใบสั่งซื้อ").length;
                if (billTitleCount > 1) {
                    messageApi.error("1 sheet : 1 ใบสั่งซื้อสินค้า กรุณาตรวจสอบไฟล์ Excel");
                    hasError = true;
                    return;
                }

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
                    if (row[0] === "วันที่นำเข้า") {
                        if (row[1]) {
                            let parsed = dayjs(row[1], "DD/MM/YYYY");
                            if (parsed.isValid()) {
                                // ถ้าเป็น พ.ศ. (>= 2400 ป้องกันกรณี excel แปลก ๆ)
                                if (parsed.year() > 2400) {
                                    parsed = parsed.year(parsed.year() - 543);
                                }
                                bill.DateImport = parsed;
                            } else {
                                bill.DateImport = null;
                            }
                        } else {
                            bill.DateImport = null;
                        }
                    }
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
                            const normalize = (val: any) => val?.toString().trim();

                            const unitName = normalize(row[5]);
                            const unit = Units.find(u => normalize(u.NameOfUnit) === unitName);

                            if (unitName && !unit) {
                                messageApi.error({
                                    content: `ไม่พบหน่วย "${unitName}" ในฐานข้อมูล กรุณาเพิ่มก่อน`,
                                    duration: 3,
                                });
                            }

                            return {
                                ManufacturerCode: row[1] ?? "",
                                SupplyProductCode: row[2] ?? "",
                                ProductName: row[3] ?? "",
                                Quantity: row[4] ?? 0,
                                UnitPerQuantityID: unit?.ID ?? undefined, //  เก็บเป็น ID
                                PricePerPiece: row[6] ?? 0,
                                Discount: row[7] ?? 0,
                                SumPriceProduct: row[8] ?? 0,
                            };
                        })
                        .filter(p => p !== null);

                    if (summaryPrice !== null) bill.SummaryPrice = summaryPrice;
                }

                formValues.bills.push(bill);
            });

            if (hasError) {
                setIsCreateModalOpen(false);
                return;
            }

            if (formValues.bills.length === 0) return; // ไม่มีบิลถูกต้อง
            console.log("Parsed Excel Data:", formValues.bills);

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
            setIsManualCreate(false);
            setIsCreateModalOpen(true);
        };
        reader.readAsArrayBuffer(file);
    };

    const handlePageChange = (pageNumber: number) => {
        setPage(pageNumber);
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
                UnitPerQuantityID: undefined,
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

    const recalcBill = async () => {
        const values = form.getFieldsValue(true);
        const currentBill = values?.bills?.[currentStep];
        if (!currentBill || !Array.isArray(currentBill.products)) return;

        const payloadProducts = currentBill.products.map((p: any) => ({
            ProductName: p?.ProductName ?? "",
            ProductCode: p?.ProductCode ?? "",
            Quantity: Number(p?.Quantity) || 0,
            PricePerPiece: parseFloat(String(p?.PricePerPiece || 0)),
            Discount: parseFloat(String(p?.Discount || 0)),
        }));

        try {
            const res = await CalculatePrice({ products: payloadProducts });
            if (res?.status === 200 && res.data) {
                const updatedProducts = (res.data.products || []).map(
                    (apiP: any, idx: number) => {
                        const original = currentBill.products[idx];
                        return {
                            ...original, // เก็บค่าที่กรอกไว้
                            SumPriceProduct: apiP.SumPriceProduct ?? original.SumPriceProduct,
                            // ถ้า API คืน 0/undefined อย่าไป overwrite Quantity/Discount
                            Quantity: original.Quantity,
                            Discount: original.Discount,
                            PricePerPiece: original.PricePerPiece,
                        };
                    }
                );

                const summary = res.data.SummaryPrice ?? currentBill.SummaryPrice ?? 0;

                const updatedBills = [...values.bills];
                updatedBills[currentStep] = {
                    ...currentBill,
                    products: updatedProducts,
                    SummaryPrice: summary,
                };

                form.setFieldsValue({ bills: updatedBills });
                setTempBills(updatedBills);
            } else {
                message.error(res?.data?.message || "ไม่สามารถคำนวณราคาได้");
            }
        } catch (err: any) {
            console.error("calc error", err);
            message.error(
                err?.response?.data?.message || "เกิดข้อผิดพลาดในการคำนวณราคา"
            );
        }
    };

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
                console.log(bill);

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
                        Title: (bill.Title).toString(),
                        SummaryPrice: Number(bill.SummaryPrice || 0),
                        EmployeeID: Number(localStorage.getItem("employeeID")),
                        SupplyID: Number(bill.SupplyID),
                        DateImport: bill.DateImport ? new Date(bill.DateImport) : null,
                    },
                    Products: bill.products,
                    ProductsOfBill: bill.products.map((p: ProductInterface) => ({
                        ProductID: p.ID || null,
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
                    EmployeeID: Number(localStorage.getItem("employeeID")),
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
                    SummaryPrice: item.SummaryPrice || 0,
                    Employee: item.Employee ? `${item.Employee.FirstName} ${item.Employee.LastName}` : "-",
                }));
                setBillData(bills);
                // setPage(1);
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

    const [loading, setLoading] = useState(false);

    const handleUpload = async (file: File) => {
        setLoading(true);
        try {
            // 1️⃣ Upload PDF
            const uploadRes = await uploadPdfForOcr(file) as any;
            if (uploadRes.status !== "OCR: Already") {
                message.error("เกิดข้อผิดพลาด OCR");
                setLoading(false);
                return;
            }

            message.success("OCR เสร็จแล้ว กำลังดาวน์โหลด Excel");

            // 2️⃣ Download Excel
            const excelBlob = await downloadExcel();
            downloadBlobAsFile(excelBlob, "DataImport.xlsx");

        } catch (err: any) {
            console.error(err);
            message.error(err.message || "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }

        // Prevent Upload from auto uploading file to AntD
        return false;
    };

    return (
        <>
            {contextHolder}
            <FloatButton
                tooltip={<div>Download Template for Import Data</div>}
                onClick={DownloadTemplateFile}
                icon={<DownloadOutlined />}
                style={{ marginBottom: "-1.5%" }}
            />
            <div
                className="Card-Header" style={{
                    marginTop: "5vh",
                    height: "10%",
                    width: "20%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "50px",
                }}>
                <span style={{ fontSize: 26, color: "white" }}>
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
                                SupplyID: "",
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
                            setIsManualCreate(true);
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
                    <Upload
                        accept=".pdf"
                        showUploadList={false}
                        customRequest={({ file }) => handleUpload(file as File)}
                    >
                        <Button
                            className="button-import"
                            type="primary"
                            icon={<FilePdfOutlined />}
                            loading={loading}
                            style={{
                                height: "auto",
                                width: "auto",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: 20,
                            }}
                        >
                            {loading ? "กำลังแปลง..." : "แปลง PDF เป็น Excel"}
                        </Button>
                    </Upload>
                </Col>
            </Row>

            <div style={{ width: "100%" }}>
                <Card className="background-card" style={{ width: "95%", margin: "0 auto" }}>
                    <Title level={3} style={{ marginTop: "0", marginBottom: "2%" }}>ประวัติการนำเข้าใบสั่งซื้อ</Title>

                    <TableContainer
                        component={Paper}
                        style={{
                            width: "100%",
                            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                        }}
                    >
                        <Table className="Table-historyimport-product">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ลำดับ</TableCell>
                                    <TableCell>ชื่อรายการ</TableCell>
                                    <TableCell>วันที่นำเข้าสินค้า</TableCell>
                                    <TableCell>บริษัทขายส่ง</TableCell>
                                    <TableCell>มูลค่ารวม</TableCell>
                                    <TableCell>พนักงานที่นำเข้า</TableCell>
                                    <TableCell align="center">จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Bills.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((row: any) => (
                                    <TableRow key={row.ID} style={{ height: 53 }}>
                                        <TableCell>{row.ID}</TableCell>
                                        <TableCell>{row.Title}</TableCell>
                                        <TableCell>
                                            {(() => {
                                                const date = dayjs(row.DateImport, "DD-MM-YYYY");
                                                const currentYear = dayjs().year();
                                                let displayYear = date.year();
                                                if (displayYear <= currentYear) {
                                                    displayYear += 543;
                                                }
                                                return `${date.date()} ${date.format("MMMM")} ${displayYear}`;
                                            })()}
                                        </TableCell>
                                        <TableCell>{row.Supply}</TableCell>
                                        <TableCell>{row.SummaryPrice}</TableCell>
                                        <TableCell>{row.Employee}</TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={(e) => handleMenuClick(e, row)}>
                                                <MoreVert />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {Bills.slice((page - 1) * rowsPerPage, page * rowsPerPage).length < 3 &&
                                    Array.from({
                                        length: 3 - Bills.slice((page - 1) * rowsPerPage, page * rowsPerPage).length,
                                    }).map((_, idx) => (
                                        <TableRow
                                            key={`empty-${idx}`}
                                            style={{
                                                height: 72.92,
                                                border: "none",          // ลบขอบ row
                                                background: "transparent" // พื้นหลังโปร่งใส
                                            }}
                                        >
                                            <TableCell
                                                colSpan={7}               // เท่ากับจำนวน column
                                                style={{ border: "none", padding: 0 }} // ลบขอบ cell
                                            />
                                        </TableRow>
                                    ))}

                            </TableBody>
                        </Table>
                    </TableContainer>

                    <div style={{ display: "flex", justifyContent: "center", alignItems: 'center', marginTop: 16 }}>
                        <Pagination
                            current={page}
                            pageSize={rowsPerPage}
                            total={Bills.length}
                            onChange={handlePageChange}
                        />
                    </div>
                </Card>
            </div>

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
                footer={
                    isManualCreate
                        ? [
                            <Button key="cancel" onClick={() => setIsCreateModalOpen(false)}>ยกเลิก</Button>,
                            <Button key="save" type="primary" onClick={handleSaveAll}>บันทึก</Button>
                        ]
                        : [
                            <Button key="cancel" onClick={() => setIsCreateModalOpen(false)}>ยกเลิก</Button>,
                            <Button
                                key="prev"
                                disabled={currentStep === 0}
                                onClick={() => {
                                    const values = form.getFieldsValue(true);
                                    const updatedBills = [...tempBills];

                                    //  update แค่ bill ปัจจุบัน
                                    updatedBills[currentStep] = values.bills[currentStep];
                                    saveTempBills(updatedBills);

                                    const prevStep = currentStep - 1;
                                    setCurrentStep(prevStep);

                                    //  ต้อง setFieldsValue ในรูปแบบ { bills: [...] }
                                    form.setFieldsValue({ bills: updatedBills });
                                }}
                            >ย้อนกลับ</Button>,
                            <Button
                                key="next"
                                type="primary"
                                onClick={() => {
                                    const values = form.getFieldsValue(true);
                                    const updatedBills = [...tempBills];

                                    //  update แค่ bill ปัจจุบัน
                                    updatedBills[currentStep] = values.bills[currentStep];
                                    saveTempBills(updatedBills);

                                    const nextStep = currentStep + 1;
                                    setCurrentStep(nextStep);

                                    //  ต้อง setFieldsValue ในรูปแบบ { bills: [...] }
                                    form.setFieldsValue({ bills: updatedBills });
                                }}
                                disabled={currentStep === tempBills.length - 1}
                            >ถัดไป</Button>,
                            <Button
                                key="addBill"
                                onClick={() => {
                                    const values = form.getFieldsValue(true);
                                    const updatedBills = [...tempBills];
                                    updatedBills[currentStep] = values.bills[currentStep];

                                    const defaultProduct = {
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

                                    const newBill = {
                                        Title: "",
                                        SupplyID: "",
                                        DateImport: null,
                                        SummaryPrice: undefined,
                                        products: [defaultProduct]
                                    };

                                    updatedBills.push(newBill);
                                    saveTempBills(updatedBills);
                                    setCurrentStep(updatedBills.length - 1);
                                    form.setFieldsValue({ bills: updatedBills });
                                }}
                            >เพิ่มบิล</Button>,
                            <Button key="save" type="primary" onClick={handleSaveAll}>บันทึก</Button>
                        ]
                }
            >

                <Form
                    form={form}
                    layout="vertical"
                    name="form"
                >
                    {/* Bill List */}
                    <Card
                        title={
                            <Title level={4}>
                                {`บิลที่ ${currentStep + 1}`}
                            </Title>
                        }
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
                        style={{
                            border: "none",
                            marginTop: -20,
                            maxHeight: "250px",
                            // marginBottom: -16,
                            padding: 0,
                            background: "#fff"        // สีพื้นหลังขาว
                        }}
                        headStyle={{
                            borderBottom: "none", // << เอาเส้นแบ่งออก
                            paddingBottom: 0
                        }}
                    >

                        <Row gutter={[8, 0]} style={{ marginTop: -12 }}>
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
                                        format="DD-MM-YYYY"
                                        placeholder="เลือกวันที่นำเข้าสินค้า"
                                        disabledDate={(current) => current && current > dayjs().endOf("day")}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xl={12}>
                                <Form.Item
                                    label="มูลค่ารวม"
                                    required
                                    shouldUpdate={(prev, curr) =>
                                        prev.bills?.[currentStep]?.SummaryPrice !==
                                        curr.bills?.[currentStep]?.SummaryPrice
                                    }
                                >
                                    {({ getFieldValue }) => {
                                        const value = getFieldValue(["bills", currentStep, "SummaryPrice"]) ?? 0;
                                        return (
                                            <InputNumber
                                                min={0}
                                                step={0.01}
                                                precision={2}
                                                style={{ width: "100%" }}
                                                value={parseFloat(Number(value).toFixed(2))}
                                                disabled
                                                required
                                            />
                                        );
                                    }}
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <TableContainer
                        component={Paper}
                        sx={{
                            borderRadius: 2,
                            maxHeight: 450,
                            border: "1px solid rgba(0,0,0,0.3)",
                        }}
                    >
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
                                                    onBlur={recalcBill}
                                                />
                                            </Form.Item>
                                        </TableCell>

                                        {/* หน่วย */}
                                        <TableCell>
                                            <Form.Item
                                                name={['bills', currentStep, 'products', index, 'UnitPerQuantityID']}
                                                rules={[{ required: true, message: 'กรุณาเลือกหน่วย' }]}
                                                getValueFromEvent={(e) => Number(e.target.value)}
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
                                                <TextField
                                                    label="ราคาต่อชิ้น"
                                                    required
                                                    variant="standard"
                                                    type="number"
                                                    fullWidth
                                                    onBlur={recalcBill} />
                                            </Form.Item>
                                        </TableCell>

                                        {/* ส่วนลด */}
                                        <TableCell>
                                            <DiscountField name={['bills', currentStep, 'products', index, 'Discount']}
                                                onBlur={recalcBill}
                                            />
                                        </TableCell>

                                        {/* ราคารวม */}
                                        <TableCell>
                                            <Form.Item
                                                shouldUpdate={(prev, curr) =>
                                                    prev.bills?.[currentStep]?.products?.[index]?.SumPriceProduct !==
                                                    curr.bills?.[currentStep]?.products?.[index]?.SumPriceProduct
                                                }
                                            >
                                                {({ getFieldValue }) => {
                                                    const value =
                                                        getFieldValue([
                                                            "bills",
                                                            currentStep,
                                                            "products",
                                                            index,
                                                            "SumPriceProduct",
                                                        ]) ?? 0;

                                                    return (
                                                        <TextField
                                                            label="ราคารวม"
                                                            variant="standard"
                                                            fullWidth
                                                            type="number"
                                                            inputProps={{ min: 0, step: 0.01 }}
                                                            value={Number(value).toFixed(2)}
                                                            disabled
                                                        />
                                                    );
                                                }}
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
                centered
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
                                <AntdSelect placeholder="เลือกบริษัทที่มีอยู่" showSearch optionFilterProp="children" disabled>
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
                                    format="DD-MM-YYYY"
                                    placeholder="เลือกวันที่นำเข้าสินค้า"
                                    disabledDate={(current) => current && current > dayjs().endOf("day")}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name='SummaryPrice'
                                label="มูลค่ารวม (บาท)"
                                rules={[{ required: true, message: "กรุณากรอกมูลค่ารวม" }]}
                            >
                                <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="กรอกมูลค่ารวม" precision={2} onBlur={recalcBill} disabled />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Products Table using Form.List */}
                    <Form.List name={['bills', currentStep, 'products']}>
                        {(fields, { add, remove }) => (
                            <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 450, border: "1px solid rgba(0,0,0,0.3)", }}>
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
                                        {fields.map((field, index) => {
                                            // ตรวจสอบว่าเป็นข้อมูลที่ get มาจาก backend หรือเพิ่มใหม่
                                            const products = form.getFieldValue(['bills', currentStep, 'products']) || [];
                                            const isFetched = !!products[index]?.ID; // ถ้ามี ID แปลว่ามาจาก backend

                                            return (
                                                <TableRow key={field.key}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'ProductName']}
                                                            rules={[{ required: true, message: 'กรุณากรอกชื่อสินค้า' }]}
                                                        >
                                                            <TextField
                                                                label="ชื่อสินค้า"
                                                                variant="standard"
                                                                fullWidth
                                                                disabled={isFetched}
                                                            />
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
                                                            <TextField label="จำนวน" variant="standard" type="number" fullWidth onBlur={recalcBill} />
                                                        </Form.Item>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'UnitPerQuantityID']}
                                                            rules={[{ required: true, message: 'กรุณาเลือกหน่วย' }]}
                                                        >
                                                            <Select
                                                                variant="standard"
                                                                fullWidth
                                                                disabled={isFetched}
                                                            >
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
                                                            <TextField label="ราคาต่อชิ้น" variant="standard" type="number" fullWidth onBlur={recalcBill} />
                                                        </Form.Item>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, "Discount"]}
                                                            rules={[
                                                                {
                                                                    validator: (_, value) => {
                                                                        if (value === undefined || value === "") {
                                                                            return Promise.resolve();
                                                                        }
                                                                        const num = parseFloat(value);
                                                                        if (isNaN(num) || num < 0 || num > 100) {
                                                                            return Promise.reject("ส่วนลดต้องอยู่ระหว่าง 0–100");
                                                                        }
                                                                        return Promise.resolve();
                                                                    },
                                                                },
                                                            ]}
                                                            getValueFromEvent={(e) => e.target.value}
                                                        >
                                                            <TextField
                                                                label="ส่วนลด (%)"
                                                                variant="standard"
                                                                type="text" // ใช้ text เพื่อให้ regex คุม input เอง
                                                                fullWidth
                                                                inputProps={{
                                                                    inputMode: "decimal",
                                                                }}
                                                                onBeforeInput={(e) => {
                                                                    const inputEl = (e.currentTarget as HTMLElement).querySelector(
                                                                        "input"
                                                                    ) as HTMLInputElement;
                                                                    if (!inputEl) return;

                                                                    const data = (e as unknown as InputEvent).data || "";
                                                                    const newValue =
                                                                        inputEl.value.substring(0, inputEl.selectionStart || 0) +
                                                                        data +
                                                                        inputEl.value.substring(inputEl.selectionEnd || 0);

                                                                    // ✅ regex: 0–100 และทศนิยมไม่เกิน 2 หลัก
                                                                    const regex = /^(100(\.0{0,2})?|(\d{1,2})(\.\d{0,2})?)?$/;

                                                                    if (!regex.test(newValue)) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (["e", "E", "+", "-", " "].includes(e.key)) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                onBlur={recalcBill}
                                                            />
                                                        </Form.Item>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'SumPriceProduct']}
                                                            rules={[{ required: true, message: 'กรุณากรอกราคารวม' }]}
                                                        >
                                                            <TextField label="ราคารวม" variant="standard" type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} disabled />
                                                        </Form.Item>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => !isFetched && remove(field.name)}
                                                            disabled={isFetched}
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
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
                        )}
                    </Form.List>
                </Form>
            </Modal>

        </>
    );
}

export default ImportProduct;