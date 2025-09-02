// 📁 Banner.tsx
import { Swiper, SwiperSlide } from "swiper/react";
import type { SwiperOptions } from "swiper/types";
import "swiper/css";
import "./banner.css";
import { Pagination } from "swiper/modules";
import LogoPage from "../../../../assets/user/env.jpg";

const Banner: React.FC = () => {
  const settings: SwiperOptions = {
    loop: true,
    speed: 2000,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
  };

  const pagination = {
    clickable: true,
    renderBullet: (index: number, className: string) => {
      return `<span class="${className} pagination-bullet"></span>`;
    },
  };

  return (
    <div className="relative">
      <Swiper {...settings} pagination={pagination} modules={[Pagination]}>
        <SwiperSlide>
          <section
            style={{ backgroundImage: `url(${LogoPage})` }}
            className="bg-cover bg-left lg:bg-center bg-no-repeat h-[750px] sm:h-[700px] md:h-[750px] lg:h-[760px] xl:h-[960px] flex items-center"
          >
            <div className="Container">
              <div className="pt-36">
                <div className="relative banner-content">
                  <h5 className="font-AlbertSans text-PrimaryColor-0 font-medium">
                    NATURAL ENVIRONMENT
                  </h5>
                  <h1 className="font-AlbertSans font-extrabold text-white text-[30px] sm:text-[56px] md:text-[70px] lg:text-[50px] xl:text-[60px] 2xl:text-[68px]">
                    Be Safe Controls
                  </h1>
                  <h1 className="font-AlbertSans font-extrabold text-white text-[30px] sm:text-[56px] md:text-[70px] lg:text-[50px] xl:text-[60px] 2xl:text-[68px] -mt-3 sm:-mt-5 md:-mt-7 lg:-mt-5">
                    Environment
                  </h1>
                  <p className="font-AlbertSans text-lg text-white mb-10">
                    Professionally optimize interdependent intellectual
                    interoperable <br className="hidden md:block" /> connect best
                    practices. Progressively
                    <br className="hidden sm:block md:hidden" /> fabricate done
                  </p>
                </div>
              </div>
            </div>
          </section>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default Banner;
