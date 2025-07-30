import { useState, useEffect } from "react";
import { Space, Button, Col, Row, Divider, message, Dropdown, Modal , Pagination , Card , Form , Input} from "antd";
// import { UserAddOutlined , EditOutlined, DeleteOutlined , InboxOutlined , SettingOutlined , MailOutlined , IdcardOutlined , PhoneOutlined , UserOutlined , RobotOutlined , WomanOutlined , ManOutlined , QuestionOutlined , KeyOutlined} from "@ant-design/icons";
// import { GetEmployees, DeleteEmployeeByID , resetPasswordEmployee} from "../../../services/https";
// import { Link, useNavigate } from "react-router-dom";
import type { EmployeeInterface } from "../../interfaces/Employee";
import { CreateEmployee,UpdateEmployee,DeleteEmployeeByID,GetAllEmployees,GetEmployeeById } from "../../services/https/index";

function Employee() {
    const [employees, setEmployees] = useState<EmployeeInterface[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeInterface[]>([])
    const [messageApi, contextHolder] = message.useMessage();

    const getEmployees = async () => {
        try {
        const res = await GetAllEmployees(); // Fetch data from the API

        if (res.status === 200) {
            setEmployees(res.data); // Set the data from the API response
        } else {
            setEmployees([]);
            messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลได้");
        }
        } catch (error) {
            setEmployees([]);
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
    };
    
    useEffect(() => {
        getEmployees(); 
    }, []);

    return (
        <>
            {contextHolder}
            <Card>
                <Row gutter={[0,8]}>
                    <Col xl={24}>
                        <Card>Hello</Card>
                    </Col>
                        <Col xl={16}>
                            <Card>Hello X2</Card>
                            <div className="flex h-screen">
                                {employees.map(emp => (
                                    <Card key={emp.ID}>
                                        <div>{emp.FirstName} {emp.LastName} {emp.Email}</div>
                                    </Card>
                                ))}
                            </div>
                        </Col>
                    <Col xl={8}>
                        <Card>Hello X3</Card>
                    </Col>
                </Row>
            </Card>
        </>
    );
}

export default Employee;