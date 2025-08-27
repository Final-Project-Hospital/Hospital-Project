// components/employees/EmployeeEditModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Form, Input, message, Row, Col, Select } from "antd";
import { CameraOutlined, FormOutlined } from "@ant-design/icons";
import axios from "axios";
import { EmployeeInterface } from "../../interface/IEmployee";
import { PositionInterface } from "../../interface/IPosition";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: EmployeeInterface | null;
  positions: PositionInterface[]; // ✅ เพิ่มให้ถูกต้อง
  /** ซ่อนการเปลี่ยนสิทธิ์และห้ามลบบัญชีตัวเองให้ส่งมาจากหน้า UserManagement */
  isSelf?: boolean;
};

const { Option } = Select;

const EmployeeEditModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  employee,
  positions,
  isSelf = false,
}) => {
  const [form] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  // เก็บค่าเริ่มต้นไว้เทียบ (ถ้าต้องการในอนาคต)
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  // URL สำหรับแสดงรูปตัวอย่าง (ไฟล์ใหม่ > รูปเดิม)
  const previewUrl = useMemo(() => {
    if (uploadFile) return URL.createObjectURL(uploadFile);
    return (employee as any)?.Profile || (employee as any)?.profile || "";
  }, [uploadFile, employee]);

  // เคลียร์ Object URL เมื่อไฟล์เปลี่ยน/คอมโพเนนต์ unmount
  useEffect(() => {
    return () => {
      if (uploadFile) URL.revokeObjectURL(previewUrl);
    };
  }, [uploadFile, previewUrl]);

  useEffect(() => {
    if (!open || !employee) return;

    const init = {
      firstName: employee.FirstName ?? "",
      lastName: employee.LastName ?? "",
      email: employee.Email ?? "",
      phone: employee.Phone ?? "",
      positionID: employee.Position?.ID ?? undefined,
      roleID: employee.Role?.ID ?? undefined,
      password: undefined, // เว้นว่างถ้าไม่เปลี่ยน
    };

    form.setFieldsValue(init);
    initialValuesRef.current = init;
    setUploadFile(undefined);
  }, [open, employee, form]);

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

  // helper แปลง id -> label
  const roleLabelById = (id?: number) =>
    ({ 1: "Admin", 2: "Employee", 3: "Guest" } as Record<number, string>)[
      id ?? -1
    ] || "-";

  // ยกเลิก: ปิดทันที (เหมือน Create — ไม่มี modal ถาม)
  const handleCancel = () => {
    onClose();
    setTimeout(() => {
      form.resetFields();
      setUploadFile(undefined);
    }, 0);
  };

  // บันทึก: ส่งข้อมูลทันที (ไม่มี modal diff/ยืนยัน)
  const handleSubmit = async () => {
    if (!employee?.ID) return;
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const formData = new FormData();
      formData.append("firstName", String(values.firstName));
      formData.append("lastName", String(values.lastName));
      formData.append("email", String(values.email));
      formData.append("phone", String(values.phone));

      if (values.positionID !== undefined && values.positionID !== null) {
        formData.append("positionID", String(values.positionID));
      }

      // รหัสผ่านใหม่ (ถ้ามี)
      if (values.password) {
        formData.append("password", String(values.password));
      }

      // roleID: ถ้าแก้ไขบัญชีตัวเอง ให้ส่ง role เดิมกลับไป
      if (isSelf) {
        const currentRoleId = employee?.Role?.ID;
        if (currentRoleId != null) formData.append("roleID", String(currentRoleId));
      } else {
        formData.append("roleID", String(values.roleID));
      }

      // รูปโปรไฟล์ (ถ้ามี)
      if (uploadFile) formData.append("profile", uploadFile);

      setLoading(true);
      await axios.put(`/api/employees/${employee.ID}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      message.success("แก้ไขข้อมูลสำเร็จ");
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // validate ไม่ผ่าน ให้ฟอร์มแสดงเอง
      const msg = err?.response?.data?.error || "แก้ไขข้อมูลไม่สำเร็จ";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Title ไล่สี teal + ไอคอน (สไตล์เดียวกับ Create)
  const TitleNode = (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/10">
        <FormOutlined className="text-teal-600" />
      </span>
      <span className="bg-gradient-to-r from-teal-600 to-cyan-400 bg-clip-text text-transparent font-semibold">
        แก้ไขข้อมูลผู้ใช้งาน
      </span>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={TitleNode}
      okText="บันทึก"
      cancelText="ยกเลิก"
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
      keyboard
      okButtonProps={{
        className:
          "bg-gradient-to-r from-teal-600 to-cyan-500 text-white hover:from-teal-700 hover:to-cyan-600 border-0 px-5 rounded-md shadow",
      }}
    >
      {/* อัปโหลดโปรไฟล์แบบวงกลม (Tailwind-only) */}
      <div className="w-full flex items-center justify-center my-6">
        <div className="relative group">
          {/* ปุ่มลบไฟล์ใหม่ */}
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
        {/* ชื่อ + นามสกุล (แถวเดียว) */}
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

        {/* อีเมล + รหัสผ่านใหม่ (แถวเดียว) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="email" label="อีเมล" rules={[{ required: true, type: "email" }]}>
              <Input placeholder="email@example.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="password" label="รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)">
              <Input.Password placeholder="********" />
            </Form.Item>
          </Col>
        </Row>

        {/* เบอร์โทร + ตำแหน่ง (แถวเดียว) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone" label="เบอร์โทร" rules={[{ required: true }]}>
              <Input placeholder="0xxxxxxxxx" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="positionID" label="ตำแหน่ง" rules={[{ required: true }]}>
              <Select placeholder="เลือกตำแหน่ง" showSearch optionFilterProp="children">
                {positions.map((p) => (
                  <Option key={p.ID} value={p.ID}>
                    {p.Position}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* สิทธิ์: ซ่อน select หากเป็นบัญชีตัวเอง */}
        {isSelf ? (
          <Form.Item label="สิทธิ์">
            <div
              style={{
                padding: "8px 12px",
                background: "#fafafa",
                border: "1px solid #f0f0f0",
                borderRadius: 6,
              }}
            >
              {roleLabelById(employee?.Role?.ID)}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
              ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเอง
            </div>
          </Form.Item>
        ) : (
          <Form.Item name="roleID" label="สิทธิ์" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Admin", value: 1 },
                { label: "Employee", value: 2 },
                { label: "Guest", value: 3 },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default EmployeeEditModal;
