import { Card } from "antd";
import { useTranslation } from "react-i18next";
import TicketGraph from "./graph";

const Status = () => {
  const { t } = useTranslation();
  return (
    <Card
      title={<span className=" gap-2 text-teal-600 font-semibold">{t("สถานะโดยรวมของบัญชีที่เเจ้งเตือน")}</span>}
      className="text-center"
      classNames={{
        body: "pt-0",
        header: "border-0",
      }}
      style={{height: "100%"}}
      bordered={false}
    >
      <TicketGraph />
    </Card>
  );
};

export default Status;
