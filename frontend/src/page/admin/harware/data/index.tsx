import React from "react";
import BodyDashboard  from "./dashboard/index";

const Dashboard: React.FC = () => {
  return (
    <section className="main">
      <div className="contentMain flex justify-center">
        <div className="contentRight py-8 px-14 w-full"><BodyDashboard/></div>
      </div>
    </section>
  );
};

export default Dashboard;