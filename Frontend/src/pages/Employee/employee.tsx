import { useState, useEffect } from "react";
import { Select , Button, Col, Row, Divider, message, Dropdown, Modal , Pagination , Card , Form , Input , Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import ImgCrop from "antd-img-crop";
import { SettingOutlined , InboxOutlined , IdcardOutlined , PhoneOutlined , DollarCircleOutlined , PlusSquareOutlined , MailOutlined , PlusOutlined , DeleteOutlined , EditOutlined , KeyOutlined } from "@ant-design/icons";
import { Typography } from 'antd';
const { Text } = Typography;
import type { EmployeeInterface } from "../../interfaces/Employee";
import type { RoleInterface } from "../../interfaces/Role";
import type { BankTypeInterface } from "../../interfaces/BankType";
import type { UploadFileStatus } from 'antd/es/upload/interface';
import { CreateEmployee , UpdateEmployee , DeleteEmployeeByID , GetAllEmployees , GetRoles , GetBankTypes , CheckEmail , CheckPhone , ResetPassword, GetEmployeeById , GetNumberRole , UpdateNumberRole } from "../../services/https/index";
import "../Employee/employee.css";
import type { NumberRoleInterface } from "../../interfaces/Number";
const { Title } = Typography;

function Employee() {
    const ID = localStorage.getItem("employeeID");
    const [employees, setEmployees] = useState<EmployeeInterface[]>([])
    const [_numbers, setNumbers] = useState<NumberRoleInterface[]>([])
    const [roles, setRoles] = useState<RoleInterface[]>([])
    const [banktypes, setBankTypes] = useState<BankTypeInterface[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(Number(ID));
    const [messageApi, contextHolder] = message.useMessage();

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");

    const [ownerNumber, setownerNumber] = useState<number>(0);
    const [managerNumber, setManagerNumber] = useState<number>(0);
    const [employeeNumber, setemployeeNumber] = useState<number>(0);
    const [idNumber, setIDNumber] = useState<number>(0);
    const [code,setCode] = useState<string>("");
    const [logic, setLogic] = useState<boolean>(false);


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
    const pageSize = 6;

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

    const pickNumbersByRole = (rows: NumberRoleInterface[]) => {
        const result = { OW: 0, MN: 0, EMP: 0 };

        for (const r of rows) {
            const n = typeof r.Numb === "number" ? r.Numb : 0; // กัน undefined → 0

            // ใช้ RoleNickName ก่อน (นิ่งและชัด)
            if (r.Role?.RoleNickName === "OW") result.OW = n;
            else if (r.Role?.RoleNickName === "MN") result.MN = n;
            else if (r.Role?.RoleNickName === "EMP") result.EMP = n;
            else {
            // fallback: ถ้าไม่มี RoleNickName ให้ map ตาม RoleID 1/2/3
            if (r.RoleID === 1) result.OW = n;
            else if (r.RoleID === 2) result.MN = n;
            else if (r.RoleID === 3) result.EMP = n;
            }
        }

        return result;
        };

    const getNumberRoles = async () => {
        try {
            const res = await GetNumberRole();

            if (res.status === 200) {
            const rows: NumberRoleInterface[] = res.data;
            setNumbers(rows);

            const { OW, MN, EMP } = pickNumbersByRole(rows);
            setownerNumber(OW);
            setManagerNumber(MN);
            setemployeeNumber(EMP);
            } else {
            setNumbers([]);
            setownerNumber(0);
            setManagerNumber(0);
            setemployeeNumber(0);
            messageApi.error(res.data?.error || "ไม่สามารถดึงข้อมูลได้");
            }
        } catch (error) {
            setNumbers([]);
            setownerNumber(0);
            setManagerNumber(0);
            setemployeeNumber(0);
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
    };

    const generateEmployeeCode = (roleID : number ) => {
        setIDNumber(roleID);
        let prefix = "";
        let number = 0;
        if ( roleID === 1 ) {
            prefix = "OW";
            number = ownerNumber;
        } else if ( roleID === 2 ) {
            prefix = "MN";
            number = managerNumber;
        } else {
            prefix = "EMP";
            number = employeeNumber;
        }
        const formatted = number.toString().padStart(3, "0");
        setCode(`${prefix}-${formatted}`);
    };

    const UpdateNumber = async () => {
        try {
            let nextNumb: number;
            switch (idNumber) {
                case 1:
                    nextNumb = ownerNumber + 1;
                    break;
                case 2:
                    nextNumb = managerNumber + 1;
                    break;
                default:
                    nextNumb = employeeNumber + 1;
                    break;
            }

            const values: NumberRoleInterface = {
                Numb: nextNumb
            };

            const res = await UpdateNumberRole(Number(idNumber), values);
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
            getNumberRoles();
            setIDNumber(0);
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
        getNumberRoles();
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
    // const [currentNationalID, setCurrentNationalID] = useState<string>("");

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
        values.EMPCode = code;
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
            setFileList([]);
            UpdateNumber();
            setCode("");
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
        // setCurrentNationalID(nationalID);

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
            if (logic){
                values.EMPCode = code ; 
            }
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
            setFileList([]);
            if (logic) {
                setCode("");
                UpdateNumber();
            }
            setLogic(false);
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

    const onFinishResetPassword = async (values: { NewPassword: string }) => {
        setIsSubmitting(true)

        const payload = {
            NewPassword: values.NewPassword,
        };

        try {
            const res = await ResetPassword( empIDResetPassword || "", payload ); 
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

    const formatPhone = (phone : string) => {
        if (!phone) return "ไม่มีข้อมูลเบอร์โทรในระบบ";
        const digits = phone.replace(/\D/g, "");
        return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
        };

    return (
        <>
            {contextHolder}
            <Card style={{
                backgroundColor: "transparent",
                minHeight: "100vh",        // สูงเต็มหน้าจอ
                width: "100%",             // กว้างเต็มจอ
                border: "none"             // เอาเส้นขอบการ์ดออกถ้าไม่อยากได้
            }}>
                < Card style={{
                    margin: "-1%" ,
                    minHeight: "96vh",        // สูงเต็มหน้าจอ     
                 }}>
                    <Row gutter={[8,8]}>
                        <Col xl={24}>
                                <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                                    <Col>
                                        <Title level={3} style={{ margin: 0 }}>จัดการข้อมูลพนักงาน</Title>
                                    </Col>
                                    <Col>
                                    <Button
                                        className="custom-btn"
                                        icon={<PlusSquareOutlined />}
                                        size="middle"
                                        onClick={showModalCreate}
                                    >
                                        เพิ่มข้อมูลพนักงาน
                                    </Button>
                                    </Col>
                                </Row>
                        </Col>
                        <Col xl={14}>
                            <Card>
                                <Row gutter={[0,8]}>
                                    <Col xl={2}>
                                    </Col>
                                    <Col xl={7}>
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
                                    <div style={{ minHeight: "63.8vh"}}>
                                        {paginatedEmployee.length > 0 ? (
                                        paginatedEmployee.map((emp) => (
                                            <Card 
                                                key={emp.ID}
                                                style={{ marginTop: 6}}
                                                onClick={() => setSelectedEmployee(Number(emp.ID))}
                                                className={`cursor-pointer ${selectedEmployee === emp.ID ? "card-selected" : ""}`}
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
                                                                        onClick: () => showModalUpdate( emp.ID || 0 ),
                                                                    },
                                                                    {
                                                                        label: "รีเซ็ตรหัสผ่าน",
                                                                        key: "2",
                                                                        icon: <KeyOutlined />,
                                                                        onClick: () => showModalResetPassword( emp.ID?.toString() || ""),
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
                                    </div>
                                </Col>
                                <Col xl={24} style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
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
                            <Card title={<span style={{ fontSize: 20, fontWeight: 'bold' }}>ข้อมูลพนักงานที่เลือก</span>} style={{ minHeight: "81vh"}}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <img src={selectedEmpData.Profile} className="profile" />
                                    <Text strong style={{ fontSize: 20 }}>
                                    {selectedEmpData.FirstName} {selectedEmpData.LastName}
                                    </Text>
                                </div>
                                <div style={{ marginTop: 24 }}>
                                    <p style={{ marginTop: 24 }}>
                                        <IdcardOutlined style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 16 }} >รหัสพนักงาน<br /></Text>
                                        <Text style={{ fontSize: 16 , marginLeft: 30}} >{selectedEmpData.EMPCode || "ไม่มีข้อมูลบัตรประชาชนในระบบ"}</Text>
                                    </p>
                                    <p style={{ marginTop: 24 }}>
                                        <PhoneOutlined style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 16 }} >เบอร์โทรติดต่อ<br /></Text>
                                        <Text style={{ fontSize: 16 , marginLeft: 30}} >{formatPhone(selectedEmpData.PhoneNumber || "") || "ไม้มีข้อมูลเบอร์โทรในระบบ"}</Text>
                                    </p>
                                    <p style={{ marginTop: 24 }}>
                                        <MailOutlined style={{ marginRight: 8 }} />
                                        <Text style={{ fontSize: 16 }} >ไอดี-ไลน์<br /></Text>
                                        <Text style={{ fontSize: 16 , marginLeft: 30}} >{selectedEmpData.Line || "ไม้มีข้อมูลไลน์ในระบบ"}</Text>
                                    </p>
                                    <p style={{ marginTop: 24 }}>
                                        <DollarCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                                        <Text style={{ fontSize: 16 }} >ธนาคาร<br /></Text>
                                        <Text style={{ fontSize: 16 , marginLeft: 30}} >{selectedEmpData.BankType?.BankTypeName}</Text>
                                    </p>
                                    <p style={{ marginTop: -15  }}>
                                        <Text style={{ fontSize: 16 , marginLeft: 30}} >{"เลขบัญชี"} <span style={{ marginLeft: 8 }}></span>{selectedEmpData.BankAccountNumber}</Text>
                                    </p>
                                </div>
                            </Card>
                            )}
                        </Col>
                    </Row>
                </Card>
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
                                onChange={(value) => {
                                    generateEmployeeCode(value); 
                                }}
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
                                        message: "กรุณาเลือกประเภทการเงิน!",
                                    },
                                ]}
                                >
                                <Select
                                placeholder="เลือกประเภทการเงิน"
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
                    </Row>
                    <Row>
                        <Col span={24} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Button 
                                type="primary"
                                htmlType="submit"
                                className="confirm-button"
                                loading={isSubmitting}
                                disabled={isSubmitting}
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
                                onChange={(value) => {
                                    generateEmployeeCode(value);
                                    setLogic(true);
                                }}
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
                                        message: "กรุณาเลือกประเภทการเงิน!",
                                    },
                                ]}
                                >
                                <Select
                                placeholder="เลือกประเภทการเงิน"
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
                                loading={isSubmittingResetPassword}
                                disabled={isSubmittingResetPassword }
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