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
        <>
            <div>Users Page</div>
            <button onClick={handleLogout}>Logout</button>
        </>
    )
}

export default index