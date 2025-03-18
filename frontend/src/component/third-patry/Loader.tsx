import React from "react";
import { LoadingOutlined } from "@ant-design/icons";

const Loader: React.FC = () => (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)", 
      zIndex: 2000,
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "rgba(255, 255, 255, 0.8)"
    }}
  >
    <LoadingOutlined style={{ fontSize: 50, color: "#180731" }} spin />
    <span style={{ marginLeft: "10px", fontSize: "20px" }}>Loading...</span>
  </div>
);

export default Loader;
