import { Row, Col, Card, message, Button, Form, Input, Modal } from "antd"
import { useState } from "react";
import AddBusinessIcon from '@mui/icons-material/AddBusiness';

function CreateSupplyer() {
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            console.log("ค่าที่กรอก:", values);
            messageApi.success("บันทึกข้อมูลเรียบร้อยแล้ว");
            setIsModalOpen(false);
            form.resetFields();
        }).catch(info => {
            console.log("Validate Failed:", info);
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

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
            <div style={{ padding: "0 16px" }}>
                <Row gutter={16} style={{ marginTop: "3%" }}>
                    <Col xl={16}>
                        <Card>
                            <Button type="primary" onClick={showModal}>
                                สร้างข้อมูลบริษัทสั่งซื้อ
                            </Button>
                        </Card>
                    </Col>
                    <Col xl={8}>
                        <Card></Card>
                    </Col>
                </Row>
            </div>

            <Modal
                title="สร้างข้อมูลบริษัทสั่งซื้อ"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="บันทึก"
                cancelText="ยกเลิก"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="ชื่อบริษัท"
                        name="companyName"
                        rules={[{ required: true, message: "กรุณากรอกชื่อบริษัท" }]}
                    >
                        <Input placeholder="เช่น บริษัท ABC จำกัด" />
                    </Form.Item>
                    <Form.Item
                        label="ที่อยู่บริษัท"
                        name="companyAddress"
                        rules={[{ required: true, message: "กรุณากรอกที่อยู่บริษัท" }]}
                    >
                        <Input.TextArea rows={3} placeholder="เช่น 123 ถนนสุขุมวิท กรุงเทพฯ" />
                    </Form.Item>
                </Form>
            </Modal>

        </>
    );
}

export default CreateSupplyer;