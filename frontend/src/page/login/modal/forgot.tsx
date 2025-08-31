import { useState } from "react";
import { message } from "antd";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { CheckEmail, ResetPassword } from "../../../services/httpLogin";

const ForgotPassword = ({ handleBack }: any) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCheckEmail = async () => {
    if (!email) {
      messageApi.warning("กรุณากรอกอีเมล");
      return;
    }
    setLoading(true);
    const res = await CheckEmail(email);
    setLoading(false);

    if (res && res.exists) {
      setEmailChecked(true);
    } else {
      messageApi.error("ไม่พบอีเมลนี้ในระบบ");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      messageApi.warning("กรุณากรอกรหัสผ่านให้ครบ");
      return;
    }
    if (newPassword !== confirmPassword) {
      messageApi.warning("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const res = await ResetPassword({ email, newPassword });
    setLoading(false);

    if (res) {
      messageApi.success("รีเซ็ตรหัสผ่านสำเร็จ! โปรดเข้าสู่ระบบใหม่");
      setTimeout(() => {
        handleBack();
      }, 1500);
    } else {
      messageApi.error("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-2 sm:px-4 md:px-6">
      {contextHolder}
      <div className="flex items-center gap-2 mb-4">
        <FaLock className="text-teal-600 text-xl" />
        <h2 className="text-2xl font-semibold text-teal-700">ลืมรหัสผ่าน</h2>
      </div>
      <p className="text-sm text-teal-500 mb-6">
        กรุณากรอกอีเมลของคุณเพื่อตั้งรหัสผ่านใหม่
      </p>

      {!emailChecked ? (
        <div className="flex flex-col gap-4">
          {/* Email Input */}
          <div>
            <label htmlFor="forgot-email" className="block text-xs text-teal-700 font-medium mb-1">
              อีเมล
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-300 text-lg">
                <FaEnvelope />
              </span>
              <input
                id="forgot-email"
                type="email"
                className="w-full rounded-lg border border-teal-200 pl-10 pr-3 py-2 text-sm bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Button Check Email */}
          <button
            type="button"
            onClick={handleCheckEmail}
            className={`
              mt-2 w-full flex items-center justify-center
              bg-gradient-to-r from-cyan-400 to-teal-600
              text-white py-2 rounded-full text-base font-semibold
              shadow-md hover:from-cyan-500 hover:to-teal-700 transition
              ${loading ? "opacity-70 cursor-not-allowed" : ""}
            `}
            disabled={loading}
          >
            {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบอีเมล"}
          </button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-xs text-teal-700 font-medium mb-1">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-300 text-lg">
                <FaLock />
              </span>
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                className="w-full rounded-lg border border-teal-200 pl-10 pr-10 py-2 text-sm bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300 transition"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <span
                className="absolute top-2 right-3 text-lg text-teal-400 cursor-pointer"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-xs text-teal-700 font-medium mb-1">
              ยืนยันรหัสผ่านใหม่
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-300 text-lg">
                <FaLock />
              </span>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="w-full rounded-lg border border-teal-200 pl-10 pr-10 py-2 text-sm bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300 transition"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span
                className="absolute top-2 right-3 text-lg text-teal-400 cursor-pointer"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          {/* Button Reset */}
          <button
            type="submit"
            className={`
              mt-4 w-full flex items-center justify-center
              bg-gradient-to-r from-teal-400 to-teal-600
              text-white py-2 rounded-full text-base font-semibold
              shadow-md hover:from-teal-500 hover:to-teal-700 transition
              ${loading ? "opacity-70 cursor-not-allowed" : ""}
            `}
            disabled={loading}
          >
            {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
          </button>
        </form>
      )}

      {/* Back to login */}
      <div
        onClick={handleBack}
        className="text-center mt-4 text-sm text-teal-600 hover:underline cursor-pointer"
      >
        กลับไปเข้าสู่ระบบ
      </div>
    </div>
  );
};

export default ForgotPassword;
