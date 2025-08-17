import { Card } from "antd";
import { useTranslation } from "react-i18next";
import TicketGraph from "./graph";

const Status = () => {
  const { t } = useTranslation();
  return (
    <Card
      title={t("สถานะโดยรวมของบัญชีที่เเจ้งเตื่อน")}
      className="text-center"
      classNames={{
        body: "pt-0",
        header: "border-0",
      }}
      bordered={false}
    >
      <TicketGraph />
    </Card>
  );
};

export default Status;
