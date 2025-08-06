import axios from "axios";
import type { LoginInterface } from "../../interfaces/Login";
import type { EmployeeInterface } from "../../interfaces/Employee";
import type { ChangePasswordInterface } from "../../interfaces/ChangePassword";
import type { ResetPasswordInterface } from "../../interfaces/ResetPassword";

const apiUrl = "http://localhost:8000";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {
    headers: {
        "Content-Type": "application/json",
        Authorization: `${Bearer} ${Authorization}`,
    },

};

async function SignIn(data: LoginInterface) {
  return await axios
    .post(`${apiUrl}/signin`, data)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateEmployee(data: EmployeeInterface) {
  return await axios
    .post(`${apiUrl}/CreateEmployee`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateEmployee(id: number, data: EmployeeInterface) {
  return await axios
    .patch(`${apiUrl}/UpdateEmployee/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteEmployeeByID(id: number) {
  return await axios
    .delete(`${apiUrl}/DeleteEmployee/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetAllEmployees() {
  return await axios
    .get(`${apiUrl}/GetAllEmployees`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetEmployeeById(id: number) {
  return await axios
    .get(`${apiUrl}/GetEmployeeById/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetRoles() {
  return await axios
    .get(`${apiUrl}/GetRoles`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetBankTypes() {
  return await axios
    .get(`${apiUrl}/GetBankTypes`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CheckEmail(email: string) {
  return await axios
    .post(`${apiUrl}/CheckEmail/${email}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CheckPhone(phoneNumber: string) {
  return await axios
    .post(`${apiUrl}/CheckPhone/${phoneNumber}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CheckNationalID(nationalID: string) {
  return await axios
    .post(`${apiUrl}/CheckNationalID/${nationalID}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function ChangePassword(
  employeeID: string,
  payload: ChangePasswordInterface
) {
  return await axios
    .patch(
      `${apiUrl}/employee/${employeeID}/changePasswordEmployee`,
      payload,
      requestOptions
    )
    .then((res) => res)
    .catch((e) => e.response);
}

async function ResetPassword(
  employeeID: string,
  payload: ResetPasswordInterface
) {
  return await axios
    .patch(
      `${apiUrl}/employee/${employeeID}/resetPasswordEmployee`,
      payload,
      requestOptions
    )
    .then((res) => res)
    .catch((e) => e.response);
}

export {
    SignIn,
    CreateEmployee,
    UpdateEmployee,
    DeleteEmployeeByID,
    GetAllEmployees,
    GetEmployeeById,
    GetBankTypes,
    GetRoles,
    CheckEmail,
    CheckPhone,
    CheckNationalID,
    ChangePassword,
    ResetPassword,
};
