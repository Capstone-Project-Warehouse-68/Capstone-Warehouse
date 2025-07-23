import { Form, Input, message} from "antd";
// import { SignInStudent, SignInAdmin, SignInLecturer } from "../../../services/https";
// import { SignInStudentInterface } from "../../../interfaces/SignInStudent";
// import { SignInAdminInterface } from "../../../interfaces/SignInAdmin";
// import { SignInLecturerInterface } from "../../../interfaces/SignInLecturer";



function SignInPages() {

  const [messageApi, contextHolder] = message.useMessage();

//   const onFinish = async (values: { email: string; password: string }) => {
//     const { email, password } = values;

//     try {
//       if (email.endsWith("g.sut.ac.th")) {
//         // Use SignInAdmin for g.sut.ac.th emails
//         // const adminValues: SignInAdminInterface = { email, password };
//         // const res = await SignInAdmin(adminValues);

//         if (res.status === 200) {
//           messageApi.success("Admin sign-in successful");
//           localStorage.setItem("isLogin", "true");
//           localStorage.setItem("page", "admin-dashboard");
//           localStorage.setItem("token_type", res.data.token_type);
//           localStorage.setItem("token", res.data.token);
//           localStorage.setItem("profile", res.data.profile);
//           localStorage.setItem("id", res.data.id);
//           localStorage.setItem("role", "admin");

//           setTimeout(() => {
//             location.href = "/dashboard";
//           }, 2000);
//         } else {
//           messageApi.error(res.data.error);
//         }
//       } else if (email.endsWith("smail.com")) {
//         // Use SignIn for gmail.com emails
//         const userValues: SignInStudentInterface = { email, password };
//         const res = await SignInStudent(userValues);

//         if (res.status === 200) {
//           messageApi.success("User sign-in successful");
//           localStorage.setItem("isLogin", "true");
//           localStorage.setItem("page", "dashboard");
//           localStorage.setItem("token_type", res.data.token_type);
//           localStorage.setItem("token", res.data.token);
//           localStorage.setItem("profile", res.data.profile);
//           localStorage.setItem("id", res.data.id);
//           localStorage.setItem("role", "student");

//           setTimeout(() => {
//             location.href = "/dashboard";
//           }, 2000);
//         } else {
//           messageApi.error(res.data.error);
//         }
//       } else if (email.endsWith("gmail.com")) {
//         // Use SignIn for gmail.com emails
//         const lacturerValues: SignInLecturerInterface = { email, password };
//         const res = await SignInLecturer(lacturerValues);

//         if (res.status === 200) {
//           messageApi.success("Lecturer sign-in successful");
//           localStorage.setItem("isLogin", "true");
//           localStorage.setItem("page", "dashboard");
//           localStorage.setItem("token_type", res.data.token_type);
//           localStorage.setItem("token", res.data.token);
//           localStorage.setItem("id", res.data.id);
//           localStorage.setItem("profile", res.data.profile);
//           localStorage.setItem("role", "lecturer");

//           setTimeout(() => {
//             location.href = "/dashboard";
//           }, 2000);
//         } else {
//           messageApi.error(res.data.error);
//         }
//       } else {
//         messageApi.error("Unsupported email domain.");
//       }
//     } catch {
//       messageApi.error("Sign-in failed. Please try again.");
//     }
//   };

  return (
    <>
    {contextHolder}
    <div className="container">
      <div className="left">
        <div className="header">
          <h2 className="animation a1">Welcome To NEXT SUT</h2>
          <h4 className="animation a2">Log in to your account using email and password</h4>
        </div>
        <div className="form">
        <Form
              name="basic"
            //   onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
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
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item>

                <button className="button-login" type="submit" >
                  <span>LOG IN</span>
                </button>
              </Form.Item>
            </Form>
        </div>
      </div>
      <div className="right"></div>
    </div>
  </>
  );
}

export default SignInPages;