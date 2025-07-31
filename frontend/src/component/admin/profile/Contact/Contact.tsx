import { Card, Typography } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiMailLine, RiPhoneLine, RiBriefcaseLine } from "react-icons/ri";
import { GetUserDataByUserID } from "../../../../services/httpLogin";
import type { UsersInterface } from "../../../../interface/IUser";

const { Text, Link } = Typography;

const Contact = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [employeeid, setEmployeeid] = useState<number>(
    Number(localStorage.getItem("employeeid")) || 0
  );

  useEffect(() => {
    setEmployeeid(Number(localStorage.getItem("employeeid")));
    const fetchEmployeeData = async () => {
      const employee: UsersInterface | false = await GetUserDataByUserID(employeeid);
      if (typeof employee === "object" && employee !== null) {
        let phoneValue = "";
        if (employee.Phone !== undefined && employee.Phone !== null) {
          phoneValue = String(employee.Phone);
        }
        setPhone(phoneValue);
        setEmail(employee.Email || "");
        setPosition(employee.Position?.Position || "-");
      } else {
        setPhone("");
        setEmail("");
        setPosition("");
      }
    };
    fetchEmployeeData();
  }, [employeeid, refreshKey]);

  return (
    <Card
      title={t("Contact")}
      className="w-full"
      style={{ width: "100%" }}
      classNames={{ body: "pt-2", header: "border-0" }}
      bordered={false}
    >
      <div className="flex flex-col gap-9 w-full">
        <div className="flex">
          <span className="text-2xl text-primary mr-3">
            <RiMailLine />
          </span>
          <div className="flex-1">
            <Text type="secondary" className="text-xs block">
              อีเมลล์
            </Text>
            <Link href={`mailto:${email}`} target="_blank">
              {email || "-"}
            </Link>
          </div>
        </div>
        <div className="flex">
          <span className="text-2xl text-primary mr-3">
            <RiBriefcaseLine />
          </span>
          <div className="flex-1">
            <Text type="secondary" className="text-xs block">
              ตำเเหน่ง
            </Text>
            <span className="text-md text-gray-700 font-semibold">{position || "-"}</span>
          </div>
        </div>
        <div className="flex">
          <span className="mr-3 text-2xl text-primary">
            <RiPhoneLine />
          </span>
          <div className="flex-1">
            <Text type="secondary" className="text-xs block">
              เบอร์โทรศัพท์
            </Text>
            <Link href={`tel:${phone}`} target="_blank">
              {phone || "-"}
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { Contact };
