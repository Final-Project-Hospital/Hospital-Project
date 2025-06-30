import { message } from "antd";
import { useNavigate } from "react-router-dom";

const index = () => {

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("isLogin");
        localStorage.removeItem("Role");
        localStorage.clear();

        message.success("ออกจากระบบ");

        setTimeout(() => {
            navigate("/login");
        }, 3500);
    };

    return (
        <div></div>
    )
}

export default index