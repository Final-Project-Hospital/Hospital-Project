import React from "react";
import ReactDOM from "react-dom";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";  // <-- import ชนิดนี้ด้วย
import "./BODdataviz.css"

const BODdataviz = () => {
  const [state, setState] = React.useState<{
    series: ApexAxisChartSeries;
    options: ApexOptions;
  }>({
    series: [
      {
        name: "Net Profit",
        data: [44, 55, 57, 56, 61, 58, 63, 60, 66],
      },
      {
        name: "Revenue",
        data: [76, 85, 101, 98, 87, 105, 91, 114, 94],
      },
      {
        name: "Free Cash Flow",
        data: [35, 41, 36, 26, 45, 48, 52, 53, 41],
      },
    ],
    options: {
      chart: {
        type: "bar",  // TypeScript จะรับรู้ว่าเป็น literal "bar"
        height: 350,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 5,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: ["Jan","Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      },
      yaxis: {
        title: {
          text: "$ (thousands)",
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return "$ " + val + " thousands";
          },
        },
      },
    },
  });

  return (
    <div>
      <div className="title-header">
        <h1>BOD-Central</h1>
        <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
      </div>
      <div>
        <div id="chart">
          <ReactApexChart options={state.options} series={state.series} type="bar" height={350} />
        </div>
      </div>
    </div>
  );
};

export default BODdataviz;
