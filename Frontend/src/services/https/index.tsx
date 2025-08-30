import axios from "axios";
import type { LoginInterface } from "../../interfaces/Login";
import type { EmployeeInterface } from "../../interfaces/Employee";

const apiUrl = "http://localhost/api";
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

async function GetAllBills() {
  return await axios
    .get(`${apiUrl}/getAllBill`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetUnitPerQuantity() {
  return await axios
    .get(`${apiUrl}/Getunitperquantity`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetCategory() {
  return await axios
    .get(`${apiUrl}/GetCategory`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetZone() {
  return await axios
    .get(`${apiUrl}/Getzone`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetShelf() {
  return await axios
    .get(`${apiUrl}/Getshelf`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetSupply() {
  return await axios
    .get(`${apiUrl}/GetSupply`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetShelfByZoneID(id: number) {
  return await axios
    .get(`${apiUrl}/GetshelfByzone/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateBillwithProduct(data: any) {
  return await axios
    .post(`${apiUrl}/CreateProductWithBill`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteBill(id: number) {
  return await axios
    .delete(`${apiUrl}/deletebillwithproduct/${id}`, requestOptions)
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
    GetAllBills,
    GetUnitPerQuantity,
    GetCategory,
    GetZone,
    GetShelf,
    GetShelfByZoneID,
    CreateBillwithProduct,
    GetSupply,
    DeleteBill,
};