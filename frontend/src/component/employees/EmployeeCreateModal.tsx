// 📁 components/employees/EmployeeCreateModal.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Form, Input, Row, Col, Select, message } from "antd";
import { CameraOutlined, UserAddOutlined } from "@ant-design/icons";
import { PositionInterface } from "../../interface/IPosition";
import { RoleInterface } from "../../interface/IRole";
import { ListRole, CreateEmployee,ListPositions } from "../../services/httpLogin";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** สามารถส่งมาจาก parent ได้เป็น fallback แต่จะพยายามดึงจาก service เองก่อน */
  positions?: PositionInterface[];
};

const EmployeeCreateModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  positions = [],
}) => {
  const [form] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [positionsState, setPositionsState] = useState<PositionInterface[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const previewUrl = useMemo(
    () => (uploadFile ? URL.createObjectURL(uploadFile) : ""),
    [uploadFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const res = await ListRole(); // ต้องคืน role "ทั้งหมด" จากตาราง Role
      setRoles(Array.isArray(res) ? res : []);
    } catch (e) {
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
        setPositionsState(positions); // fallback
      }
    } catch (e) {
      console.error(e);
      message.error("โหลดรายการตำแหน่งไม่สำเร็จ");
      setPositionsState(positions); // fallback
    } finally {
      setPositionsLoading(false);
    }
  }, [positions]);

  useEffect(() => {
    if (!open) return;
    // โหลด roles & positions ทุกครั้งที่เปิด modal เพื่อให้รายการล่าสุด
    loadRoles();
    loadPositions();
    // เคลียร์ฟอร์มเมื่อเปิดใหม่
    form.resetFields();
    setUploadFile(undefined);
  }, [open, loadRoles, loadPositions, form]);

  const handleFileChange = (file?: File) => {
    if (!file) {
      setUploadFile(undefined);
      return;
    }
    if (!file.type.startsWith("image/")) {
      message.warning("กรุณาอัปโหลดไฟล์รูปภาพ");
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

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();

      const token = localStorage.getItem("token");
      if (!token) {
        message.error("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const formData = new FormData();
      // ตรงชื่อ key กับ backend: firstName, lastName, email, password, phone, positionID, roleID
      formData.append("firstName", String(values.firstName));
      formData.append("lastName", String(values.lastName));
      formData.append("email", String(values.email));
      formData.append("password", String(values.password));
      formData.append("phone", String(values.phone));
      if (values.positionID != null) formData.append("positionID", String(values.positionID));
      if (values.roleID != null) formData.append("roleID", String(values.roleID));
      if (uploadFile) formData.append("profile", uploadFile);

      setLoading(true);
      await CreateEmployee(formData);

      message.success("สร้างบัญชีสำเร็จ");
      form.resetFields();
      setUploadFile(undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // antd validation
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
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "สร้างบัญชีไม่สำเร็จ";
      message.warning(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ antd v5 options
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
        <UserAddOutlined className="text-teal-600" />
      </span>
      <span className="bg-gradient-to-r from-teal-600 to-cyan-400 bg-clip-text text-transparent font-semibold">
        สร้างบัญชีผู้ใช้งาน
      </span>
    </div>
  );

  return (
    <Modal
      title={TitleNode}
      open={open}
      onCancel={handleCancel}
      onOk={handleCreate}
      okText="สมัครบัญชี"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      destroyOnClose
    >
      {/* Upload Profile */}
      <div className="w-full flex items-center justify-center my-6">
        <div className="relative group">
          {uploadFile && (
            <button
              type="button"
              onClick={() => handleFileChange(undefined)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border text-gray-600 hover:text-red-500"
            >
              ×
            </button>
          )}
          <label
            htmlFor="employee-profile-input"
            className="w-28 h-28 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
          >
            {uploadFile ? (
              <img
                src={previewUrl}
                alt="profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="flex flex-col items-center">
                <CameraOutlined className="text-lg text-teal-600" />
                <span className="text-xs mt-2 text-teal-600">อัปโหลดรูป</span>
              </div>
            )}
          </label>
          <input
            id="employee-profile-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </div>
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
            <Form.Item
              name="password"
              label="รหัสผ่าน"
              rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
            >
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
      </Form>
    </Modal>
  );
};

export default EmployeeCreateModal;
