import { useState, useEffect } from 'react';
import { AiOutlineMenu } from 'react-icons/ai';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';
import avatar from '../../assets/admin/avatar3.png';
import { UserProfile } from '.';
import { useStateContext } from '../../contexts/ContextProvider';
import { GetUserDataByUserID } from '../../services/httpLogin';

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
  const { currentColor, activeMenu, setActiveMenu, handleClick, isClicked, setScreenSize, screenSize } = useStateContext();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
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
      }
      setLoading(false);
    };

    fetchUser();
  }, []);
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
  }, [screenSize]);
  // useEffect(() => {
  //   const firstName = localStorage.getItem('firstnameuser') || '';
  //   const lastName = localStorage.getItem('lastnameuser') || '';
  //   setFullName(`${firstName} ${lastName}`);
  // }, []);
  // if (loading) return <div>กำลังโหลดข้อมูลผู้ใช้...</div>;
  // if (!fullName) return <div>ไม่พบข้อมูลผู้ใช้</div>;

  const handleActiveMenu = () => setActiveMenu(!activeMenu);

  return (
    <div className="flex justify-between p-2 md:ml-6 md:mr-6 relative">

      <NavButton title="Menu" customFunc={handleActiveMenu} color={currentColor} icon={<AiOutlineMenu />} />
      <div className="flex">
        <TooltipComponent content="Profile" position="BottomCenter">
          <div
            className="flex items-center gap-2 cursor-pointer p-1 hover:bg-light-gray rounded-lg"
            onClick={() => handleClick('userProfile')}
          >
            <img
              className="rounded-full w-8 h-8"
              src={avatar}
              alt="user-profile"
            />
            <p>
              <span className="text-gray-400 font-bold ml-1 text-14">
                {fullName || 'ผู้ใช้'}
              </span>
            </p>
            <MdKeyboardArrowDown className="text-gray-400 text-14" />
          </div>
        </TooltipComponent>

        {isClicked.userProfile && (<UserProfile />)}
      </div>
    </div>
  );
};

export default Navbar;
