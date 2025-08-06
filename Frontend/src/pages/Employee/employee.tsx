import { useState, useEffect } from "react";
import { Select , Button, Col, Row, Divider, message, Dropdown, Modal , Pagination , Card , Form , Input , Upload} from "antd";
import type { UploadFile, UploadProps } from "antd";
import ImgCrop from "antd-img-crop";
import { SettingOutlined , InboxOutlined , IdcardOutlined , PhoneOutlined , DollarCircleOutlined , QuestionCircleOutlined , PlusOutlined , DeleteOutlined , EditOutlined , KeyOutlined } from "@ant-design/icons";
import { Typography } from 'antd';
const { Text } = Typography;
import type { EmployeeInterface } from "../../interfaces/Employee";
import type { RoleInterface } from "../../interfaces/Role";
import type { BankTypeInterface } from "../../interfaces/BankType";
import type { UploadFileStatus } from 'antd/es/upload/interface';
import { CreateEmployee , UpdateEmployee , DeleteEmployeeByID , GetAllEmployees , GetRoles , GetBankTypes , CheckEmail , CheckPhone , CheckNationalID , ResetPassword, GetEmployeeById } from "../../services/https/index";
import "../Employee/employee.css";
import type { ResetPasswordInterface } from "../../interfaces/ResetPassword";

