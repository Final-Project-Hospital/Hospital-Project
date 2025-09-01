/* eslint-disable no-unused-vars */
import { Link, NavLink } from "react-router-dom";
import {
  FaBars,
  FaFacebookF,
  FaLinkedinIn,
  FaPhone,
  FaPinterestP,
  FaXTwitter,
} from "react-icons/fa6";
import { BiChevronDown } from "react-icons/bi";
import Logo from "../../../assets/user/logo-navbar.png";
import { useState, useEffect, useCallback, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import { HiOutlineMailOpen } from "react-icons/hi";
import { CiLocationOn } from "react-icons/ci";

function getScrollableParent(el: Element | null): Element | null {
  // ไต่ขึ้นไปหา element ที่มี overflowY เป็น auto/scroll และสูงเกิน clientHeight
  let node: Element | null = el;
  while (node) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight;

    if (canScroll) return node;
    node = node.parentElement;
  }
  return null;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // อ้างอิง header ที่จะใส่/เอา .is-sticky
  const headerRef = useRef<HTMLElement | null>(null);
  // อ้างอิงตัวที่เลื่อนจริง (Window หรือ Element)
  const scrollTargetRef = useRef<Window | Element>(window);

  const handleSticky = useCallback((): void => {
    const header = headerRef.current;
    if (!header) return;

    const target = scrollTargetRef.current;
    const currentScroll =
      target instanceof Window
        ? (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0)
        : (target as Element).scrollTop;

    // DEBUG: ดูว่าเราอ่านจากอะไร
    // console.log(
    //   target instanceof Window ? "from window:" : "from element:",
    //   currentScroll
    // );

    if (currentScroll >= 250) {
      header.classList.add("is-sticky");
    } else {
      header.classList.remove("is-sticky");
    }
  }, []);

  useEffect(() => {
    // หา header จริง
    const headerEl = document.querySelector<HTMLElement>(".header-section");
    headerRef.current = headerEl ?? null;

    // หา scrollable parent (ถ้าไม่มีให้ใช้ window)
    const scrollable = getScrollableParent(headerEl?.parentElement ?? null);
    scrollTargetRef.current = scrollable ?? window;

    // bind scroll กับตัวที่เลื่อนจริง
    const target = scrollTargetRef.current;

    // เรียกครั้งแรกเผื่อโหลดมากลางหน้า
    handleSticky();

    if (target instanceof Window) {
      target.addEventListener("scroll", handleSticky, { passive: true });
      return () => target.removeEventListener("scroll", handleSticky);
    } else {
      // Element
      target.addEventListener("scroll", handleSticky as EventListener, { passive: true } as AddEventListenerOptions);
      return () =>
        target.removeEventListener("scroll", handleSticky as EventListener, { passive: true } as EventListenerOptions);
    }
  }, [handleSticky]);

  const toggleNavbar = () => setIsOpen((p) => !p);

  return (
    <nav className="w-full transition-all duration-300 bg-transparent absolute z-[99999]">
      {/* Top bar */}
      <header className="bg-transparent overflow-hidden md:block">
        <div className="Container flex items-center justify-between h-[50px]">
          <div className="flex items-center gap-10">
            <p className="font-AlbertSans text-[15px] text-white sm:flex hidden items-center gap-1">
              <CiLocationOn className="text-xl relative bottom-[2px] text-PrimaryColor-0" />
              102/B New Market, Sandigo-USA
            </p>
            <Link
              to="/"
              className="font-AlbertSans text-[15px] text-white md:flex items-center gap-2 hidden"
            >
              <HiOutlineMailOpen size={16} className="text-PrimaryColor-0" />
              example@gmail.com
            </Link>
          </div>

          <div className="flex items-center gap-16">
            <div className="lg:flex items-center gap-2 hidden">
              <span className="flex items-center gap-2 text-sm text-PrimaryColor-0">
                <FaPhone />
              </span>
              <Link to="/" className="font-AlbertSans font-medium text-sm text-white">
                +123 (4567) 890
              </Link>
            </div>

            <ul className="flex gap-3 items-center">
              <li>
                <Link
                  to="/"
                  className="transition-all duration-500 text-white hover:text-PrimaryColor-0"
                >
                  <FaFacebookF />
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="transition-all duration-500 text-white hover:text-PrimaryColor-0"
                >
                  <FaXTwitter />
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="transition-all duration-500 text-white hover:text-PrimaryColor-0"
                >
                  <FaLinkedinIn />
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="transition-all duration-500 text-white hover:text-PrimaryColor-0"
                >
                  <FaPinterestP />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Main navbar */}
      <header
        className="header-section bg-transparent border-t border-b border-BorderColor4-0"
        data-aos="zoom-in"
        data-aos-duration="1000"
      >
        <div className="Container">
          <div className="flex flex-col lg:flex-row items-center justify-between lg:h-[100px]">
            {/* Logo */}
            <div className="w-48 lg:w-52">
              <Link to="/">
                <img draggable="false" src={Logo} className="hidden lg:block" alt="website_logo" />
              </Link>
            </div>

            {/* Mobile */}
            <div className="w-full lg:hidden flex justify-between h-[70px] items-center p-3">
              <div className="w-28">
                <Link to="/">
                  <img draggable="false" src={Logo} className="block lg:hidden" alt="constre_website_logo" />
                </Link>
              </div>
              <button className="lg:hidden block focus:outline-none" onClick={toggleNavbar}>
                {isOpen ? <IoMdClose className="w-6 h-6 text-white" /> : <FaBars className="w-5 h-5 text-white" />}
              </button>
            </div>

            {/* Menu */}
            <div className="flex gap-6 items-center">
              <ul
                className={`${isOpen ? "block" : "hidden"} text-right lg:w-fit ease-in-out flex-1 lg:flex space-y-2 lg:space-y-0 space-x-0 flex flex-col lg:flex-row capitalize text-sm lg:bg-transparent py-3 lg:py-0 font-AlbertSans font-medium sm:text-base text-white transition-all duration-500`}
              >
                {/* Home (dropdown) */}
                <li className="group relative">
                  <button className="text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full transition-all duration-300 flex items-center">
                    Home <BiChevronDown className="ml-1" />
                  </button>
                  <div className="absolute pt-5 lg:pt-8 z-[1]">
                    <ul className="shadow-lg hidden group-hover:block rounded-sm text-white w-[240px] text-left transition-all duration-500 text-sm sm:text-base py-4 bg-PrimaryColor-0">
                      <li className="px-5 hover:bg-SecondaryColor-0">
                        <Link to="/" className="py-2 block">Environmental Demo 01</Link>
                      </li>
                      <li className="px-5 hover:bg-SecondaryColor-0">
                        <Link to="/home2" className="py-2 block">Environmental Demo 02</Link>
                      </li>
                      <li className="px-5 hover:bg-SecondaryColor-0">
                        <Link to="/home3" className="py-2 block">Solor Energy Demo 01</Link>
                      </li>
                      <li className="px-5 hover:bg-SecondaryColor-0">
                        <Link to="/home4" className="py-2 block">Solor Energy Demo 02</Link>
                      </li>
                      <li className="px-5 hover:bg-SecondaryColor-0">
                        <Link to="/home5" className="py-2 block">Animal Demo</Link>
                      </li>
                    </ul>
                  </div>
                </li>

                {/* About */}
                <NavLink
                  to="/about"
                  className={({ isActive, isPending }) =>
                    `${isPending ? "pending" : isActive ? "active" : ""} text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full block transition-all duration-300`
                  }
                >
                  About
                </NavLink>

                {/* Service (dropdown) */}
                <li className="group relative">
                  <button className="text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full transition-all duration-300 flex items-center">
                    Service <BiChevronDown className="ml-1" />
                  </button>
                  <div className="absolute pt-5 lg:pt-8 z-20">
                    <ul className="shadow-lg hidden group-hover:block rounded-sm text-white w-[240px] text-left transition-all duration-500 text-sm sm:text-base py-4 bg-HeadingColor-0">
                      <li className="px-5 hover:bg-PrimaryColor-0">
                        <Link to="/service" className="py-2 block">Service</Link>
                      </li>
                      <li className="px-5 hover:bg-PrimaryColor-0">
                        <Link to="/service_details" className="py-2 block">Service Details</Link>
                      </li>
                    </ul>
                  </div>
                </li>

                {/* Pages (dropdown) */}
                <li className="group relative">
                  <button className="text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full transition-all duration-300 flex items-center">
                    Pages <BiChevronDown className="ml-1" />
                  </button>
                  <div className="absolute pt-5 lg:pt-8 z-20">
                    <ul className="shadow-lg hidden group-hover:block rounded-sm text-white w-[240px] text-left transition-all duration-500 text-sm sm:text-base py-4 bg-HeadingColor-0">
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/about" className="py-2 block">About Us</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/service" className="py-2 block">Service</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/service_details" className="py-2 block">Service Details</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/donation_inner" className="py-2 block">Donations</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/team_inner" className="py-2 block">Team Member</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/project" className="py-2 block">Projects</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/project_details" className="py-2 block">Project Details</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/pricing_inner" className="py-2 block">Pricing Plan</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/testimonial" className="py-2 block">Testimonial</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/appointment" className="py-2 block">Appointment</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/faq_inner" className="py-2 block">Faq</Link></li>
                    </ul>
                  </div>
                </li>

                {/* Blog (dropdown) */}
                <li className="group relative">
                  <button className="text-white text-left hover:text-PrimaryColor-0 lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full transition-all duration-300 flex items-center">
                    Blog <BiChevronDown className="ml-1" />
                  </button>
                  <div className="absolute pt-5 lg:pt-8 z-20">
                    <ul className="shadow-lg hidden group-hover:block rounded-sm text-white w-[240px] text-left transition-all duration-500 text-sm sm:text-base py-4 bg-SecondaryColor-0">
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/blog_grid" className="py-2 block">Blog Grid</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/blog_list" className="py-2 block">Blog List</Link></li>
                      <li className="px-5 hover:bg-PrimaryColor-0"><Link to="/blog_details" className="py-2 block">Blog Details</Link></li>
                    </ul>
                  </div>
                </li>

                {/* Contact */}
                <NavLink
                  to="/contact"
                  className={({ isActive, isPending }) =>
                    `${isPending ? "pending" : isActive ? "active" : ""} text-white text-left lg:border-b-0 px-3 lg:px-2 xl:px-3 w-full block transition-all duration-300 hover:text-PrimaryColor-0`
                  }
                >
                  Contact
                </NavLink>
              </ul>

              {/* Actions (Right) */}
              <div className="hidden lg:flex items-center">
                <button>
                  <IoSearch className="text-2xl ml-2 mr-10 text-PrimaryColor-0" />
                </button>
                <Link to="/appointment" className="header-btn">
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
