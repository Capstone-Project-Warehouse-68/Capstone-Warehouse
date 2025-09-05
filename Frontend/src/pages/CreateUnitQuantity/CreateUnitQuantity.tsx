import { Button, Card, Dropdown, Form, Input, message, Table } from "antd"
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { GetUnitPerQuantity, CreateUnitOfQuantity } from "../../services/https";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import { useEffect, useState } from "react";
import {
    EditOutlined,
    DeleteOutlined,
    DashOutlined,
} from "@ant-design/icons";

function CreateUnitQuantity() {
    const [messageApi, contextHolder] = message.useMessage();
    const [Units, setUnitData] = useState<UnitPerQuantityInterface[]>([]);
    const [form] = Form.useForm();

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

    const handleCreateUnit = async (values: UnitPerQuantityInterface) => {
        try {
            const res = await CreateUnitOfQuantity(values); // เรียก API สร้างหน่วย
            if (res.status === 200) {
                messageApi.success("สร้างหน่วยสำเร็จ");
                form.resetFields(); // เคลียร์ฟอร์ม
                getUnitperQuantity(); // รีเฟรชตาราง
            } else {
                messageApi.error(res.data.error || "สร้างหน่วยไม่สำเร็จ");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการสร้างหน่วย");
        }
    };

    const columns = [
        {
            title: 'ชื่อหน่วยสินค้า',
            dataIndex: 'NameOfUnit',
            key: 'NameOfUnit',
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
                                            // showDeleteConfirmModal(ID);
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
        getUnitperQuantity();
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
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <Card
                    style={{
                        marginTop: "1%",
                        marginBottom: "1%",
                        width: "95%",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}>
                    <Form
                        form={form}
                        layout="inline"
                    onFinish={handleCreateUnit}
                    >
                        <Form.Item
                            name="NameOfUnit"
                            rules={[{ required: true, message: "กรุณากรอกชื่อหน่วยสินค้า" }]}
                        >
                            <Input placeholder="ชื่อหน่วยสินค้า" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                สร้างหน่วย
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
            <Table dataSource={Units} columns={columns} pagination={{ pageSize: 6 }} />;


        </>
    );
}

export default CreateUnitQuantity;