import './EnvironmentDrinkwaterBlock.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstDFCB } from '../../../../services/drinkwaterServices/glass/dfcb';
import { GetfirstDTCB } from '../../../../services/drinkwaterServices/glass/dtcb';
import { GetfirstECO } from '../../../../services/drinkwaterServices/glass/eco';
import { GetfirstDFCBtank } from '../../../../services/drinkwaterServices/tank/dfcbT';
import { GetfirstDTCBtank } from '../../../../services/drinkwaterServices/tank/dtcbT';
import { GetfirstECOtank } from '../../../../services/drinkwaterServices/tank/ecoT';

import ecoli from '../../../../../src/assets/drinkwater/E-Coli-Center.png';
import dfcb from '../../../../../src/assets/drinkwater/FCB-Center.png';
import dtcb from '../../../../../src/assets/drinkwater/TCB.png';
import { Layout } from 'antd';
const { Footer } = Layout;

const EnvironmentBlock = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([
    { name: 'E Coli Center of Glass', standard: '-', image: ecoli, path: 'datavizEC' },
    { name: 'FCB Center of Glass', standard: '-', image: dfcb, path: 'datavizDFCB' },
    { name: 'TCB Center of Glass', standard: '-', image: dtcb, path: 'datavizDTCB' },
    { name: 'E Coli Center of Tank', standard: '-', image: ecoli, path: 'datavizECtank' },
    { name: 'FCB Center of Tank', standard: '-', image: dfcb, path: 'datavizDFCBtank' },
    { name: 'TCB Center of Tank', standard: '-', image: dtcb, path: 'datavizDTCBtank' },
  ]);

  const getTooltip = (name: string) => {
    switch (name) {
      case 'E Coli Center of Glass':
      case 'E Coli Center of Tank':
        return (
          <>
            Escherichia coli (E. coli)<br />
            คือ แบคทีเรียชี้วัดการปนเปื้อนอุจจาระในน้ำ
          </>
        );
      case 'FCB Center of Glass':
      case 'FCB Center of Tank':
        return (
          <>
            Fecal Coliform Bacteria (FCB)<br />
            คือ แบคทีเรียจากอุจจาระ<br />ใช้บ่งชี้การปนเปื้อนน้ำ
          </>
        );
      case 'TCB Center of Glass':
      case 'TCB Center of Tank':
        return (
          <>
            Total Coliform Bacteria (TCB)<br />
            คือ กลุ่มแบคทีเรียโคลิฟอร์มทั้งหมด<br />ใช้บ่งบอกความสะอาดของน้ำ
          </>
        );
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const [dfcbRes, dtcbRes, ecoRes, dfcbTRes, dtcbTRes, ecoTRes] = await Promise.all([
          GetfirstDFCB(),
          GetfirstDTCB(),
          GetfirstECO(),
          GetfirstDFCBtank(),
          GetfirstDTCBtank(),
          GetfirstECOtank(),
        ]);
        console.log(dfcbRes.data)
        console.log(dtcbRes.data)
        console.log(ecoRes.data)
        console.log(dfcbTRes.data)
        console.log(dtcbTRes.data)
        console.log(ecoTRes.data)

        const getDisplayStandard = (data: any) => {
          const { MinValue, MaxValue, MiddleValue } = data;
          if (MiddleValue === 0 && MinValue === -1 && MaxValue === -1) return 'ไม่พบ';
          if (MinValue !== -1 || MaxValue !== -1) return `${MinValue} - ${MaxValue}`;
          if (MiddleValue !== -1) return `${MiddleValue}`;
          return '-';
        };

        const dfcbStandard = getDisplayStandard(dfcbRes.data || dfcbRes);
        const dtcbStandard = getDisplayStandard(dtcbRes.data || dtcbRes);
        const ecoStandard = getDisplayStandard(ecoRes.data || ecoRes);

        const dfcbTStandard = getDisplayStandard(dfcbTRes.data || dfcbTRes);
        const dtcbTStandard = getDisplayStandard(dtcbTRes.data || dtcbTRes);
        const ecoTStandard = getDisplayStandard(ecoTRes.data || ecoTRes);

        setCenters(prev =>
          prev.map(center => {
            if (center.name === 'E Coli Center of Glass') {
              return { ...center, standard: ecoStandard };
            } else if (center.name === 'FCB Center of Glass') {
              return { ...center, standard: dfcbStandard };
            } else if (center.name === 'TCB Center of Glass') {
              return { ...center, standard: dtcbStandard };
            } else if (center.name === 'E Coli Center of Tank') {
              return { ...center, standard: ecoTStandard };
            } else if (center.name === 'FCB Center of Tank') {
              return { ...center, standard: dfcbTStandard };
            } else if (center.name === 'TCB Center of Tank') {
              return { ...center, standard: dtcbTStandard };
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
          <h1>นํ้าดื่ม</h1>
          <p>
            โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
          </p>
        </div>
      </div>
      <div className='buttom-footer'>
        <div className="wqc-grid">
          {centers.map((center, index) => (
            <Tooltip title={getTooltip(center.name)} overlayClassName="custom-tooltip" key={index}>
              <div
                className="wqc-card clickable"
                onClick={() => navigate(`/admin/data-visualization/drinkwater/${center.path}`)}
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
