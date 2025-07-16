import { Button, Space } from "antd";

export const ProfileNavbar = () => {
  return (
    <div className="flex flex-col items-center [&_.ant-btn-link]:text-white hover:[&_.ant-btn-link]:text-[#037dca] md:flex-row md:justify-between">
      <Space>
        <Button size="small" type="link">
          EDIT PROFILE
        </Button>
      </Space>
    </div>
  );
};
