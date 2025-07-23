import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "../../App.css";
import { Breadcrumb, Layout, theme } from "antd";
import SignInPages from "../../pages/authentication/Login";

import SiderOwner from "../SiderOwner";


const { Header, Content } = Layout;

const FullLayout: React.FC = () => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    //   const location = useLocation();
    //   const [checkLogin, setCheckLogin] = useState(false);

    //   useEffect(() => {
    //     setCheckLogin(location.pathname !== "/");
    //   }, [location.pathname]);

    //   const Role = localStorage.getItem("role") || "";

    return (
        <>
            <Layout style={{ minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
                <SiderOwner />
                {/* {checkLogin && (Role === "admin" ? <NavbarHome /> : Role === "student" ? <NavbarStudent/> : <NavbarLecturer/>)} */}
                <Layout style={{ backgroundColor: "#f7f8fc", minHeight: "100vh" }}>
                    <Header style={{ padding: 0, background: colorBgContainer, maxHeight: "0vh" }} />
                    <Content style={{ marginTop: "0px" }}>
                        <Breadcrumb style={{ marginTop: "0px" }} />
                        <div>
                            <Routes>
                                <Route path="/" element={<SignInPages />} />
                            </Routes>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </>
    );
};

export default FullLayout;