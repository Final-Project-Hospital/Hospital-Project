import React from 'react';
import { Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './EnvironmentTabs.css';

const EnvironmentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div>
      <div className="tds-header">
        <h1>TDS-Central</h1>
        <p>
          โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
        </p>
      </div>
      <br/>
      <div
      className="tabs"
      style={{
        width: '50%',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 20px',
        background: 'inherit',
        borderBottom: '2px solid #A1EFF0',
      }}
    >
      <Button
        type={isActive('/admin/data-management/water/ph') ? 'primary' : 'text'}
        onClick={() => navigate('/admin/data-management/water/ph')}
        style={
          isActive('/admin/data-management/water/ph')
            ? { backgroundColor: 'black', borderColor: 'black', color: 'white' }
            : {}
        }
      >
        pH-Central
      </Button>
      <Button
        type={isActive('/admin/data-management/water/bod') ? 'primary' : 'text'}
        onClick={() => navigate('/admin/data-management/water/bod')}
        style={
          isActive('/admin/data-management/water/bod')
            ? { backgroundColor: 'black', borderColor: 'black', color: 'white' }
            : {}
        }
      >
        BOD-Central
      </Button>
      <Button
        type={isActive('/admin/data-management/water/ts') ? 'primary' : 'text'}
        onClick={() => navigate('/admin/data-management/water/ts')}
        style={
          isActive('/admin/data-management/water/ts')
            ? { backgroundColor: 'black', borderColor: 'black', color: 'white' }
            : {}
        }
      >
        TS-Central
      </Button>
      <Button
        type={isActive('/admin/data-management/water/tds') ? 'primary' : 'text'}
        onClick={() => navigate('/admin/data-management/water/tds')}
        style={
          isActive('/admin/data-management/water/tds')
            ? { backgroundColor: 'black', borderColor: 'black', color: 'white' }
            : {}
        }
      >
        TDS-Central
      </Button>
    </div>
      {/* <hr className='line'/> */}
      <br/>
      <Outlet />
    </div>
  );
};

export default EnvironmentLayout;
