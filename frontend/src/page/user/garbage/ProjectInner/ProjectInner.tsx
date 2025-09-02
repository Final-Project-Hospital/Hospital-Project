import React from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import BreadCrumb from "../../water/BreadCrumb/BreadCrumb";
import projectThumb from "/images/project-img.png";
import projectThumb2 from "/images/project-img2.png";
import projectThumb3 from "/images/project-img3.png";
import projectThumb4 from "/images/project-img4.jpg";
import projectThumb5 from "/images/project-img5.jpg";
import projectThumb6 from "/images/project-img6.jpg";
import projectShape from "/images/project-shape.png";
import projectContentShape from "/images/project-content-shape.png";
import subTitleShape from "/images/sub-title-shape.png";

import ProjectCard, { ProjectCardProps } from "./ProjectCard";

type ProjectItem = ProjectCardProps & { id: number };

const ProjectData: ProjectItem[] = [
  {
    id: 1,
    projectThumb,
    projectSubTitle: "Climate",
    projectTitle: "Cleaning Forest",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectContentShape,
    projectShape,
  },
  {
    id: 2,
    projectThumb: projectThumb2,
    projectSubTitle: "Environment",
    projectTitle: "Echology Energy",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectContentShape,
    projectShape,
  },
  {
    id: 3,
    projectThumb: projectThumb3,
    projectSubTitle: "Recycling",
    projectTitle: "Plastic Recycling",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectContentShape,
    projectShape,
  },
  {
    id: 4,
    projectThumb: projectThumb4,
    projectSubTitle: "Recycling",
    projectTitle: "Ocean Cleaning",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectContentShape,
    projectShape,
  },
  {
    id: 5,
    projectThumb: projectThumb5,
    projectSubTitle: "Plants",
    projectTitle: "Seedlings Plants",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectContentShape,
    projectShape,
  },
  {
    id: 6,
    projectThumb: projectThumb6,
    projectSubTitle: "Environment",
    projectTitle: "Renewable Energy",
    projectUrl: "/project_details",
    buttonTitle: "View Details",
    buttonIcon: <FaArrowRightLong />,
    projectContentShape,
    projectShape,
  },
];

const ProjectInner: React.FC = () => {
  return (
    <>
      <BreadCrumb
        breadCrumbTitle="Projects"
        breadCrumbIcon={<FaArrowRightLong />}
        breadCrumbLink="Projects"
      />

      <section className="py-28 bg-[#f3f4f8]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-[60px]">
            {ProjectData.map((item) => (
              <ProjectCard
                key={item.id}
                projectThumb={item.projectThumb}
                projectContentShape={item.projectContentShape}
                projectShape={item.projectShape}
                projectSubTitle={item.projectSubTitle}
                projectTitle={item.projectTitle}
                projectUrl={item.projectUrl}
                buttonTitle={item.buttonTitle}
                buttonIcon={item.buttonIcon}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProjectInner;
