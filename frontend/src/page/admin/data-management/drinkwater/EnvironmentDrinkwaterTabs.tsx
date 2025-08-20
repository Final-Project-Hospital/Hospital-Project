import React from 'react';
import { Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../wastewater/EnvironmentWastewaterTabs.css';

const tabs = [
  { label: 'E coli-Central of Glass', path: '/admin/data-management/drinkwater/ecoli' },
  { label: 'FCB-Central of Glass', path: '/admin/data-management/drinkwater/dfcb' },
  { label: 'TCB-Central of Glass', path: '/admin/data-management/drinkwater/dtcb' },
  { label: 'E coli-Central of Tank', path: '/admin/data-management/drinkwater/ecoliT' },
  { label: 'FCB-Central of Tank', path: '/admin/data-management/drinkwater/dfcbT' },
  { label: 'TCB-Central of Tank', path: '/admin/data-management/drinkwater/dtcbT' },
];

const EnvironmentLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div>
      <div className="w-tabs-header">
        <div>
          <h1>น้ำดื่ม</h1>
          <p>
            โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
          </p>
        </div>
      </div>
      <br />
      <div className="tabs">
        {tabs.map(({ label, path }) => {
          const active = pathname === path || (pathname === '/admin/data-management/drinkwater' && path === '/admin/data-management/drinkwater/ecoli');
          return (
            <Button
              key={path}
              type={active ? 'primary' : 'text'}
              onClick={() => navigate(path)}
              style={active ? { backgroundColor: '#1a4b57', borderColor: '#1a4b57', color: 'white' } : {}}
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
