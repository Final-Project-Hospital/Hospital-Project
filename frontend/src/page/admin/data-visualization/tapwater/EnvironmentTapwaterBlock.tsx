import './EnvironmentTapwaterBlock.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstPH } from '../../../../services/phService';
import { GetfirstTDS } from '../../../../services/tdsService';
import { GetfirstBOD } from '../../../../services/bodService';
import { GetfirstFOG } from '../../../../services/fogService';

import al from '../../../../../src/assets/tapwater/aluminium.png';
import ir from '../../../../../src/assets/tapwater/iron.png';
import mn from '../../../../../src/assets/tapwater/manganese.png';
import ni from '../../../../../src/assets/tapwater/nickel.png';
import ntu from '../../../../../src/assets/tapwater/NTU.png';
import pt from '../../../../../src/assets/tapwater/PT.png';
import tcod from '../../../../../src/assets/wastewater/COD.png';
import th from '../../../../../src/assets/tapwater/TH.png';
import ttcb from '../../../../../src/assets/drinkwater/TCB.png';

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
      case 'AL Center':
        return (
          <>
            Aluminum (Al)<br />
            คือ ธาตุอะลูมิเนียม<br />ส่วนใหญ่พบจากสารส้มที่ใช้ในการตกตะกอน
          </>
        );
      case 'IR Center':
        return (
          <>
            Iron (Fe)<br />
            คือ ธาตุเหล็ก<br />หากมีมากทำให้น้ำมีสี กลิ่น และตะกอน
          </>
        );
      case 'MN Center':
        return (
          <>
            Manganese (Mn)<br />
            คือ ธาตุแมงกานีส<br />ถ้ามีมากจะทำให้น้ำมีสีคล้ำและตกตะกอน
          </>
        );
      case 'NI Center':
        return (
          <>
            Nickel (Ni)<br />
            คือ ธาตุนิกเกิล<br />หากสะสมมากอาจเป็นอันตรายต่อสุขภาพ
          </>
        );
      case 'NTU Center':
        return (
          <>
            Nephelometric Turbidity Unit (NTU)<br />
            คือ ค่าความขุ่นของน้ำ<br />วัดจากการกระเจิงของแสง
          </>
        );
      case 'PT Center':
        return (
          <>
            Total Phosphorus (TP)<br />
            คือ ฟอสฟอรัสรวม<br />เป็นธาตุอาหารที่กระตุ้นการเกิดสาหร่าย
          </>
        );
      case 'COD Center':
        return (
          <>
            Chemical Oxygen Demand (COD)<br />
            คือ ค่าความต้องการออกซิเจนทางเคมี<br />ใช้บอกปริมาณสารอินทรีย์ในน้ำ
          </>
        );
      case 'TH Center':
        return (
          <>
            Total Hardness (TH)<br />
            คือ ค่าความกระด้างของน้ำ<br />เกิดจากแคลเซียมและแมกนีเซียม
          </>
        );
      case 'TCB Center':
        return (
          <>
            Total Coliform Bacteria (TCB)<br />
            คือ กลุ่มแบคทีเรียโคลิฟอร์มทั้งหมด<br />ใช้บ่งบอกคุณภาพความสะอาดของน้ำ
          </>
        );
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const [phRes, tdsRes, bodRes, fogRes] = await Promise.all([
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
            } else if (center.name === 'FOG Center') {
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
        <h1>น้ำประปา</h1>
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

