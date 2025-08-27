// components/employees/EmployeeEditModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Form, Input, message, Row, Col, Select } from "antd";
import { CameraOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { EmployeeInterface } from "../../interface/IEmployee";
import { PositionInterface } from "../../interface/IPosition";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: EmployeeInterface | null;
  positions: PositionInterface[];
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

  // เก็บค่าเริ่มต้นไว้เทียบ (ใช้ ref เพื่อไม่ทำให้ re-render)
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  // URL สำหรับแสดงรูปตัวอย่าง (ไฟล์ใหม่ > รูปเดิม)
  const previewUrl = useMemo(() => {
    if (uploadFile) return URL.createObjectURL(uploadFile);
    return employee?.Profile || "";
  }, [uploadFile, employee]);

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

  const positionLabelById = (id?: number) => {
    if (!id && id !== 0) return "-";
    const p = positions.find((x) => (x as any).ID === id);
    return p?.Position ?? String(id);
  };

  const equalish = (a: any, b: any) => String(a ?? "") === String(b ?? "");

  // ตรวจว่ามีการแก้ไขหรือไม่ (ใช้สำหรับกันปิดโดยไม่ได้บันทึก)
  const hasUnsavedChanges = () => {
    const init = initialValuesRef.current || {};
    const cur = form.getFieldsValue();
    const keys = Object.keys(init);
    for (const k of keys) {
      if (!equalish(cur[k], init[k])) return true;
    }
    if (cur.password && String(cur.password).length > 0) return true; // ใส่รหัสผ่านใหม่
    if (uploadFile) return true; // เปลี่ยนรูป
    return false;
  };

  // เด้งยืนยันเมื่อจะปิด (X, ยกเลิก, Esc)
  const handleCancel = () => {
    if (!hasUnsavedChanges()) {
      onClose();
      return;
    }
    Modal.confirm({
      title: "ยังไม่ได้บันทึก",
      icon: <ExclamationCircleOutlined />,
      content: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการปิดหน้าต่างนี้หรือไม่?",
      okText: "ปิดโดยไม่บันทึก",
      cancelText: "กลับไปแก้ต่อ",
      okButtonProps: { danger: true },
      onOk: () => onClose(),
    });
  };

  // เด้งยืนยันก่อนบันทึก + สรุป diff ที่เปลี่ยน
  const handleSubmit = async () => {
    if (!employee?.ID) return;
    try {
      const values = await form.validateFields();

      // === สร้าง diff ===
      const changes: Array<{ key: string; label: string; oldVal: string; newVal: string }> = [];
      const pushIfChanged = (
        key: string,
        label: string,
        oldV: any,
        newV: any,
        fmt?: (v: any) => string
      ) => {
        const f = (v: any) => (fmt ? fmt(v) : (v ?? "") + "");
        if (f(oldV) !== f(newV)) changes.push({ key, label, oldVal: f(oldV) || "-", newVal: f(newV) || "-" });
      };

      pushIfChanged("firstName", "ชื่อ", employee.FirstName, values.firstName);
      pushIfChanged("lastName", "นามสกุล", employee.LastName, values.lastName);
      pushIfChanged("email", "อีเมล", employee.Email, values.email);
      pushIfChanged("phone", "เบอร์โทร", employee.Phone, values.phone);
      pushIfChanged(
        "positionID",
        "ตำแหน่ง",
        employee.Position?.ID,
        values.positionID,
        (v) => positionLabelById(Number(v))
      );

      if (!isSelf) {
        pushIfChanged(
          "roleID",
          "สิทธิ์",
          employee.Role?.ID,
          values.roleID,
          (v) => roleLabelById(Number(v))
        );
      }

      if (values.password && String(values.password).length > 0) {
        changes.push({
          key: "password",
          label: "รหัสผ่าน",
          oldVal: "—",
          newVal: "จะถูกเปลี่ยน (ไม่แสดงค่า)",
        });
      }
      if (uploadFile) {
        changes.push({
          key: "profile",
          label: "รูปโปรไฟล์",
          oldVal: employee.Profile ? "มีรูปเดิม" : "—",
          newVal: `อัปโหลดใหม่: ${uploadFile.name}`,
        });
      }

      if (changes.length === 0) {
        Modal.info({
          title: "ไม่มีการเปลี่ยนแปลง",
          content: "คุณยังไม่ได้แก้ไขข้อมูลใด ๆ",
          okText: "ตกลง",
        });
        return;
      }

      const DiffView = (
        <div>
          <div className="mb-2">โปรดตรวจสอบความเปลี่ยนแปลงก่อนบันทึก:</div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {changes.map((c) => (
              <li key={c.key} style={{ marginBottom: 6, lineHeight: 1.4 }}>
                <b>{c.label}:</b>{" "}
                <span style={{ color: "#8c8c8c" }}>{c.oldVal}</span> {" → "}
                <span style={{ color: "#389e0d" }}>{c.newVal}</span>
              </li>
            ))}
          </ul>
        </div>
      );

      Modal.confirm({
        title: "ยืนยันการแก้ไข",
        icon: <ExclamationCircleOutlined />,
        content: DiffView,
        okText: "บันทึก",
        cancelText: "ยกเลิก",
        onOk: async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return message.error("กรุณาเข้าสู่ระบบก่อน");

    const formData = new FormData();

    // ค่าพื้นฐาน
    formData.append("firstName", String(values.firstName));
    formData.append("lastName",  String(values.lastName));
    formData.append("email",     String(values.email));
    formData.append("phone",     String(values.phone));

    // positionID (ต้องมีจากฟอร์ม)
    if (values.positionID !== undefined && values.positionID !== null)
      formData.append("positionID", String(values.positionID));

    // password (optional)
    if (values.password) formData.append("password", String(values.password));

    // *** จุดสำคัญ: roleID ***
    if (isSelf) {
      // ซ่อน select อยู่ → จะไม่ได้อยู่ใน values
      // ให้ใช้ role เดิมของตัวเองส่งกลับไป
      const currentRoleId = employee?.Role?.ID;
      if (currentRoleId != null) {
        formData.append("roleID", String(currentRoleId));
      }
      // (ถ้าอยากให้ backend ยอมไม่ส่ง roleID ได้ ก็แก้ที่ controller ตามที่อธิบายก่อนหน้า)
    } else {
      // แก้ข้อมูลคนอื่น ต้องส่ง roleID จากฟอร์ม
      formData.append("roleID", String(values.roleID));
    }

    // รูปโปรไฟล์ (optional)
    if (uploadFile) formData.append("profile", uploadFile);

    setLoading(true);
    await axios.put(`/api/employees/${employee!.ID}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // ปล่อยให้ browser เซ็ต Content-Type และ boundary เองจะปลอดภัยกว่า:
        // "Content-Type": "multipart/form-data",
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
},
      });
    } catch {
      // validate ไม่ผ่าน — ฟอร์มจะโชว์ error เอง
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="แก้ไขข้อมูลพนักงาน"
      okText="บันทึก"
      cancelText="ยกเลิก"
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
      keyboard
      maskClosable={false}  // กันคลิกฉากหลังแล้วปิด
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
