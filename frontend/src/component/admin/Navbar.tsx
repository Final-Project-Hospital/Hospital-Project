// src/component/admin/Navbar.tsx
import { useState, useEffect } from 'react';
import { AiOutlineMenu } from 'react-icons/ai';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';
import avatar from '../../assets/admin/avatar3.png';
import { RiNotification3Line } from 'react-icons/ri';
import { UserProfile } from '.';
import { Notification } from './Notification';
import { useStateContext } from '../../contexts/ContextProvider';
import { GetUserDataByUserID } from '../../services/httpLogin';
import { useRefresh } from './RefreshContext'; // <-- context ที่สร้างไว้

const NavButton = ({ title, customFunc, icon, color, dotColor }: any) => (
  <TooltipComponent content={title} position="BottomCenter">
    <button
      type="button"
      onClick={() => customFunc()}
      style={{ color }}
      className="relative text-xl rounded-full p-3 hover:bg-light-gray"
    >
      <span
        style={{ background: dotColor }}
        className="absolute inline-flex rounded-full h-2 w-2 right-2 top-2"
      />
      {icon}
    </button>
  </TooltipComponent>
);

const Navbar = () => {
  const {
    currentColor,
    activeMenu,
    setActiveMenu,
    handleClick,
    isClicked,
    setScreenSize,
    screenSize,
  } = useStateContext();

  const [fullName, setFullName] = useState('');
  const [profileImg, setProfileImg] = useState<string>(avatar); //@ts-ignore
  const [loading, setLoading] = useState<boolean>(true);

  // ใช้ refreshKey จาก context
  const { refreshKey } = useRefresh();

  useEffect(() => {
    const fetchUser = async () => {
      const id = Number(localStorage.getItem("employeeid"));
      if (!id || isNaN(id)) {
        setLoading(false);
        setProfileImg(avatar);
        setFullName("");
        return;
      }
      const res = await GetUserDataByUserID(id);
      if (res !== false && res) {
        setFullName(`${res.FirstName} ${res.LastName}`);
        if (res.Profile && typeof res.Profile === "string" && res.Profile.length > 10) {
          setProfileImg(res.Profile);
        } else {
          setProfileImg(avatar);
        }
      } else {
        setProfileImg(avatar);
        setFullName("");
      }
      setLoading(false);
    };

    fetchUser();
  }, [refreshKey]); // <<== refresh เมื่อค่าเปลี่ยน

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (screenSize !== undefined && screenSize <= 900) {
      setActiveMenu(false);
    } else {
      setActiveMenu(true);
    }
  }, [screenSize, setActiveMenu]);

  const handleActiveMenu = () => setActiveMenu(!activeMenu);

  return (
    <div className="flex justify-between p-2 md:ml-6 md:mr-6 relative">
      <NavButton
        title="Menu"
        customFunc={handleActiveMenu}
        color={currentColor}
        icon={<AiOutlineMenu />}
      />
<div className="flex">
  <NavButton
    title="Notification"
    dotColor="rgb(254, 201, 15)"
    customFunc={() => handleClick('notification')}
    color={currentColor}
    icon={<RiNotification3Line />}
  />
  <TooltipComponent content="Profile" position="BottomCenter">
    <div
      className="flex items-center gap-2 cursor-pointer p-1 hover:bg-light-gray rounded-lg"
      onClick={() => handleClick('userProfile')}
    >
      <img
        className="rounded-full w-10 h-10"
        src={profileImg}
        alt="user-profile"
        onError={(e) => { (e.target as HTMLImageElement).src = avatar }}
      />
      <span className="text-gray-400 font-bold ml-1 text-14">
        {fullName || 'ผู้ใช้'}
      </span>
      <MdKeyboardArrowDown className="text-gray-400 text-14" />
    </div>
  </TooltipComponent>
  {/* แยก rendering ตาม state */}
  {isClicked.notification && <Notification />}
  {isClicked.userProfile && <UserProfile />}
</div>
    </div>
  );
};

export default Navbar;
