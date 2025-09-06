// 📁 components/employees/EmployeeEditModal.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Form, Input, message, Row, Col, Select } from "antd";
import { CameraOutlined, FormOutlined } from "@ant-design/icons";
import { EmployeeInterface } from "../../interface/IEmployee";
import { PositionInterface } from "../../interface/IPosition";
import { RoleInterface } from "../../interface/IRole";
import { ListRole, UpdateManageEmployeeByID,ListPositions } from "../../services/httpLogin";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: EmployeeInterface | null;
  /** เดิมส่งมาจาก parent ได้ แต่ตอนนี้จะพยายามดึงจาก service เองก่อน */
  positions?: PositionInterface[];
  isSelf?: boolean;
};

const EmployeeEditModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  employee,
  positions = [],
  isSelf = false,
}) => {
  const [form] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [positionsState, setPositionsState] = useState<PositionInterface[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const previewUrl = useMemo(() => {
    if (uploadFile) return URL.createObjectURL(uploadFile);
    return employee?.Profile || "";
  }, [uploadFile, employee]);

  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const res = await ListRole(); // ต้องคืน role ทั้ง "ทุกอัน" จากตาราง Role
      setRoles(Array.isArray(res) ? res : []);
    } catch (e: any) {
      console.error(e);
      message.error("โหลดรายการสิทธิ์ไม่สำเร็จ");
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    try {
      setPositionsLoading(true);
      const res = await ListPositions(); // GET /api/positions
      if (res && Array.isArray(res)) {
        setPositionsState(res);
      } else {
        // เผื่อกรณี service ล้มเหลว → fallback ใช้ props ที่ส่งเข้ามา
        setPositionsState(positions);
      }
    } catch (e) {
      console.error(e);
      message.error("โหลดรายการตำแหน่งไม่สำเร็จ");
      setPositionsState(positions);
    } finally {
      setPositionsLoading(false);
    }
  }, [positions]);

  useEffect(() => {
    if (!open || !employee) return;

    // เซ็ตค่าเริ่มต้นของฟอร์ม
    form.setFieldsValue({
      firstName: employee.FirstName ?? "",
      lastName: employee.LastName ?? "",
      email: employee.Email ?? "",
      phone: employee.Phone ?? "",
      positionID: employee.Position?.ID ?? undefined,
      roleID: employee.Role?.ID ?? undefined,
    });
    setUploadFile(undefined);

    // โหลด roles/positions ทุกครั้งที่เปิด modal เพื่อให้รายการล่าสุด
    loadRoles();
    loadPositions();
  }, [open, employee, form, loadRoles, loadPositions]);

  const handleFileChange = (file?: File) => {
    if (!file) {
      setUploadFile(undefined);
      return;
    }
    if (!file.type.startsWith("image/")) {
      message.error("กรุณาอัปโหลดไฟล์รูปภาพ");
      return;
    }
    setUploadFile(file);
  };

  const handleCancel = () => {
    onClose();
    setTimeout(() => {
      form.resetFields();
      setUploadFile(undefined);
    }, 0);
  };

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

      if (values.password) {
        formData.append("password", String(values.password));
      }

      if (values.positionID) {
        formData.append("positionID", String(values.positionID));
      }

      // ✅ แนบ roleID ตามเงื่อนไข
      if (isSelf) {
        // แก้ไขข้อมูลตัวเอง → ไม่ให้เปลี่ยนสิทธิ์ เลยยึดตาม role ปัจจุบัน
        if (employee?.Role?.ID != null) {
          formData.append("roleID", String(employee.Role.ID));
        }
      } else {
        // แก้ไขโดยผู้ดูแล → ใช้ค่าที่เลือกจาก Select
        if (values.roleID != null) {
          formData.append("roleID", String(values.roleID));
        }
      }

      if (uploadFile) formData.append("profile", uploadFile);

      setLoading(true);
      await UpdateManageEmployeeByID(employee.ID, formData);
      message.success("แก้ไขข้อมูลสำเร็จ");
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return;

      const status = err?.response?.status;

      if (status === 409 && err?.response?.data?.errors) {
        const fieldErrors = Object.entries(err.response.data.errors).map(
          ([field, msg]) => ({
            name: field,
            errors: [msg as string],
          })
        );
        form.setFields(fieldErrors);
        return;
      }

      const msg =
        err?.response?.data?.error || err?.message || "แก้ไขข้อมูลไม่สำเร็จ";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ antd v5: ใช้ options เพื่อความเสถียร (+ search)
  const roleOptions = useMemo(
    () =>
      (roles ?? [])
        .filter((r) => r?.ID != null)
        .map((r) => ({
          label: r.RoleName,
          value: r.ID,
        })),
    [roles]
  );

  const positionOptions = useMemo(() => {
    const source =
      positionsState && positionsState.length > 0 ? positionsState : positions;
    return (source ?? [])
      .filter((p) => p?.ID != null)
      .map((p) => ({
        label: p.Position,
        value: p.ID,
      }));
  }, [positionsState, positions]);

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
    >
      <div className="w-full flex items-center justify-center my-6">
        <label
          htmlFor="employee-edit-profile-input"
          className="w-28 h-28 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <CameraOutlined className="text-lg text-teal-600" />
          )}
        </label>
        <input
          id="employee-edit-profile-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
      </div>

      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="ชื่อ"
              rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="นามสกุล"
              rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="อีเมล"
              rules={[
                { required: true, message: "กรุณากรอกอีเมล" },
                { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="password" label="รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)">
              <Input.Password />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="เบอร์โทร"
              rules={[{ required: true, message: "กรุณากรอกเบอร์โทรศัพท์" }]}
            >
              <Input maxLength={10} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="positionID"
              label="ตำแหน่ง"
              rules={[{ required: true, message: "กรุณาเลือกตำแหน่ง" }]}
            >
              <Select
                placeholder="เลือกตำแหน่ง"
                options={positionOptions}
                loading={positionsLoading}
                showSearch
                optionFilterProp="label"
                allowClear
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
              />
            </Form.Item>
          </Col>
        </Row>

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
              {employee?.Role?.RoleName}
            </div>
          </Form.Item>
        ) : (
          <Form.Item
            name="roleID"
            label="สิทธิ์"
            rules={[{ required: true, message: "กรุณากำหนดสิทธิการใช้งาน" }]}
          >
            <Select
              placeholder="เลือกสิทธิ์"
              options={roleOptions}
              loading={rolesLoading}
              showSearch
              optionFilterProp="label"
              allowClear
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default EmployeeEditModal;
