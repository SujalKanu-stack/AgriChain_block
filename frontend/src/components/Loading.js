import React from "react";

function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export function LoadingSkeleton({ lines = 3, className = "" }) {
  return (
    <div className={`skeleton-stack ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className={`skeleton-line${index === lines - 1 ? " skeleton-line-short" : ""}`}
        />
      ))}
    </div>
  );
}

export function LoadingCard({ className = "" }) {
  return (
    <div className={`glass-card skeleton-card ${className}`.trim()}>
      <SkeletonBlock className="skeleton-title" />
      <LoadingSkeleton lines={4} />
    </div>
  );
}

export function LoadingGrid({ cards = 3, className = "" }) {
  return (
    <div className={`skeleton-grid ${className}`.trim()}>
      {Array.from({ length: cards }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  );
}

export function LoadingTimeline({ items = 4, className = "" }) {
  return (
    <div className={`skeleton-timeline ${className}`.trim()}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="timeline-item skeleton-card">
          <div className="timeline-icon">
            <SkeletonBlock className="skeleton-avatar" />
          </div>
          <div className="timeline-body">
            <SkeletonBlock className="skeleton-title" />
            <LoadingSkeleton lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingButton({ children, loading, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`button button-primary ${className}`.trim()}
      disabled={loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
