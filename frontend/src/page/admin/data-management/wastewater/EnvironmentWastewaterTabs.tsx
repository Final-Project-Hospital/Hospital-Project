import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Button } from 'antd';
import './EnvironmentWastewaterTabs.css'

const tabsRow1 = [
  { label: 'pH-Central', path: '/admin/data-management/wastewater/ph' },
  { label: 'BOD-Central', path: '/admin/data-management/wastewater/bod' },
  { label: 'TS-Central', path: '/admin/data-management/wastewater/ts' },
  { label: 'TDS-Central', path: '/admin/data-management/wastewater/tds' },
  { label: 'FOG-Central', path: '/admin/data-management/wastewater/fog' },
  { label: 'TKN-Central', path: '/admin/data-management/wastewater/tkn' },
];

const tabsRow2 = [
  { label: 'COD-Central', path: '/admin/data-management/wastewater/cod' },
  { label: 'FCB-Central', path: '/admin/data-management/wastewater/fcb' },
  { label: 'Residule-Central', path: '/admin/data-management/wastewater/residule' },
  { label: 'Sulfid-Central', path: '/admin/data-management/wastewater/sulfid' },
  { label: 'TCB-Central', path: '/admin/data-management/wastewater/tcb' },
];

const EnvironmentLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const getActivePath = (path: string): boolean => {
    if (pathname === path) return true;
    if (
      pathname === '/admin/data-management/wastewater' &&
      path === '/admin/data-management/wastewater/ph'
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
      <div className="w-tabs-header mt-16 md:mt-0">
        <div>
          <h1>น้ำเสีย</h1>
          <p>
            โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
          </p>
        </div>
      </div>

      <br />

      {renderTabRow(tabsRow1)}
      {renderTabRow(tabsRow2)}

      <br />

      <Outlet />
    </div>
  );
};

export default EnvironmentLayout;
