import React from "react";

export default function Title({ text }) {
  return (
    <h2 className="text-xl font-bold mb-4 text-center">
      {text}
    </h2>
  );
}