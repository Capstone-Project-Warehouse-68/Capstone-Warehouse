import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "../../App.css";
import { Breadcrumb, Layout, theme } from "antd";
import SignInPages from "../../pages/authentication/Login";

import SiderOwner from "../SiderOwner";
import ImportProduct from "../../pages/ImportProduct/importproduct";
import CreateSupplyer from "../../pages/CreateSupplyer/CreateSupplyer";
import CreateUnitQuantity from "../../pages/CreateUnitQuantity/CreateUnitQuantity";
import CreateBankType from "../../pages/CreateBankType/CreateBanktype";
import RestoreBill from "../../pages/RestoreBill/RestoreBill";


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
    console.log(Role);

    return (
        <>
            <Layout style={{ minHeight: "100vh", backgroundColor: "#ffffffff", marginTop: 0 }}>
                {checkLogin && <SiderOwner />}
                <Layout style={{ backgroundColor: "#D4D4D4", minHeight: "100vh", marginTop: 0 }}>
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
                            </Routes>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
};

export default FullLayout;