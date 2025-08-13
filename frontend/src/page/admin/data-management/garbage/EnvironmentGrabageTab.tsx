import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Button } from 'antd';
import './EnvironmentGrabageTab.css'

const tabsRow1 = [
  { label: 'Chemica-Waste', path: '/admin/data-management/garbage/chemica' },
  { label: 'General-Waste', path: '/admin/data-management/garbage/general' },
  { label: 'Hazardous-Waste', path: '/admin/data-management/garbage/hazardous' },
  { label: 'Infectious-Waste', path: '/admin/data-management/garbage/infectious' },
  { label: 'Recycled-Waste', path: '/admin/data-management/garbage/recycled' },];


const EnvironmentLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const getActivePath = (path: string): boolean => {
    if (pathname === path) return true;
    if (
      pathname === '/admin/data-management/garbage' &&
      path === '/admin/data-management/garbage/chemica'
    ) {
      return true; // ตั้งค่า default ให้ pH เป็น active หากยังไม่ได้ระบุ path
    }
    return false;
  };

  const renderTabRow = (tabs: typeof tabsRow1) => (
    <div className="tabs">
      {tabs.map(({ label, path }) => {
        const active = getActivePath(path);
        return (
          <Button
            key={path}
            type={active ? 'primary' : 'text'}
            onClick={() => navigate(path)}
            style={{
              backgroundColor: active ? 'black' : undefined,
              borderColor: active ? 'black' : undefined,
              color: active ? 'white' : undefined,
              height: '2.5em',
              width: '150px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              borderRadius: '15px',
            }}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="tabs-header">
        <h1>ขยะ</h1>
        <p>
          โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
        </p>
      </div>

      <br />

      {renderTabRow(tabsRow1)}

      <br />

      <Outlet />
    </div>
  );
};

export default EnvironmentLayout;
