import './EnvironmentBlock.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstPH } from '../../../services/phService';
import { GetfirstTDS } from '../../../services/tdsService';
import { GetfirstBOD } from '../../../services/bodService';
import { GetfirstFOG } from '../../../services/fogService';

import ph from '../../../../../frontend/src/assets/ph.png';
import bod from '../../../../../frontend/src/assets/blood-analysis.png';
import ts from '../../../../../frontend/src/assets/sedimentation.png';
import tds from '../../../../../frontend/src/assets/water-quality.png';
import fog from '../../../../../frontend/src/assets/oil.png';
import tkn from '../../../../../frontend/src/assets/nitrogen.png';

const EnvironmentBlock = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([
    { name: 'PH Center', standard: '-', image: ph, path: 'datavizPH' },
    { name: 'BOD Center', standard: '-', image: bod, path: 'datavizBOD' },
    { name: 'TS Center', standard: '30', image: ts, path: 'datavizTS' },
    { name: 'TDS Center', standard: '-', image: tds, path: 'datavizTDS' },
    { name: 'FOG Center', standard: '20', image: fog, path: 'fog' },
    { name: 'TKN Center', standard: '35', image: tkn, path: 'datavizTKN' },
  ]);

  const getTooltip = (name: string) => {
    switch (name) {
      case 'PH Center':
        return (
          <>
            Potential of Hydrogen (pH) <br />
            คือ ค่าความเป็นกรด-ด่างของน้ำ
          </>
        );
      case 'BOD Center':
        return (
          <>
            Biochemical Oxygen Demand (BOD) <br />
            คือ ค่าความต้องการออกซิเจนทางชีวภาพ
          </>
        );
      case 'TS Center':
        return (
          <>
            Total Solid (TS) <br />
            คือ ของแข็งทั้งหมดในน้ำเสีย
          </>
        );
      case 'TDS Center':
        return (
          <>
            Total Dissolved Solids (TDS) <br />
            คือ ของแข็งที่ละลายได้ในน้ำ
          </>
        );
      case 'FOG Center':
        return (
          <>
            Fat Oil and Grease (FOG) <br />
            คือ ไขมัน น้ำมัน และไขมันในน้ำเสีย
          </>
        );
      case 'TKN Center':
        return (
          <>
            Total Kjeldahl Nitrogen (TKN) <br />
            คือ ไนโตรเจนทั้งหมดในรูปของอินทรีย์และแอมโมเนีย
          </>
        );
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const [phRes, tdsRes, bodRes,fogRes] = await Promise.all([
          GetfirstPH(),
          GetfirstTDS(),
          GetfirstBOD(),
          GetfirstFOG(),
        ]);

        const getDisplayStandard = (data: any) => {
          const { MinValue, MaxValue, MiddleValue } = data;
          if (MinValue !== 0 || MaxValue !== 0) return `${MinValue} - ${MaxValue}`;
          if (MiddleValue !== 0) return `${MiddleValue}`;
          return '-';
        };

        const phStandard = getDisplayStandard(phRes.data || phRes);
        const bodStandard = getDisplayStandard(bodRes.data || bodRes);
        const tdsStandard = getDisplayStandard(tdsRes.data || tdsRes);
        const fogStandard = getDisplayStandard(fogRes.data || fogRes);

        setCenters(prev =>
          prev.map(center => {
            if (center.name === 'PH Center') {
              return { ...center, standard: phStandard };
            } else if (center.name === 'TDS Center') {
              return { ...center, standard: tdsStandard };
            } else if (center.name === 'BOD Center') {
              return { ...center, standard: bodStandard };
            }else if (center.name === 'FOG Center') {
              return { ...center, standard: fogStandard };
            }
            return center;
          })
        );
      } catch (error) {
        console.error('Error fetching standards:', error);
      }
    };

    fetchStandards();
  }, []);

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
          <Tooltip title={getTooltip(center.name)} overlayClassName="custom-tooltip" key={index}>
            <div
              className="wqc-card clickable"
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
          </Tooltip>
        ))}
      </div>

      <Outlet />
    </div>
  );
};

export default EnvironmentBlock;

