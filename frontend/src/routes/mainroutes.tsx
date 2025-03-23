import { lazy } from "react";
import { useRoutes, RouteObject } from "react-router-dom";
import Loadable from "../component/third-patry/Loadable";

const Dashboard = Loadable(lazy(() => import("../page/Dashboard/index")));

const UserRoutes = (): RouteObject[] => [
  {
    path: "/", 
    element: <Dashboard />,  
  },
  {
    path: "/dashboard",
    element: <Dashboard />, 
  },
];

function ConfigRoutes() {
  console.log("ConfigRoutes Loaded");
  return useRoutes(UserRoutes());
}

export default ConfigRoutes;
