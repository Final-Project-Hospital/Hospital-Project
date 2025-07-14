import React from 'react';
import { Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './EnvironmentTabs.css';

const tabs = [
  { label: 'pH-Central', path: '/admin/data-management/water/ph' },
  { label: 'BOD-Central', path: '/admin/data-management/water/bod' },
  { label: 'TS-Central', path: '/admin/data-management/water/ts' },
  { label: 'TDS-Central', path: '/admin/data-management/water/tds' },
  { label: 'FOG-Central', path: '/admin/data-management/water/fog' },
  { label: 'TKN-Central', path: '/admin/data-management/water/tkn' },
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
      // style={{
      //   width: '80%',
      //   margin: '0 auto',
      //   display: 'flex',
      //   justifyContent: 'center',
      //   gap: 8,
      //   padding: '10px 20px',
      //   borderBottom: '5px solid #A1EFF0',
      // }}
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
