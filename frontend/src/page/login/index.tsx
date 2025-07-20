import LoginPopup from "./modal/LoginPopup";
import BgImage from "../../assets/bg-image.jpg";
import Main from "./background";

const Login = () => {
  // กำหนด loginPopup ให้ true ตลอด ไม่ต้องใช้ state
  const loginPopup = true;

  const bgImage = {
    width: "100%",
    height: "100%",
    backgroundImage: `url(${BgImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <>
      <div className="blur-sm bg-black/30">
        <div style={bgImage}>
          <Main />
        </div>
      </div>

      <LoginPopup loginPopup={loginPopup} />
    </>
  );
};

export default Login;
