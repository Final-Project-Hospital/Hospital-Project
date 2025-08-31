import { useState } from "react";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { message, Spin } from "antd";
import { AddLogin, GetUserDataByUserID } from "../../../services/httpLogin";
import { LoginInterface } from "../../../interface/Login";
import LogoLogin from "../../../assets/Logo Environment Login.png";

const Login = ({ handleSignIn, handleForgot }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const clickLoginbt = async (datalogin: LoginInterface) => {
    setLoading(true);
    let res = await AddLogin(datalogin);

    if (res.status === 200) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("token_type", res.data.token_type);
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("roleName", res.data.Role.RoleName);
      localStorage.setItem("emailuser", res.data.Email);
      localStorage.setItem("positionuser", res.data.Position.Position);
      localStorage.setItem("employeeid", res.data.EmployeeID);
      localStorage.setItem("firstnameuser", res.data.FirstNameUser);
      localStorage.setItem("lastnameuser", res.data.LastNameUser);

      const RoleName = res.data.Role.RoleName;
      const userID = res.data.EmployeeID;

      if (userID && RoleName !== "User") {
        try {
          await GetUserDataByUserID(Number(userID));
        } catch (error) {
          console.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้:", error);
        }
      }
      messageApi.success(`เข้าสู่ระบบในฐานะ ${RoleName} สำเร็จ`);
      setTimeout(() => {
        setLoading(false);
        if (RoleName === "Admin") {
          window.location.href = "/admin";
        } else if (RoleName === "Employee") {
          window.location.href = "/admin";
        } else if (RoleName === "Guest") {
          window.location.href = "/guest";
        }
      }, 500);
    } else {
      setLoading(false);
      messageApi.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      messageApi.warning("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    const datalogin: LoginInterface = { email: email.trim(), password: password };
    await clickLoginbt(datalogin);
  };

  return (
    <>
      {contextHolder}
      <div className="w-full max-w-lg mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-8">
            <img
              src={LogoLogin}
              alt="icon"
              className="w-56 h-56 md:w-64 md:h-20"
              style={{ objectFit: "contain" }}
            />
          </div>
          <h2 className="text-3xl font-semibold text-teal-700 mb-1">เข้าสู่ระบบ</h2>
          <p className="text-teal-400 text-base">โปรดเข้าสู่ระบบด้วยบัญชีของคุณ</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} autoComplete="off">
          {/* อีเมล */}
          <div>
            <label htmlFor="email" className="block text-xs text-teal-700 font-medium mb-1">
              อีเมล
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-300 text-lg">
                <FaEnvelope />
              </span>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-teal-200 pl-10 pr-3 py-2 text-sm bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* รหัสผ่าน */}
          <div>
            <label htmlFor="password" className="block text-xs text-teal-700 font-medium mb-1">
              รหัสผ่าน
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-300 text-lg">
                <FaLock />
              </span>
              <input
                className="w-full rounded-lg border border-teal-200 pl-10 pr-10 py-2 text-sm bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300 transition"
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <span
                className="absolute top-2 right-3 text-lg text-teal-400 cursor-pointer"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          </div>

          <div className="flex justify-end text-xs mt-1">
            <span
              onClick={handleForgot}
              className="text-teal-500 hover:underline cursor-pointer"
            >
              ลืมรหัสผ่าน?
            </span>
          </div>

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
            {loading ? (
              <span className="flex items-center gap-2">
                <Spin size="small" className="!text-white" />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-base text-teal-400">
          ยังไม่มีบัญชีใช่หรือไม่?{" "}
          <span
            className="text-teal-600 hover:underline cursor-pointer font-bold"
            onClick={handleSignIn}
          >
            สมัครสมาชิก
          </span>
        </div>
      </div>
    </>
  );
};

export default Login;
