import { useState, useEffect } from "react";
import { message } from "antd";
import { LoginInterface } from "../../interface/Login";
import { AddLogin, GetUserDataByUserID } from "../../services/httpLogin";
import Logo_Login from "../../assets/car_login.svg";
import Logo_Regis from "../../assets/signup.svg";
import "./login.css";

function Login() {
  const [messageApi, contextHolder] = message.useMessage(); // @ts-ignore
  const [Slide, SetSlide] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const clickLoginbt = async (datalogin: LoginInterface) => {
    console.log("ก่อนLogin: ", datalogin);
    let res = await AddLogin(datalogin);
    console.log(res);
    console.log("หลังLogin: ", res);

    if (res.status === 200) {
      SetSlide(true);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("token_type", res.data.token_type);
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("roleName", res.data.UserRole.RoleName);
      localStorage.setItem("userid", res.data.UserID);
      localStorage.setItem("firstnameuser", res.data.FirstNameUser);
      localStorage.setItem("lastnameuser", res.data.LastNameUser);

      const RoleName = localStorage.getItem("roleName");
      const userID = localStorage.getItem("userid");
      console.log(userID);
      if (userID && RoleName !== "User") {
        try {
          const UsersID = await GetUserDataByUserID(Number(userID));
          console.log(UsersID);
          if (UsersID !== null && UsersID !== undefined) {
            localStorage.setItem("userid", UsersID.toString());
            console.log("UsersID saved to localStorage:", UsersID);
          } else {
            console.warn("UsersID is null or undefined.");
          }
        } catch (error) {
          console.error("Failed to fetch UsersID:", error);
        }
      }

      if (RoleName === "Admin") {
        messageApi.success("ท่านได้ทำการ เข้าสู่ระบบ " + RoleName + " สำเร็จ");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 100);
      } else if (RoleName === "User") {
        messageApi.success("ท่านได้ทำการ เข้าสู่ระบบ " + RoleName + " สำเร็จ");
        setTimeout(() => {
          window.location.href = "/user";
        }, 100);
      }
    } else {
      messageApi.open({
        type: "warning",
        content: "รหัสผ่านหรือข้อมูลผู้ใช้ไม่ถูกต้อง!! กรุณากรอกข้อมูลใหม่",
      });
    }
  };

  // ฟังก์ชัน submit form Sign In
  const handleSubmitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      messageApi.warning("กรุณากรอก Username และ Password ให้ครบ");
      return;
    }

    const datalogin: LoginInterface = {
      username: username.trim(),
      password: password,
    };



    await clickLoginbt(datalogin);
  };

  // จัดการ animation สลับ sign-in / sign-up
  useEffect(() => {
    const sign_in_btn = document.querySelector(
      "#sign-in-btn"
    ) as HTMLButtonElement | null;
    const sign_up_btn = document.querySelector(
      "#sign-up-btn"
    ) as HTMLButtonElement | null;
    const container = document.querySelector(".container") as HTMLElement | null;

    const handleSignUp = () => container?.classList.add("sign-up-mode");
    const handleSignIn = () => container?.classList.remove("sign-up-mode");

    sign_up_btn?.addEventListener("click", handleSignUp);
    sign_in_btn?.addEventListener("click", handleSignIn);

    return () => {
      sign_up_btn?.removeEventListener("click", handleSignUp);
      sign_in_btn?.removeEventListener("click", handleSignIn);
    };
  }, []);

  return (
    <div className="container">
      {contextHolder}

      <div className="forms-container">
        <div className="signin-signup">
          {/* ฟอร์ม Sign In */}
          <form onSubmit={handleSubmitSignIn} className="sign-in-form">
            <h2 className="title">Sign in</h2>
            <div className="input-field">
              <i className="fas fa-user"></i>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <input type="submit" value="Login" className="btn solid" />
            <p className="social-text">Welcome To My Website</p>
          </form>

          {/* ฟอร์ม Sign Up (ยังไม่ทำงานจริง) */}
          <form action="#" className="sign-up-form">
            <h2 className="title">Sign up</h2>
            <div className="input-field">
              <i className="fas fa-user"></i>
              <input type="text" placeholder="Username" />
            </div>
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input type="email" placeholder="Email" />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input type="password" placeholder="Password" />
            </div>
            <input type="submit" className="btn" value="Sign up" />
            <p className="social-text">Welcome To My Website</p>
          </form>
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>New here ?</h3>
            <p>
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis,
              ex ratione. Aliquid!
            </p>
            <button className="btn transparent" id="sign-up-btn">
              Sign up
            </button>
          </div>
          <img src={Logo_Login} className="image" alt="login img" />
        </div>
        <div className="panel right-panel">
          <div className="content">
            <h3>One of us ?</h3>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum
              laboriosam ad deleniti.
            </p>
            <button className="btn transparent" id="sign-in-btn">
              Sign in
            </button>
          </div>
          <img src={Logo_Regis} className="image" alt="register img" />
        </div>
      </div>
    </div>
  );
}

export default Login;
