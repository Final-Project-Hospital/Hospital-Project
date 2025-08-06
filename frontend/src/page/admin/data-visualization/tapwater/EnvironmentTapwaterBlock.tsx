import './EnvironmentTapwaterBlock.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstPH } from '../../../../services/phService';
import { GetfirstTDS } from '../../../../services/tdsService';
import { GetfirstBOD } from '../../../../services/bodService';
import { GetfirstFOG } from '../../../../services/fogService';

import al from '../../../../../src/assets/ph.png';
import ir from '../../../../../src/assets/blood-analysis.png';
import mn from '../../../../../src/assets/sedimentation.png';
import ni from '../../../../../src/assets/water-quality.png';
import ntu from '../../../../../src/assets/oil.png';
import pt from '../../../../../src/assets/nitrogen.png';
import tcod from '../../../../../src/assets/nitrogen.png';
import th from '../../../../../src/assets/nitrogen.png';
import ttcb from '../../../../../src/assets/nitrogen.png';

const EnvironmentBlock = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([
    { name: 'AL Center', standard: '-', image: al, path: 'datavizAL' },
    { name: 'IR Center', standard: '-', image: ir, path: 'datavizIR' },
    { name: 'MN Center', standard: '30', image: mn, path: 'datavizMN' },
    { name: 'NI Center', standard: '-', image: ni, path: 'datavizNI' },
    { name: 'NTU Center', standard: '20', image: ntu, path: 'datavizNTU' },
    { name: 'PT Center', standard: '35', image: pt, path: 'datavizPT' },
    { name: 'COD Center', standard: '-', image: tcod, path: 'datavizTCOD' },
    { name: 'TH Center', standard: '30', image: th, path: 'datavizTH' },
    { name: 'TCB Center', standard: '-', image: ttcb, path: 'datavizTTCB' },

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
              onClick={() => navigate(`/admin/data-visualization/tapwater/${center.path}`)}
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

