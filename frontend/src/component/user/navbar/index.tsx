/* eslint-disable no-unused-vars */
import { Link, NavLink } from "react-router-dom";
import { FaBars } from "react-icons/fa6";
import { BiChevronDown } from "react-icons/bi";
import Logo from "../../../assets/user/logo-navbar.png";
import { useState, useEffect, useCallback, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import { IoSearch } from "react-icons/io5";

function getScrollableParent(el: Element | null): Element | null {
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

  const headerRef = useRef<HTMLElement | null>(null);
  const scrollTargetRef = useRef<Window | Element>(window);

  const handleSticky = useCallback((): void => {
    const header = headerRef.current;
    if (!header) return;
    const target = scrollTargetRef.current;
    const currentScroll =
      target instanceof Window
        ? (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0)
        : (target as Element).scrollTop;
    if (currentScroll >= 250) header.classList.add("is-sticky");
    else header.classList.remove("is-sticky");
  }, []);

  useEffect(() => {
    const headerEl = document.querySelector<HTMLElement>(".header-section");
    headerRef.current = headerEl ?? null;
    const scrollable = getScrollableParent(headerEl?.parentElement ?? null);
    scrollTargetRef.current = scrollable ?? window;

    const target = scrollTargetRef.current;
    handleSticky();
    if (target instanceof Window) {
      target.addEventListener("scroll", handleSticky, { passive: true });
      return () => target.removeEventListener("scroll", handleSticky);
    } else {
      target.addEventListener("scroll", handleSticky as EventListener, { passive: true } as AddEventListenerOptions);
      return () =>
        target.removeEventListener("scroll", handleSticky as EventListener, { passive: true } as EventListenerOptions);
    }
  }, [handleSticky]);

  const toggleNavbar = () => setIsOpen((p) => !p);

  return (
    <nav className="w-full transition-all duration-300 bg-transparent absolute z-[99999]">
      {/* Main navbar */}
      <header
        className="header-section bg-transparent border-t border-b border-BorderColor4-0"
        data-aos="zoom-in"
        data-aos-duration="1000"
      >
        <div className="Container">
          {/* ใช้ Grid 3 คอลัมน์: โลโก้ | เมนู | ปุ่มขวา */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:h-[90px]">
            {/* Logo */}
            <div className="min-w-[140px] lg:min-w-[200px]">
              <Link to="/" className="block">
                <img draggable="false" src={Logo} className="h-10 lg:h-12 w-auto" alt="website_logo" />
              </Link>
            </div>

            {/* Menu (Desktop) */}
            <div className="hidden lg:block">
              <ul className="flex items-center justify-center gap-6 xl:gap-10 text-white font-AlbertSans font-medium text-[15px] leading-6">
                {/* หน้าแรก */}
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `${isActive ? "text-PrimaryColor-0" : "text-white"} whitespace-nowrap hover:text-PrimaryColor-0 px-2 xl:px-3 transition-colors`
                    }
                  >
                    หน้าแรก
                  </NavLink>
                </li>

                {/* ข้อมูลการตรวจวัด (dropdown) */}
                <li className="group relative">
                  <button
                    className="whitespace-nowrap px-2 xl:px-3 text-white hover:text-PrimaryColor-0 transition-colors flex items-center gap-1"
                  >
                    ข้อมูลการตรวจวัด <BiChevronDown />
                  </button>
                  {/* เมนูย่อย */}
                  <div className="absolute left-0 top-full mt-3 z-20">
                    <ul className="hidden group-hover:block w-56 shadow-lg rounded-sm text-white text-base py-2 bg-HeadingColor-0/95 backdrop-blur pointer-events-auto">
                      <li>
                        <Link to="/monitoring/wastewater" className="block px-5 py-2 hover:bg-PrimaryColor-0 whitespace-nowrap">
                          น้ำเสีย
                        </Link>
                      </li>
                      <li>
                        <Link to="/monitoring/drinking-water" className="block px-5 py-2 hover:bg-PrimaryColor-0 whitespace-nowrap">
                          น้ำดื่ม
                        </Link>
                      </li>
                      <li>
                        <Link to="/monitoring/tap-water" className="block px-5 py-2 hover:bg-PrimaryColor-0 whitespace-nowrap">
                          น้ำประปา
                        </Link>
                      </li>
                      <li>
                        <Link to="/monitoring/waste" className="block px-5 py-2 hover:bg-PrimaryColor-0 whitespace-nowrap">
                          ขยะ
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>

                {/* Contact */}
                <li>
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      `${isActive ? "text-PrimaryColor-0" : "text-white"} whitespace-nowrap hover:text-PrimaryColor-0 px-2 xl:px-3 transition-colors`
                    }
                  >
                    Contact
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* Actions (Right) */}
            <div className="hidden lg:flex items-center justify-end gap-6 shrink-0">
              <button className="p-2">
                <IoSearch className="text-2xl text-PrimaryColor-0" />
              </button>
              <Link to="/appointment" className="header-btn whitespace-nowrap">
                Get A Quote
              </Link>
            </div>

            {/* Mobile Bar */}
            <div className="lg:hidden col-span-3 flex items-center justify-between h-[64px]">
              <Link to="/" className="block">
                <img draggable="false" src={Logo} className="h-9 w-auto" alt="logo" />
              </Link>
              <button className="focus:outline-none" onClick={toggleNavbar} aria-label="Toggle menu">
                {isOpen ? <IoMdClose className="w-7 h-7 text-white" /> : <FaBars className="w-6 h-6 text-white" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
              <div className="lg:hidden col-span-3">
                <ul className="flex flex-col gap-2 py-3 text-white font-AlbertSans text-base">
                  <li>
                    <NavLink
                      to="/"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 hover:text-PrimaryColor-0 whitespace-nowrap"
                    >
                      หน้าแรก
                    </NavLink>
                  </li>

                  {/* Dropdown mobile: แสดงเป็นรายการย่อยปกติ */}
                  <li className="px-3 pt-2 pb-1 text-white/80">ข้อมูลการตรวจวัด</li>
                  <li><Link to="/monitoring/wastewater" onClick={() => setIsOpen(false)} className="block px-6 py-2 hover:text-PrimaryColor-0">น้ำเสีย</Link></li>
                  <li><Link to="/monitoring/drinking-water" onClick={() => setIsOpen(false)} className="block px-6 py-2 hover:text-PrimaryColor-0">น้ำดื่ม</Link></li>
                  <li><Link to="/monitoring/tap-water" onClick={() => setIsOpen(false)} className="block px-6 py-2 hover:text-PrimaryColor-0">น้ำประปา</Link></li>
                  <li><Link to="/monitoring/waste" onClick={() => setIsOpen(false)} className="block px-6 py-2 hover:text-PrimaryColor-0">ขยะ</Link></li>

                  <li>
                    <NavLink
                      to="/contact"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 hover:text-PrimaryColor-0 whitespace-nowrap"
                    >
                      Contact
                    </NavLink>
                  </li>

                  <li className="px-3 pt-2">
                    <Link to="/appointment" onClick={() => setIsOpen(false)} className="header-btn inline-block">
                      Get A Quote
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
    </nav>
  );
};

export default Navbar;
