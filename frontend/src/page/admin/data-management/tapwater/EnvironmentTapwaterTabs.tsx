import React from 'react';
import { Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../wastewater/EnvironmentWastewaterTabs.css';

const tabs = [
  { label: 'Al-Central', path: '/admin/data-management/tapwater/al' },
  { label: 'Fe-Central', path: '/admin/data-management/tapwater/iron' },
  { label: 'Mn-Central', path: '/admin/data-management/tapwater/mn' },
  { label: 'Nitrate-Central', path: '/admin/data-management/tapwater/ni' },
  { label: 'NTU-Central', path: '/admin/data-management/tapwater/ntu' },
  { label: 'PT-Central', path: '/admin/data-management/tapwater/pt' },
  { label: 'COD-Central', path: '/admin/data-management/tapwater/cod' },
  { label: 'TH-Central', path: '/admin/data-management/tapwater/th' },
  { label: 'TCB-Central', path: '/admin/data-management/tapwater/tcb' },
];

const EnvironmentLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div>
      <div className="w-tabs-header">
        <div>
          <h1>น้ำประปา</h1>
          <p>
            โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพน้ำประปา
          </p>
        </div>
      </div>
      <br />
      <div className="tabs">
        {tabs.map(({ label, path }) => {
          const active = pathname === path || (pathname === '/admin/data-management/tapwater' && path === '/admin/data-management/tapwater/al');
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
