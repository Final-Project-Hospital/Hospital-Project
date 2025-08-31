/* eslint-disable @typescript-eslint/no-unused-vars */
import serviceImg from "../../../assets/user/servic/service-thumb.png";
import serviceImg2 from "../../../assets/user/servic/service-thumb2.png";
import serviceImg3 from "../../../assets/user/servic/service-thumb3.png";
import serviceIcon from "../../../assets/user/servic/service-icon1.png";
import serviceIcon2 from "../../../assets/user/servic/service-icon2.png";
import serviceIcon3 from "../../../assets/user/servic/service-icon3.png";
import serviceShape from "../../../assets/user/servic/service-shape.png";
import subTitleShape from "../../../assets/user/servic/sub-title-shape.png";
import { Swiper, SwiperSlide } from "swiper/react";
import ServiceNavigation from "./ServiceNavigation";
import ServiceCard, { ServiceCardProps } from "./ServiceCard";
import { GoArrowUpRight } from "react-icons/go";

const ServiceData: ServiceCardProps[] = [
  {
    id: 1,
    serviceImg,
    serviceIcon,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceTitle: "Tree Plantation",
    serviceDesc:
      "Alternative innovation to ethical network environmental whiteboard",
    serviceShape,
  },
  {
    id: 2,
    serviceImg: serviceImg2,
    serviceIcon: serviceIcon2,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceTitle: "Dust Recycling",
    serviceDesc:
      "Alternative innovation to ethical network environmental whiteboard",
    serviceShape,
  },
  {
    id: 3,
    serviceImg: serviceImg3,
    serviceIcon: serviceIcon3,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceTitle: "Cleaning Ocean",
    serviceDesc:
      "Alternative innovation to ethical network environmental whiteboard",
    serviceShape,
  },
  {
    id: 4,
    serviceImg,
    serviceIcon,
    serviceUrl: "/service_details",
    serviceButton: <GoArrowUpRight />,
    serviceTitle: "Tree Plantation",
    serviceDesc:
      "Alternative innovation to ethical network environmental whiteboard",
    serviceShape,
  },
];

const Service: React.FC = () => {
  const settings = {
    loop: true,
    spaceBetween: 30,
    speed: 1000,
    autoplay: true,
    breakpoints: {
      320: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3,
      },
      1200: {
        slidesPerView: 3,
      },
    },
  };

  return (
    <section
      className="relative pt-28 pb-[120px] bg-cover bg-no-repeat bg-center"
      style={{ backgroundImage: "url('/images/service-bg.jpg')" }}
    >
      <div className="Container">
        <div className="md:-mb-[11.2rem]">
          <h5 className="font-AlbertSans font-medium text-PrimaryColor-0 flex items-center gap-2">
            <img src={subTitleShape} draggable={false} alt="subtitle shape" />
            OUR SERVICES
          </h5>
          <h1 className="font-AlbertSans font-bold text-xl leading-6 sm:text-[38px] sm:leading-[48px] md:text-[40px] md:leading-[54px] lg:text-[32px] lg:leading-[42px] xl:text-[40px] xl:leading-[50px] 2xl:text-[46px] 2xl:leading-[56px] text-HeadingColor-0 mt-5 mb-3 border-b border-BorderColor2-0 pb-9">
            Echofy Provide Environment <br />
            Best Leading Services
          </h1>
        </div>
        <div className="mt-[40px]">
          <Swiper {...settings}>
            {ServiceData.map((item) => (
              <SwiperSlide key={item.id}>
                <div className="pt-[120px] sm:pt-[180px]">
                  <ServiceCard {...item} />
                </div>
              </SwiperSlide>
            ))}
            <ServiceNavigation />
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Service;
