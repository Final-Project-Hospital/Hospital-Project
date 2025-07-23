import React from "react";
import BodyDashboard  from "./dashboard/index";

const Dashboard: React.FC = () => {
  return (
    <section className="main w-full min-h-screen">
      <div className="contentMain w-full">
        <div className="contentRight py-8 px-4 md:px-14 w-full">
          <BodyDashboard/>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
