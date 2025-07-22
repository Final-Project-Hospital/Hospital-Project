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
      className="min-h-screen flex justify-center items-center bg-gradient-to-br from-teal-50 to-cyan-50 px-2"
    >
      {contextHolder}
      <div className="w-full flex justify-center items-center">
        <Card
          className="
            w-full max-w-[430px] 
            rounded-2xl 
            shadow-lg 
            border 
            border-teal-200 
            p-6 
            sm:p-10 
            bg-white
            mx-2
          "
          bodyStyle={{ padding: 0 }}
        >
          <div className="flex flex-col items-center w-full">
            <div className="text-xl md:text-2xl font-bold mb-3 text-teal-600">
              Login Role <span className="text-teal-700">Guest</span>
            </div>
            <div className="text-gray-500 mb-6 text-base md:text-lg">
              Welcome,{" "}
              <span className="font-semibold bg-gradient-to-r from-teal-400 to-teal-700 bg-clip-text text-transparent">
                {FirstName} {LastName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="
                w-full py-3 text-base md:text-lg font-semibold rounded-full
                shadow-md transition
                bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600
                text-white hover:from-teal-500 hover:to-teal-700 active:scale-95
                outline-none focus:ring-2 focus:ring-teal-300
              "
              style={{ marginTop: 8 }}
            >
              ออกจากระบบ
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserIndex;
