import type { MultiOrderBillInput } from "../../../interfaces/OderProduct";

const apiUrl = "/api";

function getAuthHeaders() {
  const Authorization = localStorage.getItem("token");
  const Bearer = localStorage.getItem("token_type");
  return {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  };
}

async function GetProductPDF() {
  try {
    const response = await fetch(`${apiUrl}/GetProductPDF`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      return {
        status: response.status,
        error: data.error || "Unknown error occurred",
      };
    }
  } catch (error: any) {
    console.error("Error fetching GetProductPDF:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}

async function AddOrderBillWithProducts(data: MultiOrderBillInput) {
  try {
    const response = await fetch(`${apiUrl}/AddOrderBillWithProducts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      return result;
    } else {
      return {
        status: response.status,
        error: result.error || "Unknown error occurred",
      };
    }
  } catch (error: any) {
    console.error("Error Add Order Bill With Products:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}

async function GetAllOrderBills() {
  try {
    const response = await fetch(`${apiUrl}/GetAllOrderBills`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      return {
        status: response.status,
        error: data.error || "Unknown error occurred",
      };
    }
  } catch (error: any) {
    console.error("Error fetching GetAllOrderBills:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}

async function DeleteOrderBill(id: number) {
  try {
    const response = await fetch(`${apiUrl}/DeleteOrderBill/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const { message, error } = await response.json();
    if (response.ok) {
      return { message };
    } else {
      return {
        status: response.status,
        error: error || "Unknown error occurred",
      };
    }
  } catch (error: any) {
    console.error("Error fetching DeleteOrderBill:", error);
    return { error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" };
  }
}
export { GetProductPDF, AddOrderBillWithProducts, GetAllOrderBills, DeleteOrderBill};
