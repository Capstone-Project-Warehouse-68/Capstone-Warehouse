import axios from "axios";
import type { LoginInterface } from "../../interfaces/Login";
import type { EmployeeInterface } from "../../interfaces/Employee";

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
    .get(`${apiUrl}/GetEmployeeById`, requestOptions)
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
};
