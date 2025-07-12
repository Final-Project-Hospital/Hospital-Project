import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash, FaLinkedinIn } from "react-icons/fa";
import { message } from "antd";
import { AddLogin, GetUserDataByUserID } from "../../../services/httpLogin";
import { LoginInterface } from "../../../interface/Login";

const Login = ({ handleSignIn }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  const clickLoginbt = async (datalogin: LoginInterface) => {
    let res = await AddLogin(datalogin);
    console.log(res.data)
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
          const UsersID = await GetUserDataByUserID(Number(userID));
          console.log(UsersID)
          if (UsersID !== null && UsersID !== undefined) {
            // localStorage.setItem("employeeid", UsersID.toString());
          }
        } catch (error) {
          console.error("Failed to fetch UsersID:", error);
        }
      }
      messageApi.success(`เข้าสู่ระบบในฐานะ ${RoleName} สำเร็จ`);
      setTimeout(() => {
        if (RoleName === "Admin") {
          window.location.href = "/admin";
        } else if (RoleName === "User") {
          window.location.href = "/user";
        }
      }, 500);
    } else {
      messageApi.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
    }
    
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      messageApi.warning("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    const datalogin: LoginInterface = {
      email: email.trim(),
      password: password,
    };

    await clickLoginbt(datalogin);
  };
  

  return (
    <>
      {contextHolder}
      <div className="p-4">
        <h1 className="text-2xl text-gray-600 font-semibold text-center mb-4">
          Log in
        </h1>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="login-input-label">
              Email
            </label>
            <input
              id="email"
              type="text"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="login-input-label">
              Password
            </label>
            <div className="relative">
              <input
                className="login-input pr-8"
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {showPassword ? (
                <FaEye
                  className="text-gray-500 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <FaEyeSlash
                  className="text-gray-500 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white py-1 px-5 rounded-full mt-7 block w-full hover:bg-blue-500/80 login-transition-200"
          >
            Submit
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm my-3">or login with</p>
        <div className="flex gap-4 justify-center">
          <FcGoogle className="text-2xl grayscale hover:grayscale-0 login-transition-200" />
          <FaLinkedinIn className="text-2xl text-gray-600 hover:text-blue-600 login-transition-200" />
        </div>

        <p
          className="text-center text-gray-500 text-sm my-3 hover:text-blue-700 cursor-pointer"
          onClick={handleSignIn}
        >
          No Account? Create Signup here
        </p>
      </div>
    </>
  );
};

export default Login;
