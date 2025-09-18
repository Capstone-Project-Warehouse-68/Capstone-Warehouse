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
    console.log("EMP ID : ",ID);

    return (
        <>
            <Layout style={{ minHeight: "100vh", backgroundColor: "#ffffffff", marginTop: 0 }}>
                {checkLogin && <SiderOwner />}
                <Layout style={{ backgroundColor: "#adadadff", minHeight: "100vh", marginTop: 0 }}>
                    <Content style={{ marginTop: "0px" }}>
                        <Breadcrumb />
                        <div>
                            <Routes>
                                <Route path="/" element={<SignInPages />} />
                                <Route path="/importproduct" element={<ImportProduct />}/>
                                <Route path="/createsupplyer" element={<CreateSupplyer />}/>
                                <Route path="/createunitquantity" element={<CreateUnitQuantity />}/>
                                <Route path="/createbanktype" element={<CreateBankType />}/>
                                <Route path="/restorebill" element={<RestoreBill />}/>
                                <Route path="/manageemployee" element={<Employee />} />
                                <Route path="/notificationproduct" element={<NotificationProduct />} />
                                <Route path="/productList" element={<ProductList />} />
                                <Route path="/createlistproduct" element={<OrderCreate />} />
                                <Route path="/historylistproduct" element={<HistoryPdf />} />
                                <Route path="/dashboard" element={<Dashboard/>}/>
                            </Routes>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
};

export default FullLayout;