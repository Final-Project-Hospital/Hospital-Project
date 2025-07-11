import { lazy } from "react";
import { useRoutes, RouteObject } from "react-router-dom";
import Loadable from "../component/third-patry/Loadable";

const Login = Loadable(lazy(() => import("../page/login")));
const Register = Loadable(lazy(() => import("../page/signup/signup"))); // ยังไม่ทำ

// User Role
const User = Loadable(lazy(() => import("../page/user/")));

// Admin Role 
const Admin = Loadable(lazy(() => import("../page/admin/")));
const MainLayout = Loadable(lazy(() => import("../component/admin/MainLayout")));
const Calendar = Loadable(lazy(() => import("../page/admin/calendar/Calendar")));
const People = Loadable(lazy(() => import("../page/admin/people/index")));

// Hardware
const Hardware_Main = Loadable(lazy(() => import("../page/admin/harware/index")));
const Hardware_Room = Loadable(lazy(() => import("../page/admin/harware/data/index")));

// data-visualization
const EnvironmentBlock = Loadable(lazy(() => import("../page/admin/data-visualization/EnvironmentBlock")));
const DatavizPH = Loadable(lazy(() => import("../page/admin/data-visualization/PHdataviz")));
const DatavizBOD = Loadable(lazy(() => import("../page/admin/data-visualization/BODdataviz")));

// data-management
const EnvironmentTabs = Loadable(lazy(() => import("../page/admin/data-management/EnvironmentTabs")));
const PH = Loadable(lazy(() => import("../page/admin/data-management/PHcenter")));
const BOD = Loadable(lazy(() => import("../page/admin/data-management/BODcenter")));


const UserRoutes = (): RouteObject[] => [
  {
    path: "/", element: <User />,
  },
  {
    path: "/user",
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
      { path: "Hardware", element: <Hardware_Main /> },
      { path: "Room", element: <Hardware_Room /> },
      { path: "Calendar", element: <Calendar /> },
      { path: "people", element: <People /> },
      {
        path: "data-visualization/water",
        children: [
          { index: true, element: <EnvironmentBlock /> },
          { path: "datavizPH", element: <DatavizPH /> },
          { path: "datavizBOD", element: <DatavizBOD /> },
          // { path: "datavizTS", element: <DatavizTS /> },
          // { path: "datavizTDS", element: <DatavizTDS /> },
          // { path: "datavizFOG", element: <DatavizFOG /> },
          // { path: "datavizTKN", element: <DatavizTKN /> },
        ]
      },
      {
        path: "data-management/water",
        element: <EnvironmentTabs />, // Header + Tabs
        children: [
          { index: true, element: <BOD /> },         // /admin/environment
          { path: "ph", element: <PH /> },            // /admin/environment/ph
          { path: "bod", element: <BOD /> },          // /admin/environment/bod
          // { path: "tds", element: <TDS /> },          // /admin/environment/tds
          // { path: "ts", element: <TS /> },
          // { path: "fog", element: <FOG /> },
          // { path: "tkn", element: <TKN /> },
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
      { path: "/register", element: <Register /> },
      { path: "*", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
];


function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem('isLogin') === 'true';
  const roleName = localStorage.getItem('roleName');
  const userID = localStorage.getItem('userID');

  console.log("isLoggedIn:", isLoggedIn);
  console.log("roleName:", roleName);
  console.log("userID:", userID);

  let routes: RouteObject[] = [];

  if (isLoggedIn) {
    switch (roleName) {
      case 'Admin':
        routes = AdminRoutes();
        break;
      case 'User':
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