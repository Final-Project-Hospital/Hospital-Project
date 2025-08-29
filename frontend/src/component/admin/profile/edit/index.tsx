// 📁 component/users/EditUserModal.tsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, message } from "antd";
import ImgCrop from "antd-img-crop";
import { PlusOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
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
        Email: initialData.Email, // ✅ set ค่า email ด้วย
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

  const onChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

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

    const res = await UpdateEmployeeByID(initialData.ID!, {
      FirstName: values.FirstName,
      LastName: values.LastName,
      Phone: values.Phone,
      Email: values.Email, // ✅ ส่งค่า email ไป backend
      Profile: base64,
    });

    setLoading(false);

    if (res) {
      message.success("อัปเดตข้อมูลสำเร็จ");
      onSaveSuccess();
      onClose();
    } else {
      message.error("เกิดข้อผิดพลาดในการอัปเดต");
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
      bodyStyle={{
        background: "white",
        padding: 0,
        borderRadius: 16,
        boxShadow: "none",
      }}
    >
      {/* Header */}
      <div className="text-center text-lg font-bold bg-teal-600 text-white py-4 rounded-t-2xl mb-2 flex items-center justify-center gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
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
        </div>

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
            { required: true, message: "กรุณากรอกอีเมล" },
            { type: "email", message: "กรุณากรอกอีเมลให้ถูกต้อง" },
          ]}
        >
          <Input placeholder="กรอกอีเมล" />
        </Form.Item>

        {/* Phone */}
        <Form.Item
          name="Phone"
          label="เบอร์โทรศัพท์"
          className="mb-3"
          rules={[
            { required: false },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                if (!/^[0][0-9]{9}$/.test(value))
                  return Promise.reject(
                    new Error("เบอร์โทรต้องมี 10 หลัก และขึ้นต้นด้วย 0")
                  );
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            className="rounded-lg bg-teal-50 border-teal-200"
            maxLength={10}
            onChange={(e) => {
              const rawValue = e.target.value;
              const cleaned = rawValue.replace(/\D/g, "");
              if (cleaned.length === 0 || cleaned.startsWith("0")) {
                e.target.value = cleaned;
              } else {
                e.target.value = "0" + cleaned.slice(0, 9);
              }
            }}
          />
        </Form.Item>

        <div className="flex justify-end gap-4 mt-6">
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-teal-600 hover:bg-teal-700 border-none"
          >
            บันทึก
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditUserModal;
