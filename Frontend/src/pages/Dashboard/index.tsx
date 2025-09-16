import {
  Card,
  Table,
  Statistic,
  Row,
  Col,
  DatePicker,
  ConfigProvider,
  message,
  Empty,
  Spin,
} from "antd";
import thTH from "antd/lib/locale/th_TH";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState, useCallback, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  GetDashboardSummary,
  GetDashboardSupplier,
  GetDashboardTrend,
} from "../../services/https/Dashborad";

interface DashboardSummary {
  month_total: number;
  year_total: number;
}
interface DashboardSupplier {
  supply_name: string;
  total: number;
}
interface DashboardTrend {
  month: string;
  total: number;
}

export default function Dashboard() {
  const now = dayjs();
  const [year, setYear] = useState<Dayjs>(now);
  const [month, setMonth] = useState<Dayjs>(now);

  const [summary, setSummary] = useState<DashboardSummary>({
    month_total: 0,
    year_total: 0,
  });
  const [supplierData, setSupplierData] = useState<DashboardSupplier[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<DashboardTrend[]>([]);
  const [loading, setLoading] = useState(false);

  // Pie colors & Table columns
  const pieColors = useMemo(() => ["#1890ff", "#13c2c2", "#eb2f96"], []);
  const supplierColumns = useMemo(
    () => [
      { title: "Supplier", dataIndex: "supply_name" },
      { title: "ยอดรวม (บาท)", dataIndex: "total" },
    ],
    []
  );

  const monthLabelsTH = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  // แปลง monthlyTrend ให้เป็นเดือนภาษาไทย
  const monthlyTrendTH = useMemo(
    () =>
      monthlyTrend.map((item) => ({
        ...item,
        month: monthLabelsTH[Number(item.month) - 1] || item.month,
      })),
    [monthlyTrend]
  );

  // Fetch data
  const fetchData = useCallback(
    async (filterYear?: string, filterMonth?: string) => {
      try {
        setLoading(true);

        // ใช้ปี/เดือนที่เลือก หรือ state ปัจจุบัน
        const selectedYear = filterYear || year.year().toString();
        const selectedMonth =
          filterMonth || (month.month() + 1).toString().padStart(2, "0");

        let summaryRes: any = {};
        let supplierRes: DashboardSupplier[] = [];
        let trendRes: DashboardTrend[] = [];

        if (filterYear) {
          // เปลี่ยนปี -> update ทุกอย่าง: summary ปี+เดือน, supplier, monthlyTrend
          [summaryRes, supplierRes, trendRes] = await Promise.all([
            GetDashboardSummary(selectedYear, selectedMonth), // summary เดือน
            GetDashboardSupplier(selectedYear, selectedMonth), // pie + table เดือน
            GetDashboardTrend(selectedYear), // monthly trend ปี
          ]);

          setSummary(summaryRes);
          setSupplierData(Array.isArray(supplierRes) ? supplierRes : []);
          setMonthlyTrend(Array.isArray(trendRes) ? trendRes : []);
        } else if (filterMonth) {
          // เปลี่ยนเดือน -> update summary เดือน + supplier
          [summaryRes, supplierRes] = await Promise.all([
            GetDashboardSummary(selectedYear, selectedMonth),
            GetDashboardSupplier(selectedYear, selectedMonth),
          ]);

          setSummary((prev) => ({
            ...prev,
            month_total: summaryRes.month_total,
          }));
          setSupplierData(Array.isArray(supplierRes) ? supplierRes : []);
          // monthlyTrend ไม่เปลี่ยน
        } else {
          // โหลดครั้งแรก
          [summaryRes, supplierRes, trendRes] = await Promise.all([
            GetDashboardSummary(selectedYear, selectedMonth),
            GetDashboardSupplier(selectedYear, selectedMonth),
            GetDashboardTrend(selectedYear),
          ]);

          setSummary(summaryRes);
          setSupplierData(Array.isArray(supplierRes) ? supplierRes : []);
          setMonthlyTrend(Array.isArray(trendRes) ? trendRes : []);
        }
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        console.error(error);
        setSupplierData([]);
        setMonthlyTrend([]);
      } finally {
        setLoading(false);
      }
    },
    [year, month]
  );

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handler เปลี่ยนเดือน ---
  const handleMonthChange = useCallback(
    (date: Dayjs | null) => {
      if (date) {
        setMonth(date);
        fetchData(undefined, (date.month() + 1).toString().padStart(2, "0"));
      }
    },
    [fetchData]
  );

  // --- Handler เปลี่ยนปี ---
  const handleYearChange = useCallback(
    (date: Dayjs | null) => {
      if (date) {
        setYear(date);
        setMonth(date); // reset month ให้ตรงปีใหม่
        fetchData(date.year().toString());
      }
    },
    [fetchData]
  );

  return (
    <ConfigProvider locale={thTH}>
      <div
        style={{ padding: 24, backgroundColor: "#d9d9d9", minHeight: "100vh" }}
      >
        {/* Filter */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <DatePicker
              picker="year"
              value={year}
              onChange={handleYearChange}
              format="YYYY"
            />
          </Col>
          <Col>
            <DatePicker
              picker="month"
              value={month}
              onChange={handleMonthChange}
              format="MMMM"
            />
          </Col>
        </Row>

        {/* Summary */}
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title={`ยอดสั่งซื้อเดือน ${month.format("MMMM")}`}
                value={summary.month_total}
                suffix="บาท"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title={`ยอดสั่งซื้อปี ${year.year()}`}
                value={summary.year_total}
                suffix="บาท"
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={12}>
            <Card title={`ยอดซื้อรายเดือน ปี ${year.year()}`}>
              {loading ? (
                <Spin tip="กำลังโหลด..." />
              ) : monthlyTrend.length === 0 ? (
                <Empty description="ไม่มีข้อมูล" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyTrendTH}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="สัดส่วนตาม Supplier">
              {loading ? (
                <Spin tip="กำลังโหลด..." />
              ) : supplierData.length === 0 ? (
                <Empty description="ไม่มีข้อมูล" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={supplierData}
                      dataKey="total"
                      nameKey="supply_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {supplierData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Row style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="ตาราง Supplier">
              <Table
                dataSource={supplierData}
                columns={supplierColumns}
                pagination={false}
                rowKey="supply_name"
                locale={{ emptyText: <Empty description="ไม่มีข้อมูล" /> }}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
}
