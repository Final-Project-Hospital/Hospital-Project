import '../wastewater/EnvironmentWastewaterBlock.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstDFCB } from '../../../../services/drinkwaterServices/dfcb';
import { GetfirstDTCB } from '../../../../services/drinkwaterServices/dtcb';
import { GetfirstECO } from '../../../../services/drinkwaterServices/eco';

import ecoli from '../../../../../src/assets/drinkwater/E-Coli-Center.png';
import dfcb from '../../../../../src/assets/drinkwater/FCB-Center.png';
import dtcb from '../../../../../src/assets/drinkwater/TCB.png';
import { Layout } from 'antd';
const { Footer } = Layout;

const EnvironmentBlock = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([
    { name: 'E Coli Center', standard: '-', image: ecoli, path: 'datavizEC' },
    { name: 'FCB Center', standard: '-', image: dfcb, path: 'datavizDFCB' },
    { name: 'TCB Center', standard: '30', image: dtcb, path: 'datavizDTCB' },
  ]);

  const getTooltip = (name: string) => {
    switch (name) {
      case 'E Coli Center':
        return (
          <>
            Escherichia coli (E. coli)<br />
            คือ แบคทีเรียชี้วัดการปนเปื้อนอุจจาระในน้ำ
          </>
        );
      case 'FCB Center':
        return (
          <>
            Fecal Coliform Bacteria (FCB)<br />
            คือ แบคทีเรียจากอุจจาระ<br />ใช้บ่งชี้การปนเปื้อนน้ำ
          </>
        );
      case 'TCB Center':
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
        const [dfcbRes, dtcbRes, ecoRes] = await Promise.all([
          GetfirstDFCB(),
          GetfirstDTCB(),
          GetfirstECO(),
        ]);

        const getDisplayStandard = (data: any) => {
          const { MinValue, MaxValue, MiddleValue } = data;
          if (MinValue !== 0 || MaxValue !== 0) return `${MinValue} - ${MaxValue}`;
          if (MiddleValue !== 0) return `${MiddleValue}`;
          return '-';
        };

        const dfcbStandard = getDisplayStandard(dfcbRes.data || dfcbRes);
        const dtcbStandard = getDisplayStandard(dtcbRes.data || dtcbRes);
        const ecoStandard = getDisplayStandard(ecoRes.data || ecoRes);

        setCenters(prev =>
          prev.map(center => {
            if (center.name === 'E Coli Center') {
              return { ...center, standard: ecoStandard };
            } else if (center.name === 'FCB Center') {
              return { ...center, standard: dfcbStandard };
            } else if (center.name === 'TCB Center') {
              return { ...center, standard: dtcbStandard };
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
      <div className="w-title-header">
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

