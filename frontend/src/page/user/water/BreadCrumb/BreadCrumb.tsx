import React from "react";
import { Link } from "react-router-dom";
import { IoHome } from "react-icons/io5";

export interface BreadCrumbProps {
  breadCrumbTitle: string;
  breadCrumbIcon?: React.ReactNode;
  url?: string;
  breadCrumbLink?: string;
  breadCrumbIcon2?: React.ReactNode;
  breadCrumbContent?: string;
}

const BreadCrumb: React.FC<BreadCrumbProps> = ({
  breadCrumbTitle,
  breadCrumbIcon,
  url,
  breadCrumbLink,
  breadCrumbIcon2,
  breadCrumbContent,
}) => {
  const safeUrl = url ?? "/";

  return (
    <div
      className="bg-[url('/images/breadcrumb-bg.jpg')] bg-no-repeat bg-cover bg-center flex items-center h-[400px] sm:h-[530px] text-center pt-20"
      aria-label="breadcrumb"
    >
      <div className="Container">
        <h1 className="font-AlbertSans font-extrabold text-4xl sm:text-[46px] text-white capitalize">
          {breadCrumbTitle}
        </h1>

        <ul className="flex flex-col md:flex-row gap-2 sm:gap-4 items-center justify-center mt-8 sm:mt-5">
          {/* Home */}
          <li className="flex gap-2 sm:gap-4 items-center">
            <Link to="/">
              <button className="font-AlbertSans text-white flex items-center gap-2 transition-all duration-500 hover:text-PrimaryColor-0">
                <IoHome className="text-PrimaryColor-0" />
                Echofy
              </button>
            </Link>
          </li>

          {/* > icon */}
          {breadCrumbIcon && (
            <li className="hidden sm:block text-white">{breadCrumbIcon}</li>
          )}

          {/* Link level 1 */}
          {breadCrumbLink && (
            <li>
              <Link to={safeUrl}>
                <button className="font-AlbertSans capitalize text-white opacity-70">
                  {breadCrumbLink}
                </button>
              </Link>
            </li>
          )}

          {/* > icon 2 */}
          {breadCrumbIcon2 && (
            <li className="hidden md:block text-white">{breadCrumbIcon2}</li>
          )}

          {/* Content / current page */}
          {breadCrumbContent && (
            <li>
              <Link to={safeUrl}>
                <button className="font-AlbertSans capitalize text-white opacity-70">
                  {breadCrumbContent}
                </button>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default BreadCrumb;
