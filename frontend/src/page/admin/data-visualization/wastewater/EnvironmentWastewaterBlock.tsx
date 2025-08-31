import './EnvironmentWastewaterBlock.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstPH } from '../../../../services/wastewaterServices/ph';
import { GetfirstTDS } from '../../../../services/tdsService';
import { GetfirstBOD } from '../../../../services/bodService';
import { GetfirstFOG } from '../../../../services/wastewaterServices/fog';
import { GetfirstTS } from '../../../../services/wastewaterServices/ts';
import { GetfirstTKN } from '../../../../services/wastewaterServices/tkn';
import { GetfirstCOD } from '../../../../services/wastewaterServices/cod';
import { GetfirstFCB } from '../../../../services/wastewaterServices/fcb';
import { GetfirstRES } from '../../../../services/wastewaterServices/res';
import { GetfirstSUL } from '../../../../services/wastewaterServices/sul';
import { GetfirstTCB } from '../../../../services/wastewaterServices/tcb';

import ph from '../../../../../src/assets/ph.png';
import bod from '../../../../../src/assets/blood-analysis.png';
import ts from '../../../../../src/assets/sedimentation.png';
import tds from '../../../../../src/assets/water-quality.png';
import fog from '../../../../../src/assets/oil.png';
import tkn from '../../../../../src/assets/nitrogen.png';
import cod from '../../../../../src/assets/wastewater/COD.png';
import fcb from '../../../../../src/assets/drinkwater/FCB-Center.png';
import res from '../../../../../src/assets/wastewater/Residual.png';
import sul from '../../../../../src/assets/wastewater/sulfide.png';
import tcb from '../../../../../src/assets/drinkwater/TCB.png';
import { Layout } from 'antd';
const { Footer } = Layout;


