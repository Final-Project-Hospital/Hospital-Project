// import { Outlet } from 'react-router-dom';
// import { Navbar, Sidebar } from '../../component/admin';
// import { RefreshProvider } from "./RefreshContext"; 
// import "./main.css"

// const MainLayout = () => {
//     return (
//         <RefreshProvider>
//             <div className="flex relative dark:bg-main-dark-bg">
//                 {/* Sidebar */}
//                 <Sidebar />

//                 {/* Main Content */}
//                 <div className="flex-1 min-h-screen bg-main-bg dark:bg-main-dark-bg">
//                     <div className="fixed md:static bg-main-bg dark:bg-main-dark-bg navbar w-full">
//                         <Navbar />
//                     </div>
//                     <div>
//                         <Outlet />
//                     </div>
//                 </div>
//             </div>
//         </RefreshProvider>
//     )
// }

// export default MainLayout;

import { Outlet } from 'react-router-dom';
import { useStateContext } from '../../contexts/ContextProvider';
import { Navbar, Sidebar } from '../../component/admin';
import { RefreshProvider } from "./RefreshContext"; 
import "./main.css"

const MainLayout = () => {
    const { currentMode } = useStateContext();

    return (
        <RefreshProvider>
            <div className={currentMode === 'Dark' ? 'dark' : ''}>
                <div className="flex relative dark:bg-main-dark-bg">

                    {/* Sidebar */}
                    <Sidebar />

                    {/* Main Content */}
                        <div className={`flex-1 min-h-screen transition-all duration-300 bg-main-bg dark:bg-main-dark-bg ml-[collapsed ? '80px' : '224px']`}>
                        {/* Navbar */}
                        <div className="fixed md:static w-full bg-main-bg dark:bg-main-dark-bg navbar">
                            <Navbar />
                        </div>

                        {/* Outlet */}
                        <div className="mt-16 md:mt-0">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </RefreshProvider>
    )
}

export default MainLayout;
