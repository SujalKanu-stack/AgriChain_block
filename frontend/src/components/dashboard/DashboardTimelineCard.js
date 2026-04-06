import React from "react";
import { Activity } from "lucide-react";

export default function DashboardTimelineCard({ title, description, items }) {
  return (
    <div className="glass-card role-timeline-card">
      <div className="section-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="activity-feed-list">
        {items.map((item) => (
          <div key={item.id} className="activity-feed-item">
            <div className="activity-feed-icon">
              <Activity size={16} />
            </div>
            <div className="activity-feed-copy">
              <div className="activity-feed-top">
                <strong>{item.title}</strong>
                <span>{new Date(item.timestamp).toLocaleString()}</span>
              </div>
              <p>{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
