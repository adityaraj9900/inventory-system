import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardAPI } from "../api/client.js";
import StockBadge from "../components/StockBadge.jsx";
import { useToast } from "../components/Toast.jsx";

const STAT_DEFS = [
  { key: "total_products", label: "Total Products", code: "01" },
  { key: "total_customers", label: "Total Customers", code: "02" },
  { key: "total_orders", label: "Total Orders", code: "03" },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    DashboardAPI.summary()
      .then(setSummary)
      .catch(() => toast.error("Could not load dashboard summary."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">Today's Manifest</p>
        <h2 className="font-display text-4xl font-semibold text-ink">Dashboard</h2>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading summary…</p>
      ) : !summary ? (
        <p className="text-sm text-muted">No data available.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STAT_DEFS.map((stat) => (
              <div key={stat.key} className="panel p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">
                  {stat.code} / {stat.label}
                </p>
                <p className="mt-2 font-display text-5xl font-semibold text-ink">
                  {summary[stat.key]}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-ink">Low Stock Alerts</h3>
              <Link to="/products" className="text-sm font-medium text-primary hover:underline">
                View all products →
              </Link>
            </div>

            {summary.low_stock_products.length === 0 ? (
              <div className="panel p-6 text-sm text-muted">
                Nothing below the reorder threshold right now. Stock levels look healthy.
              </div>
            ) : (
              <div className="panel overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.low_stock_products.map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.name}</td>
                        <td className="font-mono text-muted">{p.sku}</td>
                        <td className="font-mono">${Number(p.price).toFixed(2)}</td>
                        <td>
                          <StockBadge quantity={p.quantity} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
