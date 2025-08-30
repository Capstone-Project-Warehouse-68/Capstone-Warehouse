const apiUrl = "http://localhost/api";


function getAuthHeaders() {
    const Authorization = localStorage.getItem("token");
    const Bearer = localStorage.getItem("token_type");
  return {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  }}

async function GetProductPDF() {
  try {
    const response = await fetch(`${apiUrl}/GetProductPDF`, {
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
    console.error("Error fetching GetProductPDF:", error);
    return {
      error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
    };
  }
}


export {
    GetProductPDF
}