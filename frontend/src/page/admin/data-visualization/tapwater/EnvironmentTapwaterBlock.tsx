import '../wastewater/EnvironmentWastewaterBlock.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstAL } from '../../../../services/tapwaterServices/al';
import { GetfirstIRON } from '../../../../services/tapwaterServices/iron';
import { GetfirstMN } from '../../../../services/tapwaterServices/mn';
import { GetfirstNI } from '../../../../services/tapwaterServices/ni';
import { GetfirstNTU } from '../../../../services/tapwaterServices/ntu';
import { GetfirstPT } from '../../../../services/tapwaterServices/pt';
import { GetfirstTCOD } from '../../../../services/tapwaterServices/tcod';
import { GetfirstTH } from '../../../../services/tapwaterServices/th';
import { GetfirstTTCB } from '../../../../services/tapwaterServices/ttcb';

import al from '../../../../../src/assets/tapwater/aluminium.png';
import ir from '../../../../../src/assets/tapwater/iron.png';
import mn from '../../../../../src/assets/tapwater/manganese.png';
import ni from '../../../../../src/assets/tapwater/nickel.png';
import ntu from '../../../../../src/assets/tapwater/NTU.png';
import pt from '../../../../../src/assets/tapwater/PT.png';
import tcod from '../../../../../src/assets/wastewater/COD.png';
import th from '../../../../../src/assets/tapwater/TH.png';
import ttcb from '../../../../../src/assets/drinkwater/TCB.png';
import { Layout } from 'antd';
const { Footer } = Layout;

const EnvironmentBlock = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([
    { name: 'Al Center', standard: '-', image: al, path: 'datavizAL' },
    { name: 'Fe Center', standard: '-', image: ir, path: 'datavizIR' },
    { name: 'Mn Center', standard: '-', image: mn, path: 'datavizMN' },
    { name: 'Nitrate Center', standard: '-', image: ni, path: 'datavizNI' },
    { name: 'NTU Center', standard: '-', image: ntu, path: 'datavizNTU' },
    { name: 'PT Center', standard: '-', image: pt, path: 'datavizPT' },
    { name: 'COD Center', standard: '-', image: tcod, path: 'datavizTCOD' },
    { name: 'TH Center', standard: '-', image: th, path: 'datavizTH' },
    { name: 'TCB Center', standard: '-', image: ttcb, path: 'datavizTTCB' },

  ]);

  const getTooltip = (name: string) => {
    switch (name) {
      case 'Al Center':
        return (
          <>
            Aluminum (Al)<br />
            คือ ธาตุอะลูมิเนียม<br />ส่วนใหญ่พบจากสารส้มที่ใช้ในการตกตะกอน
          </>
        );
      case 'Fe Center':
        return (
          <>
            Iron (Fe)<br />
            คือ ธาตุเหล็ก<br />หากมีมากทำให้น้ำมีสี กลิ่น และตะกอน
          </>
        );
      case 'Mn Center':
        return (
          <>
            Manganese (Mn)<br />
            คือ ธาตุแมงกานีส<br />ถ้ามีมากจะทำให้น้ำมีสีคล้ำและตกตะกอน
          </>
        );
      case 'Nitrate Center':
        return (
          <>
            Nitrate (NO₃⁻)<br />
            คือ ธาตุไนเตรต<br />สารประกอบของไนโตรเจนในรูปออกซิไดซ์สูงสุด
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
        const [alRes, ironRes, mnRes, niRes, ntuRes, ptRes, tcodRes, thRes, ttcbRes] = await Promise.all([
          GetfirstAL(),
          GetfirstIRON(),
          GetfirstMN(),
          GetfirstNI(),
          GetfirstNTU(),
          GetfirstPT(),
          GetfirstTCOD(),
          GetfirstTH(),
          GetfirstTTCB(),
        ]);

        const getDisplayStandard = (data: any) => {
          const { MinValue, MaxValue, MiddleValue } = data;
          if (MinValue !== 0 || MaxValue !== 0) return `${MinValue} - ${MaxValue}`;
          if (MiddleValue !== 0) return `${MiddleValue}`;
          return '-';
        };

        const alStandard = getDisplayStandard(alRes.data || alRes);
        const ironStandard = getDisplayStandard(ironRes.data || ironRes);
        const mnStandard = getDisplayStandard(mnRes.data || mnRes);
        const niStandard = getDisplayStandard(niRes.data || niRes);
        const ntuStandard = getDisplayStandard(ntuRes.data || ntuRes);
        const ptStandard = getDisplayStandard(ptRes.data || ptRes);
        const tcodStandard = getDisplayStandard(tcodRes.data || tcodRes);
        const thStandard = getDisplayStandard(thRes.data || thRes);
        const ttcbStandard = getDisplayStandard(ttcbRes.data || ttcbRes);

        setCenters(prev =>
          prev.map(center => {
            if (center.name === 'Al Center') {
              return { ...center, standard: alStandard };
            } else if (center.name === 'Fe Center') {
              return { ...center, standard: ironStandard };
            } else if (center.name === 'Mn Center') {
              return { ...center, standard: mnStandard };
            } else if (center.name === 'Nitrate Center') {
              return { ...center, standard: niStandard };
            } else if (center.name === 'NTU Center') {
              return { ...center, standard: ntuStandard };
            } else if (center.name === 'PT Center') {
              return { ...center, standard: ptStandard };
            } else if (center.name === 'COD Center') {
              return { ...center, standard: tcodStandard };
            } else if (center.name === 'TH Center') {
              return { ...center, standard: thStandard };
            } else if (center.name === 'TCB Center') {
              return { ...center, standard: ttcbStandard };
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
      <div className="w-title-header mt-16 md:mt-0">
        <div>
          <h1>น้ำประปา</h1>
          <p>
            โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
          </p>
        </div>
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
      <Layout>
        <Footer style={{ textAlign: "center", padding: "10px" }} >Icons made by
          <a href="https://www.flaticon.com/authors/iconjam" title="Iconjam"> Iconjam</a>,
          <a href="https://www.flaticon.com/authors/freepik" title="Freepik"> Freepik</a>,
          <a href="https://www.flaticon.com/authors/paul-j" title="Andinur"> Paul J.</a>,
          <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons"> Smashicons</a>,
          <a href="https://www.flaticon.com/authors/andinur" title="Andinur"> Andinur</a>,
          <a href="https://www.flaticon.com/authors/pikepicture" title="Pikepicture"> Pikepicture</a>,
          <a href="https://www.flaticon.com/authors/ranukumbololab" title="RanuKumbolo.lab"> RanuKumbolo.lab</a>,
          <a href="https://www.flaticon.com/authors/aficons-studio" title="Aficons studio"> Aficons studio</a>,
          <a href="https://www.flaticon.com/authors/meaicon" title="Aficons studio"> Meaicon</a>,
          <a href="https://www.flaticon.com/authors/kliwir-art" title="Aficons studio"> Kliwir art </a>
          from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
        </Footer>
      </Layout>
    </div>
  );
};

export default EnvironmentBlock;

