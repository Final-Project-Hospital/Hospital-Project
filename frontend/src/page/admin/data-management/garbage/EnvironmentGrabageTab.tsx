import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Button } from 'antd';
import '../wastewater/EnvironmentWastewaterTabs.css'

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
              backgroundColor: active ? '#1a4b57' : undefined,
              borderColor: active ? '#1a4b57' : undefined,
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
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 py-6 rounded-b-3xl mb-1 mt-16 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">ขยะ</h1>
            <p className="text-sm">โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
          </div>
        </div>
      </div>
      <br />

      {renderTabRow(tabsRow1)}

      <br />

      <Outlet />
    </div>
  );
};

export default EnvironmentLayout;
