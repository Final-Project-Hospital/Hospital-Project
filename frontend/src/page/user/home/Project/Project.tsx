/* eslint-disable no-unused-vars */
import { FaArrowRightLong } from "react-icons/fa6";
import projectThumb from "../../../../assets/user/project/project-img.png";
import projectThumb2 from "../../../../assets/user/project/project-img2.png";
import projectThumb3 from "../../../../assets/user/project/project-img3.png";
import projectShape from "../../../../assets/user/project/project-shape.png";
import { Swiper, SwiperSlide } from "swiper/react";
import subTitleShape from "../../../../assets/user/project/sub-title-shape.png";
import "swiper/css";
import ProjectCard from "./ProjectCard";
import ProjectNavigation from "./ProjectNavigation";
import { JSX } from "react";

interface ProjectItem {
  id: number;
  projectThumb: string;
  projectSubTitle: string;
  projectTitle: string;
  projectUrl: string;
  buttonTitle: string;
  buttonIcon: JSX.Element;
  projectShape: string;
}

const ProjectData: ProjectItem[] = [
  {
    id: 1,
    projectThumb: projectThumb,
    projectSubTitle: "Climate",
    projectTitle: "Cleaning Forest",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectShape: projectShape,
  },
  {
    id: 2,
    projectThumb: projectThumb2,
    projectSubTitle: "Environment",
    projectTitle: "Tree Plantation",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectShape: projectShape,
  },
  {
    id: 3,
    projectThumb: projectThumb3,
    projectSubTitle: "Recycling",
    projectTitle: "Plastic Recycling",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectShape: projectShape,
  },
  {
    id: 4,
    projectThumb: projectThumb,
    projectSubTitle: "Climate",
    projectTitle: "Cleaning Forest",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectShape: projectShape,
  },
];

const Project: React.FC = () => {
  const settings = {
    loop: true,
    spaceBetween: 30,
    speed: 1000,
    initialSlide: 1,
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
      1400: {
        slidesPerView: 3,
      },
    },
  };
  return (
    <section className="pt-28 project relative z-10 before:absolute before:top-0 before:left-0 before:w-full before:h-[85%] before:bg-[url('/images/project-bg.jpg')] before:bg-no-repeat before:bg-center before:bg-cover before:-z-10">
      <div className="Container">
        <div className="md:-mb-[6.2rem]">
          <h5 className="font-AlbertSans font-medium text-PrimaryColor-0 flex items-center gap-2">
            <img src={subTitleShape} draggable="false" />
            OUR PROJECTS
          </h5>
          <h1 className="font-AlbertSans font-bold text-xl leading-8 sm:text-[38px] sm:leading-[48px] md:text-[44px] md:leading-[54px] lg:text-[32px] lg:leading-[42px] xl:text-[40px] xl:leading-[50px] 2xl:text-[46px] 2xl:leading-[56px] text-HeadingColor-0 mt-5 mb-3">
            Finished the Latest Leading <br />
            Environmental Works
          </h1>
        </div>
        <div>
          <Swiper {...settings}>
            <div>
              {ProjectData.map((item) => (
                <SwiperSlide key={item.id}>
                  <div className="pt-[144px]">
                    <ProjectCard {...item} />
                  </div>
                </SwiperSlide>
              ))}
            </div>
            <ProjectNavigation />
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Project;
