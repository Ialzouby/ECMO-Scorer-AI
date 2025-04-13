import React from "react";
import "./CenteredContainer.css";

export default function CenteredContainer({ children }) {
  return (
    <div className="centered-container">
      <div className="centered-content">{children}</div>
    </div>
  );
}