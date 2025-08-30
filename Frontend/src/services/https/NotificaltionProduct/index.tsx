import axios from "axios";
// import type { NotificationProduct } from "../../../interfaces/NotificationProduct";
import type {UpdateNotificationProduct } from "../../../interfaces/NotificationProduct";


const apiUrl = "http://localhost/api";


function getAuthHeaders() {
    const Authorization = localStorage.getItem("token");
    const Bearer = localStorage.getItem("token_type");
  return {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  };
}

async function GetLimitQuantity() {
  try {
    const response = await fetch(`${apiUrl}/GetLimitQuantity`, {
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
    console.error("Error fetching GetLimitQuantity:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}
async function GetCategory() {
  try {
    const response = await fetch(`${apiUrl}/GetCategoryApi`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (response.ok) {
      return data; 
    }else {
      return {
        status: response.status,
        error: data.error || "Unknown error occurred",
      };
    }
    }catch (error: any) {
    console.error("Error fetching GetCategory:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}

async function UpdateLimitQuantity(data: UpdateNotificationProduct) {
  try {
    const response = await fetch(`${apiUrl}/UpdateLimitQuantity`, {
      method: "PATCH",
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
    console.error("Error updating limit quantity:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}
async function GetNotificationProducts() {
    try {
    const response = await fetch(`${apiUrl}/notifications`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const result = await response.json();

    if (response.ok) {
      return result;
    } else {
      return {
        status: response.status,
        error: result.error || "เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งเตือน",
      };
    }
  } catch (error: any) {
    console.error("Error fetching notification products:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}


export {
    GetLimitQuantity, 
    GetCategory,  
    UpdateLimitQuantity,
    GetNotificationProducts,
};