import { useNavigate } from "react-router-dom";
import { message, Card } from "antd";

const UserIndex = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogout = () => {
    localStorage.removeItem("isLogin");
    localStorage.removeItem("userRole");
    localStorage.clear();

    messageApi.success("Logout");

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const FirstName = localStorage.getItem("firstnameuser") || "User";
  const LastName = localStorage.getItem("lastnameuser") || "User";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e6fffa 0%, #f0fdfa 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {contextHolder}
      <Card
        style={{
          width: 460,
          borderRadius: 18,
          boxShadow: "0 1px 10px rgba(0, 160, 146, 0.13)",
          textAlign: "center",
          padding: "36px 20px 28px 20px",
          background: "#fff",
          border: "1.5px solid #5eead4",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 14,
            color: "#14b8a6",
            letterSpacing: 0.2,
          }}
        >
          Login Role <span style={{ color: "#0d9488" }}>Guest</span>
        </div>
        <div style={{ color: "#64748b", marginBottom: 30, fontSize: 16 }}>
          Welcome,{" "}
          <span
            style={{
              color: "#0d9488",
              fontWeight: 600,
              background: "linear-gradient(90deg, #5eead4 0%, #2dd4bf 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {FirstName} {LastName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="
            w-full py-2 text-lg font-semibold rounded-full
            shadow-md transition
            bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600
            text-white hover:from-teal-500 hover:to-teal-700 active:scale-95
            outline-none focus:ring-2 focus:ring-teal-300
          "
          style={{ marginTop: 8 }}
        >
          ออกจากระบบ
        </button>
      </Card>
    </div>
  );
};

export default UserIndex;
