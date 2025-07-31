import { useState, useEffect } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { Button } from '.'; // ปุ่ม custom
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useStateContext } from '../../contexts/ContextProvider';
import avatar from '../../assets/admin/avatar3.png';
import './FlowerButton.css';
import { GetUserDataByUserID } from '../../services/httpLogin';
import { AiOutlineUser } from 'react-icons/ai';

const UserProfile = () => {
  const { currentColor } = useStateContext();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [profileImg, setProfileImg] = useState<string>(avatar);//@ts-ignore
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

  const userProfileData = [
    {
      icon: <AiOutlineUser />,
      title: 'ข้อมูลส่วนตัว',
      desc: 'เเก้ไขข้อมูล',
      iconColor: '#03C9D7',
      iconBg: '#E5FAFB',
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const id = Number(localStorage.getItem("employeeid"));
      if (!id || isNaN(id)) {
        console.error("ไม่มีหรือ ID ไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      const res = await GetUserDataByUserID(id);
      if (res !== false && res) {
        setFullName(`${res.FirstName} ${res.LastName}`);
        setPositionName(res.Position?.Position ?? 'ไม่มีพบอาชีพ');
        setRoleName(res.Role?.RoleName ?? 'ไม่มีพบตำแหน่ง');
        setEmailUser(`${res.Email}`);
        // ถ้ามีรูปใช้ profile base64, ถ้าไม่มี fallback เป็น avatar
        if (res.Profile && typeof res.Profile === "string" && res.Profile.length > 10) {
          setProfileImg(res.Profile);
        } else {
          setProfileImg(avatar);
        }
      } else {
        setProfileImg(avatar);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  return (
    <div className="nav-item absolute right-1 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-lg text-white px-3 py-1 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-500 dark:text-gray-200">
          {roleName || 'User Profile'}
        </p>
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
          className="rounded-full h-24 w-24 object-cover"
          src={profileImg}
          alt="user-profile"
          onError={(e) => { (e.target as HTMLImageElement).src = avatar }}
        />
        <div>
          <p className="font-semibold text-xl dark:text-gray-200"> {fullName || 'ผู้ใช้'} </p>
          <p className="text-gray-500 text-sm dark:text-gray-400">ตำเเหน่ง :  {positionName || 'ไม่มีพบอาชีพ'} </p>
          <p className="text-gray-500 text-sm font-semibold dark:text-gray-400">อีเมลล์ : {emailUser || 'ไม่มีพบอีเมล'} </p>
        </div>
      </div>
      <div>
        {userProfileData.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate('/admin/profile')}
            className="flex gap-5 border-b-1 border-color p-4 hover:bg-light-gray cursor-pointer dark:hover:bg-[#42464D]"
          >
            <button
              type="button"
              style={{ color: item.iconColor, backgroundColor: item.iconBg }}
              className="text-xl rounded-lg p-3 hover:bg-light-gray"
            >
              {item.icon}
            </button>
            <div>
              <p className="font-semibold dark:text-gray-200">{item.title}</p>
              <p className="text-gray-500 text-sm dark:text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
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
    </div>
  );
};

export default UserProfile;
