import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { FiChevronDown } from 'react-icons/fi';
import { AiOutlineMenu } from 'react-icons/ai';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../../assets/SUTH Logo.png';
import { links } from '../../data/dummy';
import './Sidebar.css';

const { SubMenu, Item } = Menu;

export interface MenuItem {
  name: string;
  label?: string;
  icon?: React.ReactNode;
  path?: string;
  subMenu?: MenuItem[];
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(true);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [currentColor] = useState('#03C9D7');

  const handleCloseSideBar = () => {
    if (window.innerWidth <= 900) setActiveMenu(false);
  };

  const findOpenKeys = (menus: MenuItem[], path: string): string[] => {
    for (const item of menus) {
      if (item.subMenu?.some((sub) => path.startsWith(sub.path || `/admin/${sub.name}`))) return [item.name];
      if (item.subMenu) {
        const deeper = findOpenKeys(item.subMenu, path);
        if (deeper.length) return [item.name, ...deeper];
      }
      if (item.children?.some((sub) => path.startsWith(sub.path || `/admin/${sub.name}`))) return [item.name];
      if (item.children) {
        const deeper = findOpenKeys(item.children, path);
        if (deeper.length) return [item.name, ...deeper];
      }
    }
    return [];
  };

  useEffect(() => {
    const keys = links.flatMap((section) => findOpenKeys(section.links, location.pathname));
    setOpenKeys(keys);
  }, [location.pathname]);

  const onOpenChange = (keys: string[]) => setOpenKeys(keys);

  // const renderMenu = (menu: MenuItem[]) =>
  //   menu.map((item) => {
  //     const hasSubMenu = item.subMenu && item.subMenu.length > 0;
  //     const isOpen = openKeys.includes(item.name);

  //     if (hasSubMenu) {
  //       if (!activeMenu) {
  //         return <Item key={item.name} icon={item.icon} style={{ justifyContent: 'center' }} />;
  //       }

  //       const title = (
  //         <div className="custom-submenu-title" style={{ color: isOpen ? currentColor : undefined }}>
  //           <div className="custom-submenu-icon-text">
  //             {item.icon}
  //             <span>{item.label}</span>
  //           </div>
  //           <FiChevronDown
  //             className="custom-submenu-arrow"
  //             style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
  //           />
  //         </div>
  //       );

  //       return (
  //         <SubMenu key={item.name} title={title} expandIcon={() => null}>
  //           {renderMenu(item.subMenu!)}
  //         </SubMenu>
  //       );
  //     } else {
  //       const isSelected = location.pathname === (item.path || `/admin/${item.name}`);
  //       return (
  //         <Item
  //           key={item.path || `/admin/${item.name}`}
  //           icon={item.icon}
  //           onClick={handleCloseSideBar}
  //           className={isSelected ? 'custom-selected' : ''}
  //           style={{ color: isSelected ? currentColor : undefined, justifyContent: activeMenu ? undefined : 'center' }}
  //         >
  //           {activeMenu && (
  //             <Link to={item.path || `/admin/${item.name}`}>
  //               <span className="capitalize">{item.label || item.name}</span>
  //             </Link>
  //           )}
  //         </Item>
  //       );
  //     }
  // });
  const renderMenu = (menu: MenuItem[]) =>
    menu.map((item) => {
      const hasSubMenu = item.subMenu && item.subMenu.length > 0;
      const isSubMenuOpen = openKeys.includes(item.name);
      
      // ตรวจสอบว่า sub-menu นี้มี item ที่ถูกเลือกอยู่หรือไม่
      const isSubMenuItemSelected = hasSubMenu && item.subMenu!.some(sub => location.pathname === (sub.path || `/admin/${sub.name}`));

      const isItemSelected = location.pathname === (item.path || `/admin/${item.name}`);

      if (hasSubMenu) {
        if (!activeMenu) {
          return (
            <Item
              key={item.name}
              icon={item.icon}
              style={{ justifyContent: 'center', color: isSubMenuItemSelected ? currentColor : undefined }}            />
          );
        }
        
        const title = (
          <div className="custom-submenu-title" style={{ color: isSubMenuOpen ? currentColor : undefined }}>
            <div className="custom-submenu-icon-text">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <FiChevronDown
              className="custom-submenu-arrow"
              style={{ transform: isSubMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        );
        
        return (
          <SubMenu key={item.name} title={title} expandIcon={() => null}>
            {renderMenu(item.subMenu!)}
          </SubMenu>
        );
      } else {
        return (
          <Item
            key={item.path || `/admin/${item.name}`}
            icon={item.icon}
            onClick={handleCloseSideBar}
            className={isItemSelected ? 'custom-selected' : ''}
            style={{ color: isItemSelected ? currentColor : undefined, justifyContent: activeMenu ? undefined : 'center' }}
          >
            {activeMenu && (
              <Link to={item.path || `/admin/${item.name}`}>
                <span className="capitalize">{item.label || item.name}</span>
              </Link>
            )}
          </Item>
        );
      }
  });
  return (
    <div
      className={`sidebar ml-2 h-screen overflow-auto pb-10 transition-all duration-300`}
      style={{ width: activeMenu ? '14rem' : '5rem' }}
    >
      <div className="flex justify-between items-center mt-4 mr-2">
        <Link to="/admin">
        {activeMenu && (
              <img
                src={Logo}
                alt="Logo"
                className="h-12 w-auto transition-all duration-300"
              />
            )}
        </Link>
        <AiOutlineMenu
          color={currentColor}
          size={28}
          className="cursor-pointer"
          onClick={() => setActiveMenu(!activeMenu)}
        />
      </div>

      <div className="mt-10">
        {links.map((section) => (
          <div key={section.title || 'section'}>
            {activeMenu && section.title && (
              <p className="sidebar-section-title">{section.title}</p>
            )}
            <Menu
              mode="inline"
              theme="light"
              selectedKeys={[location.pathname]}
              openKeys={openKeys}
              onOpenChange={onOpenChange}
              style={{ border: 'none', backgroundColor: 'transparent' }}
            >
              {renderMenu(section.links)}
            </Menu>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
