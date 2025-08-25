import React, { useEffect, useState } from "react";

const Loader: React.FC = () => {
  const [visible, setVisible] = useState(true);

  // ✅ Loader แสดง 5 วิ แล้วหายไป
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* ✅ Icon Environment (น้ำ + หลอดทดลอง) */}
      <div
        style={{
          fontSize: "70px",
          marginBottom: "30px",
          animation: "float 2s ease-in-out infinite",
        }}
      >
        💧🧪
      </div>

      {/* ✅ จุดกลม wave */}
      <div style={{ display: "flex", gap: "20px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#0ea5e9", // สีฟ้า-น้ำเงิน สื่อถึงน้ำ
              animation: "bounce 1.2s infinite",
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      {/* ✅ Keyframes */}
      <style>
        {`
          @keyframes float {
            0%   { transform: translateY(0px); }
            50%  { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); opacity: 0.6; }
            50% { transform: translateY(-14px); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default Loader;
