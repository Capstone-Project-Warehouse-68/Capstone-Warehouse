import { useState, useEffect } from "react";
import { Layout, Menu, message, Button } from "antd";
const { SubMenu } = Menu;
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import HistoryIcon from '@mui/icons-material/History';
import PostAddIcon from '@mui/icons-material/PostAdd';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from "react-router-dom";
import { GetEmployeeById } from "../services/https";
import type { EmployeeInterface } from "../interfaces/Employee";
import './Sider.css'

function SiderOwner() {
  const page = localStorage.getItem("page");
  const { Sider } = Layout;
  const [messageApi, contextHolder] = message.useMessage();
  const [collapsed, setCollapsed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [positionName, setPositionName] = useState("");
  const [profile, setProfile] = useState("");

  const employeeID = localStorage.getItem("id");

  const getEmployeeById = async () => {

    try {
      const res = await GetEmployeeById(Number(employeeID || 0));
      if (res.status === 200) {
        const employee: EmployeeInterface = res.data;
        setFirstName(employee.FirstName || "");
        setLastName(employee.LastName || "");
        setProfile(employee.Profile || "");
        setPositionName(employee.Role?.RoleName || "Unknown Position");
      } else {
        messageApi.error(res.data.error || "ไม่สามารถดึงข้อมูลได้");
        setPositionName("Unknown Position");
      }
    } catch (error) {
      messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setPositionName("Unknown Position");
    }
  };

  //   const getPositionNameById = async (positionID: number) => {
  //     try {
  //       const res = await GetPositions();
  //       if (res.status === 200) {
  //         const positions: PositionInterface[] = res.data;
  //         const position = positions.find((pos) => pos.ID === positionID);
  //         if (position) {
  //           setPositionName(position.Name || "Unknown Position");
  //         } else {
  //           setPositionName("Unknown Position");
  //         }
  //       } else {
  //         messageApi.error(res.data.error || "ไม่สามารถดึงตำแหน่งได้");
  //       }
  //     } catch (error) {
  //       messageApi.error("เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง");
  //     }
  //   };

  useEffect(() => {
    getEmployeeById();
  }, []);

  const setCurrentPage = (val: string) => {
    localStorage.setItem("page", val);
  };

  const Logout = () => {
    localStorage.clear();
    messageApi.success("Logout successful");
    setTimeout(() => {
      location.href = "/";
    }, 2000);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      {contextHolder}
      <Sider collapsed={collapsed} className="custom-sider" width={window.innerWidth * 0.17}
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
            <Button onClick={toggleCollapsed} className="toggle-button">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>

            <div className="profile-container">
              <img
                src={profile}
                alt="Profile"
                className={`profile-image ${collapsed ? "small" : "large"}`}
                style={{
                  width: collapsed ? "50px" : "100px",
                  height: collapsed ? "50px" : "100px",
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
              defaultSelectedKeys={[page ? page : "dashboard"]}
              mode="inline"
              inlineCollapsed={collapsed}
            >
              <Menu.Item
                key="dashboard"
                icon={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <SpaceDashboardIcon style={{ fontSize: 26 }} />
                  </div>
                }
                onClick={() => setCurrentPage("dashboard")}
              >
                <Link to="/dashboard" style={{ fontSize: 16 }}>แดชบอร์ด</Link>
              </Menu.Item>

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
                onClick={() => setCurrentPage("listproduct")}
              >
                <Link to="/listproduct" style={{ fontSize: 16 }}>แสดงรายการสินค้า</Link>
              </Menu.Item>

              <SubMenu
                key="sub"
                icon={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <AddShoppingCartIcon style={{ fontSize: 26 }} />
                  </div>
                }
                title="สร้างรายการสั่งซื้อสินค้า"
              >
                <Menu.Item key="1" icon={<NoteAddIcon />}>
                  <Link to="/createlistproduct" style={{ fontSize: 14 }}>สร้างรายการสั่งซื้อสินค้า</Link>
                </Menu.Item>
                <Menu.Item key="2" icon={<HistoryIcon />}>
                  <Link to="/historylistproduct" style={{ fontSize: 14 }}>ประวัติรายการสั่งซื้อสินค้า</Link>
                </Menu.Item>
              </SubMenu>

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
                title="สร้างข้อมูลสินค้า"
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

              <Menu.Item
                key="restorebill"
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
                onClick={() => setCurrentPage("restorebill")}
              >
                <Link to="/restorebill" style={{ fontSize: 16 }}>ประวัติการลบใบสั่งซื้อ</Link>
              </Menu.Item>

              <Menu.Item
                key="notificationproduct"
                icon={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <NotificationImportantIcon style={{ fontSize: 26 }} />
                  </div>
                }
                onClick={() => setCurrentPage("notificationproduct")}
              >
                <Link to="/notificationproduct" style={{ fontSize: 16 }}>การแจ้งเตือนสินค้าต่ำ</Link>
              </Menu.Item>

              <Menu.Item
                key="manageemployee"
                icon={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <ManageAccountsIcon style={{ fontSize: 26 }} />
                  </div>
                }
                onClick={() => setCurrentPage("manageemployee")}
              >
                <Link to="/manageemployee" style={{ fontSize: 16 }}>จัดการสมาชิก</Link>
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
                <LogoutIcon style={{ fontSize: 26 }} />
              </div>
            } onClick={Logout}>
              <span style={{ fontSize: 16 }}>ออกจากระบบ </span>
            </Menu.Item>
          </Menu>
        </div>
      </Sider>
    </>
  );
}

export default SiderOwner;