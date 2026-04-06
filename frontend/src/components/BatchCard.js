import React from "react";

const productIcons = {
  tomato: "T",
  onion: "O",
  potato: "P",
  rice: "R",
  wheat: "W",
  banana: "B",
  apple: "A",
  mango: "M",
  carrot: "C",
  cabbage: "C",
  corn: "C",
  fallback: "L",
};

function getEmoji(name = "") {
  return productIcons[String(name).toLowerCase()] || productIcons.fallback;
}

function formatCurrency(value) {
  if (value === undefined || value === null) {
    return "--";
  }

  return Number(value).toLocaleString("en-IN");
}

export default function BatchCard({ batch, onMoveNext, isMoving }) {
  const {
    name,
    quantity,
    farmerPrice,
    currentPrice,
    isComplete,
    currentStageIndex,
    farmerShare,
    farmerShareLabel,
    farmerShareLevel,
    nextPrice,
    priceJourney,
  } = batch || {};

  const trend = Array.isArray(priceJourney) ? priceJourney : [];
  const shareWord = String(farmerShareLabel || "Share").split(" ")[0];
  const safeName = name || "Unknown Product";
  const safeQuantity = Number(quantity ?? 0);
  const activeStageIndex = Number.isFinite(currentStageIndex) ? currentStageIndex : 0;

  return (
    <article className="lot-card redesign">
      <h3 className="card-title">
        [ {getEmoji(safeName)} {safeName} ]
      </h3>

      <div className="card-block">
        <p><strong>Quantity:</strong> {safeQuantity.toLocaleString()} kg</p>
        <p><strong>Farmer Price:</strong> Rs. {formatCurrency(farmerPrice)}</p>
        <p><strong>Current Price:</strong> Rs. {formatCurrency(currentPrice)}</p>
      </div>

      <div className="card-block">
        <strong>Price Journey:</strong>
        <div className="journey-line">
          {trend.map((step, index) => (
            <React.Fragment key={`${step?.stage || "stage"}-${index}`}>
              <span className={index <= activeStageIndex ? "active-text" : "muted-text"}>
                {step?.stage || "Stage"} Rs. {formatCurrency(step?.price)}
              </span>
              {index < trend.length - 1 && <span className="muted-text"> -> </span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card-block">
        <strong>Farmer Share:</strong>
        <p className={`share-val share-${farmerShareLevel || "moderate"}`}>
          {shareWord} ({Number(farmerShare ?? 0)}%)
        </p>
      </div>

      <div className="card-block">
        <strong>Stage Progress:</strong>
        <div className="journey-line">
          {trend.map((step, index) => (
            <React.Fragment key={`progress-${step?.stage || "stage"}-${index}`}>
              <span className={index <= activeStageIndex ? "active-text" : "muted-text"}>
                {index <= activeStageIndex ? "o" : "o"} {step?.stage || "Stage"}
              </span>
              {index < trend.length - 1 && <span className="muted-text"> -> </span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card-footer-redesign">
        <div>
          {!isComplete && (
            <p className="next-price"><strong>Next Price:</strong> Rs. {formatCurrency(nextPrice)}</p>
          )}
        </div>

        {!isComplete ? (
          <button
            type="button"
            className="button button-primary footer-btn"
            disabled={isMoving}
            onClick={onMoveNext}
          >
            {isMoving ? "Updating..." : "Move to Next Stage"}
          </button>
        ) : (
          <p className="completed-text">Delivered to Consumer</p>
        )}
      </div>
    </article>
  );
}
