/* eslint-disable no-unused-vars */
import React from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import { GoArrowUpRight } from "react-icons/go";

import serviceImg from "/images/services-thumb.png";
import serviceImg2 from "/images/services-thumb2.png";
import serviceImg3 from "/images/services-thumb3.png";
import serviceImg4 from "/images/services-thumb4.png";
import serviceImg5 from "/images/services-thumb5.png";
import serviceImg6 from "/images/services-thumb6.png";
import serviceShape from "/images/service-shape.png";
import serviceIcon from "/images/service2-icon.png";
import serviceIcon2 from "/images/service2-icon2.png";
import serviceIcon3 from "/images/service2-icon3.png";
import serviceIcon4 from "/images/service2-icon4.png";
import serviceIcon5 from "/images/service2-icon5.png";
import serviceIcon6 from "/images/service2-icon6.png";
import subTitleShape from "/images/sub-title-shape.png";

import ServiceCard, { ServiceCardProps } from "./ServiceCard";
import BreadCrumb from "../BreadCrumb/BreadCrumb";

type ServiceItem = Omit<ServiceCardProps, "serviceButton"> & {
  id: number;
  serviceButton: React.ReactNode;
};

const serviceData: ServiceItem[] = [
  {
    id: 1,
    serviceImg,
    serviceIcon: serviceIcon,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceButton2: "Discover More",
    serviceTitle: "Ocean Clean",
    serviceDesc: "Alternative innovation to ethical network environmental whiteboard",
    serviceShape: serviceShape,
  },
  {
    id: 2,
    serviceImg: serviceImg2,
    serviceIcon: serviceIcon2,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceButton2: "Discover More",
    serviceTitle: "Dust Recycling",
    serviceDesc: "Alternative innovation to ethical network environmental whiteboard",
    serviceShape: serviceShape,
  },
  {
    id: 3,
    serviceImg: serviceImg3,
    serviceIcon: serviceIcon4,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceButton2: "Discover More",
    serviceTitle: "Corbon Emissions",
    serviceDesc: "Alternative innovation to ethical network environmental whiteboard",
    serviceShape: serviceShape,
  },
  {
    id: 4,
    serviceImg: serviceImg4,
    serviceIcon: serviceIcon3,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceButton2: "Discover More",
    serviceTitle: "Tree Plantation",
    serviceDesc: "Alternative innovation to ethical network environmental whiteboard",
    serviceShape: serviceShape,
  },
  {
    id: 5,
    serviceImg: serviceImg5,
    serviceIcon: serviceIcon5,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceButton2: "Discover More",
    serviceTitle: "Sustainble Energy",
    serviceDesc: "Alternative innovation to ethical network environmental whiteboard",
    serviceShape: serviceShape,
  },
  {
    id: 6,
    serviceImg: serviceImg6,
    serviceIcon: serviceIcon6,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceButton2: "Discover More",
    serviceTitle: "Plantary Warming",
    serviceDesc: "Alternative innovation to ethical network environmental whiteboard",
    serviceShape: serviceShape,
  },
];

const ServiceInner: React.FC = () => {
  return (
    <>
      <BreadCrumb
        breadCrumbTitle={"Our Services"}
        breadCrumbIcon={<FaArrowRightLong />}
        breadCrumbLink={"Our Services"}
      />
      <section className="pt-28 pb-[120px] p relative z-10 bg-[#f3f3f7]">
        <div className="Container">
          <div className="text-center">
            <h5 className="font-AlbertSans font-medium text-PrimaryColor-0 flex items-center justify-center gap-2">
              <img src={subTitleShape} draggable="false" alt="subtitle" />
              OUR SERVICES
            </h5>
            <h1 className="font-AlbertSans font-bold text-xl leading-6 sm:text-[38px] sm:leading-[48px] md:text-[40px] md:leading-[54px] lg:text-[32px] lg:leading-[42px] xl:text-[40px] xl:leading-[50px] 2xl:text-[46px] 2xl:leading-[56px] text-HeadingColor-0 mt-5">
              Echofy Provide Environment <br />
              Best Leading Services
            </h1>
          </div>
          <div className="mt-[60px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {serviceData.map((item) => (
                <ServiceCard
                  key={item.id}
                  serviceImg={item.serviceImg}
                  serviceIcon={item.serviceIcon}
                  serviceUrl={item.serviceUrl}
                  serviceButton={item.serviceButton}
                  serviceButton2={item.serviceButton2}
                  serviceTitle={item.serviceTitle}
                  serviceDesc={item.serviceDesc}
                  serviceShape={item.serviceShape}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceInner;
