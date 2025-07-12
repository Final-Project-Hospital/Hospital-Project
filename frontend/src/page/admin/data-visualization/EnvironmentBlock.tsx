import './EnvironmentBlock.css';
import { useNavigate, Outlet } from 'react-router-dom';

import ph from '../../../../../frontend/src/assets/ph.png';
import bod from '../../../../../frontend/src/assets/blood-analysis.png';
import ts from '../../../../../frontend/src/assets/sedimentation.png';
import tds from '../../../../../frontend/src/assets/water-quality.png';
import fog from '../../../../../frontend/src/assets/oil.png';
import tkn from '../../../../../frontend/src/assets/nitrogen.png';

const centers = [
  { name: 'PH Center', standard: '5 - 9', image: ph, path: 'datavizPH' },
  { name: 'BOD Center', standard: '20', image: bod, path: 'datavizBOD' },
  { name: 'TS Center', standard: '30', image: ts, path: 'ts' },
  { name: 'TDS Center', standard: '500', image: tds, path: 'tds' },
  { name: 'FOG Center', standard: '20', image: fog, path: 'fog' },
  { name: 'TKN Center', standard: '35', image: tkn, path: 'tkn' },
];

const EnvironmentBlock = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="title-header">
        <h1>น้ำเสีย</h1>
        <p>
          โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
        </p>
      </div>
      <div className="wqc-grid">
        {centers.map((center, index) => (
          <div
            className="wqc-card clickable"
            key={index}
            onClick={() => navigate(`/admin/data-visualization/water/${center.path}`)}
          >
            <div className="wqc-info">
              <h3>{center.name}</h3>
              <p>
                มาตรฐาน <span>{center.standard}</span>
              </p>
            </div>
            <div className="wqc-divider" />
            <img src={center.image} alt={center.name} className="wqc-icon" />
          </div>
        ))}
      </div>

      {/* ต้องมี Outlet เพื่อแสดง child routes */}
      <Outlet />
    </div>
  );
};

export default EnvironmentBlock;
