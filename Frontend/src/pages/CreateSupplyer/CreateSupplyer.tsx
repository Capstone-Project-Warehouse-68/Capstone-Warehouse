import { Row, Col, Card, message } from "antd"
import AddBusinessIcon from '@mui/icons-material/AddBusiness';

function CreateSupplyer() {
    const [messageApi, contextHolder] = message.useMessage();



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
                        <Card></Card>
                    </Col>
                    <Col xl={8}>
                        <Card></Card>
                    </Col>
                </Row>
            </div>


        </>
    );
}

export default CreateSupplyer;