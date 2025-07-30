import { Button, Col, Row, Table, Dropdown } from "antd";
import {
    FileAddOutlined,
    FilePdfOutlined,
    HistoryOutlined,
    EditOutlined,
    DeleteOutlined,
    DashOutlined

} from "@ant-design/icons";
import KeyboardIcon from '@mui/icons-material/Keyboard';

function ImportProduct() {

    const dataSource = [
        {
            ID: '1',
            Title: 'ลูกปืน',
            DateImport: '12-06-68',
            Supply: 'Warp Co., Ltd.',
            Employee: 'นายสมชาย '
        },
    ];

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
            title: 'จัดการ',
            dataIndex: 'Action',
            key: 'Action',
            render: () => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                label: "แก้ไขข้อมูล",
                                key: "1",
                                icon: <EditOutlined />,
                                // onClick: () => {
                                //     navigate(`/studentlist/edit/${ID}`);  // ใช้ id จาก dataIndex
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
                                // onClick: () => {
                                //     if (id !== undefined) {
                                //         showDeleteConfirmModal(ID);
                                //     } else {
                                //         message.error("ไม่พบ ID ของนักศึกษา");
                                //     }
                                // },
                                danger: true,
                            },
                        ],
                    }}
                >
                    <Button icon={<DashOutlined />} size={"small"} className="btn" shape="circle" />
                </Dropdown>
            )
        },
    ];

    return (
        <>
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

            <Row style={{ display: "flex", justifyContent: "center", marginTop: "5%", marginBottom: "5%" }}>
                <Col style={{ marginRight: "10%" }}>
                    <Button
                        className="button-import" style={{
                            height: "auto",
                            width: "auto",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}>
                        <span style={{ fontSize: 20, color: "white",display: "flex",
                            justifyContent: "center",
                            alignItems: "center", }}>
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
                            <FilePdfOutlined  style={{ marginRight: 8, color: "white" }} />
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

            <Table className="Table-historyimport-product" dataSource={dataSource} columns={columns} />;

        </>
    );
}

export default ImportProduct;