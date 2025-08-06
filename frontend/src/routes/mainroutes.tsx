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
const EnvironmentWastewaterBlock = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/EnvironmentWastewaterBlock")));
const DatavizPH = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/PHdataviz/PHdataviz")));
const DatavizTDS = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/TDSdataviz/TDSdataviz")));
const DatavizBOD = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/BODdataviz/BODdataviz")));
const DatavizTKN = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/TKNdataviz/TKNdataviz")));
const DatavizTS = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/TSdataviz/TSdataviz")));
const DatavizFOG = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/FOGdataviz/FOGdataviz")));

// data-management
const EnvironmentWastewaterTabs = Loadable(lazy(() => import("../page/admin/data-management/wastewater/EnvironmentWastewaterTabs")));
const PH = Loadable(lazy(() => import("../page/admin/data-management/wastewater/PHcenter/PHcenter")));
const TDS = Loadable(lazy(() => import("../page/admin/data-management/wastewater/TDScenter/TDScenter")));
const BOD = Loadable(lazy(() => import("../page/admin/data-management/wastewater/BODcenter/BODcenter")));
const TKN = Loadable(lazy(() => import("../page/admin/data-management/wastewater/TKNcenter/TKNcenter")));
const TS = Loadable(lazy(() => import("../page/admin/data-management/wastewater/TScenter/TScenter") ));
const FOG = Loadable(lazy(() => import("../page/admin/data-management/wastewater/FOGcenter/FOGcenter")));
const COD = Loadable(lazy(() => import("../page/admin/data-management/wastewater/CODcenter/CODcenter")));
const FCB = Loadable(lazy(() => import("../page/admin/data-management/wastewater/FCBcenter/FCBcenter")));
const RES = Loadable(lazy(() => import("../page/admin/data-management/wastewater/Residulecenter/REScenter")));
const SUL = Loadable(lazy(() => import("../page/admin/data-management/wastewater/Sulfidcenter/SULcenter")));
const TCB = Loadable(lazy(() => import("../page/admin/data-management/wastewater/TCBcenter/TCBcenter")));
//drinkwater
const EnvironmentDrinkwaterTabs = Loadable(lazy(() => import("../page/admin/data-management/drinkwater/EnvironmentDrinkwaterTabs")));
const ECOIN = Loadable(lazy(() => import("../page/admin/data-management/drinkwater/ecolicenter/ecolicenter")));
const DTCB = Loadable(lazy(() => import("../page/admin/data-management/drinkwater/dtcbcenter/tcbcenter")));
const DFCB = Loadable(lazy(() => import("../page/admin/data-management/drinkwater/dfcbcenter/fcbenter")));

//tapwater
const EnvironmentTapwaterTabs = Loadable(lazy(() => import("../page/admin/data-management/tapwater/EnvironmentTapwaterTabs")));
const Al = Loadable(lazy(() => import("../page/admin/data-management/tapwater/alcenter/alcenter")));
const IRON = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ironcenter/ironcenter")));
const MN = Loadable(lazy(() => import("../page/admin/data-management/tapwater/mncenter/mncenter")));
const NI = Loadable(lazy(() => import("../page/admin/data-management/tapwater/nicenter/nicenter")));
const NTU = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ntucenter/ntucenter")));
const PT = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ptcenter/ptcenter")));
const TCOD = Loadable(lazy(() => import("../page/admin/data-management/tapwater/tcodcenter/codcenter")));
const TH = Loadable(lazy(() => import("../page/admin/data-management/tapwater/thcenter/thcenter")));
const TTCB = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ttcbcenter/tcbcenter")));
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
          { index: true, element: <EnvironmentWastewaterBlock /> },
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
        element: <EnvironmentWastewaterTabs />, // Header + Tabs
        children: [
          { index: true, element: <PH /> },         // /admin/environment
          { path: "ph", element: <PH /> },            
          { path: "bod", element: <BOD /> },          // /admin/environment/bod
          { path: "tds", element: <TDS /> },          
          { path: "ts", element: <TS /> },
          { path: "fog", element: <FOG /> },
          { path: "tkn", element: <TKN /> },
          { path: "cod", element: <COD /> },
          { path: "fcb", element: <FCB /> },
          { path: "residule", element: <RES /> },
          { path: "sulfid", element: <SUL /> },
          { path: "tcb", element: <TCB /> },
        ],
      },
      {
        path: "data-management/drinkwater",
        element: <EnvironmentDrinkwaterTabs />, // Header + Tabs
        children: [
          { index: true, element: <ECOIN /> },         // /admin/environment
          { path: "ecoli", element: <ECOIN /> },            
          { path: "dfcb", element: <DFCB /> },
          { path: "dtcb", element: <DTCB /> },
        ],
      },
      {
        path: "data-management/tapwater",
        element: <EnvironmentTapwaterTabs />, // Header + Tabs
        children: [
          { index: true, element: <Al /> },         // /admin/environment
          { path: "al", element: <Al /> },
          { path: "iron", element: <IRON /> },            
          { path: "mn", element: <MN /> },
          { path: "ni", element: <NI /> },
          { path: "ntu", element: <NTU /> },            
          { path: "pt", element: <PT /> },
          { path: "cod", element: <TCOD /> },
          { path: "th", element: <TH /> },            
          { path: "tcb", element: <TTCB /> },
          
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