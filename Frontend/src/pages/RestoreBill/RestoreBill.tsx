import { message, Button, Modal, Spin, Checkbox, Row, Col, Pagination, Card, Typography } from "antd";
import { useEffect, useState } from "react";
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { GetBillAllDataById, GetBillDeleted, RestoreBills } from "../../services/https"; // เพิ่ม API restore
import type { BillInterface } from "../../interfaces/Bill";
import dayjs from "dayjs";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { IconButton, Menu, MenuItem } from "@mui/material";
import { Info, MoreVert } from "@mui/icons-material";
import './RestoreBill.css';
const { Title } = Typography;

function RestoreBill() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Bills, setBillData] = useState<BillInterface[]>([]);
    const [selectedBill, setSelectedBill] = useState<BillInterface | null>(null);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRow, setSelectedRow] = useState<BillInterface | null>(null);
    const [isModalDataOpen, setIsModalDataOpen] = useState(false);

    const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);

    const fetchBillData = async (id: number) => {
        try {
            const res = await GetBillAllDataById(id);
            if (res.status === 200) {
                const billData: BillInterface = {
                    ...res.data,
                    DateImport: res.data.DateImport ? new Date(res.data.DateImport) : undefined,
                    products: res.data.Products.map((p: any) => ({ ...p }))
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
            const res = await GetBillDeleted();
            if (res.status === 200) {
                const bills = res.data.map((item: BillInterface) => ({
                    ...item,
                    DateImport: dayjs(item.DateImport).format("YYYY-MM-DD"),
                    SupplyName: item.Supply?.SupplyName || "-",
                    Employee: item.Employee
                        ? `${item.Employee.FirstName || ""} ${item.Employee.LastName || ""}`.trim()
                        : item.EmployeeID ?? "-",
                }));
                setBillData(bills);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลรายการสินค้าได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายการสินค้า");
        }
    };

    useEffect(() => {
        getBillAll();
    }, []);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: BillInterface) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCheckboxChange = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedBillIds(prev => [...prev, id]);
        } else {
            setSelectedBillIds(prev => prev.filter(bid => bid !== id));
        }
    };

    const handleRestore = async () => {
        if (selectedBillIds.length === 0) return;
        try {
            const res = await RestoreBills(selectedBillIds);
            if (res.status === 200) {
                messageApi.success("กู้คืนบิลเรียบร้อย");
                getBillAll();
                setSelectedBillIds([]);
            } else {
                messageApi.error(res.data?.error || "ไม่สามารถกู้คืนบิลได้");
            }
        } catch (error: any) {
            if (error?.response?.data?.error) {
                messageApi.error(error.response.data.error);
            } else {
                messageApi.error("เกิดข้อผิดพลาดในการกู้คืนบิล");
            }
        }
    };

    const handlePageChange = (newPage: number, newPageSize?: number) => {
        setPage(newPage);
        if (newPageSize) setRowsPerPage(newPageSize);
    };

    console.log(Bills);

    return (
        <>
            {contextHolder}
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
                <span style={{ fontSize: 28, color: "white" }}>
                    <AddBusinessIcon style={{ marginRight: 8, color: "white", fontSize: 28 }} />
                    กู้คืนข้อมูลบิล
                </span>
            </div>

            <div style={{ marginTop: 20, marginBottom: 20, display: "flex", justifyContent: "center" }}>
                <Card style={{ width: "95%" }}>
                    <Title level={3} style={{ marginTop: "0", marginBottom: "2%" }}>ประวัติการลบใบสั่งซื้อ</Title>
                    <TableContainer component={Paper} style={{ maxHeight: 500, boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)" }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>เลือก</TableCell>
                                    <TableCell>ลำดับ</TableCell>
                                    <TableCell>ชื่อรายการ</TableCell>
                                    <TableCell>วันที่นำเข้าสินค้า</TableCell>
                                    <TableCell>บริษัทขายส่ง</TableCell>
                                    <TableCell>พนักงานที่นำเข้า</TableCell>
                                    <TableCell align="center">จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Bills.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((row) => (
                                    <TableRow key={row.ID}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedBillIds.includes(row.ID)}
                                                onChange={(e) => handleCheckboxChange(row.ID, e.target.checked)}
                                            />
                                        </TableCell>
                                        <TableCell>{row.ID}</TableCell>
                                        <TableCell>{row.Title}</TableCell>
                                        <TableCell>{row.DateImport ? dayjs(row.DateImport).format("DD-MM-YYYY") : "-"}</TableCell>
                                        <TableCell>{row.SupplyName}</TableCell>
                                        <TableCell>
                                            {row.Employee
                                                ? `${row.Employee}`
                                                : row.EmployeeID ?? "-"}
                                        </TableCell>

                                        <TableCell align="center">
                                            <IconButton onClick={(e) => handleMenuClick(e, row)}>
                                                <MoreVert />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {Array.from({ length: rowsPerPage - Math.min(rowsPerPage, Bills.slice((page - 1) * rowsPerPage, page * rowsPerPage).length) }).map((_, index) => (
                                    <TableRow key={`empty-${index}`} style={{ height: 72.92, visibility: "hidden" }}>
                                        <TableCell colSpan={7}></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>


                    <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                        <Button className="restore_button" type="primary" onClick={handleRestore} disabled={selectedBillIds.length === 0}>
                            กู้คืนบิลที่เลือก
                        </Button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Pagination
                            current={page}
                            pageSize={rowsPerPage}
                            total={Bills.length}
                            onChange={handlePageChange}
                            showSizeChanger={false} // ถ้าไม่อยากให้ user เปลี่ยน pageSize
                        />
                    </div>
                </Card>
            </div>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem
                    onClick={() => {
                        if (!selectedRow) return;
                        fetchBillData(selectedRow.ID);
                        setIsModalDataOpen(true);
                        handleMenuClose();
                    }}
                >
                    <Info fontSize="small" style={{ marginRight: 8 }} />
                    ดูใบสั่งซื้อสินค้า
                </MenuItem>
            </Menu>

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
                                    {selectedBill.DateImport
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
                                        <TableCell>คำอธิบาย</TableCell>
                                        <TableCell>จำนวน</TableCell>
                                        <TableCell>หน่วย</TableCell>
                                        <TableCell>ราคาต่อชิ้น</TableCell>
                                        <TableCell>ส่วนลด (%)</TableCell>
                                        <TableCell>ราคารวม</TableCell>
                                        <TableCell>ราคาขายต่อหน่วย</TableCell>
                                        <TableCell>ประเภทสินค้า</TableCell>
                                        <TableCell>โซน</TableCell>
                                        <TableCell>ชั้นวางสินค้า</TableCell>
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
                                            <TableCell>{p.SalePrice}</TableCell>
                                            <TableCell>{p.CategoryName}</TableCell>
                                            <TableCell>{p.ZoneName}</TableCell>
                                            <TableCell>{p.ShelfName}</TableCell>
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
        </>
    );
}

export default RestoreBill;
