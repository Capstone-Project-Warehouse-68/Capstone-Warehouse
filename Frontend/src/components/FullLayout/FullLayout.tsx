import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "../../App.css";
import { Breadcrumb, Layout, theme } from "antd";
import SignInPages from "../../pages/authentication/Login";
import Employee from "../../pages/Employee/employee";

import SiderOwner from "../SiderOwner";
import ImportProduct from "../../pages/ImportProduct/importproduct";
import CreateSupplyer from "../../pages/CreateSupplyer/CreateSupplyer";
import CreateUnitQuantity from "../../pages/CreateUnitQuantity/CreateUnitQuantity";
import CreateBankType from "../../pages/CreateBankType/CreateBanktype";
import RestoreBill from "../../pages/RestoreBill/RestoreBill";
import NotificationProduct from "../../pages/NotificationProduct/notificationproduct";
import ProductList from "../../pages/ShowProduct";
import OrderCreate from "../../pages/CreateListProductPDF/index";
import HistoryPdf from "../../pages/CreateListProductPDF/History/HistoryPdf";
import Dashboard from "../../pages/Dashboard";
import CreateZoneShelf from "../../pages/ZoneShelf/CreateZoneShelf";
import SiderManager from "../SiderManager";
import PrivateRoute from "../../routes/PrivateRoutes";
import Sider from "../Sider";

const { Content } = Layout;

const FullLayout: React.FC = () => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    const location = useLocation();
    const [checkLogin, setCheckLogin] = useState(false);

    useEffect(() => {
        const isLogin = localStorage.getItem("isLogin") === "true";
        const notLoginPage = location.pathname !== "/";
        setCheckLogin(isLogin && notLoginPage);
    }, [location.pathname]);


    const Role = localStorage.getItem("role") || "";
    const ID = localStorage.getItem("employeeID") || "";
    console.log(Role);
    console.log("EMP ID : ", ID);

    return (
        <>
            <Layout style={{ minHeight: "100vh", backgroundColor: colorBgContainer, marginTop: 0 }}>
                {checkLogin &&
                    (Role === "1" ? <SiderOwner /> : Role === "2" ? <SiderManager /> : <Sider />)}
                <Layout style={{ backgroundColor: "#adadadff", minHeight: "100vh", marginTop: 0 }}>
                    <Content style={{ marginTop: "0px" }}>
                        <Breadcrumb />
                        <div>
                            <Routes>
                                <Route path="/" element={<SignInPages />} />
                                <Route path="/importproduct" element={<PrivateRoute element={<ImportProduct />} allowedRoles={["1", "2", "3"]} />} />
                                <Route path="/createsupplyer" element={<PrivateRoute element={<CreateSupplyer />} allowedRoles={["1", "2", "3"]} />} />
                                <Route path="/createunitquantity" element={<PrivateRoute element={<CreateUnitQuantity />} allowedRoles={["1", "2"]} />} />
                                <Route path="/createbanktype" element={<PrivateRoute element={<CreateBankType />} allowedRoles={["1", "2", "3"]} />} />
                                <Route path="/restorebill" element={<PrivateRoute element={<RestoreBill />} allowedRoles={["1"]} />} />
                                <Route path="/manageemployee" element={<PrivateRoute element={<Employee />} allowedRoles={["1"]} />}/>
                                <Route path="/notificationproduct" element={<PrivateRoute element={<NotificationProduct />} allowedRoles={["1"]} />} />
                                <Route path="/productList" element={<PrivateRoute element={<ProductList />} allowedRoles={["1", "2", "3"]} />} />
                                <Route path="/createlistproduct" element={<PrivateRoute element={<OrderCreate />} allowedRoles={["1"]} />} />
                                <Route path="/historylistproduct" element={<PrivateRoute element={<HistoryPdf />} allowedRoles={["1"]} />} />
                                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} allowedRoles={["1"]} />} />
                                <Route path="/createzoneshelf" element={<PrivateRoute element={<CreateZoneShelf />} allowedRoles={["1", "2"]} />} />
                            </Routes>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
};

export default FullLayout;