/* eslint-disable no-unused-vars */
import { Link, NavLink } from "react-router-dom";
import { FaBars } from "react-icons/fa6";
import { BiChevronDown } from "react-icons/bi";
import Logo from "../../../assets/user/logo-navbar.png";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { IoMdClose } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import { GetUserDataByUserID } from "../../../services/httpLogin";

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

type UserData = {
  ID?: number;
  FirstName?: string;
  LastName?: string;
  Name?: string;
  Email?: string;
  Phone?: string;
  // รูปโปรไฟล์จาก backend (data URL/base64 หรือ URL)
  Profile?: string;
  // กรณี backend ใช้ชื่อฟิลด์อื่น ๆ
  Image?: string;
  ProfileImage?: string;
  Avatar?: string;
  AvatarURL?: string;
  image_url?: string;
  avatar_url?: string;
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const headerRef = useRef<HTMLElement | null>(null);
  const scrollTargetRef = useRef<Window | Element>(window);

  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);

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
      target.addEventListener("scroll", handleSticky as unknown as EventListener, {
        passive: true,
      } as AddEventListenerOptions);
      return () =>
        target.removeEventListener("scroll", handleSticky as unknown as EventListener, {
          passive: true,
        } as EventListenerOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSticky]);

  // --- ดึงข้อมูลผู้ใช้เพื่อนำมาวางรูปโปรไฟล์ ---
  useEffect(() => {
    const raw = localStorage.getItem("employeeid");
    const id = raw ? Number(raw) : 1; // ปรับตามที่คุณใช้งานจริง
    setLoadingUser(true);
    (async () => {
      const res = await GetUserDataByUserID(id as number);
      if (res) setUser(res as unknown as UserData);
      setLoadingUser(false);
    })();
  }, []);

  const toggleNavbar = () => setIsOpen((p) => !p);

  const profileSrc = useMemo(() => {
    if (!user) return "";
    return (
      user.Profile || // ✅ ใช้ฟิลด์ Profile เป็นอันดับแรก
      user.Image ||
      user.ProfileImage ||
      user.Avatar ||
      user.AvatarURL ||
      user.image_url ||
      user.avatar_url ||
      ""
    );
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "";
    return (
      user.Name ||
      [user.FirstName, user.LastName].filter(Boolean).join(" ") ||
      user.FirstName ||
      ""
    );
  }, [user]);

  const initials = useMemo(() => {
    const name = (displayName || "U").trim();
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [displayName]);

  // อวาตาร์พร้อม fallback ถ้ารูปเสีย → โชว์ตัวอักษรย่อ
  const ProfileAvatar: React.FC<{ size?: number; className?: string }> = ({
    size = 44,
    className = "",
  }) => {
    const [imgErr, setImgErr] = useState(false);
    if (!profileSrc || imgErr) {
      return (
        <div
          className={`${className} rounded-full border-2 border-PrimaryColor-0 bg-white/10 text-white flex items-center justify-center font-semibold`}
          style={{ width: size, height: size }}
          aria-label="profile-initials"
        >
          {initials}
        </div>
      );
    }
    return (
      <img
        src={profileSrc}
        alt={displayName || "profile"}
        className={`${className} rounded-full object-cover border-2 border-PrimaryColor-0`}
        style={{ width: size, height: size }}
        onError={() => setImgErr(true)}
      />
    );
  };

  return (
    <nav className="w-full transition-all duration-300 bg-transparent absolute z-[99999]">
      {/* Main navbar */}
      <header
        className="header-section bg-transparent border-t border-b border-BorderColor4-0"
        data-aos="zoom-in"
        data-aos-duration="1000"
      >
        <div className="Container">
          {/* แถวหลัก: โลโก้ซ้าย | เมนู+ปุ่ม ขวาสุด */}
          <div className="flex items-center justify-between h-[64px] lg:h-[90px]">
            {/* Logo (ซ้ายสุด) */}
            <div className="min-w-[140px] lg:min-w-[200px]">
              <Link to="/" className="block">
                <img draggable="false" src={Logo} className="h-9 lg:h-12 w-auto" alt="website_logo" />
              </Link>
            </div>

            {/* กลุ่มขวาสุด: เมนูเดสก์ท็อป + ปุ่ม + ไอคอนมือถือ */}
            <div className="flex items-center gap-4">
              {/* Menu (Desktop) */}
              <div className="hidden lg:block">
                <ul className="flex items-center gap-6 xl:gap-10 text-white font-AlbertSans font-medium text-[15px] leading-6">
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
                      type="button"
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
                </ul>
              </div>

              {/* Actions (Right) */}
              <div className="hidden lg:flex items-center gap-6">

                {/* ✅ โปรไฟล์ (แทน Get A Quote) */}
                <Link to="/profile" className="inline-flex items-center" aria-label="Profile">
                  <ProfileAvatar size={44} />
                </Link>
              </div>

              {/* Mobile hamburger (ขวาสุดบนมือถือ) */}
              <button className="lg:hidden p-1 focus:outline-none" onClick={toggleNavbar} aria-label="Toggle menu">
                {isOpen ? <IoMdClose className="w-7 h-7 text-white" /> : <FaBars className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="lg:hidden">
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
                <li>
                  <Link
                    to="/monitoring/wastewater"
                    onClick={() => setIsOpen(false)}
                    className="block px-6 py-2 hover:text-PrimaryColor-0"
                  >
                    น้ำเสีย
                  </Link>
                </li>
                <li>
                  <Link
                    to="/monitoring/drinking-water"
                    onClick={() => setIsOpen(false)}
                    className="block px-6 py-2 hover:text-PrimaryColor-0"
                  >
                    น้ำดื่ม
                  </Link>
                </li>
                <li>
                  <Link
                    to="/monitoring/tap-water"
                    onClick={() => setIsOpen(false)}
                    className="block px-6 py-2 hover:text-PrimaryColor-0"
                  >
                    น้ำประปา
                  </Link>
                </li>
                <li>
                  <Link
                    to="/monitoring/waste"
                    onClick={() => setIsOpen(false)}
                    className="block px-6 py-2 hover:text-PrimaryColor-0"
                  >
                    ขยะ
                  </Link>
                </li>

                {/* ✅ Mobile: โปรไฟล์แทนปุ่ม Get A Quote */}
                <li className="px-3 pt-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3"
                    aria-label="Profile"
                  >
                    <ProfileAvatar size={40} />
                    <span className="text-white/90">
                      {loadingUser ? "กำลังโหลด..." : displayName || "Profile"}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>
    </nav>
  );
};

export default Navbar;