function Employee() {
    const ID = localStorage.getItem("employeeID");
    const [employees, setEmployees] = useState<EmployeeInterface[]>([])
    const [roles, setRoles] = useState<RoleInterface[]>([])
    const [banktypes, setBankTypes] = useState<BankTypeInterface[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(Number(ID));
    const [messageApi, contextHolder] = message.useMessage();

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");

    const onChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1));
    };
    
    // Updated onPreview function to handle image preview correctly
    const onPreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
        file.preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file.originFileObj as Blob);
            reader.onload = () => resolve(reader.result as string);
        });
        }
        setPreviewImage(file.url || file.preview as string);
        setPreviewVisible(true);
        setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf("/") + 1));
    };

    const selectedEmpData = employees.find(emp => emp.ID === selectedEmployee);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 4;

    const paginatedEmployee = employees.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

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

    const fetchData = async () => {
        try {
          const [EmpRes, RoleRes , BankTypeRes] = await Promise.all([GetAllEmployees(), GetRoles(), GetBankTypes()]);
      
          if (EmpRes.status === 200) {
            setEmployees(EmpRes.data);
          } else {
            setEmployees([]);
            messageApi.error(EmpRes.data.error || "ไม่สามารถดึงข้อมูลพนักงานได้");
          }
      
          if (RoleRes.status === 200) {
            setRoles(RoleRes.data);
          } else {
            setRoles([]);
            messageApi.error(RoleRes.data.error || "ไม่สามารถดึงข้อมูลตำแหน่งงานได้");
          }

          if (BankTypeRes.status === 200) {
            setBankTypes(BankTypeRes.data);
          } else {
            setBankTypes([]);
            messageApi.error(BankTypeRes.data.error || "ไม่สามารถดึงข้อมูลประเภทการเงินได้");
          }


        } catch (error) {
            setEmployees([]);
            setRoles([]);
            setBankTypes([]);
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
    };

    useEffect(() => {
        fetchData(); 
    }, []);

    // State สำหรับควบคุม Modal
    const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
    const [isModalOpenDelete, setIsModalOpenDelete] = useState(false);
    const [isModalOpenUpdate, setIsModalOpenUpdate] = useState(false);
    const [isModalOpenResetPassword, setIsModalOpenResetPassword] = useState(false);
    const [selectedEmpID, setSelectEmpID] = useState<number | null>(null);
    const [empIDUpdate, setEmpIDUpdate] = useState<number | null>();
    const [empIDResetPassword, setEmpIDResetPassword] = useState<string | "">();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
    const [isSubmittingResetPassword, setIsSubmittingResetPassword] = useState(false);

    const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>("");
    const [currentNationalID, setCurrentNationalID] = useState<string>("");

    const [formCreate] = Form.useForm();
    const [formUpdate] = Form.useForm();
    const [formResetPassword] = Form.useForm();

    const showModalCreate = () => {
        setIsModalOpenCreate(true);
    };

    const handleCancelCreate = () => {
        formCreate.resetFields();
        setFileList([]);
        setIsSubmitting(false);
        setIsModalOpenCreate(false);
    };

    const getBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const onFinishCreate = async (values: EmployeeInterface) => {
        if (fileList.length === 0) {
            messageApi.error("กรุณาเลือกรูปภาพ");
            return;
        }
        // แปลงภาพเป็น base64 หรือส่งแบบไฟล์ก็ได้
        const file = fileList[0].originFileObj;
        const base64 = await getBase64(file as File);

        // เพิ่มรูปลงใน values
        values.Profile = base64;

        setIsSubmitting(true); 
        try {
            const res = await CreateEmployee(values);
            if (res.status === 201) {
                messageApi.success("สร้างข้อมูลพนักงานสำเร็จ");
            } else {
                messageApi.open({
                    type: "error",
                    content: res.data.error,
                });
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการสร้างข้อมูลพนักงาน");
        } finally {
            formCreate.resetFields();
            setIsSubmitting(false);
            setIsModalOpenCreate(false);
            getEmployees();
        }
    };

    const showDeleteConfirmModal = (id: number) => {
        setSelectEmpID(id);
        setIsModalOpenDelete(true);
    };

    const handleDelete = async () => {
        if (selectedEmpID) {
            if (selectedEmpID === Number(ID)) {
            messageApi.warning("ไม่สามารถลบข้อมูลผู้ใช้ตัวเองได้");
            setIsModalOpenDelete(false);
            return;
            }
          try {
            const res = await DeleteEmployeeByID(Number(selectedEmpID));
            if (res.status === 200) {
              messageApi.success("ลบข้อมูลสำเร็จ");
              await getEmployees(); // Refresh the list after deleting a room
            } else {
              messageApi.error(res.data.error || "ไม่สามารถลบข้อมูลได้");
            }
          } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการลบข้อมูล");
          } finally {
            setIsModalOpenDelete(false);
            setSelectEmpID(null);
          }
        }
    };

    const getDataEmployeeByID = async (id: number) => {
        let res = await GetEmployeeById(id);
        if (res.status === 200) {
        const phoneNumber = res.data.PhoneNumber;
        const nationalID = res.data.NationalID;
        formUpdate.setFieldsValue({
            FirstName: res.data.FirstName,
            LastName: res.data.LastName,
            PhoneNumber: phoneNumber,
            NationalID: nationalID,
            RoleID:     res.data.RoleID,
            BankTypeID: res.data.BankTypeID,
            BankAccountNumber:  res.data.BankAccountNumber,
            Line:   res.data.Line,

        });
        setCurrentPhoneNumber(phoneNumber);
        setCurrentNationalID(nationalID);

        if (res.data.Profile) {
            const defaultFile: UploadFile[] = [
                {
                    uid: '-1',
                    name: 'profile-image.png',
                    status: 'done' as UploadFileStatus,
                    url: res.data.Profile,
                },
            ];
            setFileList(defaultFile);
            formUpdate.setFieldsValue({ Profile: defaultFile });
        }
        } else {
            messageApi.open({
                type: "error",
                content: "ไม่พบข้อมูลผู้ใช้",
            });
        }
    };

    const showModalUpdate = (id: number) => {
        getDataEmployeeByID(id);
        setEmpIDUpdate(id);
        setIsModalOpenUpdate(true);
    };

    const handleCancelUpdate = () => {
        formUpdate.resetFields();
        setFileList([]);
        setEmpIDUpdate(null);
        setIsSubmittingUpdate(false);
        setIsModalOpenUpdate(false);
    };

    const onFinishUpdate = async (values: EmployeeInterface) => {
        try{

            if (isSubmitting) return;
            setIsSubmittingUpdate(true);
            values.Profile = fileList.length > 0 ? fileList[0].thumbUrl : "";
            const res = await UpdateEmployee(Number(empIDUpdate), values);
            if (res.status === 200) {
                messageApi.open({
                    type: "success",
                    content: res.data.message,
                });
            } else {
                messageApi.open({
                    type: "error",
                    content: res.data.error,
                });
            }
        } finally {
            formUpdate.resetFields();
            setIsSubmittingUpdate(false);
            setIsModalOpenUpdate(false);
            getEmployees();
        }
        
    };

    const showModalResetPassword = (id: string) => {
        setIsModalOpenResetPassword(true);
        setEmpIDResetPassword(id)
    };

    const handleCancelResetPassword = () => {
        formResetPassword.resetFields();
        setEmpIDResetPassword("")
        setIsSubmittingResetPassword(false);
        setIsModalOpenResetPassword(false);
    };

    const onFinishResetPassword = async (values : ResetPasswordInterface ) => {
        setIsSubmitting(true)

        try {
            const res = await ResetPassword( empIDResetPassword || "", values ); 
        if (res.status === 200) {
            messageApi.open({
                type: "success",
                content: res.data.message || "เปลี่ยนรหัสผ่านสำเร็จ",
            });
        } else {
            messageApi.open({
                type: "error",
                content: res.data.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
            });
        }
        if(res.status === 400){
            formResetPassword.resetFields();
            setIsSubmitting(false);
        }
        } catch (error) {
            messageApi.open({
                type: "error",
                content: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
        });
        } finally {
            formResetPassword.resetFields();
            setEmpIDResetPassword("")
            setIsModalOpenResetPassword(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Card>
                <Row gutter={[8,8]}>
                    <Col xl={24}>
                        <Card>
                            <Row>
                                <Col xl={12}>
                                        Test
                                </Col>
                                <Col xl={11}>
                                        <Button type="default" 
                                            icon={<QuestionCircleOutlined />} 
                                            size={"middle"}
                                            onClick={showModalCreate}
                                        > 
                                            สมัครข้อมูลพนักงาน
                                        </Button>
                                </Col>
                                <Col xl={1}>
                                    <Button type="default" icon={<QuestionCircleOutlined />} size={"middle"} className="help-btn" />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                    <Col xl={14}>
                        <Card>
                            <Row gutter={[0,8]}>
                                <Col xl={1}>
                                    </Col>
                                <Col xl={8}>
                                    <Text strong>ชื่อจริง นามสกุล</Text>
                                </Col>
                                <Col xl={7}>
                                    <Text strong>ตำแหน่งงาน</Text>
                                </Col>
                                <Col xl={8}>
                                    <Text strong>อีเมลล์</Text>
                                </Col>
                            </Row>
                        </Card>
                        <Row>
                            <Col xl={24}>
                                {paginatedEmployee.length > 0 ? (
                                paginatedEmployee.map((emp) => (
                                    <Card 
                                        key={emp.ID}
                                        style={{ 
                                            marginTop: 8,
                                            backgroundColor: selectedEmployee === emp.ID ? '#e6f7ff' : undefined,
                                            border: selectedEmployee === emp.ID ? '2px solid #1890ff' : undefined
                                        }}
                                        onClick={() => setSelectedEmployee(Number(emp.ID))}
                                        className="cursor-pointer hover:shadow-md transition-all"
                                    >
                                        <Row gutter={[0,8]}>
                                            <Col xl={8}>
                                                <Text strong>{emp.FirstName} {emp.LastName}</Text>
                                            </Col>
                                            <Col xl={6}>
                                                <Text strong>{emp.Role?.RoleName}</Text>
                                            </Col>
                                            <Col xl={9}>
                                                <Text strong>{emp.Email }</Text>
                                            </Col>
                                            <Col xl={1}>
                                                <Dropdown
                                                    menu={{
                                                        items: [
                                                            {
                                                                label: "แก้ไขข้อมูล",
                                                                key: "1",
                                                                icon: <EditOutlined />,
                                                                onClick: () => showModalUpdate( emp.ID || 0),
                                                            },
                                                            {
                                                                label: "รีเซ็ตรหัสผ่าน",
                                                                key: "2",
                                                                icon: <KeyOutlined />,
                                                                onClick: () => showModalResetPassword(emp.ID?.toString() || ""),
                                                            },
                                                            {
                                                                label: "ลบข้อมูล",
                                                                key: "3",
                                                                icon: <DeleteOutlined />,
                                                                onClick: () => showDeleteConfirmModal( emp.ID || 0),
                                                                danger: true,
                                                            },
                                                        ],
                                                    }}
                                                >
                                                    <Button type="primary" icon={<SettingOutlined />} size={"small"} className="config-btn" />
                                                </Dropdown>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))
                            ) : (
                                <Col span={24}>
                                    <div 
                                        style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            justifyContent: "flex-end", 
                                            alignItems: "center", 
                                            minHeight: "40vh",
                                            padding: "20px", 
                                            color: "#999" 
                                        }}
                                    >
                                        <InboxOutlined  style={{ fontSize: "48px", marginBottom: "16px" }} />
                                        <p style={{ fontSize: "16px", color: "#999" }}>ไม่มีข้อมูลพนักงาน</p>
                                    </div>
                                </Col>
                                )}
                            </Col>
                            <Col xl={24} style={{display: "flex", justifyContent: "flex-end", }}>
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={employees.length}
                                    onChange={(page) => setCurrentPage(page)}
                                    style={{ marginTop: 16 }}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col xl={10}>
                        {selectedEmpData && (
                        <Card title="ข้อมูลพนักงานที่เลือก" >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img src={selectedEmpData.Profile} className="profile" />
                                <Text strong style={{ fontSize: 18 }}>
                                {selectedEmpData.FirstName} {selectedEmpData.LastName}
                                </Text>
                            </div>
                            <div style={{ marginTop: 24 }}>
                        <p>
                            <IdcardOutlined style={{ marginRight: 8 }} />
                            บัตรประชาชน<br />
                            {<Text type="secondary">{selectedEmpData.NationalID || "ไม่มีข้อมูลบัตรประชาชนในระบบ"}</Text>}
                        </p>
                        <p>
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            เบอร์โทรติดต่อ<br />
                            <Text type="secondary">{selectedEmpData.PhoneNumber || "ไม้มีข้อมูลเบอร์โทรในระบบ"}</Text>
                        </p>
                        <p>
                        {/* <SiLine style={{ color: "#06C755", marginRight: 8 }} /> */}
                        ไอดี-ไลน์<br />
                        <Text type="secondary">{selectedEmpData.Line || "ไม้มีข้อมูลไลน์ในระบบ"}</Text>
                        </p>
                        <p>
                        <DollarCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                        ธนาคาร<br />
                        <Text type="secondary">{selectedEmpData.BankType?.BankTypeName} {selectedEmpData.BankAccountNumber}</Text>
                        </p>
                    </div>
                        </Card>
                        )}
                    </Col>
                </Row>
            </Card>

            <Modal
                title="เพิ่มข้อมูลพนักงาน"
                open={isModalOpenCreate}
                onCancel={handleCancelCreate}
                footer={null}
            >
                <Divider/>
                <Form
                    name="Register"
                    form={formCreate}
                    onFinish={onFinishCreate}
                    layout="vertical"
                >
                    <Row gutter={[8,8]}>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                            <Form.Item label="รูปประจำตัว" required >
                                <ImgCrop rotationSlider>
                                <Upload
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={onChange}
                                    maxCount={1}
                                    multiple={false}
                                    listType="picture-card"
                                    onPreview={onPreview}
                                >
                                    <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>อัพโหลด</div>
                                    </div>
                                </Upload>
                                </ImgCrop>
                            </Form.Item>
                        </Col>
                        <Col xl={24}>
                             <Form.Item
                                label="อีเมล"
                                name="Email"
                                hasFeedback
                                rules={[
                                    { required: true, message: "กรุณากรอกอีเมล!" },
                                    { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง!" },
                                    {
                                        pattern: /^[a-zA-Z0-9@.]+$/,
                                        message: 'กรุณากรอกเฉพาะภาษาอังกฤษ และตัวเลขเท่านั้น',
                                    },
                                    {
                                        validator: async (_, value) => {
                                            if (!value) return Promise.resolve(); // ให้ validator อื่นจัดการ required
                                            const res = await CheckEmail(value);
                                            if (!res.data.isValid) {
                                                return Promise.reject(new Error("อีเมลนี้มีอยู่ในระบบแล้ว"));
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <Input 
                                    type="email" 
                                    onKeyDown={(e) => {
                                        if (!/^[a-zA-Z0-9@.]+$/.test(e.key) && e.key !== "Backspace") {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="รหัสผ่าน"
                                name="Password"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกรหัสผ่าน!",
                                    },
                                    {
                                        min: 6,
                                        message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                                    },
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="ยืนยันรหัสผ่าน"
                                name="VerifyPassword"
                                dependencies={['Password']} 
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกยืนยันรหัสผ่าน!",
                                    },
                                    {
                                        min: 6,
                                        message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('Password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน!"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="FirstName"
                                label="ชื่อจริง"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอกชื่อจริง !'
                                    },
                                    {
                                        pattern: /^[\u0E00-\u0E7F]+$/,
                                        message: 'กรุณากรอกเฉพาะตัวอักษรภาษาไทยเท่านั้น',
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={25}
                                    type="text"
                                    onKeyDown={(e) => {
                                        if (!/^[\u0E00-\u0E7F]+$/.test(e.key) && e.key !== "Backspace") {
                                            e.preventDefault();
                                        }
                                    }}
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="LastName"
                                label="นามสกุล"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอกนามสกุล !'
                                    },
                                    {
                                        pattern: /^[\u0E00-\u0E7F]+$/,
                                        message: 'กรุณากรอกเฉพาะตัวอักษรภาษาไทยเท่านั้น',
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={25}
                                    type="text"
                                    onKeyDown={(e) => {
                                        if (!/^[\u0E00-\u0E7F]+$/.test(e.key) && e.key !== "Backspace") {
                                            e.preventDefault();
                                        }
                                    }}
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="Line"
                                label="ไลน์"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอก ไลน์ สำหรับการติดต่อ !'
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={25}
                                    type="text"
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="เบอร์โทร"
                                name="PhoneNumber"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกเบอร์โทร!",
                                    },
                                    {
                                        pattern: /^0\d{9}$/,
                                        message: "กรุณากรอกเบอร์โทร!",
                                    },
                                    {
                                        validator: async (_, value) => {
                                            if (!value) return Promise.resolve(); // ให้ validator อื่นจัดการ required
                                            const res = await CheckPhone(value);
                                            if (!res.data.isValid) {
                                                return Promise.reject(new Error("เบอร์โทรนี้มีอยู่ในระบบแล้ว"));
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <Input
                                type="tel" // Tel type, which may help prevent cookie-based autofill
                                autoComplete="new-password" // Prevent browser autofill
                                maxLength={10} // จำกัดความยาวสูงสุดที่ 10 หลัก
                                onKeyPress={(event) => {
                                    const inputValue = (event.target as HTMLInputElement).value;
                                    if (!/[0-9]/.test(event.key)) {
                                    event.preventDefault();
                                    }
                                    if (inputValue.length === 0 && event.key !== "0") {
                                    event.preventDefault();
                                    }
                                }}
                                onCopy={(e) => e.preventDefault()} // Prevent copy
                                onCut={(e) => e.preventDefault()} // Prevent cut
                                onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="ตำแหน่งงาน"
                                name="RoleID"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณาเลือกตำแหน่งงาน!",
                                    },
                                ]}
                                >
                                <Select
                                placeholder="เลือกตำแหน่งงาน"
                                style={{ width: "100%" }}
                                options={roles.map((roles) => ({
                                    value: roles.ID,
                                    label: roles.RoleName,
                                }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="ประเภทการเงิน"
                                name="BankTypeID"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณาเลือกตำแหน่งงาน!",
                                    },
                                ]}
                                >
                                <Select
                                placeholder="เลือกตำแหน่งงาน"
                                style={{ width: "100%" }}
                                options={banktypes.map((banktypes) => ({
                                    value: banktypes.ID,
                                    label: banktypes.BankTypeName,
                                }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="BankAccountNumber"
                                label="เลขบัญชีธนาคาร/พร้อมเพย์"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอก เลขบัญชีธนาคาร/พร้อมเพย์ !'
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={15}
                                    type="text"
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="NationalID"
                                label="บัตรประชาชน"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกรหัสบัตรประชาชน!",
                                    },
                                    {
                                        pattern: /^\d{13}$/,
                                        message: "กรุณากรอกเลขบัตรให้ครบ 13 หลัก",
                                    },
                                    {
                                        validator: async (_, value) => {
                                            if (!value) return Promise.resolve(); // ให้ validator อื่นจัดการ required
                                            const res = await CheckNationalID(value);
                                            if (!res.data.isValid) {
                                                return Promise.reject(new Error("เลขบัตรประชาชนนี้มีอยู่แล้ว"));
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                                >
                                <Input
                                    type="nationalid"
                                    autoComplete="new-password" // Prevent browser autofill
                                    maxLength={13}
                                    // onChange={handleNationalIDChange}
                                    onKeyPress={(event) => {
                                    if (!/[0-9]/.test(event.key)) {
                                        event.preventDefault();
                                    }
                                    }}
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Button 
                                type="primary"
                                htmlType="submit"
                                className="green-button"
                                loading={isSubmitting}
                                disabled={isSubmitting }
                                >
                                ยืนยัน
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                visible={previewVisible}
                title={previewTitle}
                footer={null}
                onCancel={() => setPreviewVisible(false)}
            >
                <img alt="profile" style={{ width: "100%" }} src={previewImage} />
            </Modal>

            <Modal
                title="ยืนยันการลบ"
                open={isModalOpenDelete}
                onOk={handleDelete}
                onCancel={() => setIsModalOpenDelete(false)}
                okType="danger"
                okText="ลบ"
                cancelText="ยกเลิก"
            >
                <p>คุณแน่ใจเหรอว่าต้องการลบข้อมูลพนักงาน ?</p>
            </Modal>

            <Modal
                title="แก้ไขข้อมูลพนักงาน"
                open={isModalOpenUpdate}
                onCancel={handleCancelUpdate}
                footer={null}
            >
                <Divider/>
                <Form
                    name="EditInfo"
                    form={formUpdate}
                    onFinish={onFinishUpdate}
                    layout="vertical"
                >
                    <Row gutter={[8,8]}>
                        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                            {/* <Form.Item label="รูปประจำตัว" required >
                                <ImgCrop rotationSlider>
                                <Upload
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={onChange}
                                    maxCount={1}
                                    multiple={false}
                                    listType="picture-card"
                                    onPreview={onPreview}
                                >
                                    <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>อัพโหลด</div>
                                    </div>
                                </Upload>
                                </ImgCrop>
                            </Form.Item> */}
                            <Form.Item
                                label="รูปประจำตัว"
                                name="Profile"
                                valuePropName="fileList"
                                getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}
                                rules={[
                                    {
                                    required: true,
                                    message: "กรุณาอัปโหลดรูปภาพ!",
                                    },
                                ]}
                            >
                            <ImgCrop rotationSlider>
                                <Upload
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={({ fileList: newFileList }) => {
                                        setFileList(newFileList.slice(-1)); // จำกัดแค่รูปเดียว
                                        formUpdate.setFieldsValue({ Profile: newFileList.slice(-1) });
                                    }}
                                    maxCount={1}
                                    multiple={false}
                                    listType="picture-card"
                                    onPreview={onPreview}
                                >
                                {fileList.length < 1 && (
                                    <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>อัพโหลด</div>
                                    </div>
                                )}
                                </Upload>
                            </ImgCrop>
                            </Form.Item>

                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="FirstName"
                                label="ชื่อจริง"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอกชื่อจริง !'
                                    },
                                    {
                                        pattern: /^[\u0E00-\u0E7F]+$/,
                                        message: 'กรุณากรอกเฉพาะตัวอักษรภาษาไทยเท่านั้น',
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={25}
                                    type="text"
                                    onKeyDown={(e) => {
                                        if (!/^[\u0E00-\u0E7F]+$/.test(e.key) && e.key !== "Backspace") {
                                            e.preventDefault();
                                        }
                                    }}
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="LastName"
                                label="นามสกุล"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอกนามสกุล !'
                                    },
                                    {
                                        pattern: /^[\u0E00-\u0E7F]+$/,
                                        message: 'กรุณากรอกเฉพาะตัวอักษรภาษาไทยเท่านั้น',
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={25}
                                    type="text"
                                    onKeyDown={(e) => {
                                        if (!/^[\u0E00-\u0E7F]+$/.test(e.key) && e.key !== "Backspace") {
                                            e.preventDefault();
                                        }
                                    }}
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="Line"
                                label="ไลน์"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอก ไลน์ สำหรับการติดต่อ !'
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={25}
                                    type="text"
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="เบอร์โทร"
                                name="PhoneNumber"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกเบอร์โทร!",
                                    },
                                    {
                                        pattern: /^0\d{9}$/,
                                        message: "กรุณากรอกเบอร์โทร!",
                                    },
                                    {
                                        validator: async (_, value) => {
                                            if (!value) return Promise.resolve(); // ให้ validator อื่นจัดการ required
                                            if (value === currentPhoneNumber) return Promise.resolve(); // ถ้าเหมือนของเดิม ให้ผ่าน
                                            const res = await CheckPhone(value);
                                            if (!res.data.isValid) {
                                                return Promise.reject(new Error("เบอร์โทรนี้มีอยู่ในระบบแล้ว"));
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <Input
                                type="tel" // Tel type, which may help prevent cookie-based autofill
                                autoComplete="new-password" // Prevent browser autofill
                                maxLength={10} // จำกัดความยาวสูงสุดที่ 10 หลัก
                                onKeyPress={(event) => {
                                    const inputValue = (event.target as HTMLInputElement).value;
                                    if (!/[0-9]/.test(event.key)) {
                                    event.preventDefault();
                                    }
                                    if (inputValue.length === 0 && event.key !== "0") {
                                    event.preventDefault();
                                    }
                                }}
                                onCopy={(e) => e.preventDefault()} // Prevent copy
                                onCut={(e) => e.preventDefault()} // Prevent cut
                                onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="ตำแหน่งงาน"
                                name="RoleID"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณาเลือกตำแหน่งงาน!",
                                    },
                                ]}
                                >
                                <Select
                                placeholder="เลือกตำแหน่งงาน"
                                style={{ width: "100%" }}
                                options={roles.map((roles) => ({
                                    value: roles.ID,
                                    label: roles.RoleName,
                                }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="ประเภทการเงิน"
                                name="BankTypeID"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณาเลือกตำแหน่งงาน!",
                                    },
                                ]}
                                >
                                <Select
                                placeholder="เลือกตำแหน่งงาน"
                                style={{ width: "100%" }}
                                options={banktypes.map((banktypes) => ({
                                    value: banktypes.ID,
                                    label: banktypes.BankTypeName,
                                }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="BankAccountNumber"
                                label="เลขบัญชีธนาคาร/พร้อมเพย์"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'กรุณากรอก เลขบัญชีธนาคาร/พร้อมเพย์ !'
                                    },
                                ]}
                            >
                                <Input
                                    maxLength={15}
                                    type="text"
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                name="NationalID"
                                label="บัตรประชาชน"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกรหัสบัตรประชาชน!",
                                    },
                                    {
                                        pattern: /^\d{13}$/,
                                        message: "กรุณากรอกเลขบัตรให้ครบ 13 หลัก",
                                    },
                                    {
                                        validator: async (_, value) => {
                                            if (!value) return Promise.resolve(); // ให้ validator อื่นจัดการ required
                                            if (value === currentNationalID) return Promise.resolve(); // ถ้าเหมือนของเดิม ให้ผ่าน
                                            const res = await CheckNationalID(value);
                                            if (!res.data.isValid) {
                                                return Promise.reject(new Error("เลขบัตรประชาชนนี้มีอยู่แล้ว"));
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                                >
                                <Input
                                    type="nationalid"
                                    autoComplete="new-password" // Prevent browser autofill
                                    maxLength={13}
                                    // onChange={handleNationalIDChange}
                                    onKeyPress={(event) => {
                                    if (!/[0-9]/.test(event.key)) {
                                        event.preventDefault();
                                    }
                                    }}
                                    onCopy={(e) => e.preventDefault()} // Prevent copy
                                    onCut={(e) => e.preventDefault()} // Prevent cut
                                    onPaste={(e) => e.preventDefault()} // Prevent paste
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Button 
                                type="primary"
                                htmlType="submit"
                                className="green-button"
                                loading={isSubmittingUpdate}
                                disabled={isSubmittingUpdate }
                                >
                                ยืนยัน
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title="แก้ไขรหัสผ่านพนักงาน"
                open={isModalOpenResetPassword}
                onCancel={handleCancelResetPassword}
                footer={null}
            >
                <Divider/>
                <Form
                    name="ResetPassword"
                    form={formResetPassword}
                    onFinish={onFinishResetPassword}
                    layout="vertical"
                >
                    <Row gutter={[8,8]}>

                        <Col xl={12}>
                            <Form.Item
                                label="รหัสผ่าน"
                                name="NewPassword"
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกรหัสผ่าน!",
                                    },
                                    {
                                        min: 6,
                                        message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                                    },
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                        <Col xl={12}>
                            <Form.Item
                                label="ยืนยันรหัสผ่าน"
                                name="VerifyPassword"
                                dependencies={['NewPassword']} 
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: "กรุณากรอกยืนยันรหัสผ่าน!",
                                    },
                                    {
                                        min: 6,
                                        message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('NewPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("รหัสผ่านไม่ตรงกัน!"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Button 
                                type="primary"
                                htmlType="submit"
                                className="green-button"
                                loading={isSubmittingUpdate}
                                disabled={isSubmittingUpdate }
                                >
                                ยืนยัน
                            </Button>
                        </Col>
                    </Row>
                </Form>
                
            </Modal>

            
        </>
    );
}

export default Employee;