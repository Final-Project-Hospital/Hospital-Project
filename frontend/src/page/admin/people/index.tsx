import { useEffect, useState } from "react";
import { Table, Select, message, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { Role } from "../../auth/AuthContext"; // ปรับ path ตามโปรเจกต์

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  role: Role; // "admin", "user", "guest"
}

export default function UserManagement() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/employees");
      console.log("📦 res.data =", res.data);

      if (Array.isArray(res.data)) {
        const mappedData = res.data.map((e: any) => ({
          id: e.ID,
          firstName: e.FirstName,
          lastName: e.LastName,
          email: e.Email,
          phone: e.Phone,
          position: e.Position?.Position || "-",
          role: (e.Role?.RoleName?.toLowerCase() || "guest") as Role,
        }));
        setData(mappedData);
      } else {
        console.error("❌ res.data is not an array:", res.data);
        message.error("ข้อมูลที่ได้ไม่ถูกต้อง");
        setData([]);
      }
    } catch (err) {
      message.error("ดึงข้อมูลไม่สำเร็จ");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChangeRole = async (id: number, role: Role) => {
  console.log("🔔 role ก่อนส่ง PATCH:", role); // เพิ่มบรรทัดนี้เพื่อตรวจสอบค่า role
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      message.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    await axios.patch(
      `/api/employees/${id}/role`,
      { role },  // หรือ { role: toTitleCase(role) } ถ้าจะปรับ case ด้วย
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    message.success("อัปเดตสิทธิ์สำเร็จ");
    setData((prev) =>
      prev.map((e) => (e.id === id ? { ...e, role } : e))
    );
  } catch (err) {
    message.error("อัปเดตสิทธิ์ไม่สำเร็จ");
  }
};


  const columns: ColumnsType<Employee> = [
    { title: "ชื่อ", dataIndex: "firstName", key: "firstName" },
    { title: "นามสกุล", dataIndex: "lastName", key: "lastName" },
    { title: "อีเมล", dataIndex: "email", key: "email" },
    { title: "เบอร์", dataIndex: "phone", key: "phone" },
    { title: "ตำแหน่ง", dataIndex: "position", key: "position" },
    {
      title: "สิทธิ์",
      key: "role",
      render: (_, record) => (
        <Tag
          className={`px-2 py-1 text-sm rounded-full ${
            record.role === "admin"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {record.role}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      render: (_, record) => (
        <Space>
          <Select<Role>
            value={record.role}
            style={{ width: 120 }}
            className="rounded-md"
            onChange={(role) => handleChangeRole(record.id, role)}
            options={[
              { value: "admin", label: "admin" },
              { value: "user", label: "user" },
              { value: "guest", label: "guest" },
            ]}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">จัดการสิทธิ์ผู้ใช้</h1>

      <div className="bg-white rounded-xl shadow p-4">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 8 }}
          bordered
        />
      </div>
    </div>
  );
}