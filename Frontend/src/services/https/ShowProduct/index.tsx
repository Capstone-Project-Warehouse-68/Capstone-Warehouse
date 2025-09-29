const apiUrl = "/api";


function getAuthHeaders() {
    const Authorization = localStorage.getItem("token");
    const Bearer = localStorage.getItem("token_type");
  return {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  };
}

async function GetSupplySelect() {
  try {
    const response = await fetch(`${apiUrl}/GetSupply`, {
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
    console.error("Error fetching SupplySelect:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}

async function GetProductsforShowlist() {
  try {
    const response = await fetch(`${apiUrl}/GetProductsforShowlist`, {
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
    console.error("Error fetching GetProductsforShowlist:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}

export {
    GetSupplySelect,
    GetProductsforShowlist ,
}