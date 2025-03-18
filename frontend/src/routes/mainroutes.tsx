import { lazy } from "react";
import { useRoutes, RouteObject } from "react-router-dom";
import Loadable from "../component/third-patry/Loadable";

const Dashboard = Loadable(lazy(() => import("../page/Dashboard/index")));
const First = Loadable(lazy(() => import("../page/First/index")));

const UserRoutes = (): RouteObject[] => [
  {
    path: "/", 
    element: <Dashboard />,  
  },
  {
    path: "/user",
    element: <Dashboard />, 
  },
  {
    path: "/first",
    element: <First />,  
  }
];

function ConfigRoutes() {
  console.log("ConfigRoutes Loaded");
  return useRoutes(UserRoutes());
}

export default ConfigRoutes;
