import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { FiChevronDown } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { MdOutlineCancel } from 'react-icons/md';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';
import Logo from '../../assets/SUTH Logo.png';
import { getLinks } from '../../data/dummy';   // ✅ ใช้ getLinks ไม่ใช่ links
import { useStateContext } from '../../contexts/ContextProvider';
import './Sidebar.css'; // ✅ import CSS ที่แยกไฟล์

const { SubMenu, Item } = Menu;

interface MenuItem {
  name: string;
  label?: string;
  icon?: React.ReactNode;
  path?: string;
  subMenu?: MenuItem[];
  children?: MenuItem[];
}

const Sidebar = () => {
  const { currentColor, activeMenu, setActiveMenu, screenSize } = useStateContext();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [menuLinks, setMenuLinks] = useState<any[]>([]); // ✅ เก็บ links ที่โหลดมา

  const handleCloseSideBar = () => {
    if (activeMenu !== undefined && screenSize !== undefined && screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  const findOpenKeys = (menus: MenuItem[], path: string): string[] => {
    for (const item of menus) {
      if (item.subMenu) {
        if (item.subMenu.some((sub) => path.startsWith(sub.path || `/admin/${sub.name}`))) {
          return [item.name];
        }
        const deeper = findOpenKeys(item.subMenu, path);
        if (deeper.length) return [item.name, ...deeper];
      }
      if (item.children) {
        if (item.children.some((sub) => path.startsWith(sub.path || `/admin/${sub.name}`))) {
          return [item.name];
        }
        const deeper = findOpenKeys(item.children, path);
        if (deeper.length) return [item.name, ...deeper];
      }
    }
    return [];
  };

  // ✅ โหลด links จาก dummy.tsx
  useEffect(() => {
    const loadLinks = async () => {
      const data = await getLinks();
      setMenuLinks(data);
      const keys = findOpenKeys(data.flatMap((section) => section.links), location.pathname);
      setOpenKeys(keys);
    };
    loadLinks();
  }, [location.pathname]);

  const onOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const renderMenu = (menu: MenuItem[]) => {
    return menu.map((item) => {
      const hasSubMenu = item.subMenu && item.subMenu.length > 0;
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openKeys.includes(item.name);

      if (hasSubMenu || hasChildren) {
        const title = (
          <div
            className="custom-submenu-title"
            style={{ color: isOpen ? currentColor : undefined }}
          >
            <div className="custom-submenu-icon-text">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <FiChevronDown
              className="custom-submenu-arrow"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
        );

        return (
          <SubMenu key={item.name} title={title} expandIcon={() => null}>
            {item.subMenu && renderMenu(item.subMenu)}
            {item.children && renderMenu(item.children)}
          </SubMenu>
        );
      } else {
        const isSelected = location.pathname === (item.path || `/admin/${item.name}`);
        return (
          <Item
            key={item.path || `/admin/${item.name}`}
            icon={item.icon}
            onClick={handleCloseSideBar}
            className={isSelected ? 'custom-selected' : ''}
            style={{
              color: isSelected ? currentColor : undefined,
            }}
          >
            <Link to={item.path || `/admin/${item.name}`}>
              <span className="capitalize">{item.label || item.name}</span>
            </Link>
          </Item>
        );
      }
    });
  };

  return (
    <div className="ml-2 h-screen md:overflow-hidden overflow-auto md:hover:overflow-auto pb-10">
      {activeMenu && (
        <>
          <div className="flex justify-between items-center">
            <Link
              to="/admin"
              onClick={handleCloseSideBar}
              className="items-center gap-3 ml-14 mt-6 flex text-xl font-extrabold tracking-tight dark:text-white text-slate-900"
            >
              <span>
                <img src={Logo} alt="logo" width={155} />
              </span>
            </Link>
            <TooltipComponent content="Menu" position="BottomCenter">
              <button
                type="button"
                onClick={() => setActiveMenu(!activeMenu)}
                style={{ color: currentColor }}
                className="text-xl rounded-full p-3 hover:bg-light-gray mt-4 block md:hidden"
              >
                <MdOutlineCancel />
              </button>
            </TooltipComponent>
          </div>

          <div className="mt-10">
            {menuLinks.map((section) => (
              <div key={section.title || 'section'}>
                {section.title && (
                  <p className="sidebar-section-title">{section.title}</p>
                )}
                <Menu
                  mode="inline"
                  theme="light"
                  selectedKeys={[location.pathname]}
                  openKeys={openKeys}
                  onOpenChange={onOpenChange}
                  style={{ border: 'none' }}
                >
                  {renderMenu(section.links)}
                </Menu>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
