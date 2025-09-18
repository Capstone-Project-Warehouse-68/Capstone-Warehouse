import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "../../App.css";
import { Breadcrumb, Layout, theme } from "antd";
import SignInPages from "../../pages/authentication/Login";
import Employee from "../../pages/Employee/employee";

import SiderOwner from "../SiderOwner";


const { Header, Content } = Layout;

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
                <Layout style={{ backgroundColor: "#adadadff", minHeight: "100vh", marginTop: 0 }}>
                    <Content style={{ marginTop: "0px" }}>
                        <Breadcrumb style={{ marginTop: "0px" }} />
                        <div>
                            <Routes>
                                <Route path="/" element={<SignInPages />} />
                                <Route path="/manageemployee" element={<Employee />} />
                            </Routes>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
};

export default FullLayout;