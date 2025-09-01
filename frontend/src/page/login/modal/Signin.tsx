// 📁 component/auth/Signin.tsx
import { useState } from "react";
import { message, Form, Upload, Input, Button } from "antd";
import ImgCrop from "antd-img-crop";
import { PlusOutlined } from "@ant-design/icons";
import { FaUser, FaUserPlus, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
import { SignupUser, SignupInput } from "../../../services/httpLogin";
import type { UsersInterface } from "../../../interface/IUser";

function getBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

const Signin = ({ handleSignIn }: any) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const onPreview = async (file: any) => {
    let src = file.url;
    if (!src && file.originFileObj) {
      src = await getBase64(file.originFileObj);
    }
    window.open(src, "_blank");
  };

  const onChange = ({ fileList: newFileList }: any) => setFileList(newFileList);

  const onFinish = async (values: any) => {
    if (!fileList.length) {
      messageApi.error("กรุณาอัปโหลดรูปโปรไฟล์");
      return;
    }
    setLoading(true);
    const file = fileList[0]?.originFileObj;
    let base64 = "";
    if (file) {
      base64 = await getBase64(file);
    }

    const signupInput: SignupInput = {
      FirstName: values.FirstName,
      LastName: values.LastName,
      Email: values.Email,
      Phone: values.Phone || "",
      Password: values.Password,
      Profile: base64,
      PositionID: Number(values.PositionID) || 1,
    };

    try {//@ts-ignore
      const res: UsersInterface = await SignupUser(signupInput);
      setLoading(false);

      messageApi.success("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      setTimeout(() => handleSignIn(), 1000);
    } catch (error: any) {
      setLoading(false);

      const status = error?.response?.status;

      // ✅ รองรับ error หลาย field (Email + Phone)
      if (status === 409 && error?.response?.data?.errors) {
        const fieldErrors = Object.entries(error.response.data.errors).map(
          ([field, msg]) => ({
            name: field,
            errors: [msg as string],
          })
        );
        form.setFields(fieldErrors); // แสดง error ใต้ช่อง input
        return;
      }

      let errMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "เกิดข้อผิดพลาดในการสมัครสมาชิก";

      messageApi.warning(errMsg);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-2 sm:px-4 md:px-0">
      {contextHolder}

      {/* Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3">
          <FaUserPlus className="text-teal-600 text-3xl mb-3" />
          <h1 className="text-2xl md:text-2xl text-teal-700 font-bold">
            สมัครสมาชิก
          </h1>
        </div>
      </div>

      <div className="flex justify-center">
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          className="w-full"
          autoComplete="off"
        >
          {/* Upload Profile */}
          <Form.Item
            name="Profile"
            className="mb-3 flex justify-center"
            valuePropName="fileList"
            getValueFromEvent={({ fileList }) => fileList}
            rules={[
              {
                validator: () =>
                  fileList.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error("กรุณาอัปโหลดรูปโปรไฟล์")),
              },
            ]}
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
                    <div className="mt-2 text-xs text-teal-600">อัปโหลดรูป</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>

          {/* Firstname - Lastname */}
          <div className="flex gap-4 mb-3">
            <Form.Item
              name="FirstName"
              label="ชื่อ"
              className="w-1/2 mb-0"
              rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
            >
              <Input
                prefix={<FaUser className="text-teal-400 mr-2" />}
                className="rounded-lg bg-teal-50 border-teal-200"
              />
            </Form.Item>
            <Form.Item
              name="LastName"
              label="นามสกุล"
              className="w-1/2 mb-0"
              rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
            >
              <Input
                prefix={<FaUser className="text-teal-400 mr-2" />}
                className="rounded-lg bg-teal-50 border-teal-200"
              />
            </Form.Item>
          </div>

          {/* Email - Password */}
          <div className="flex gap-4 mb-3">
            <Form.Item
              name="Email"
              label="อีเมล"
              className="w-1/2 mb-0"
              rules={[
                { required: true, message: "กรุณากรอกอีเมล" },
                { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
              ]}
            >
              <Input
                prefix={<FaEnvelope className="text-teal-400 mr-2" />}
                className="rounded-lg bg-teal-50 border-teal-200"
              />
            </Form.Item>
            <Form.Item
              name="Password"
              label="รหัสผ่าน"
              className="w-1/2 mb-0"
              rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
            >
              <Input.Password
                prefix={<FaLock className="text-teal-400 mr-2" />}
                className="rounded-lg bg-teal-50 border-teal-200"
                autoComplete="new-password"
              />
            </Form.Item>
          </div>

          {/* Phone */}
          <Form.Item
            name="Phone"
            label="เบอร์โทรศัพท์"
            className="mb-3"
            rules={[
              { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
              {
                validator: (_, value) => {
                  if (!value || value.trim() === "") {
                    return Promise.resolve();
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
              prefix={<FaPhone className="text-teal-400 mr-2" />}
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

          {/* Button */}
          <Button
            htmlType="submit"
            type="primary"
            className="
              mt-4 w-full
              bg-gradient-to-r from-teal-400 to-teal-600
              text-white py-5 rounded-full text-base font-semibold
              shadow-md hover:from-teal-500 hover:to-teal-700 transition
              disabled:opacity-60
            "
            loading={loading}
            block
          >
            {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
          </Button>
        </Form>
      </div>

      {/* Link to Login */}
      <p
        className="text-center text-teal-500 text-sm my-2 hover:text-teal-700 cursor-pointer"
        onClick={handleSignIn}
      >
        มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
      </p>
    </div>
  );
};

export default Signin;
