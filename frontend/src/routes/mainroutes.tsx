import { lazy } from "react";
import { useRoutes, RouteObject  } from "react-router-dom";
import Loadable from "../component/third-patry/Loadable";

const Login = Loadable(lazy(() => import("../page/login")));

// User Role
const User = Loadable(lazy(() => import("../page/user/")));

// Admin Role 
const Admin = Loadable(lazy(() => import("../page/admin/")));
const MainLayout = Loadable(lazy(() => import("../component/admin/MainLayout")));
const Calendar = Loadable(lazy(() => import("../page/admin/calendar/Calendar")));
const People = Loadable(lazy(() => import("../page/admin/people/index")));
const Profile = Loadable(lazy(() => import("../component/admin/profile/SocialProfile")));

// Hardware
const Hardware_Main = Loadable(lazy(() => import("../page/admin/harware/index")));
const Hardware_Room = Loadable(lazy(() => import("../page/admin/harware/data/index")));
const ManageRoom = Loadable(lazy(() => import("../page/admin/harware/manage")));

// data-visualization
const EnvironmentBlock = Loadable(lazy(() => import("../page/admin/data-visualization/EnvironmentBlock")));
const DatavizPH = Loadable(lazy(() => import("../page/admin/data-visualization/PHdataviz")));
const DatavizTDS = Loadable(lazy(() => import("../page/admin/data-visualization/TDSdataviz")));
const DatavizBOD = Loadable(lazy(() => import("../page/admin/data-visualization/BODdataviz")));
const DatavizTKN = Loadable(lazy(() => import("../page/admin/data-visualization/TKNdataviz")));
const DatavizTS = Loadable(lazy(() => import("../page/admin/data-visualization/TSdataviz")));
const DatavizFOG = Loadable(lazy(() => import("../page/admin/data-visualization/FOGdataviz")));

// data-management
const EnvironmentTabs = Loadable(lazy(() => import("../page/admin/data-management/EnvironmentTabs")));
const PH = Loadable(lazy(() => import("../page/admin/data-management/wastewater/PHcenter/PHcenter")));
const TDS = Loadable(lazy(() => import("../page/admin/data-management/wastewater/TDScenter/TDScenter")));
const BOD = Loadable(lazy(() => import("../page/admin/data-management/wastewater/BODcenter/BODcenter")));
const TKN = Loadable(lazy(() => import("../page/admin/data-management/wastewater/TKNcenter/TKNcenter")));
const SS = Loadable(lazy(() => import("../page/admin/data-management/wastewater/SScenter/SScenter") ));
const FOG = Loadable(lazy(() => import("../page/admin/data-management/wastewater/FOGcenter/FOGcenter")));


const UserRoutes = (): RouteObject[] => [
  {
    path: "/", element: <User />,
  },
  {
    path: "/guest",
    children: [
      { index: true, element: <User /> },
    ],
  },
];

const AdminRoutes = (): RouteObject[] => [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Admin /> },
    ],
  },
  {
    path: "/admin",
    element: <MainLayout />,
    children: [
      { index: true, element: <Admin /> },
      { path: "Dashboard", element: <Admin /> },
      { path: "hardware", element: <Hardware_Main /> },
      { path: "Room", element: <Hardware_Room /> },
      { path: "Calendar", element: <Calendar /> },
      { path: "people", element: <People /> },
      { path: "management", element: <ManageRoom /> },
      { path: "profile", element: <Profile /> },
      {
        path: "data-visualization/water",
        children: [
          { index: true, element: <EnvironmentBlock /> },
          { path: "datavizPH", element: <DatavizPH /> },
          { path: "datavizBOD", element: <DatavizBOD /> },
          { path: "datavizTS", element: <DatavizTS /> },
          { path: "datavizTDS", element: <DatavizTDS /> },
          { path: "datavizFOG", element: <DatavizFOG /> },
          { path: "datavizTKN", element: <DatavizTKN /> },
        ]
      },
      {
        path: "data-management/wastewater",
        element: <EnvironmentTabs />, // Header + Tabs
        children: [
          { index: true, element: <PH /> },         // /admin/environment
          { path: "ph", element: <PH /> },            
          { path: "bod", element: <BOD /> },          // /admin/environment/bod
          { path: "tds", element: <TDS /> },          
          { path: "ss", element: <SS /> },
          { path: "fog", element: <FOG /> },
          { path: "tkn", element: <TKN /> },
        ],
      },
    ],
  },
];


const MainRoutes = (): RouteObject[] => [
  {
    path: "/",
    children: [
      { index: true, element: <Login /> },
      { path: "*", element: <Login /> },
    ],
  },
];


function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem('isLogin') === 'true';
  const roleName = localStorage.getItem('roleName');
  const userID = Number(localStorage.getItem('employeeid'));

  console.log("isLoggedIn:", isLoggedIn);
  console.log("roleName:", roleName);
  console.log("employeeid:", userID);

  let routes: RouteObject[] = [];

  if (isLoggedIn) {
    switch (roleName) {
      case 'Admin':
        routes = AdminRoutes();
        break;
      case 'Employee':
        routes = AdminRoutes();
        break;
      case 'Guest':
        routes = UserRoutes();
        break;
      default:
        routes = MainRoutes();
        break;
    }
  }
  else {
    routes = MainRoutes();
  }

  return useRoutes(routes);
}
export default ConfigRoutes;