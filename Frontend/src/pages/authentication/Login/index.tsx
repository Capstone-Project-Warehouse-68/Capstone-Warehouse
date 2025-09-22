import { Form, Input, message, Card, Button } from "antd";
import { useRef, useState } from "react";
import "./index.css";
import type { LoginInterface } from "../../../interfaces/Login";
import { SignIn } from "../../../services/https";

import truckLogo from "../../../assets/icons8-delivery-truck-96.png";
import warehouseIllustration from "../../../assets/warehouseAi.png";

function SignInPages() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms)); // helper

  const onFinish = async (values: { email: string; password: string }) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    const { email, password } = values;

    try {
      const LoginValue: LoginInterface = { email, password };
      const res = await SignIn(LoginValue);
      console.log("Login Submit Called", LoginValue);

      if (res.status === 200) {
        messageApi.open({
          type: "success",
          content: "Sign-in successful",
          duration: 1,
        });

        localStorage.setItem("isLogin", "true");
        localStorage.setItem("token_type", res.data.token_type);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("employeeID", res.data.id);
        localStorage.setItem("role", res.data.role);

        await delay(1000);
        location.href = "/dashboard";
      } else {
        messageApi.error(res.data.error);
      }
    } catch {
      messageApi.error("Sign-in failed. Please try again.");
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="login-container">
        <Card className="login-card">
          {/* โลโก้ + Illustration */}
          <div className="login-header">
            {/* <img src={warehouseLogo} alt="Warehouse Logo" className="login-logo" /> */}
            <img
              src={warehouseIllustration}
              alt="Warehouse Illustration"
              className="login-illustration"
            />
          </div>

          <h2 className="login-title"><img src={truckLogo} width={49} height={49}/> ระบบคลังอะไหล่สินค้า</h2>
          <p className="login-subtitle">
            ล็อกอินเพื่อเข้าใช้งานระบบ
          </p>

          <Form
            name="basic"
            autoComplete="on"
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input size="large" placeholder="กรอก email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password size="large" placeholder="กรอกรหัสผ่าน" />
            </Form.Item>

            <Form.Item>
              <Button
                className="button-login"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                LOG IN
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}

export default SignInPages;
