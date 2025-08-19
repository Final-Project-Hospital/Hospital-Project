import React from "react";
import "../assets/skydash/css/style.css"; // CSS หลักของ Skydash
import logo from "../assets/skydash/images/logo.svg"; // โลโก้ของ Skydash
import AdminDashboard from "../page/admin";

const AdminLayout: React.FC = () => {
  return (
    <div className="container-scroller">
      {/* Navbar */}
      <nav className="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
        <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-center">
          <a className="navbar-brand brand-logo" href="/">
            <img src={logo} alt="logo" />
          </a>
        </div>
        <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end">
          <ul className="navbar-nav navbar-nav-right">
            <li className="nav-item">
              <span className="nav-link">Welcome, Admin</span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main container */}
      <div className="container-fluid page-body-wrapper">
        {/* Sidebar */}
        <nav className="sidebar sidebar-offcanvas" id="sidebar">
          <ul className="nav">
            <li className="nav-item">
              <a className="nav-link" href="/admin">
                <span className="menu-title">Dashboard</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Content */}
        <div className="main-panel">
          <div className="content-wrapper">
            <AdminDashboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
