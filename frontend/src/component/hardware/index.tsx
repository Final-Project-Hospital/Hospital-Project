import Building from "./header/building";
import Line from "./header/line";
import Node from "./header/node";
import Room from "./header/room";
import Notification from "./line/account";
import Status from "./line/status";
import { NotificationProvider } from "./line/NotificationContext";
import BuildingMain from "./line/building";

interface MainLineProps {
  reloadKey?: number; // ✅ รับค่า reloadKey จาก RoomAdminTable
}

const Index: React.FC<MainLineProps> = ({ reloadKey }) => {
  return (
    <div className="col-span-full xl:col-span-8">
      <NotificationProvider>
        <div className="grid gap-8 grid-cols-12">
          {/* Header Widgets */}
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
            {/* ✅ ส่ง reloadKey ลงไปยัง Room */}
            <Room reloadKey={reloadKey} />
          </div>

          {/* ✅ Notification + Status */}
          <div className="col-span-full md:col-span-6 xl:col-span-5">
            <Notification />
          </div>
          <div className="col-span-full sm:col-span-6 md:col-span-6 xl:col-span-3">
            <Status />
          </div>

          <div className="col-span-full xl:col-span-4">
            <BuildingMain />
          </div>
        </div>
      </NotificationProvider>
    </div>
  );
};

export default Index;
