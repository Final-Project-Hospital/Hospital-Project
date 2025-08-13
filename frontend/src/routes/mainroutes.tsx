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
//wastewater
const EnvironmentWastewaterBlock = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/EnvironmentWastewaterBlock")));
const DatavizPH = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/PHdataviz/PHdataviz")));
const DatavizTDS = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/TDSdataviz/TDSdataviz")));
const DatavizBOD = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/BODdataviz/BODdataviz")));
const DatavizTKN = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/TKNdataviz/TKNdataviz")));
const DatavizTS = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/TSdataviz/TSdataviz")));
const DatavizFOG = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/FOGdataviz/FOGdataviz")));
const DatavizCOD = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/CODdataviz/CODdataviz")));
const DatavizFCB = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/FCBdataviz/FCBdataviz")));
const DatavizRES = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/Residuledataviz/RESdataviz")));
const DatavizSUL = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/Sulfiddataviz/SULdataviz")));
const DatavizTCB = Loadable(lazy(() => import("../page/admin/data-visualization/wastewater/TCBdataviz/TCBdataviz")));
//tapwater
const EnvironmentTapwaterBlock = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/EnvironmentTapwaterBlock")));
const DatavizAL = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/ALdataviz/ALdataviz")));
const DatavizIR = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/IRdataviz/IRdataviz")));
const DatavizMN = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/MNdataviz/MNdataviz")));
const DatavizNI = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/NIdataviz/NIdataviz")));
const DatavizNTU = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/NTUdataviz/NTUdataviz")));
const DatavizPT = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/PTdataviz/PTdataviz")));
const DatavizTCOD = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/TCODdataviz/CODdataviz")));
const DatavizTH = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/THdataviz/THdataviz")));
const DatavizTTCB = Loadable(lazy(() => import("../page/admin/data-visualization/tapwater/TTCBdataviz/TCBdataviz")));
//drinkwater
const EnvironmentDrinkwaterBlock = Loadable(lazy(() => import("../page/admin/data-visualization/drinkwater/EnvironmentDrinkwaterBlock")));
const DatavizDFCB = Loadable(lazy(() => import("../page/admin/data-visualization/drinkwater/DFCBdataviz/DFCBdataviz")));
const DatavizDTCB = Loadable(lazy(() => import("../page/admin/data-visualization/drinkwater/DTCBdataviz/DTCBdataviz")));
const DatavizEC = Loadable(lazy(() => import("../page/admin/data-visualization/drinkwater/ECOLIdataviz/ECOLIdataviz")));

//garab
const EnvironmentGarbageBox = Loadable(lazy(() => import("../page/admin/data-visualization/garbage/EnvironmentGarbageBox")));
const DatavizCHE = Loadable(lazy(() => import("../page/admin/data-visualization/garbage/chemicalWaste/chemicalWaste")));
const DatavizGEN = Loadable(lazy(() => import("../page/admin/data-visualization/garbage/generalWaste/generalWaste")));
const DatavizHAZ = Loadable(lazy(() => import("../page/admin/data-visualization/garbage/hazardousWaste/hazardousWaste")));
const DatavizINF = Loadable(lazy(() => import("../page/admin/data-visualization/garbage/infectiousWaste/infectiousWaste")));
const DatavizREC = Loadable(lazy(() => import("../page/admin/data-visualization/garbage/recycledWaste/recycledWaste")));

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
const DTCB = Loadable(lazy(() => import("../page/admin/data-management/drinkwater/dtcbcenter/dtcbcenter")));
const DFCB = Loadable(lazy(() => import("../page/admin/data-management/drinkwater/dfcbcenter/dfcbcenter")));

