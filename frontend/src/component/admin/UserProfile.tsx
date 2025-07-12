import { useState, useEffect } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { Button } from '.';
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useStateContext } from '../../contexts/ContextProvider';
import avatar from '../../assets/admin/avatar3.png';
import './FlowerButton.css'; // นำเข้า CSS
import { GetUserDataByUserID } from '../../services/httpLogin';

const UserProfile = () => {
  const { currentColor } = useStateContext();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const handleLogout = () => {
    localStorage.removeItem("isLogin");
    localStorage.removeItem("Role");
    localStorage.clear();

    message.success("ออกจากระบบ");

    setTimeout(() => {
      navigate("/login");
    }, 3500);
  };
  useEffect(() => {
    const fetchUser = async () => {
      const id = Number(localStorage.getItem("employeeid")); // ดึงจาก localStorage
      if (!id || isNaN(id)) {
        console.error("ไม่มีหรือ ID ไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const res = await GetUserDataByUserID(id);
      if (res !== false) {
        setFullName(`${res.FirstName} ${res.LastName}`);
        setPositionName(res.Position?.Position ?? 'ไม่มีพบอาชีพ');
        setRoleName(res.Role?.RoleName ?? 'ไม่มีพบตำแหน่ง');
        setEmailUser(`${res.Email}`)
      }
      setLoading(false);
    };

    fetchUser();
  }, []);
  if (loading) return <div>กำลังโหลดข้อมูลผู้ใช้...</div>;
  if (!fullName) return <div>ไม่พบข้อมูลผู้ใช้</div>;
  // useEffect(() => {
  //   const firstName = localStorage.getItem('firstnameuser') || '';
  //   const lastName = localStorage.getItem('lastnameuser') || '';
  //   setRoleName(localStorage.getItem('roleName') || '');
  //   setPositionName(localStorage.getItem('positionuser') || '');
  //   setEmailUser(localStorage.getItem('emailuser') || '');
  //   setFullName(`${firstName} ${lastName}`);
  // }, []);

  return (
    <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-lg dark:text-gray-200">User Profile</p>
        <Button
          icon={<MdOutlineCancel />}
          color="rgb(153, 171, 180)"
          bgHoverColor="light-gray"
          size="2xl"
          borderRadius="50%"
        />
      </div>
      <div className="flex gap-5 items-center mt-6 border-color border-b-1 pb-6">
        <img
          className="rounded-full h-24 w-24"
          src={avatar}
          alt="user-profile"
        />
        <div>
          <p className="font-semibold text-xl dark:text-gray-200"> {fullName || 'ผู้ใช้'} </p>
          <p className="text-gray-500 text-sm dark:text-gray-400">  {roleName|| 'ไม่มีพบตำแหน่ง' } </p>
          <p className="text-gray-500 text-sm dark:text-gray-400">  {positionName|| 'ไม่มีพบอาชีพ' } </p>
          <p className="text-gray-500 text-sm font-semibold dark:text-gray-400"> {emailUser|| 'ไม่มีพบอีเมล' } </p>
        </div>
      </div>
      <div className="mt-5">
        <Button
          color="white"
          bgColor={currentColor}
          text="Logout"
          borderRadius="10px"
          width="full"
          onClick={handleLogout}
        />
      </div>
      {/* <div className="flower-wrapper">
        <button className="btn" onClick={handleLogout}>
          <div className="wrapper">
            <p className="text">Flowers</p>

            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div className={`flower flower${num}`} key={num}>
                <div className="petal one" />
                <div className="petal two" />
                <div className="petal three" />
                <div className="petal four" />
              </div>
            ))}
          </div>
        </button>
      </div> */}
    </div>

  );
};

export default UserProfile;
