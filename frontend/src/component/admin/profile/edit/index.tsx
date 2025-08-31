// 📁 component/users/EditUserModal.tsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, message, Row, Col } from "antd";
import ImgCrop from "antd-img-crop";
import {
  PlusOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { UsersInterface } from "../../../../interface/IUser";
import { UpdateEmployeeByID } from "../../../../services/httpLogin";
import { EditOutlined } from "@ant-design/icons";

interface EditUserModalProps {
  show: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData: UsersInterface;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  show,
  onClose,
  onSaveSuccess,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      form.setFieldsValue({
        FirstName: initialData.FirstName,
        LastName: initialData.LastName,
        Phone: initialData.Phone,
        Email: initialData.Email,
      });
      if (initialData.Profile) {
        setFileList([
          {
            uid: "-1",
            name: "profile.png",
            status: "done",
            url: initialData.Profile,
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [show, initialData, form]);

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onChange = ({ fileList: newFileList }: any) => setFileList(newFileList);

  const onPreview = async (file: any) => {
    let src = file.url;
    if (!src && file.originFileObj) {
      src = await getBase64(file.originFileObj);
    }
    window.open(src, "_blank");
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    let base64: string | undefined;
    if (fileList.length > 0 && fileList[0].originFileObj) {
      base64 = await getBase64(fileList[0].originFileObj);
    } else if (fileList.length > 0 && fileList[0].url && fileList[0].uid === "-1") {
      base64 = fileList[0].url;
    } else {
      base64 = undefined;
    }

    try {
      const res = await UpdateEmployeeByID(initialData.ID!, {
        FirstName: values.FirstName,
        LastName: values.LastName,
        Phone: values.Phone,
        Email: values.Email,
        Profile: base64,
      });

      setLoading(false);

      if (res) {
        message.success("อัปเดตข้อมูลสำเร็จ");
        onSaveSuccess();
        onClose();
      }
    } catch (err: any) {
      setLoading(false);

      const status = err?.response?.status;

      // ✅ รองรับ error หลาย field
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

      let msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "เกิดข้อผิดพลาดในการอัปเดต";
      message.warning(msg);
    }
  };

  if (!show) return null;

  return (
    <Modal
      open={show}
      onCancel={onClose}
      title={null}
      footer={null}
      centered
      destroyOnClose
      closable={false}
      className="edit-user-modal"
      style={{ top: window.innerWidth < 768 ? 40 : 0 }}
      bodyStyle={{
        background: "white",
        padding: 0,
        borderRadius: 16,
        boxShadow: "none",
      }}
    >
      {/* Header */}
      <div className="text-center text-lg font-bold bg-teal-600 text-white py-4 rounded-t-2xl flex items-center justify-center gap-2">
        <EditOutlined className="text-2xl" />
        <span className="tracking-wide">แก้ไขข้อมูลโปรไฟล์</span>
      </div>

      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
        className="px-8 pt-2 pb-6"
        style={{ background: "white" }}
      >
        {/* Upload Profile */}
        <div className="flex justify-center mb-6">
          <Form.Item
            name="profile"
            valuePropName="fileList"
            getValueFromEvent={({ fileList }) => fileList}
            className="mb-0"
          >
            <ImgCrop rotationSlider>
              <Upload
                fileList={fileList}
                onChange={onChange}
                onPreview={onPreview}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith("image/");
                  if (!isImage) {
                    message.error("กรุณาอัปโหลดไฟล์รูปภาพ");
                    return Upload.LIST_IGNORE;
                  }
                  setFileList([file]);
                  return false;
                }}
                maxCount={1}
                listType="picture-circle"
                accept="image/*"
                className="flex justify-center"
              >
                {fileList.length < 1 && (
                  <div className="flex flex-col items-center">
                    <PlusOutlined style={{ fontSize: 32, color: "#14b8a6" }} />
                    <div className="mt-2 text-xs text-teal-600">Upload</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
        </div>

        {/* FirstName + LastName */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={
                <span>
                  <UserOutlined className="mr-1 text-teal-600" />
                  ชื่อ
                </span>
              }
              name="FirstName"
              rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
            >
              <Input placeholder="กรอกชื่อ" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={
                <span>
                  <UserOutlined className="mr-1 text-teal-600" />
                  นามสกุล
                </span>
              }
              name="LastName"
              rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
            >
              <Input placeholder="กรอกนามสกุล" />
            </Form.Item>
          </Col>
        </Row>

        {/* Email */}
        <Form.Item
          label={
            <span>
              <MailOutlined className="mr-1 text-teal-600" />
              อีเมล
            </span>
          }
          name="Email"
          rules={[
            {
              validator: (_, value) => {
                if (!value || value.trim() === "") {
                  return Promise.reject(new Error("กรุณากรอกอีเมล"));
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                  return Promise.reject(new Error("รูปแบบอีเมลไม่ถูกต้อง"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="กรอกอีเมล" />
        </Form.Item>

        {/* Phone */}
        <Form.Item
          name="Phone"
          label={
            <span>
              <PhoneOutlined className="mr-1 text-teal-600" />
              เบอร์โทรศัพท์
            </span>
          }
          className="mb-3"
          rules={[
            {
              validator: (_, value) => {
                if (!value || value.trim() === "") {
                  return Promise.reject(new Error("กรุณากรอกเบอร์โทรศัพท์"));
                }
                if (!/^[0][0-9]{9}$/.test(value)) {
                  return Promise.reject(
                    new Error("เบอร์โทรต้องมี 10 หลัก และขึ้นต้นด้วย 0")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            maxLength={10}
            className="rounded-lg bg-teal-50 border-teal-200"
          />
        </Form.Item>

        <div className="flex justify-end gap-4 mt-6">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              background: "linear-gradient(to right, #14b8a6, #0d9488)",
              borderColor: "#0d9488",
            }}
          >
            บันทึก
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditUserModal;
