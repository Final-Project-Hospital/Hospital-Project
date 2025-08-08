// pages/admin/UserManagement.tsx
import { useEffect, useState } from "react";
import { Table, message, Space, Tag, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { EmployeeInterface } from "../../../interface/IEmployee";
import { PositionInterface } from "../../../interface/IPosition";
import { FaUser } from "react-icons/fa";
import "./UserManagement.css";

import EmployeeEditModal from "../../../component/employees/EmployeeEditModal";
import EmployeeCreateModal from "../../../component/employees/EmployeeCreateModal";

export default function UserManagement() {
  const [data, setData] = useState<EmployeeInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeInterface | null>(null);
  const [positions, setPositions] = useState<PositionInterface[]>([]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/employees");
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        message.error("ข้อมูลที่ได้ไม่ถูกต้อง");
        setData([]);
      }
    } catch {
      message.error("ดึงข้อมูลไม่สำเร็จ");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await axios.get("/api/positions");
      setPositions(res.data || []);
    } catch {
      message.error("ไม่สามารถโหลดตำแหน่งได้");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPositions();
  }, []);


  const openEdit = (emp: EmployeeInterface) => {
    setCurrentEmployee(emp);
    setEditOpen(true);
  };

  const handleDelete = (id: number) => {
    // ใช้ Modal.confirm ก็ได้ หรือ sweetalert ตามเดิม
    import("antd").then(({ Modal }) =>
      Modal.confirm({
        title: "ยืนยันการลบ",
        content: "คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?",
        okText: "ลบ",
        cancelText: "ยกเลิก",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            const token = localStorage.getItem("token");
            if (!token) return message.error("กรุณาเข้าสู่ระบบก่อน");

            await axios.delete(`/api/employees/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            message.success("ลบผู้ใช้งานสำเร็จ");
            fetchEmployees();
          } catch {
            message.error("ลบผู้ใช้งานไม่สำเร็จ");
          }
        },
      })
    );
  };

  const columns: ColumnsType<EmployeeInterface> = [
    { title: "ชื่อ", dataIndex: "FirstName", key: "FirstName" },
    { title: "นามสกุล", dataIndex: "LastName", key: "LastName" },
    { title: "อีเมล", dataIndex: "Email", key: "Email" },
    { title: "เบอร์", dataIndex: "Phone", key: "Phone" },
    {
      title: "ตำแหน่ง",
      key: "Position",
      render: (_, record) => record.Position?.Position || "-",
    },
    {
      title: "สิทธิ์",
      key: "Role",
      render: (_, record) => {
        const roleName = record.Role?.RoleName || "-";
        return (
          <Tag className={`px-2 py-1 text-sm rounded-full ${roleBadgeClass(roleName)}`}>
            {roleName}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      render: (_, record) => (
        <Space wrap>
          {/* <Select<string>
            value={record.Role?.RoleName?.toLowerCase()}
            style={{ width: 120 }}
            onChange={(role) => handleChangeRole(record.ID!, role)}
            options={[
              { value: "admin", label: "admin" },
              { value: "employee", label: "employee" },
              { value: "guest", label: "guest" },
            ]}
          /> */}
          <Button size="small" onClick={() => openEdit(record)}>
            แก้ไข
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record.ID!)}>
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  const roleBadgeClass = (roleName?: string) => {
    switch ((roleName || "").toLowerCase()) {
      case "admin":
        return "bg-green-100 text-green-700";
      case "employee":
        return "bg-blue-100 text-blue-700";
      case "guest":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };  

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="title-header">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold drop-shadow-md">
              จัดการสิทธิ์ผู้ใช้
            </h1>
            <p className="text-sm drop-shadow-sm leading-snug">
              โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
            </p>
          </div>
          <Button icon={<FaUser size={18} />} onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            สร้างบัญชี
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 max-w-screen-xl mx-auto">
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 overflow-x-auto">
          <Table
            rowKey="ID"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{ pageSize: 6 }}
            bordered
            size="middle"
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>

      {/* ใช้คอมโพเนนต์ Modal แบบ reusable */}
      <EmployeeEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchEmployees}
        employee={currentEmployee}
        positions={positions}
      />

      <EmployeeCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchEmployees}
        positions={positions}
      />
    </div>
  );
}