//tapwater
const EnvironmentTapwaterTabs = Loadable(lazy(() => import("../page/admin/data-management/tapwater/EnvironmentTapwaterTabs")));
const Al = Loadable(lazy(() => import("../page/admin/data-management/tapwater/alcenter/alcenter")));
const IRON = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ironcenter/ironcenter")));
const MN = Loadable(lazy(() => import("../page/admin/data-management/tapwater/mncenter/mncenter")));
const NI = Loadable(lazy(() => import("../page/admin/data-management/tapwater/nicenter/nicenter")));
const NTU = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ntucenter/ntucenter")));
const PT = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ptcenter/ptcenter")));
const TCOD = Loadable(lazy(() => import("../page/admin/data-management/tapwater/tcodcenter/tcodcenter")));
const TH = Loadable(lazy(() => import("../page/admin/data-management/tapwater/thcenter/thcenter")));
const TTCB = Loadable(lazy(() => import("../page/admin/data-management/tapwater/ttcbcenter/ttcbcenter")));

//garbage
const EnvironmentGrabageTab = Loadable(lazy(() => import("../page/admin/data-management/garbage/EnvironmentGrabageTab")));
const CHE = Loadable(lazy(() => import("../page/admin/data-management/garbage/chemicalWaste/chemicalWaste")));
const GEN = Loadable(lazy(() => import("../page/admin/data-management/garbage/generalWaste/generalWaste")));
const HAZ = Loadable(lazy(() => import("../page/admin/data-management/garbage/hazardousWaste/hazardousWaste")));
const INF = Loadable(lazy(() => import("../page/admin/data-management/garbage/infectiousWaste/infectiousWaste")));
const REC = Loadable(lazy(() => import("../page/admin/data-management/garbage/recycledWaste/recycledWaste")));

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
        path: "data-visualization/wastewater",
        children: [
          { index: true, element: <EnvironmentWastewaterBlock /> },
          { path: "datavizPH", element: <DatavizPH /> },
          { path: "datavizBOD", element: <DatavizBOD /> },
          { path: "datavizTS", element: <DatavizTS /> },
          { path: "datavizTDS", element: <DatavizTDS /> },
          { path: "datavizFOG", element: <DatavizFOG /> },
          { path: "datavizTKN", element: <DatavizTKN /> },
          { path: "datavizCOD", element: <DatavizCOD /> },
          { path: "datavizFCB", element: <DatavizFCB /> },
          { path: "datavizRES", element: <DatavizRES /> },
          { path: "datavizSUL", element: <DatavizSUL /> },
          { path: "datavizTCB", element: <DatavizTCB /> },
        ]
      },
            {
        path: "data-visualization/tapwater",
        children: [
          { index: true, element: <EnvironmentTapwaterBlock /> },
          { path: "DatavizAL", element: <DatavizAL /> },
          { path: "DatavizIR", element: <DatavizIR /> },
          { path: "DatavizMN", element: <DatavizMN /> },
          { path: "DatavizNI", element: <DatavizNI /> },
          { path: "DatavizNTU", element: <DatavizNTU /> },
          { path: "DatavizPT", element: <DatavizPT /> },
          { path: "DatavizTCOD", element: <DatavizTCOD /> },
          { path: "DatavizTH", element: <DatavizTH /> },
          { path: "DatavizTTCB", element: <DatavizTTCB /> },
        ]
      },
      {
        path: "data-visualization/drinkwater",
        children: [
          { index: true, element: <EnvironmentDrinkwaterBlock /> },
          { path: "DatavizDFCB", element: <DatavizDFCB /> },
          { path: "DatavizDTCB", element: <DatavizDTCB /> },
          { path: "DatavizEC", element: <DatavizEC /> },
        ]
      },
      {
        path: "data-visualization/garbage",
        children: [
          { index: true, element: <EnvironmentGarbageBox /> },
          { path: "DatavizCHE", element: <DatavizCHE /> },
          { path: "DatavizGEN", element: <DatavizGEN /> },
          { path: "DatavizHAZ", element: <DatavizHAZ /> },
          { path: "DatavizINF", element: <DatavizINF /> },
          { path: "DatavizREC", element: <DatavizREC /> },
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
      {
        path: "data-management/garbage",
        element: <EnvironmentGrabageTab />, // Header + Tabs
        children: [
          { index: true, element: <CHE /> },         // /admin/environment
          { path: "chemica", element: <CHE /> },
          { path: "general", element: <GEN /> },            
          { path: "hazardous", element: <HAZ /> },
          { path: "infectious", element: <INF /> },
          { path: "recycled", element: <REC /> },
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