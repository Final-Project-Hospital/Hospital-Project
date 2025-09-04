import { Avatar } from "antd";
import { useEffect, useState } from "react";
import { GetUserDataByUserID } from "../../../../../services/httpLogin";
import { UsersInterface } from "../../../../../interface/IUser";
import avatarDefault from "../../../../../assets/admin/avatar3.png";

export const AvatarWithInfo = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [employee, setEmployee] = useState<UsersInterface | null>(null);
  const [employeeid, setEmployeeid] = useState<number>(
    Number(localStorage.getItem("employeeid")) || 0
  );

  useEffect(() => {
    setEmployeeid(Number(localStorage.getItem("employeeid")));
    const fetchEmployee = async () => {
      const emp = await GetUserDataByUserID(employeeid);
      if (emp) setEmployee(emp);
    };
    fetchEmployee();
  }, [employeeid, refreshKey]);

  return (
    <div className="flex items-center justify-between flex-col sm:flex-row">
      <div className="flex flex-wrap flex-col items-center max-sm:text-center mb-6 lg:flex-row">
        <Avatar
          src={employee?.Profile ? employee.Profile : avatarDefault}
          alt="user"
          size={80}
          className="bg-white"
        />
        <div className="flex-1 sm:pl-4 max-sm:mt-4">
          <div className="text-xl mb-1">
            {employee
              ? `${employee.FirstName || ""} ${employee.LastName || ""}`
              : "Loading..."}
          </div>
          <div>{employee?.Role?.RoleName || ""}</div>
        </div>
      </div>
    </div>
  );
};
