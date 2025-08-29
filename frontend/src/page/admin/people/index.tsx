// pages/admin/UserManagement.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  message,
  Space,
  Tag,
  Button,
  Avatar,
  Input,
  Select,
  ConfigProvider,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import thTH from "antd/locale/th_TH";
import { EmployeeInterface } from "../../../interface/IEmployee";
import { PositionInterface } from "../../../interface/IPosition";
import { FaUser } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { ReloadOutlined } from "@ant-design/icons";
import EmployeeEditModal from "../../../component/employees/EmployeeEditModal";
import EmployeeCreateModal from "../../../component/employees/EmployeeCreateModal";
import { ListEmployees } from "../../../services/httpLogin";

export default function UserManagement() {
  const [data, setData] = useState<EmployeeInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeInterface | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [positions, setPositions] = useState<PositionInterface[]>([]);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const [searchText, setSearchText] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");

  // ✅ Tailwind classes ตรง ๆ
  const roleBadgeClass = (roleName?: string) => {
    switch ((roleName || "").toLowerCase()) {
      case "admin":
        return "bg-gradient-to-r from-purple-800 to-purple-500";
      case "employee":
        return "bg-gradient-to-r from-blue-800 to-blue-500";
      case "guest":
        return "bg-gradient-to-r from-amber-800 to-amber-500";
      default:
        return "bg-gradient-to-r from-gray-800 to-gray-500";
    }
  };

  const getCurrentEmployeeId = (): number | null => {
    const raw =
      localStorage.getItem("employeeid") ??
      localStorage.getItem("employeeId") ??
      "";
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  };

  const getAvatarSrc = (emp: EmployeeInterface): string | undefined => {
    const pick = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const profile = pick((emp as any)?.Profile) ?? pick((emp as any)?.profile);
    if (profile) {
      const hasPrefix =
        /^data:image\/[a-zA-Z]+;base64,/.test(profile) ||
        /^https?:\/\//.test(profile) ||
        profile.startsWith("blob:") ||
        profile.startsWith("/");
      if (hasPrefix) return profile;
      if (/^[A-Za-z0-9+/=]+$/.test(profile.slice(0, 80))) {
        return `data:image/png;base64,${profile}`;
      }
    }
    const keys = [
      "ProfileImageURL","ImageURL","AvatarURL","ProfileImage",
      "Image","Avatar","Picture","PhotoUrl","PhotoURL","Photo",
    ];
    for (const k of keys) {
      const v = pick((emp as any)?.[k]);
      if (v) return v;
    }
    return undefined;
  };

  const derivePositions = (emps: EmployeeInterface[]): PositionInterface[] => {
    const map = new Map<string | number, PositionInterface>();
    for (const e of emps) {
      const p: any = (e as any)?.Position;
      if (!p) continue;
      const id = p?.ID ?? p?.Id ?? p?.id ?? p?.PositionID;
      const name = p?.Position ?? p?.Name ?? p?.Title ?? "";
      if (!name) continue;
      const key = id ?? name;
      if (!map.has(key)) map.set(key, { ID: id ?? 0, Position: name } as PositionInterface);
    }
    return Array.from(map.values());
  };

  const roles = useMemo(() => {
    const s = new Set<string>();
    data.forEach((e) => {
      const r = (e as any)?.Role?.RoleName;
      if (typeof r === "string" && r.trim()) s.add(r.trim());
    });
    return Array.from(s.values()).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const fetchEmployees = async () => {
    setLoading(true);
    const list = await ListEmployees();
    if (list) {
      setData(list);
      setPositions(derivePositions(list));
    } else {
      message.error("ดึงข้อมูลไม่สำเร็จ");
      setData([]);
      setPositions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const uid = getCurrentEmployeeId();
    setCurrentUserId(uid);
    fetchEmployees();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchText, roleFilter, positionFilter]);

  const filteredData = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return data.filter((e) => {
      const roleName = (e as any)?.Role?.RoleName ?? "";
      const positionName = (e as any)?.Position?.Position ?? "";
      if (roleFilter && String(roleName).toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (positionFilter && String(positionName).toLowerCase() !== positionFilter.toLowerCase()) return false;
      if (!q) return true;
      const name = `${e.FirstName ?? ""} ${e.LastName ?? ""}`.toLowerCase();
      const email = (e.Email ?? "").toLowerCase();
      const phone = (e.Phone ?? "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        String(roleName).toLowerCase().includes(q) ||
        String(positionName).toLowerCase().includes(q)
      );
    });
  }, [data, searchText, roleFilter, positionFilter]);

  const openEdit = (emp: EmployeeInterface) => {
    setCurrentEmployee(emp);
    setEditOpen(true);
  };

  const handleDelete = (id: number) => {
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
            const { api: axios } = await import("../../../services/api");
            await axios.delete(`/api/employees/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            message.success("ลบผู้ใช้งานสำเร็จ");
            fetchEmployees();
          } catch (e: any) {
            const apiMsg = e?.response?.data?.error || "ลบผู้ใช้งานไม่สำเร็จ";
            message.error(apiMsg);
          }
        },
      })
    );
  };

  const clearAllFilters = () => {
    setSearchText("");
    setRoleFilter("");
    setPositionFilter("");
    setPage(1);
  };

  const columns: ColumnsType<EmployeeInterface> = [
    {
      title: "ลำดับ",
      key: "index",
      width: 80,
      align: "center",
      render: (_: any, __: EmployeeInterface, idx: number) =>
        (page - 1) * pageSize + idx + 1,
    },
    {
      title: "ชื่อ-นามสกุล",
      key: "FullName",
      render: (_, record) => {
        const fullName = `${record.FirstName ?? ""} ${record.LastName ?? ""}`.trim() || "-";
        const email = record.Email || "-";
        const src = getAvatarSrc(record);
        return (
          <div className="flex items-center gap-3 min-w-[240px]">
            <Avatar
              src={src}
              size={40}
              className="flex-shrink-0"
              alt={fullName || "user"}
            >
              {fullName ? fullName[0] : "U"}
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-gray-800">{fullName}</span>
              <a
                href={email !== "-" ? `mailto:${email}` : undefined}
                className="text-xs md:text-sm text-gray-500 hover:text-teal-600 truncate max-w-[260px] md:max-w-[360px]"
                title={email}
              >
                {email}
              </a>
            </div>
          </div>
        );
      },
    },
    { title: "เบอร์โทรศัพท์", dataIndex: "Phone", key: "Phone" },
    {
      title: "ตำแหน่ง",
      key: "Position",
      render: (_, record) => record.Position?.Position || "-",
    },
    {
      title: "สิทธิ์การใช้งาน",
      key: "Role",
      render: (_, record) => {
        const roleName = record.Role?.RoleName || "-";
        return (
          <Tag
            className={`px-3 py-1 text-sm font-bold text-white rounded-full ${roleBadgeClass(roleName)}`}
          >
            {roleName}
          </Tag>
        );
      },
    },
    {
      title: "จัดการ",
      key: "action",
      render: (_, record) => {
        const isSelf = currentUserId != null && record.ID === currentUserId;
        return (
          <Space wrap>
            <Button
              size="small"
              onClick={() => openEdit(record)}
              className="flex items-center gap-2 rounded-md border border-teal-500 text-teal-600 hover:bg-teal-50 px-3 py-1 shadow-sm"
            >
              <FiEdit2 className="text-teal-600" />
              <span>แก้ไข</span>
            </Button>
            {!isSelf && (
              <Button
                size="small"
                onClick={() => handleDelete(record.ID!)}
                className="flex items-center gap-2 rounded-md border border-red-500 text-red-500 hover:bg-red-50 px-3 py-1 shadow-sm"
              >
                <FiTrash2 className="text-red-500" />
                <span>ลบ</span>
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const handleTableChange = (pg: TablePaginationConfig) => {
    setPage(pg.current || 1);
    setPageSize(pg.pageSize || pageSize);
  };

  const paginationLocale = {
    ...thTH,
    Pagination: {
      ...(thTH as any).Pagination,
      items_per_page: " / page",
    },
  };

  return (
    <div className="bg-gray-50 min-h-screen w-full flex flex-col mt-16 md:mt-0">
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 sm:px-6 lg:px-8 py-6 rounded-b-3xl mb-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold drop-shadow-md">จัดการสิทธิ์ผู้ใช้</h1>
            <p className="text-sm drop-shadow-sm leading-snug">
              โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-teal-700 rounded-full shadow px-4 py-2"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
              <FaUser size={14} />
            </span>
            <span className="font-medium">สร้างบัญชี</span>
          </button>
        </div>
      </div>

      <div className="w-full px-2 sm:px-4 lg:px-8 mt-3">
        <div className="bg-white rounded-xl shadow-md p-2 sm:p-4 md:p-6 w-full overflow-x-auto">
          <div className="mb-3 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
            <Input
              allowClear
              placeholder="ค้นหา"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="md:col-span-2 xl:col-span-2"
            />
            <Select
              allowClear
              value={roleFilter || undefined}
              onChange={(v) => setRoleFilter(v ?? "")}
              placeholder="กรองตามสิทธิ์"
              options={roles.map((r) => ({ label: r, value: r }))}
              className="w-full"
            />
            <Select
              allowClear
              value={positionFilter || undefined}
              onChange={(v) => setPositionFilter(v ?? "")}
              placeholder="กรองตามตำแหน่ง"
              options={positions.map((p) => ({ label: p.Position, value: p.Position }))}
              className="w-full"
              showSearch
              optionFilterProp="label"
            />
            <div className="flex md:justify-end">
              <Button
                icon={<ReloadOutlined />}
                onClick={clearAllFilters}
                className="border-teal-600 text-teal-700 hover:!text-teal-700 hover:bg-teal-50"
              >
                ล้างตัวกรองทั้งหมด
              </Button>
            </div>
          </div>

          <ConfigProvider locale={paginationLocale}>
            <Table
              rowKey="ID"
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total: filteredData.length,
                position: ["bottomCenter"],
                showSizeChanger: true,
                pageSizeOptions: [5, 10, 15, 20],
                showTotal: (t, range) => `${range[0]}-${range[1]} จาก ${t} รายการ`,
              }}
              bordered
              size="middle"
              className="w-full teal-thead"
              scroll={{ x: true }}
              style={{ width: "100%" }}
              onChange={handleTableChange}
            />
          </ConfigProvider>
        </div>
      </div>

      <EmployeeEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchEmployees}
        employee={currentEmployee}
        positions={positions}
        isSelf={
          currentEmployee?.ID != null &&
          currentUserId != null &&
          currentEmployee.ID === currentUserId
        }
      />
      <EmployeeCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchEmployees}
        positions={positions}
      />

      <style>{`
        .teal-thead .ant-table-thead .ant-table-cell {
          color: #0f766e;           
          font-weight: 600;
          background: #ffffff;      
        }
        .teal-thead .ant-table-thead .ant-table-column-sorters {
          color: #0f766e;
        }
      `}</style>
    </div>
  );
}
