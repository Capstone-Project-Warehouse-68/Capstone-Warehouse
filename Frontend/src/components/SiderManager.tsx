import { useState, useEffect } from "react";
import { Layout, Menu, message } from "antd";
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    LoadingOutlined,
} from "@ant-design/icons";
const { SubMenu } = Menu;
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import PostAddIcon from '@mui/icons-material/PostAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShelvesIcon from '@mui/icons-material/Shelves';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { Link } from "react-router-dom";
import { GetEmployeeById } from "../services/https";
import type { EmployeeInterface } from "../interfaces/Employee";
import './Sider.css'

function SiderManager() {
    const page = localStorage.getItem("page");
    const { Sider } = Layout;
    const [messageApi, contextHolder] = message.useMessage();
    const [collapsed, setCollapsed] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [positionName, setPositionName] = useState("");
    const [profile, setProfile] = useState("");
    const [loading, setLoading] = useState(false);

    const employeeID = Number(localStorage.getItem("employeeID"));

    const getEmployeeById = async (id: number) => {
        try {
            const res = await GetEmployeeById(id);

            if (res.status === 200) {
                const employee: EmployeeInterface = res.data;
                setFirstName(employee.FirstName || "");
                setLastName(employee.LastName || "");
                setProfile(employee.Profile || "");
                setPositionName(employee.Role?.RoleName || "")
            } else {
                messageApi.error(res.data?.error || "ไม่สามารถดึงข้อมูลได้ ");
                setPositionName("Unknown Position");
            }
        } catch (error) {
            messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
            setPositionName("Unknown Position");
        }
    };
    useEffect(() => {
        getEmployeeById(Number(employeeID));
    }, []);

    const setCurrentPage = (val: string) => {
        localStorage.setItem("page", val);
    };

    const Logout = async () => {
        if (loading) return;
        setLoading(true);

        try {
            messageApi.success("Logout successful");
            await new Promise((resolve) => setTimeout(resolve, 1200));
            localStorage.clear();
            window.location.href = "/";
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    return (
        <>
            {contextHolder}
            <Sider
                collapsed={collapsed}
                className="custom-sider"
                width={Math.min(Math.max(window.innerWidth * 0.15, 200), 300)}
                collapsedWidth={120}
                style={{
                    height: "100vh",
                    overflowY: "auto",
                }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                    }}
                >
                    <div style={{ position: "relative" }}>
                        <Menu style={{ backgroundColor: "#8c8c8c" }} mode="inline" inlineCollapsed={collapsed}>
                            <Menu.Item
                                key="toggleMenuBottom"
                                icon={
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "100%",
                                        }}
                                    >
                                        {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 26, color: "black" }} /> : <MenuFoldOutlined style={{ fontSize: 26, color: "black" }} />}
                                    </div>
                                }
                                onClick={toggleCollapsed}
                                style={{
                                    color: "black",
                                    fontWeight: "bold",
                                    border: "none",
                                    borderRadius: "4px",
                                    margin: "4px",
                                }}
                                className="custom-toggle-button"
                            >
                                <span style={{ fontSize: 16, color: "black", fontWeight: "bold" }}>
                                    {collapsed ? "ขยายเมนู" : "ย่อเมนู"}
                                </span>
                            </Menu.Item>
                        </Menu>

                        <div className="profile-container">
                            <img
                                src={profile}
                                alt="Profile"
                                className={`profile-image ${collapsed ? "small" : "large"}`}
                                style={{
                                    width: collapsed ? "100px" : "100px",
                                    height: collapsed ? "100px" : "100px",
                                }}
                            />
                        </div>

                        <div className="profile-info">
                            <span style={{ fontSize: "large", color: "white" }}>
                                {firstName} {lastName}
                            </span>
                            <span style={{ fontSize: "default", color: "white" }}>
                                ({positionName})
                            </span>
                        </div>

                        <Menu
                            className="menu"
                            defaultSelectedKeys={[page ? page : "productList"]}
                            mode="inline"
                            inlineCollapsed={collapsed}
                        >

                            <Menu.Item
                                key="listproduct"
                                icon={
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "100%",
                                        }}
                                    >
                                        <FeaturedPlayListIcon style={{ fontSize: 26 }} />
                                    </div>
                                }
                                onClick={() => setCurrentPage("ProductList")}
                            >
                                <Link to="/productList" style={{ fontSize: 16 }}>แสดงรายการสินค้า</Link>
                            </Menu.Item>

                            <SubMenu
                                key="sub2"
                                icon={
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "100%",
                                        }}
                                    >
                                        <CreateNewFolderIcon style={{ fontSize: 26 }} />
                                    </div>
                                }
                                title={<span style={{ fontSize: 16 }}>สร้างข้อมูลสินค้า</span>}
                            >
                                <Menu.Item key="s1" icon={<AccountBalanceIcon />}>
                                    <Link to="/createbanktype " style={{ fontSize: 14 }}>สร้างข้อมูลธนาคาร</Link>
                                </Menu.Item>
                                <Menu.Item key="s2" icon={<AddBusinessIcon />}>
                                    <Link to="/createsupplyer" style={{ fontSize: 14 }}>สร้างข้อมูลบริษัทสั่งซื้อ</Link>
                                </Menu.Item>
                                <Menu.Item key="s3" icon={<InventoryIcon />}>
                                    <Link to="/createunitquantity" style={{ fontSize: 14 }}>สร้างประเภทและหน่วยสินค้า</Link>
                                </Menu.Item>
                                <Menu.Item key="s4" icon={<ShelvesIcon />}>
                                    <Link to="/createzoneshelf" style={{ fontSize: 14 }}>สร้างชั้นและชั้นสินค้า</Link>
                                </Menu.Item>
                            </SubMenu>

                            <Menu.Item
                                key="importproduct"
                                icon={
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "100%",
                                        }}
                                    >
                                        <PostAddIcon style={{ fontSize: 26 }} />
                                    </div>
                                }
                                onClick={() => setCurrentPage("importproduct")}
                            >
                                <Link to="/importproduct" style={{ fontSize: 16 }}>นำเข้าข้อมูลสินค้า</Link>
                            </Menu.Item>

                        </Menu>
                    </div>

                    <Menu style={{ backgroundColor: "#8c8c8c" }} mode="inline" inlineCollapsed={collapsed}>
                        <Menu.Item key="logout" icon={
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                {loading ? <LoadingOutlined spin /> : <LogoutIcon style={{ fontSize: 26 }} />}
                            </div>
                        } onClick={Logout} disabled={loading}>
                            <span style={{ fontSize: 16 }}>ออกจากระบบ </span>
                        </Menu.Item>
                    </Menu>
                </div>
            </Sider>
        </>
    );
}

export default SiderManager;