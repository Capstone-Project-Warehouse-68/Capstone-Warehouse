import axios from "axios";
import type { LoginInterface } from "../../interfaces/Login";
import type { EmployeeInterface } from "../../interfaces/Employee";
import type { ResetPasswordInterface } from "../../interfaces/ResetPassword";
import type { NumberRoleInterface } from "../../interfaces/Number";
import type { UnitPerQuantityInterface } from "../../interfaces/UnitPerQuantity";
import type { BankTypeInterface } from "../../interfaces/BankType";
import type { SupplyInterface } from "../../interfaces/Supply";
import type { CategoryInterface } from "../../interfaces/Category";
import type { BillInterface } from "../../interfaces/Bill";
import type { ZoneInterface } from "../../interfaces/Zone";
import type { ShelfInterface } from "../../interfaces/Shelf";

const apiUrl = "/api";
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

async function ResetPassword(
  employeeID: string,
  payload: ResetPasswordInterface
) {
  return await axios
    .patch(
      `${apiUrl}/Employee/${employeeID}/EmergencyResetPassword`,
      payload,
      requestOptions
    )
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetNumberRole() {
  return await axios
    .get(`${apiUrl}/GetNumberRole`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateNumberRole(id: number, data: NumberRoleInterface) {
  return await axios
    .patch(`${apiUrl}/UpdateNumberRole/${id}`, data, requestOptions)
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

async function CreateUnitOfQuantity(data: UnitPerQuantityInterface) {
  return await axios
    .post(`${apiUrl}/createunitquantity`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateBank(data: BankTypeInterface) {
  return await axios
    .post(`${apiUrl}/createbanktype`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetBankTypes() {
  return await axios
    .get(`${apiUrl}/getBankType`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateBankType(id: number, data: BankTypeInterface) {
  return await axios
    .patch(`${apiUrl}/updateBank/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateSupplys(data: SupplyInterface) {
  return await axios
    .post(`${apiUrl}/CreateSupply`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateSupply(id: number, data: SupplyInterface) {
  return await axios
    .patch(`${apiUrl}/UpdateSupply/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteSupply(id: number) {
  return await axios
    .delete(`${apiUrl}/DeleteSupply/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateCategory(data: CategoryInterface) {
  return await axios
    .post(`${apiUrl}/CreateCategory`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateCategory(id: number, data: CategoryInterface) {
  return await axios
    .patch(`${apiUrl}/UpdateCategory/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateUnitPerQuantity(
  id: number,
  data: UnitPerQuantityInterface
) {
  return await axios
    .patch(`${apiUrl}/updateUnitPerQuantity/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetBillAllDataById(id: number) {
  return await axios
    .get(`${apiUrl}/getbillalldata/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateBillWithProduct(id: number, data: BillInterface) {
  return await axios
    .patch(`${apiUrl}/Updatebillwithproduct/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetBillDeleted() {
  return await axios
    .get(`${apiUrl}/getBillDeleted`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function RestoreBills(ids: number[]) {
  return await axios
    .patch(`${apiUrl}/restoreBill`, { bill_ids: ids }, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateZone(data: ZoneInterface) {
  return await axios
    .post(`${apiUrl}/CreateZone`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function UpdateZone(id: number, data: ZoneInterface) {
  return await axios
    .patch(`${apiUrl}/UpdateZone/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateShelf(data: ShelfInterface) {
  return await axios
    .post(`${apiUrl}/CreateShelf`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateShelf(id: number, data: ShelfInterface) {
  return await axios
    .patch(`${apiUrl}/UpdateShelf/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function DownloadTemplateFile() {
  try {
    const response = await axios.get(`${apiUrl}/download-template`, {
      ...requestOptions,
      responseType: "blob",
    });

    // สร้าง blob URL
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Format_file_DataImport.xlsx"); // ชื่อไฟล์ที่จะบันทึก
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Download failed:", err);
  }
}

async function GetProductOfBillsByProductID(id: number) {
  return await axios
    .get(`${apiUrl}/getproductofbillbyid/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function UpdateProduct(id: number, data: any) {
  return await axios
    .patch(`${apiUrl}/updateproduct/${id}`, data, requestOptions)
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
  ResetPassword,
  GetNumberRole,
  UpdateNumberRole,
  GetAllBills,
  GetUnitPerQuantity,
  GetCategory,
  GetZone,
  GetShelf,
  GetShelfByZoneID,
  CreateBillwithProduct,
  GetSupply,
  DeleteBill,
  CreateUnitOfQuantity,
  CreateBank,
  UpdateBankType,
  CreateSupplys,
  UpdateSupply,
  DeleteSupply,
  UpdateCategory,
  CreateCategory,
  UpdateUnitPerQuantity,
  GetBillAllDataById,
  UpdateBillWithProduct,
  GetBillDeleted,
  RestoreBills,
  DownloadTemplateFile,
  CreateZone,
  UpdateZone,
  CreateShelf,
  UpdateShelf,
  GetProductOfBillsByProductID,
  UpdateProduct,
};
