import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Upload, Button, Col, Row, message, Form, Input, Modal, Card, InputNumber, DatePicker } from "antd";
import {
    FileAddOutlined,
    FilePdfOutlined,
    HistoryOutlined,
    DeleteOutlined,
    FileExcelOutlined

} from "@ant-design/icons";
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { CreateBillwithProduct, DeleteBill, GetAllBills, GetCategory, GetShelfByZoneID, GetUnitPerQuantity, GetZone } from "../../services/https";
import type { BillInterface, ProductInterface } from "../../interfaces/Bill";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import type { CategoryInterface } from "../../interfaces/Category";
import type { ZoneInterface } from "../../interfaces/Zone";
import type { ShelfInterface } from "../../interfaces/Shelf";
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

function ImportProduct() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Bills, setBillData] = useState<BillInterface[]>([]);
    const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
    const [Categorys, setCateData] = useState<CategoryInterface[]>([]);
    const [Zones, setZoneData] = useState<ZoneInterface[]>([]);
    const [shelfMap, setShelfMap] = useState<Record<number, ShelfInterface[]>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [tempBills, setTempBills] = useState<any[]>(() => {
        const saved = localStorage.getItem("tempBills");
        return saved ? JSON.parse(saved) : [];
    });
    const [products, setProducts] = useState<any[]>([]);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = React.useState<any>(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(4);

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

                // อ่าน header ข้อมูลบิล
                jsonData.forEach(row => {
                    if (row[0] === "ชื่อบริษัท") bill.SupplyName = row[1];
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
                                SalePrice: row[9] ?? 0,
                                Description: row[10] ?? "",
                                Zone: "",
                                ShelfID: "",
                                CategoryID: "",
                            };
                        })
                        .filter(p => p !== null);

                    if (summaryPrice !== null) bill.SummaryPrice = summaryPrice;
                }

                formValues.bills.push(bill);
            });

            // save state
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
        const bills = form.getFieldValue("bills") || [];

        if (bills.length <= 1) {
            message.warning("ต้องมีบิลอย่างน้อย 1 บิล");
            return;
        }

        let updatedBills;
        if (step !== undefined && step >= 0 && step < bills.length) {
            // ลบตาม index
            updatedBills = bills.filter((_: BillInterface, idx: number) => idx !== step);
        } else {
            message.warning("ไม่พบบิลที่ต้องการลบ");
            return;
        }

        // อัปเดต form และ state
        form.setFieldsValue({ bills: updatedBills });
        setTempBills(updatedBills);
        saveTempBills(updatedBills);

        // อัปเดต currentStep ให้ไม่เกิน index ล่าสุด
        const newStep = Math.min(currentStep, updatedBills.length - 1);
        setCurrentStep(newStep);

        // อัปเดต products ให้ตรงกับ currentStep ใหม่
        setProducts(updatedBills[newStep]?.products || []);
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
                SalePrice: undefined,
                Zone: "",
                ShelfID: "",
                CategoryID: "",
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


    const handleZoneSelect = async (ZoneID: number, index: number) => {
        form.setFields([
            {
                name: ['bills', currentStep, 'products', index, 'ShelfID'],
                value: undefined,
            },
        ]);

        const values = form.getFieldsValue(true);
        values.bills[currentStep].products[index].Zone = ZoneID;
        form.setFieldsValue(values);

        try {
            const ShelfResponse = await GetShelfByZoneID(ZoneID);
            if (ShelfResponse.status === 200) {
                setShelfMap(prev => ({
                    ...prev,
                    [ZoneID]: ShelfResponse.data,
                }));
            } else {
                message.error(ShelfResponse.data.error || "ไม่สามารถโหลดข้อมูลชั้นวางได้");
            }
        } catch (error) {
            message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลชั้นวาง");
        }
    };


    const handleCreateCancel = () => setIsCreateModalOpen(false);

    const handleSaveAll = async () => {
        try {
            // Validate ทั้งหมด
            await form.validateFields();

            // ดึงค่าจาก Form
            const values = form.getFieldsValue(true); // { bills: [...] }
            const bills = values.bills || [];

            // ตรวจสอบอย่างเข้ม: แต่ละ bill ต้องมี Title, SupplyName, DateImport
            for (const bill of bills) {
                if (!bill.Title || !bill.SupplyName || !bill.DateImport) {
                    message.error("กรุณากรอกข้อมูลบิลให้ครบทุกช่อง");
                    return;
                }

                for (const p of bill.products || []) {
                    if (
                        !p.ProductName ||
                        p.Quantity == null || p.Quantity <= 0 ||
                        !p.UnitPerQuantityID ||
                        p.PricePerPiece == null || p.PricePerPiece <= 0 ||
                        !p.CategoryID ||
                        !p.Zone ||
                        !p.ShelfID
                    ) {
                        message.error(`กรุณากรอกข้อมูลสินค้าให้ครบทุกช่อง (${p.ProductName || 'ไม่มีชื่อสินค้า'}) `);
                        return;
                    }

                }
            }

            // แปลงค่า number
            const parsedBills = bills.map((bill: BillInterface) => ({
                ...bill,
                products: (bill.products || []).map((p: ProductInterface) => ({
                    ...p,
                    Quantity: Number(p.Quantity),
                    PricePerPiece: Number(p.PricePerPiece),
                    Discount: Number(p.Discount || 0),
                    SumPriceProduct: Number(p.SumPriceProduct || 0),
                    SalePrice: Number(p.SalePrice || 0),
                    UnitPerQuantityID: Number(p.UnitPerQuantityID),
                    CategoryID: Number(p.CategoryID),
                    ShelfID: Number(p.ShelfID),
                    Zone: Number(p.Zone),
                }))
            }));

            // ส่งไป API
            for (const bill of parsedBills) {
                const billData = {
                    Bill: {
                        Title: bill.Title,
                        SummaryPrice: bill.SummaryPrice,
                        EmployeeID: Number(localStorage.getItem("id")),
                    },
                    Products: bill.products,
                    ProductsOfBill: bill.products.map((p: ProductInterface) => ({
                        ManufacturerCode: p.ManufacturerCode,
                        Quantity: p.Quantity,
                        PricePerPiece: p.PricePerPiece,
                        Discount: p.Discount,
                    }))
                };

                const res = await CreateBillwithProduct(billData);
                if (res?.status === 201) {
                    message.success(`สร้างบิล "${bill.Title}" เรียบร้อย`);
                } else {
                    message.error(`เกิดข้อผิดพลาดในการสร้างบิล "${bill.Title}"`);
                    console.log("Response ไม่ 201:", res);
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

    useEffect(() => {
        getBillAll();
        getUnitperQuantity();
        getCategory();
        getZone();
        if (tempBills.length > 0) {
            setProducts(tempBills[currentStep]?.products || []);
            form.setFieldsValue(tempBills[currentStep] || {});
        }
    }, [currentStep, tempBills]);

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
                                SalePrice: undefined,
                                Zone: "",
                                ShelfID: "",
                                CategoryID: "",
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

            {/* Dropdown Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { /* navigate(`/bill/detail/${selectedRow?.ID}`) */ handleMenuClose(); }}>
                    <Info fontSize="small" style={{ marginRight: 8 }} /> ดูใบสั่งซื้อสินค้า
                </MenuItem>
                <MenuItem onClick={() => { /* navigate(`/bill/edit/${selectedRow?.ID}`) */ handleMenuClose(); }}>
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

                            // ✅ สร้าง default product 1 รายการ
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
                                SalePrice: undefined,
                                Zone: "",
                                ShelfID: "",
                                CategoryID: "",
                            };

                            // ✅ newBill มี product = 1 รายการเริ่มต้น
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
                                    onClick={() => removeBillByStep(currentStep)}
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
                        <TableContainer component={Paper} sx={{ borderRadius: 2, minWidth: 1800 }}>
                            <Table sx={{ minWidth: 1800 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                        <TableCell>ลำดับ</TableCell>
                                        <TableCell>ชื่อสินค้า</TableCell>
                                        <TableCell>รหัสสินค้า</TableCell>
                                        <TableCell>รหัสบริษัทสั่งซื้อ</TableCell>
                                        <TableCell>รหัสผู้ผลิต</TableCell>
                                        <TableCell>คำอธิบาย</TableCell>
                                        <TableCell>จำนวน</TableCell>
                                        <TableCell>หน่วย</TableCell>
                                        <TableCell>ราคาต่อชิ้น</TableCell>
                                        <TableCell>ส่วนลด</TableCell>
                                        <TableCell>ราคารวม</TableCell>
                                        <TableCell>ราคาขายต่อหน่วย</TableCell>
                                        <TableCell>ประเภทสินค้า</TableCell>
                                        <TableCell>โซน</TableCell>
                                        <TableCell>ชั้นวางสินค้า</TableCell>
                                        <TableCell align="center">จัดการ</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {products.map((p, index) => (
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

                                            {/* รหัสสินค้า */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'ProductCode']}
                                                    rules={[{ required: true, message: 'กรุณากรอกรหัสสินค้า' }]}
                                                >
                                                    <TextField label="รหัสสินค้า" required variant="standard" fullWidth />
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

                                            {/* คำอธิบาย */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'Description']}
                                                >
                                                    <TextField label="คำอธิบาย" required variant="standard" fullWidth multiline />
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
                                                    getValueFromEvent={e => Number(e.target.value)}
                                                >
                                                    <TextField label='ส่วนลด' variant="standard" type="number" fullWidth />
                                                </Form.Item>
                                            </TableCell>

                                            {/* ราคารวม */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'SumPriceProduct']}
                                                    getValueFromEvent={e => Number(e.target.value)}
                                                >
                                                    <TextField label="ราคารวม" required variant="standard" type="number" fullWidth />
                                                </Form.Item>
                                            </TableCell>

                                            {/* ราคาขายต่อหน่วย */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'SalePrice']}
                                                    getValueFromEvent={e => Number(e.target.value)}
                                                >
                                                    <TextField label="ราคาขายต่อหน่วย" required variant="standard" type="number" fullWidth />
                                                </Form.Item>
                                            </TableCell>

                                            {/* ประเภทสินค้า */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'CategoryID']}
                                                    rules={[{ required: true, message: 'กรุณาเลือกประเภทสินค้า' }]}
                                                    initialValue={p.CategoryID || ""}
                                                >
                                                    <Select
                                                        value={p.CategoryID || ""}
                                                        variant="standard"
                                                        fullWidth
                                                    >
                                                        {Categorys.map(c => (
                                                            <MenuItem key={c.ID} value={String(c.ID)}>
                                                                {c.CategoryName}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </TableCell>

                                            {/* โซน */}
                                            <TableCell>
                                                <Form.Item
                                                    name={['bills', currentStep, 'products', index, 'Zone']}
                                                    rules={[{ required: true, message: 'กรุณาเลือกโซน' }]}
                                                    initialValue={p.Zone || ""}
                                                >
                                                    <Select
                                                        value={p.Zone || ""}
                                                        variant="standard"
                                                        fullWidth
                                                        onChange={async e => {
                                                            const value = Number(e.target.value);
                                                            await handleZoneSelect(value, index); // เคลียร์ ShelfID
                                                        }}
                                                    >
                                                        {Zones.map(z => (
                                                            <MenuItem key={z.ID} value={String(z.ID)}>
                                                                {z.ZoneName}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </TableCell>

                                            {/* ชั้นวางสินค้า */}
                                            <TableCell>
                                                <Form.Item
                                                    shouldUpdate={(prev, cur) =>
                                                        prev.bills?.[currentStep]?.products?.[index]?.Zone !==
                                                        cur.bills?.[currentStep]?.products?.[index]?.Zone
                                                    }
                                                    noStyle
                                                >
                                                    {({ getFieldValue }) => {
                                                        const zoneID = getFieldValue(['bills', currentStep, 'products', index, 'Zone']) || "";
                                                        return (
                                                            <Form.Item
                                                                name={['bills', currentStep, 'products', index, 'ShelfID']}
                                                                rules={[{ required: true, message: 'กรุณาเลือกชั้นวาง' }]}
                                                                initialValue={p.ShelfID || ""}
                                                            >
                                                                <Select
                                                                    value={p.ShelfID || ""}
                                                                    variant="standard"
                                                                    fullWidth
                                                                    disabled={!zoneID}
                                                                >
                                                                    {(shelfMap[Number(zoneID)] || []).map(s => (
                                                                        <MenuItem key={s.ID} value={String(s.ID)}>
                                                                            {s.ShelfName}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
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
                    </SimpleBar>

                </Form>
            </Modal >

        </>
    );
}

export default ImportProduct;