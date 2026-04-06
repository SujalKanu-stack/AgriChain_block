import React from "react";
import { FileX } from "lucide-react";

export function EmptyState({ icon: Icon = FileX, title, description, action = null }) {
  const SafeIcon = typeof Icon === "function" ? Icon : FileX;

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <SafeIcon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function EmptyBatches({ onCreateBatch }) {
  return (
    <EmptyState
      title="No data yet"
      description="Start by creating your first product lot"
      action={
        onCreateBatch ? (
          <button type="button" className="button button-primary" onClick={onCreateBatch}>
            Create Product Lot
          </button>
        ) : null
      }
    />
  );
}

export function EmptyTransactions() {
  return (
    <EmptyState
      title="No activity yet"
      description="Start by creating your first product lot"
    />
  );
}
