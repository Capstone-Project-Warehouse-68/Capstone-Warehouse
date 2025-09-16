const apiUrl = "/api";

function getAuthHeaders() {
  const Authorization = localStorage.getItem("token");
  const Bearer = localStorage.getItem("token_type");
  return {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  };
}

async function GetDashboardSummary(year: string, month?: string) {
  try {
    const params = new URLSearchParams({ year });
    if (month) params.append("month", month);

    const response = await fetch(`${apiUrl}/GetDashboardSummary?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Unknown error");

    return data;
  } catch (error: any) {
    console.error("Error fetching GetDashboardSummary:", error);
    return { month_total: 0, year_total: 0, error: error.message };
  }
}

async function GetDashboardSupplier(year: string, month?: string) {
  try {
    const params = new URLSearchParams({ year });
    if (month) params.append("month", month);

    const response = await fetch(`${apiUrl}/GetDashboardSupplier?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Unknown error");

    return data;
  } catch (error: any) {
    console.error("Error fetching GetDashboardSupplier:", error);
    return [];
  }
}

async function GetDashboardTrend(year: string) {
  try {
    const response = await fetch(`${apiUrl}/GetDashboardTrend?year=${year}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Unknown error");

    return data;
  } catch (error: any) {
    console.error("Error fetching GetDashboardTrend:", error);
    return [];
  }
}


export{
    GetDashboardSummary,
    GetDashboardSupplier,
    GetDashboardTrend
}