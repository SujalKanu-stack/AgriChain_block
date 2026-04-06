import React from "react";
import { LoaderCircle } from "lucide-react";

export default function LoadingState({ message = "Loading...", detail = "Preparing live supply data." }) {
  return (
    <div className="loading-state">
      <LoaderCircle size={22} className="spinner-icon" />
      <div className="loading-state-copy">
        <strong>{message}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
