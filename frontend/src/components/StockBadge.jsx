import React from "react";

export default function StockBadge({ quantity, threshold = 10 }) {
  if (quantity <= 0) {
    return <span className="stamp-out-of-stock">Out of Stock</span>;
  }
  if (quantity <= threshold) {
    return <span className="stamp-low-stock">Low · {quantity} left</span>;
  }
  return <span className="stamp-in-stock">In Stock · {quantity}</span>;
}
