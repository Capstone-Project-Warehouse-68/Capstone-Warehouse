import { Row, Col, message, Button, Form, Input, Modal, Select } from "antd"
import { useEffect, useState } from "react";
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { CreateSupplys, GetBankTypes, GetSupply, UpdateSupply } from "../../services/https";
import type { BankTypeInterface } from "../../interfaces/BankType";
import type { SupplyInterface } from "../../interfaces/Supply";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';

function CreateSupplyer() {
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [Bank, setBankType] = useState<BankTypeInterface[]>([]);
    const [Supplyer, setSupplyer] = useState<SupplyInterface[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSupply, setEditingSupply] = useState<SupplyInterface | null>(null);
    const [form] = Form.useForm();

    const showModal = () => {
        form.resetFields();
        setIsModalOpen(true);
    };


    const onFinish = async () => {
        try {
            const values = await form.validateFields();
            const res = await CreateSupplys(values);
            if (res.status === 201) {
                messageApi.success("บันทึกข้อมูลเรียบร้อยแล้ว");
                setIsModalOpen(false);
                form.resetFields();
                getSupply();
            } else {
                messageApi.error(res.data?.error || "ไม่สามารถบันทึกข้อมูลได้");
            }
        } catch (error: any) {
            console.error("API Error:", error);
            messageApi.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setIsModalOpen(false);
    };

    const handleEdit = (supply: SupplyInterface) => {
        setEditingSupply(supply);
        form.setFieldsValue({
            SupplyName: supply.SupplyName,
            SupplyAbbrev: supply.SupplyAbbrev,
            Address: supply.Address,
            SaleName: supply.SaleName,
            PhoneNumberSale: supply.PhoneNumberSale,
            BankTypeID: supply.BankTypeID,
            BankAccountNumber: supply.BankAccountNumber,
            LineIDSale: supply.LineIDSale,
        });
        setIsEditModalOpen(true);
    };

    const handleEditFinish = async () => {
        if (!editingSupply) return;
        try {
            const values = await form.validateFields();
            console.log(values);

            const res = await UpdateSupply(editingSupply.ID, values);
            if (res.status === 200) {
                messageApi.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
                setIsEditModalOpen(false);
                form.resetFields();
                getSupply();
            } else {
                messageApi.error(res.data?.error || "ไม่สามารถแก้ไขข้อมูลได้");
            }
        } catch (error: any) {
            messageApi.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        }
    };

    const getBankType = async () => {
        try {
            const res = await GetBankTypes();
            if (res.status === 200) {
                const unit = res.data.map((item: BankTypeInterface) => ({
                    ID: item.ID.toString(),
                    BankTypeName: item.BankTypeName || "-",
                    BankTypePicture: item.BankTypePicture || "-",
                }));
                setBankType(unit);
            } else {
                messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลธนาคารได้");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลธนาคาร");
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

    useEffect(() => {
        getBankType();
        getSupply();
    }, []);

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
                }}>
                <span style={{ fontSize: 20, color: "white" }}>
                    <AddBusinessIcon style={{ marginRight: 8, color: "white" }} />
                    สร้างข้อมูลบริษัทสั่งซื้อ
                </span>
            </div>
            <Button type="primary" onClick={showModal}>
                สร้างข้อมูลบริษัทสั่งซื้อ
            </Button>
            <Row>
                <Col xl={24}>
                    <TableContainer component={Paper} style={{ maxHeight: '65vh', maxWidth: "80vw", margin: "16px auto" }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ชื่อบริษัท</TableCell>
                                    <TableCell>ชื่อย่อบริษัท</TableCell>
                                    <TableCell>ที่อยู่</TableCell>
                                    <TableCell>ผู้ขาย</TableCell>
                                    <TableCell>เบอร์โทรศัพท์</TableCell>
                                    <TableCell>ธนาคาร</TableCell>
                                    <TableCell>เลขบัญชี</TableCell>
                                    <TableCell>LineID</TableCell>
                                    <TableCell>จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Supplyer.map((supply) => {
                                    const bank = Bank.find(b => Number(b.ID) === supply.BankTypeID);
                                    return (
                                        <TableRow key={supply.ID}>
                                            <TableCell>{supply.SupplyName}</TableCell>
                                            <TableCell>{supply.SupplyAbbrev}</TableCell>
                                            <TableCell>{supply.Address}</TableCell>
                                            <TableCell>{supply.SaleName}</TableCell>
                                            <TableCell>{supply.PhoneNumberSale}</TableCell>
                                            <TableCell>
                                                {bank ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <img
                                                            src={bank.BankTypePicture}
                                                            alt={bank.BankTypeName}
                                                            style={{ width: 24, height: 24, objectFit: 'contain' }}
                                                        />
                                                        <span>{bank.BankTypeName}</span>
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{supply.BankAccountNumber}</TableCell>
                                            <TableCell>{supply.LineIDSale}</TableCell>
                                            <TableCell>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleEdit(supply)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Col>
            </Row>

            <Modal
                title="สร้างข้อมูลบริษัทสั่งซื้อ"
                open={isModalOpen}
                onOk={onFinish}
                onCancel={handleCancel}
                okText="บันทึก"
                cancelText="ยกเลิก"
                centered
            >
                <Form form={form} layout="vertical">
                    <Row gutter={[16, 8]}>
                        <Col xl={12}>
                            <Form.Item
                                label="ชื่อบริษัท"
                                name="SupplyName"
                                rules={[{ required: true, message: "กรุณากรอกชื่อบริษัท" }]}
                            >
                                <Input placeholder="กรอกชื่อบริษัท" />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="ชื่อย่อบริษัท (ภาษาอังกฤษ)"
                                name="SupplyAbbrev"
                                rules={[
                                    { required: true, message: "กรุณากรอกชื่อย่อบริษัทพิมพ์ใหญ่" },
                                    {
                                        pattern: /^[A-Z]{2,3}$/,
                                        message: "ต้องเป็นภาษาอังกฤษพิมพ์ใหญ่ 2-3 ตัวอักษร",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="กรอกชื่อย่อบริษัท"
                                    maxLength={3}
                                    onChange={(e) => {
                                        const value = e.target.value.toUpperCase();
                                        e.target.value = value;
                                    }}
                                />
                            </Form.Item>
                        </Col>


                        <Col xl={24}>
                            <Form.Item
                                label="ที่อยู่บริษัท"
                                name="Address"
                                rules={[{ required: true, message: "กรุณากรอกที่อยู่บริษัท" }]}
                            >
                                <Input.TextArea rows={3} placeholder="กรอกที่อยู่บริษัท" />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="ชื่อผู้ขาย"
                                name="SaleName"
                                rules={[{ required: true, message: "กรุณากรอกที่ชื่อผู้ขาย" }]}
                            >
                                <Input placeholder="กรอกที่ชื่อผู้ขาย" />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="เบอร์โทรศัพท์"
                                name="PhoneNumberSale"
                                rules={[
                                    { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
                                    {
                                        pattern: /^0\d{9}$/,
                                        message: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="กรอกเบอร์โทรศัพท์"
                                    maxLength={10}
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="ธนาคาร"
                                name="BankTypeID"
                                rules={[{ required: true, message: "กรุณาเลือกธนาคาร" }]}
                            >
                                <Select placeholder="เลือกธนาคาร">
                                    {Bank.map((bank) => (
                                        <Select.Option key={bank.ID} value={Number(bank.ID)}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <img
                                                    src={bank.BankTypePicture}
                                                    alt={bank.BankTypeName}
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        objectFit: "contain",
                                                    }}
                                                />
                                                <span>{bank.BankTypeName}</span>
                                            </div>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="เลขบัญชี"
                                name="BankAccountNumber"
                                rules={[
                                    { required: true, message: "กรุณากรอกเลขบัญชี" },
                                    {
                                        pattern: /^\d+$/,
                                        message: "กรุณากรอกเฉพาะตัวเลขเท่านั้น",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="กรอกเลขบัญชี"
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xl={24}>
                            <Form.Item
                                label="LineID"
                                name="LineIDSale"
                                rules={[{ required: true, message: "กรุณากรอกเลขบัญชี" }]}
                            >
                                <Input placeholder="กรอกเลขบัญชี" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title="แก้ไขข้อมูลบริษัทสั่งซื้อ"
                open={isEditModalOpen}
                onOk={handleEditFinish}
                onCancel={() => setIsEditModalOpen(false)}
                okText="บันทึก"
                cancelText="ยกเลิก"
                centered
            >
                <Form form={form} layout="vertical">
                    <Row gutter={[16, 8]}>
                        <Col xl={12}>
                            <Form.Item
                                label="ชื่อบริษัท"
                                name="SupplyName"
                                rules={[{ required: true, message: "กรุณากรอกชื่อบริษัท" }]}
                            >
                                <Input placeholder="กรอกชื่อบริษัท" />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="ชื่อย่อบริษัท (ภาษาอังกฤษ)"
                                name="SupplyAbbrev"
                                rules={[
                                    { required: true, message: "กรุณากรอกชื่อย่อบริษัทพิมพ์ใหญ่" },
                                    {
                                        pattern: /^[A-Z]{2,3}$/,
                                        message: "ต้องเป็นภาษาอังกฤษพิมพ์ใหญ่ 2-3 ตัวอักษร",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="กรอกชื่อย่อบริษัท"
                                    maxLength={3}
                                    onChange={(e) => {
                                        const value = e.target.value.toUpperCase();
                                        e.target.value = value;
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xl={24}>
                            <Form.Item
                                label="ที่อยู่บริษัท"
                                name="Address"
                                rules={[{ required: true, message: "กรุณากรอกที่อยู่บริษัท" }]}
                            >
                                <Input.TextArea rows={3} placeholder="กรอกที่อยู่บริษัท" />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="ชื่อผู้ขาย"
                                name="SaleName"
                                rules={[{ required: true, message: "กรุณากรอกที่ชื่อผู้ขาย" }]}
                            >
                                <Input placeholder="กรอกที่ชื่อผู้ขาย" />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="เบอร์โทรศัพท์"
                                name="PhoneNumberSale"
                                rules={[
                                    { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
                                    {
                                        pattern: /^0\d{9}$/,
                                        message: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="กรอกเบอร์โทรศัพท์"
                                    maxLength={10}
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="ธนาคาร"
                                name="BankTypeID"
                                rules={[{ required: true, message: "กรุณาเลือกธนาคาร" }]}
                            >
                                <Select placeholder="เลือกธนาคาร">
                                    {Bank.map((bank) => (
                                        <Select.Option key={bank.ID} value={Number(bank.ID)}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <img
                                                    src={bank.BankTypePicture}
                                                    alt={bank.BankTypeName}
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        objectFit: "contain",
                                                    }}
                                                />
                                                <span>{bank.BankTypeName}</span>
                                            </div>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xl={12}>
                            <Form.Item
                                label="เลขบัญชี"
                                name="BankAccountNumber"
                                rules={[
                                    { required: true, message: "กรุณากรอกเลขบัญชี" },
                                    {
                                        pattern: /^\d+$/,
                                        message: "กรุณากรอกเฉพาะตัวเลขเท่านั้น",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="กรอกเลขบัญชี"
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xl={24}>
                            <Form.Item
                                label="LineID"
                                name="LineIDSale"
                                rules={[{ required: true, message: "กรุณากรอกเลขบัญชี" }]}
                            >
                                <Input placeholder="กรอกเลขบัญชี" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

        </>
    );
}

export default CreateSupplyer;