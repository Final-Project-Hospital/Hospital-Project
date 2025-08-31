import { Link, NavLink } from "react-router-dom";
import { FaBars } from "react-icons/fa6";
import { BiChevronDown } from "react-icons/bi";
import Logo from "../../../assets/user/logo-navbar.png";
import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { IoSearch } from "react-icons/io5";

const Navbar: React.FC = () => {
  // Sticky
  useEffect(() => {
    window.addEventListener("scroll", isSticky);
    return () => {
      window.removeEventListener("scroll", isSticky);
    };
  }, []);

  // Method that will fix header after a specific scrollable
  const isSticky = () => {
    const header = document.querySelector(".header-section");
    const scrollTop = window.scrollY;
    if (header) {
      scrollTop >= 250
        ? header.classList.add("is-sticky")
        : header.classList.remove("is-sticky");
    }
  };

  // modal opener
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav
      className={`w-full transition-all duration-300 bg-transparent absolute z-[99999]`}
    >
      {/* top Navbar */}
      <header
        className="header-section bg-transparent border-t border-b border-BorderColor4-0"
        data-aos="zoom-in"
        data-aos-duration="1000"
      >
        <div className="Container">
          {/* main Navbar */}
          <div className="flex flex-col lg:flex-row items-center justify-between lg:h-[100px] ">
            {/* website Logo */}
            <div className=" w-48 lg:w-52">
              <Link to="/">
                <img
                  draggable="false"
                  src={Logo}
                  className="hidden lg:block"
                  alt="website_logo"
                />
              </Link>
            </div>

            {/* small screen size */}
            <div className="w-full lg:hidden flex justify-between h-[70px] items-center p-3">
              <div className="w-28">
                <Link to="/">
                  <img
                    draggable="false"
                    src={Logo}
                    className="block lg:hidden "
                    alt="constre_website_logo"
                  />
                </Link>
              </div>
              {/* toggle bar mode */}
              <button
                className="lg:hidden block focus:outline-none "
                onClick={toggleNavbar}
              >
                {/* modal open and close */}
                {isOpen ? (
                  <IoMdClose className="w-6 h-6 text-white" />
                ) : (
                  <FaBars className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            {/* All navLink with active */}
            <div className="flex gap-6 items-center">
              <ul
                className={`${
                  isOpen ? "block" : "hidden"
                } text-right lg:w-fit ease-in-out flex-1 lg:flex space-y-2 lg:space-y-0 space-x-0 flex flex-col lg:flex-row capitalize text-sm lg:bg-transparent py-3 lg:py-0 font-AlbertSans font-medium sm:text-base text-white transition-all duration-500
                `}
              >
                <NavLink
                  to="/"
                  className={({ isActive, isPending }) =>
                    `${
                      isPending
                        ? "pending"
                        : isActive
                        ? "active"
                        : ""
                    } text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full block transition-all duration-300 group relative`
                  }
                >
                  <span className="flex items-center">
                    Home
                    <BiChevronDown className="ml-1" />
                  </span>
                  <div
                    className="absolute pt-5 lg:pt-8 z-[1]"
                    data-aos="zoom-in-left"
                    data-aos-duration="1000"
                  >
                    <ul className="shadow-lg hidden group-hover:block rounded-sm text-white w-[240px] text-left transition-all duration-500 text-sm sm:text-base py-4 bg-PrimaryColor-0 ">
                      <div className="px-5 group hover:bg-SecondaryColor-0 ">
                        <li className="hover:ml-3 duration-300">
                          <Link to="/" className="py-2 block">
                            Environmental Demo 01
                          </Link>
                        </li>
                      </div>
                      <div className="px-5 group hover:bg-SecondaryColor-0 ">
                        <li className="hover:ml-3 duration-300">
                          <Link to="/home2" className="py-2 block">
                            Environmental Demo 02
                          </Link>
                        </li>
                      </div>
                      <div className="px-5 group hover:bg-SecondaryColor-0 ">
                        <li className="hover:ml-3 duration-300">
                          <Link to="/home3" className="py-2 block">
                            Solor Energy Demo 01
                          </Link>
                        </li>
                      </div>
                      <div className="px-5 group hover:bg-SecondaryColor-0 ">
                        <li className="hover:ml-3 duration-300">
                          <Link to="/home4" className="py-2 block">
                            Solor Energy Demo 02
                          </Link>
                        </li>
                      </div>
                      <div className="px-5 group hover:bg-SecondaryColor-0 ">
                        <li className="hover:ml-3 duration-300">
                          <Link to="/home5" className="py-2 block">
                            Animal Demo
                          </Link>
                        </li>
                      </div>
                    </ul>
                  </div>
                </NavLink>

                <NavLink
                  to="/about"
                  className={({ isActive, isPending }) =>
                    `${
                      isPending
                        ? "pending"
                        : isActive
                        ? "active"
                        : ""
                    } text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full block transition-all duration-300 group relative`
                  }
                >
                  <span>About</span>
                </NavLink>

                <NavLink
                  to="#"
                  className={({ isActive, isPending }) =>
                    `${
                      isPending
                        ? "pending"
                        : isActive
                        ? "active"
                        : ""
                    } text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full block transition-all duration-300 group relative`
                  }
                >
                  <span className="flex items-center">
                    Service
                    <BiChevronDown className="ml-1" />
                  </span>
                  <div className="absolute pt-5 lg:pt-8 z-20">
                    <ul className="shadow-lg hidden group-hover:block rounded-sm text-white w-[240px] text-left transition-all duration-500 text-sm sm:text-base py-4 bg-HeadingColor-0 ">
                      <div className="px-5 group hover:bg-PrimaryColor-0 ">
                        <li className="hover:ml-3 duration-300">
                          <Link to="/service" className="py-2 block">
                            Service
                          </Link>
                        </li>
                      </div>
                      <div className="px-5 group hover:bg-PrimaryColor-0 ">
                        <li className="hover:ml-3 duration-300">
                          <Link to="/service_details" className="py-2 block">
                            Service Details
                          </Link>
                        </li>
                      </div>
                    </ul>
                  </div>
                </NavLink>

                {/* ... (ส่วนอื่น ๆ ของเมนูเหมือนเดิม แค่เปลี่ยน className function ให้ถูกต้อง) ... */}

                <NavLink
                  to="/contact"
                  className={({ isActive, isPending }) =>
                    `${
                      isPending
                        ? "pending"
                        : isActive
                        ? "active"
                        : ""
                    } text-white text-left lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full block transition-all duration-300`
                  }
                >
                  Contact
                </NavLink>
              </ul>

              <div className="hidden lg:flex items-center">
                <button>
                  <IoSearch className="text-2xl ml-2 mr-10 text-PrimaryColor-0" />
                </button>
                <Link to={"/appointment"} className="header-btn">
                  Get A Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </nav>
  );
};

export default Navbar;
