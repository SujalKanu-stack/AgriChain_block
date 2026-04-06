import React from "react";
import { Link } from "react-router-dom";

export default function DashboardWidgetCard({ title, description, items, action }) {
  return (
    <div className="glass-card role-widget-card">
      <div className="section-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {action ? (
        <div className="role-widget-action">
          <Link to={action.to} className="button button-primary">
            {action.label}
          </Link>
        </div>
      ) : null}

      <div className="quick-summary-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="quick-summary-item">
              <div className="quick-summary-icon">
                <Icon size={16} />
              </div>
              <div>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
