import React from "react";

export default function PageContainer({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh", // Ensures the container spans the full viewport height
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem", // Adds spacing around the content
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}