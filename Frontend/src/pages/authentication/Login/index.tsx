import { Form, Input, message, Card, Button } from "antd";
import { useRef, useState } from "react";
import "./index.css";
import type { LoginInterface } from "../../../interfaces/Login";
import { SignIn } from "../../../services/https";

function SignInPages() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms)); // helper

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
        localStorage.setItem("id", res.data.id);
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#1b41d8ff",
        }}
      >
        <Card>
          <h2 style={{ marginBottom: "1rem" }}>Welcome To Warehouse</h2>
          <h4 style={{ marginBottom: "2rem", color: "#777" }}>
            Log in to your account using email and password
          </h4>

          <Form
            name="basic"
            autoComplete="off"
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
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button
                className="button-login"
                htmlType="submit"
                loading={loading}
              >
                <span>LOG IN</span>
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}

export default SignInPages;