const EnvironmentBlock = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([
    { name: 'pH Center', standard: '-', image: ph, path: 'datavizPH' },//
    { name: 'BOD Center', standard: '-', image: bod, path: 'datavizBOD' },//
    { name: 'TS Center', standard: '-', image: ts, path: 'datavizTS' },//
    { name: 'TDS Center', standard: '-', image: tds, path: 'datavizTDS' },//
    { name: 'FOG Center', standard: '-', image: fog, path: 'datavizFOG' },//
    { name: 'TKN Center', standard: '-', image: tkn, path: 'datavizTKN' },//
    { name: 'COD Center', standard: '-', image: cod, path: 'datavizCOD' },//
    { name: 'FCB Center', standard: '-', image: fcb, path: 'datavizFCB' },//
    { name: 'Residule Center', standard: '-', image: res, path: 'datavizRES' },//
    { name: 'Sulfide Center', standard: '-', image: sul, path: 'datavizSUL' },
    { name: 'TCB Center', standard: '-', image: tcb, path: 'datavizTCB' },

  ]);

  const getTooltip = (name: string) => {
    switch (name) {
      case 'pH Center':
        return (
          <>
            Potential of Hydrogen (pH)<br />
            คือ ค่าความเป็นกรด-ด่างของน้ำ
          </>
        );
      case 'BOD Center':
        return (
          <>
            Biochemical Oxygen Demand (BOD)<br />
            คือ ค่าความต้องการออกซิเจนทางชีวภาพ<br />แสดงปริมาณสารอินทรีย์ที่ย่อยสลายได้
          </>
        );
      case 'TS Center':
        return (
          <>
            Total Solids (TS)<br />
            คือ ของแข็งทั้งหมดในน้ำ<br />ทั้งที่ละลายน้ำและแขวนลอย
          </>
        );
      case 'TDS Center':
        return (
          <>
            Total Dissolved Solids (TDS)<br />
            คือ ของแข็งที่ละลายได้ในน้ำ<br />เช่น เกลือ แร่ธาตุ
          </>
        );
      case 'FOG Center':
        return (
          <>
            Fat, Oil and Grease (FOG)<br />
            คือ ไขมันและน้ำมันที่ปนอยู่ในน้ำเสีย
          </>
        );
      case 'TKN Center':
        return (
          <>
            Total Kjeldahl Nitrogen (TKN)<br />
            คือ ไนโตรเจนรวมในรูปสารอินทรีย์และแอมโมเนีย
          </>
        );
      case 'COD Center':
        return (
          <>
            Chemical Oxygen Demand (COD)<br />
            คือ ค่าความต้องการออกซิเจนทางเคมี<br />แสดงปริมาณสารอินทรีย์ทั้งหมดที่ย่อยสลายได้และไม่ได้
          </>
        );
      case 'FCB Center':
        return (
          <>
            Fecal Coliform Bacteria (FCB)<br />
            คือ แบคทีเรียจากอุจจาระ<br />ใช้บ่งชี้การปนเปื้อนน้ำเสีย
          </>
        );
      case 'Residule Center':
        return (
          <>
            Residual Chlorine<br />
            คือ ปริมาณคลอรีนอิสระที่เหลืออยู่ในน้ำหลังการฆ่าเชื้อ
          </>
        );
      case 'Sulfide Center':
        return (
          <>
            Sulfide (S²⁻)<br />
            คือ ซัลไฟด์ในน้ำ<br />ถ้ามีมากจะเกิดกลิ่นเหม็นเน่าและเป็นพิษ
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
        const [phRes, tdsRes, bodRes, fogRes, tsRes, tknRes, codRes, fcbRes, resRes, sulRes, tcbRes] = await Promise.all([
          GetfirstPH(),
          GetfirstTDS(),
          GetfirstBOD(),
          GetfirstFOG(),
          GetfirstTS(),
          GetfirstTKN(),
          GetfirstCOD(),
          GetfirstFCB(),
          GetfirstRES(),
          GetfirstSUL(),
          GetfirstTCB(),
        ]);

        const getDisplayStandard = (data: any) => {
          const { MinValue, MaxValue, MiddleValue } = data;
          if (MinValue !== -1 || MaxValue !== -1) return `${MinValue} - ${MaxValue}`;
          if (MiddleValue !== -1) return `${MiddleValue}`;
          return '-';
        };

        const phStandard = getDisplayStandard(phRes.data || phRes);
        const bodStandard = getDisplayStandard(bodRes.data || bodRes);
        const tdsStandard = getDisplayStandard(tdsRes.data || tdsRes);
        const fogStandard = getDisplayStandard(fogRes.data || fogRes);
        const tsStandard = getDisplayStandard(tsRes.data || tsRes);
        const tknStandard = getDisplayStandard(tknRes.data || tknRes);
        const codStandard = getDisplayStandard(codRes.data || codRes);
        const fcbStandard = getDisplayStandard(fcbRes.data || fcbRes);
        const resStandard = getDisplayStandard(resRes.data || resRes);
        const sulStandard = getDisplayStandard(sulRes.data || sulRes);
        const tcbStandard = getDisplayStandard(tcbRes.data || tcbRes);

        setCenters(prev =>
          prev.map(center => {
            if (center.name === 'pH Center') {
              return { ...center, standard: phStandard };
            } else if (center.name === 'TDS Center') {
              return { ...center, standard: tdsStandard };
            } else if (center.name === 'BOD Center') {
              return { ...center, standard: bodStandard };
            } else if (center.name === 'FOG Center') {
              return { ...center, standard: fogStandard };
            } else if (center.name === 'TS Center') {
              return { ...center, standard: tsStandard };
            } else if (center.name === 'TKN Center') {
              return { ...center, standard: tknStandard };
            } else if (center.name === 'COD Center') {
              return { ...center, standard: codStandard };
            } else if (center.name === 'FCB Center') {
              return { ...center, standard: fcbStandard };
            } else if (center.name === 'Residule Center') {
              return { ...center, standard: resStandard };
            } else if (center.name === 'Sulfide Center') {
              return { ...center, standard: sulStandard };
            } else if (center.name === 'TCB Center') {
              return { ...center, standard: tcbStandard };
            };
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
          <h1>น้ำเสีย</h1>
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
              onClick={() => navigate(`/admin/data-visualization/wastewater/${center.path}`)}
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

