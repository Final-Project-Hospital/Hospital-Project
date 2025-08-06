// components/employees/EmployeeCreateModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Row, Col, Select, message, Button } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import axios from "axios";
import { PositionInterface } from "../../interface/IPosition";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  positions: PositionInterface[];
};

const { Option } = Select;

const EmployeeCreateModal: React.FC<Props> = ({ open, onClose, onSuccess, positions }) => {
  const [form] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  // URL preview ของรูป เพื่อแสดงใน <img>
  const previewUrl = useMemo(() => (uploadFile ? URL.createObjectURL(uploadFile) : ""), [uploadFile]);

  // cleanup object URL เมื่อเปลี่ยนไฟล์/ปิด modal
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (file?: File) => {
    if (!file) {
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

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem("token");
      if (!token) return message.error("กรุณาเข้าสู่ระบบก่อน");

      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        formData.append(k, String(v));
      });
      if (uploadFile) formData.append("profile", uploadFile);

      setLoading(true);
      await axios.post("/api/employees", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      message.success("สร้างบัญชีสำเร็จ");
      form.resetFields();
      setUploadFile(undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "สร้างบัญชีไม่สำเร็จ";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="สร้างบัญชีพนักงาน"
      open={open}
      onCancel={onClose}
      onOk={handleCreate}
      okText="สร้าง"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      destroyOnClose
    >
      {/* อัปโหลดโปรไฟล์แบบวงกลม (Tailwind-only) */}
      <div className="w-full flex items-center justify-center my-6">
        <div className="relative group">
          {/* ปุ่มลบมุมขวาบน (แสดงเมื่อมีรูป) */}
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

          {/* ปุ่มอัปโหลด (label + input file) */}
          <label
            htmlFor="employee-profile-input"
            className={[
              "w-28 h-28 rounded-full cursor-pointer overflow-hidden",
              "border-2 border-dashed border-gray-300",
              "bg-gray-50 flex items-center justify-center",
              "transition-all duration-200 ease-out",
              "hover:shadow-[0_0_0_6px_rgba(20,184,166,0.12)] hover:border-teal-500 hover:scale-[1.02]",
              uploadFile ? "border-transparent bg-transparent hover:scale-100" : "",
            ].join(" ")}
          >
            {uploadFile ? (
              // แสดงรูป
              <div className="relative w-full h-full">
                <img
                  src={previewUrl}
                  alt="profile"
                  className="w-full h-full object-cover rounded-full"
                />
                {/* Overlay เมื่อ hover */}
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
              // Placeholder (ไม่มีรูป)
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                  <CameraOutlined className="text-lg text-teal-600" />
                </div>
                <span className="text-xs mt-2 text-teal-600">อัปโหลด</span>
              </div>
            )}
          </label>

          <input
            id="employee-profile-input"
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

export default EmployeeCreateModal;
