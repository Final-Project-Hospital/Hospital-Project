import React from 'react';
import { Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './EnvironmentTabs.css';

const tabs = [
  { label: 'pH-Central', path: '/admin/data-management/wastewater/ph' },
  { label: 'BOD-Central', path: '/admin/data-management/wastewater/bod' },
  { label: 'SS-Central', path: '/admin/data-management/wastewater/ts' },
  { label: 'TDS-Central', path: '/admin/data-management/wastewater/tds' },
  { label: 'FOG-Central', path: '/admin/data-management/wastewater/fog' },
  { label: 'TKN-Central', path: '/admin/data-management/wastewater/tkn' },
  { label: 'COD-Central', path: '/admin/data-management/wastewater/cod' },
  { label: 'FCB-Central', path: '/admin/data-management/wastewater/fcb' },
  { label: 'Residule-Central', path: '/admin/data-management/wastewater/residule' },
  { label: 'Sulfid-Central', path: '/admin/data-management/wastewater/sulfid' },
  { label: 'TCB-Central', path: '/admin/data-management/wastewater/tcb' },
];

const EnvironmentLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div>
      <div className="tds-header">
        <h1>น้ำเสีย</h1>
        <p>
          โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
        </p>
      </div>
      <br />
      <div
        className="tabs"
      >
        {tabs.map(({ label, path }) => {
          const active = pathname === path;
          return (
            <Button
              key={path}
              type={active ? 'primary' : 'text'}
              onClick={() => navigate(path)}
              style={active ? { backgroundColor: 'black', borderColor: 'black', color: 'white' } : {}}
            >
              {label}
            </Button>
          );
        })}
      </div>

      <br />
      <Outlet />
    </div>
  );
};

export default EnvironmentLayout;
