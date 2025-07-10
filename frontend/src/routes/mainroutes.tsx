import { lazy } from "react";
import { useRoutes, RouteObject } from "react-router-dom";
import Loadable from "../component/third-patry/Loadable";

// Pages
const Login = Loadable(lazy(() => import("../page/login")));
const Register = Loadable(lazy(() => import("../page/signup/signup"))); // ยังไม่ทำ

// User Role
const User = Loadable(lazy(() => import("../page/user/")));

// Admin Role
const Admin = Loadable(lazy(() => import("../page/admin/")));
const People = Loadable(lazy(() => import("../page/admin/people"))); // 👈 เพิ่ม
const MainLayout = Loadable(lazy(() => import("../component/admin/MainLayout")));

const UserRoutes = (): RouteObject[] => [
  {
    path: "/",
    element: <User />,
  },
  {
    path: "/user",
    element: <MainLayout />,
    children: [
      { index: true, element: <Admin /> },
      { path: "Dashboard", element: <Admin /> },
    ],  },
];

const AdminRoutes = (): RouteObject[] => [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Admin /> },
      { path: "people", element: <People /> }, // 👈 เพิ่ม /people (แบบไม่มี /admin prefix)
    ],
  },
  {
    path: "/admin",
    element: <MainLayout />,
    children: [
      { index: true, element: <Admin /> },
      { path: "Dashboard", element: <Admin /> },
      { path: "People", element: <People /> }, // 👈 เพิ่ม /admin/People
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
    ],
  },
];

function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem("isLogin") === "true";
  const roleName = localStorage.getItem("roleName");

  let routes: RouteObject[] = [];

  if (isLoggedIn) {
    switch (roleName) {
      case "Admin":
        routes = AdminRoutes();
        break;
      case "User":
        routes = UserRoutes();
        break;
      default:
        routes = MainRoutes();
        break;
    }
  } else {
    routes = MainRoutes();
  }

  return useRoutes(routes);
}
export default ConfigRoutes;
