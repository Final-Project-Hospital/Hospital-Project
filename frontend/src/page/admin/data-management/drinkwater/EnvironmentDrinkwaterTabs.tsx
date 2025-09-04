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
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 py-6 rounded-b-3xl mb-1 mt-16 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">น้ำดื่ม</h1>
            <p className="text-sm">โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
          </div>
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
