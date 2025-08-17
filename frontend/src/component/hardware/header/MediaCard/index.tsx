import { Card, CardProps, theme } from "antd";
import React from "react";

const { useToken } = theme;

export interface MediaCardProps extends CardProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  desc: React.ReactNode;
}
export function MediaCard(props: MediaCardProps) {
  const { icon, title, desc, style, ...restProps } = props;
  const { token } = useToken();
  return (
    <Card bordered={false} style={style} {...restProps}>
      <div className="flex items-center">
        <span
          className="text-5xl mr-5"
          style={{
            color: style?.color ? "inherit" : "#030852",
          }}
        >
          {icon}
        </span>
        <div>
          <div
            className="text-3xl font-medium"
            style={{
              color: style?.color ? "inherit" : token.colorTextHeading,
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: style?.color ? "inherit" : token.colorTextSecondary,
            }}
          >
            {desc}
          </div>
        </div>
      </div>
    </Card>
  );
}
