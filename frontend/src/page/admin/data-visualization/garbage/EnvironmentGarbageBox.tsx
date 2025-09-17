import './EnvironmentGarbageBox.css';
import { Tooltip } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetfirstGeneral } from '../../../../services/garbageServices/generalWaste';
import { GetfirstInfectious } from '../../../../services/garbageServices/infectiousWaste';

import che from '../../../../../src/assets/waste/radiation.png';
import gen from '../../../../../src/assets/waste/food-waste.png';
import haz from '../../../../../src/assets/waste/biohazard.png';
import inf from '../../../../../src/assets/waste/infectious-disease.png';
import rec from '../../../../../src/assets/waste/recycle.png';
import { Layout } from 'antd';
const { Footer } = Layout;


const EnvironmentBlock = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([
    { name: 'Chemical Waste', standard: '-', image: che, path: 'DatavizCHE' },
    { name: 'General Waste', standard: '-', image: gen, path: 'DatavizGEN' },
    { name: 'Hazardous Waste', standard: '-', image: haz, path: 'DatavizHAZ' },
    { name: 'Infectious Waste', standard: '-', image: inf, path: 'DatavizINF' },
    { name: 'Recycled Waste', standard: '-', image: rec, path: 'DatavizREC' },
  ]);

  const getTooltip = (name: string) => {
    switch (name) {
      case 'Chemical Waste':
        return (
          <>
            <b>ขยะเคมีบำบัด (Chemical Waste)</b><br />
            คือ ของเสียที่เกิดจากสารเคมีต่าง ๆ<br />ไม่ว่าจะอยู่ในรูปของแข็ง ของเหลว หรือก๊าซ
          </>
        );
      case 'General Waste':
        return (
          <>
            <b>ขยะทั่วไป (General Waste)</b><br />
            คือ ขยะจากการใช้ประจำวัน<br />ที่ไม่เป็นพิษและไม่สามารถรีไซเคิลได้
          </>
        );
      case 'Hazardous Waste':
        return (
          <>
            <b>ขยะอันตราย (Hazardous Waste)</b><br />
            คือ ขยะที่มีคุณสมบัติเป็นพิษ ติดไฟ<br />ระเบิด กัดกร่อน หรือก่อให้เกิดอันตราย
          </>
        );
      case 'Infectious Waste':
        return (
          <>
            <b>ขยะติดเชื้อ (Infectious Waste)</b><br />
            คือ ขยะที่มีเชื้อโรคหรือปนเปื้อนสารชีวภาพ<br />อาจก่อให้เกิดการแพร่กระจายของโรคได้
          </>
        );
      case 'Recycled Waste':
        return (
          <>
            <b>ขยะรีไซเคิล (Recycled Waste)</b><br />
            คือ ขยะที่สามารถนำกลับมาใช้ใหม่ได้<br />เช่น กระดาษ พลาสติก แก้ว และโลหะ
          </>
        );
    }
  };

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const [genRes, infRes] = await Promise.all([
          GetfirstGeneral(),
          GetfirstInfectious(),
        ]);

        const getDisplayStandard = (data: any) => {
          const { MinTarget, MaxTarget, MiddleTarget } = data;
          const toTwoDecimal = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          if (MinTarget !== 0 || MaxTarget !== 0) {
            return `${toTwoDecimal(MinTarget)} - ${toTwoDecimal(MaxTarget)}`;
          }
          if (MiddleTarget !== 0) {
            return `${toTwoDecimal(MiddleTarget)}`;
          }
          return '-';
        };

        const genStandard = getDisplayStandard(genRes.data || genRes);
        const infStandard = getDisplayStandard(infRes.data || infRes);

        setCenters(prev =>
          prev.map(center => {
            if (center.name === 'General Waste') {
              return { ...center, standard: genStandard };
            } else if (center.name === 'Infectious Waste') {
              return { ...center, standard: infStandard };
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
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 py-6 rounded-b-3xl mb-1 mt-16 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">ขยะ</h1>
            <p className="text-sm">โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
          </div>
        </div>
      </div>

      <div className='buttom-footer'>
        <div className="g-wqc-grid">
          {centers.map((center, index) => (
            <Tooltip title={getTooltip(center.name)} overlayClassName="custom-tooltip" key={index}>
              <div
                className="g-wqc-card clickable"
                onClick={() => navigate(`/admin/data-visualization/garbage/${center.path}`)}
              >
                <div className="g-wqc-info">
                  <h3>{center.name}</h3>
                  {center.standard && center.standard !== "-" && (
                    <p>
                      {center.name === 'General Waste' ? 'เป้าหมาย' : 'มาตรฐาน'} <span>{center.standard}</span>
                    </p>
                  )}
                </div>
                <div className="g-wqc-divider" />
                <img src={center.image} alt={center.name} className="g-wqc-icon" />
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

