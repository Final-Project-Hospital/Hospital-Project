// components/employees/EmployeeEditModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, message, Row, Col, Select, Button } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import axios from "axios";
import { EmployeeInterface } from "../../interface/IEmployee";
import { PositionInterface } from "../../interface/IPosition";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: EmployeeInterface | null;
  positions: PositionInterface[];
};

const { Option } = Select;

const EmployeeEditModal: React.FC<Props> = ({ open, onClose, onSuccess, employee, positions }) => {
  const [form] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  // URL สำหรับแสดงรูปตัวอย่าง:
  // ถ้ามีไฟล์ใหม่ => ใช้ URL.createObjectURL(uploadFile)
  // ไม่งั้น => ใช้รูปเดิมของพนักงาน (employee.Profile)
  const previewUrl = useMemo(() => {
    if (uploadFile) return URL.createObjectURL(uploadFile);
    return employee?.Profile || "";
  }, [uploadFile, employee]);

  useEffect(() => {
    if (!open || !employee) return;

    form.setFieldsValue({
      firstName: employee.FirstName,
      lastName: employee.LastName,
      email: employee.Email,
      phone: employee.Phone,
      positionID: employee.Position?.ID,
      roleID: employee.Role?.ID,
      password: undefined, // เว้นว่างถ้าไม่เปลี่ยน
    });

    // เคลียร์ไฟล์ใหม่ทุกครั้งที่เปิด modal/เปลี่ยนพนักงาน
    setUploadFile(undefined);

    // cleanup object URL เมื่อปิด/เปลี่ยนไฟล์
    return () => {
      if (uploadFile) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee]);

  const handleFileChange = (file?: File) => {
    if (!file) {
      // กดลบไฟล์ใหม่ -> กลับไปใช้รูปเดิม (ถ้ามี)
      setUploadFile(undefined);
      return;
    }
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("กรุณาอัปโหลดไฟล์รูปภาพ");
      return;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("ขนาดรูปต้องไม่เกิน 2MB");
      return;
    }
    setUploadFile(file);
  };

  const handleSubmit = async () => {
    if (!employee?.ID) return;
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem("token");
      if (!token) return message.error("กรุณาเข้าสู่ระบบก่อน");

      const formData = new FormData();
      // แนบเฉพาะฟิลด์ที่มีค่า
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          formData.append(k, String(v));
        }
      });

      // ถ้าอัปโหลดไฟล์ใหม่ -> แนบไฟล์ใหม่ไป
      if (uploadFile) {
        formData.append("profile", uploadFile);
      }
      // ถ้าไม่แนบ -> backend ควรตีความว่า "คงรูปเดิม"

      setLoading(true);
      await axios.put(`/api/employees/${employee.ID}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("แก้ไขข้อมูลสำเร็จ");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "แก้ไขข้อมูลไม่สำเร็จ";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="แก้ไขข้อมูลพนักงาน"
      okText="บันทึก"
      cancelText="ยกเลิก"
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
    >
      {/* อัปโหลดโปรไฟล์แบบวงกลม (Tailwind-only) */}
      <div className="w-full flex items-center justify-center my-6">
        <div className="relative group">
          {/* ปุ่มลบไฟล์ใหม่ (แสดงเฉพาะเมื่อมีไฟล์ใหม่) */}
          {uploadFile && (
            <button
              type="button"
              onClick={() => handleFileChange(undefined)}
              className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-white border border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-400 shadow flex items-center justify-center"
              aria-label="ลบรูป"
            >
              ×
            </button>
          )}

          <label
            htmlFor="employee-edit-profile-input"
            className={[
              "w-28 h-28 rounded-full cursor-pointer overflow-hidden",
              "border-2 border-dashed border-gray-300",
              "bg-gray-50 flex items-center justify-center",
              "transition-all duration-200 ease-out",
              "hover:shadow-[0_0_0_6px_rgba(20,184,166,0.12)] hover:border-teal-500 hover:scale-[1.02]",
              previewUrl ? "border-transparent bg-transparent hover:scale-100" : "",
            ].join(" ")}
          >
            {previewUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={previewUrl}
                  alt="profile"
                  className="w-full h-full object-cover rounded-full"
                />
                {/* overlay เมื่อ hover */}
                <div
                  className={[
                    "absolute inset-0 rounded-full",
                    "bg-black/0 group-hover:bg-black/30",
                    "flex items-center justify-center",
                    "transition-colors duration-200",
                  ].join(" ")}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs flex items-center gap-1">
                    <CameraOutlined className="text-base" />
                    เปลี่ยนรูป
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                  <CameraOutlined className="text-lg text-teal-600" />
                </div>
                <span className="text-xs mt-2 text-teal-600">อัปโหลด</span>
              </div>
            )}
          </label>

          <input
            id="employee-edit-profile-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleFileChange(file);
            }}
          />
        </div>
      </div>

      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="firstName" label="ชื่อ" rules={[{ required: true }]}>
              <Input placeholder="ชื่อ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lastName" label="นามสกุล" rules={[{ required: true }]}>
              <Input placeholder="นามสกุล" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="email" label="อีเมล" rules={[{ required: true }]}>
          <Input placeholder="email@example.com" />
        </Form.Item>

        <Form.Item name="password" label="รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)">
          <Input.Password placeholder="********" />
        </Form.Item>

        <Form.Item name="phone" label="เบอร์โทร" rules={[{ required: true }]}>
          <Input placeholder="0xxxxxxxxx" />
        </Form.Item>

        <Form.Item name="positionID" label="ตำแหน่ง" rules={[{ required: true }]}>
          <Select placeholder="เลือกตำแหน่ง">
            {positions.map((p) => (
              <Option key={p.ID} value={p.ID}>
                {p.Position}
              </Option>
            ))}
          </Select>
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
  );
};

export default EmployeeEditModal;
