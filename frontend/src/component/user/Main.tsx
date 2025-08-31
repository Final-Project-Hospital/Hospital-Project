import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import "./main.css"
const Main = () => {
  return (
    <>
      <Navbar />
      <div>
        <Outlet />
      </div>
    </>
  );
};
export default Main;
