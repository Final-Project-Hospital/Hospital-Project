import Building from "./header/building";
import Line from "./header/line";
import Node from "./header/node";
import Room from "./header/room";
import Notification from "./line/account";
import Status from "./line/status";
import { NotificationProvider } from "./line/NotificationContext"; // ✅ import Provider

const Index = () => {
  return (
    <div className="col-span-full xl:col-span-8">
      <div className="grid gap-8 grid-cols-12">
        <div className="col-span-full sm:col-span-6 lg:col-span-3">
          <Building />
        </div>
        <div className="col-span-full sm:col-span-6 lg:col-span-3">
          <Line />
        </div>
        <div className="col-span-full sm:col-span-6 lg:col-span-3">
          <Node />
        </div>
        <div className="col-span-full sm:col-span-6 lg:col-span-3">
          <Room />
        </div>

        <NotificationProvider>
          <div className="col-span-full lg:col-span-6 xl:col-span-8">
            <Notification />
          </div>
          <div className="col-span-full lg:col-span-6 xl:col-span-4">
            <Status />
          </div>
        </NotificationProvider>
      </div>
    </div>
  );
};

export default Index;
