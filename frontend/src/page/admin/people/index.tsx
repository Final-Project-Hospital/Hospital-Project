import { useEffect, useState } from "react";
import {
  Table,
  Select,
  message,
  Space,
  Tag,
  Modal,
  Button,
  Form,
  Input,
  Row,
  Col,
  Upload,
} from "antd";
import { UploadOutlined ,CameraOutlined  } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { EmployeeInterface } from "../../../interface/IEmployee";
import { PositionInterface } from "../../../interface/IPosition";
import { FaUser } from "react-icons/fa"
import "./UserManagement.css";


export default function UserManagement() {
  const [data, setData] = useState<EmployeeInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeInterface | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [positions, setPositions] = useState<PositionInterface[]>([]);
  const [uploadFile, setUploadFile] = useState<any>();

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

  const handleChangeRole = async (id: number, roleName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return message.error("กรุณาเข้าสู่ระบบก่อน");

      await axios.patch(
        `/api/employees/${id}/role`,
        { role: roleName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("อัปเดตสิทธิ์สำเร็จ");
      fetchEmployees();
    } catch {
      message.error("อัปเดตสิทธิ์ไม่สำเร็จ");
    }
  };

  const handleEdit = (employee: EmployeeInterface) => {
    setEditEmployee(employee);
    form.setFieldsValue({
      firstName: employee.FirstName,
      lastName: employee.LastName,
      email: employee.Email,
      phone: employee.Phone,
      positionID: employee.Position?.ID,
      roleID: employee.Role?.ID,
    });
    setEditVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem("token");

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value as string);
        }
      });

      if (uploadFile) {
        formData.append("profile", uploadFile);
      }

      await axios.put(`/api/employees/${editEmployee?.ID}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("แก้ไขข้อมูลสำเร็จ");
      setEditVisible(false);
      fetchEmployees();
    } catch {
      message.error("แก้ไขข้อมูลไม่สำเร็จ");
    }
  };

  const handleCreateSubmit = async () => {
    try {
      const formData = new FormData();
      const values = await createForm.validateFields();
      const token = localStorage.getItem("token");
      if (!token) return message.error("กรุณาเข้าสู่ระบบก่อน");

      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      if (uploadFile) {
        formData.append("profile", uploadFile);
      }

      await axios.post("/api/employees", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      message.success("สร้างบัญชีสำเร็จ");
      setCreateVisible(false);
      createForm.resetFields();
      setUploadFile(undefined);
      fetchEmployees();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "สร้างบัญชีไม่สำเร็จ";
      message.error(msg);
    }
  };

  const handleDelete = (id: number) => {
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
    });
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
      render: (_, record) => (
        <Tag
          className={`px-2 py-1 text-sm rounded-full ${
            record.Role?.RoleName?.toLowerCase() === "admin"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {record.Role?.RoleName || "-"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      render: (_, record) => (
        <Space wrap>
          <Select<string>
            value={record.Role?.RoleName?.toLowerCase()}
            style={{ width: 120 }}
            onChange={(role) => handleChangeRole(record.ID!, role)}
            options={[
              { value: "admin", label: "admin" },
              { value: "employee", label: "employee" },
              { value: "guest", label: "guest" },
            ]}
          />
          <Button size="small" onClick={() => handleEdit(record)}>
            แก้ไข
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record.ID!)}>
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

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
          <Button
            icon={<FaUser size={18} />}
            onClick={() => setCreateVisible(true)}
            className="w-full sm:w-auto"
          >
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
  
      {/* Modal แก้ไข */}
      <Modal
  title="แก้ไขข้อมูลพนักงาน"
  open={editVisible}
  onCancel={() => setEditVisible(false)}
  onOk={handleEditSubmit}
  okText="บันทึก"
  cancelText="ยกเลิก"
  destroyOnClose
>
  <Form form={form} layout="vertical">
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item name="firstName" label="ชื่อ" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="lastName" label="นามสกุล" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item name="email" label="อีเมล" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item name="password" label="รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)">
  <Input.Password />
</Form.Item>
    <Form.Item name="phone" label="เบอร์โทร" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item name="positionID" label="ตำแหน่ง" rules={[{ required: true }]}>
      <Select
        placeholder="เลือกตำแหน่ง"
        options={positions.map((p) => ({
          label: p.Position,
          value: p.ID,
        }))}
      />
    </Form.Item>
    <Form.Item name="roleID" label="สิทธิ์" rules={[{ required: true }]}>
      <Select
        options={[
          { label: "Admin", value: 1 },
          { label: "Employee", value: 2 },
          { label: "Guest", value: 3 },
        ]}
      />
    </Form.Item>
    <Form.Item label="อัปโหลดรูปโปรไฟล์ใหม่ (ถ้ามี)">
      <Upload
        maxCount={1}
        beforeUpload={(file) => {
          setUploadFile(file);
          return false;
        }}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />}>เลือกรูป</Button>
      </Upload>
    </Form.Item>
  </Form>
</Modal>

      {/* Modal สร้างบัญชี */}
      <Modal
  title="สร้างบัญชีพนักงาน"
  open={createVisible}
  onCancel={() => setCreateVisible(false)}
  onOk={handleCreateSubmit}
  okText="สร้าง"
  cancelText="ยกเลิก"
  destroyOnClose
>
  {/* Upload Profile Preview */}
  <div className="profile-upload-wrapper">
    <label className="profile-upload">
      <img
        src={
          uploadFile
            ? URL.createObjectURL(uploadFile)
            : "https://via.placeholder.com/100?text=รูป"
        }
        alt=""
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            setUploadFile(e.target.files[0]);
          }
        }}
      />
      <div className="profile-upload-label">
        <CameraOutlined />
      </div>
    </label>
  </div>

  <Form form={createForm} layout="vertical">
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item name="firstName" label="ชื่อ" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="lastName" label="นามสกุล" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item name="email" label="อีเมล" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item name="password" label="รหัสผ่าน" rules={[{ required: true }]}>
      <Input.Password />
    </Form.Item>
    <Form.Item name="phone" label="เบอร์โทร" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item name="positionID" label="ตำแหน่ง" rules={[{ required: true }]}>
      <Select
        placeholder="เลือกตำแหน่ง"
        options={positions.map((p) => ({
          label: p.Position,
          value: p.ID,
        }))}
      />
    </Form.Item>
    <Form.Item name="roleID" label="สิทธิ์" rules={[{ required: true }]}>
      <Select
        options={[
          { label: "Admin", value: 1 },
          { label: "Employee", value: 2 },
          { label: "Guest", value: 3 },
        ]}
      />
    </Form.Item>
  </Form>
</Modal>
    </div>
  );
}
