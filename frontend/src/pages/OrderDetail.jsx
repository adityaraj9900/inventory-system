import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { OrdersAPI, extractErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import Modal from "../components/Modal.jsx";

const statusStyles = {
  completed: "stamp-in-stock",
  pending: "stamp-low-stock",
  cancelled: "stamp-out-of-stock",
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  useEffect(() => {
    OrdersAPI.get(id)
      .then(setOrder)
      .catch(() => toast.error("Could not load this order."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doDelete = async () => {
    try {
      await OrdersAPI.remove(id);
      toast.success("Order cancelled and stock restored.");
      navigate("/orders");
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setConfirmDelete(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Loading order…</p>;
  if (!order) return <p className="text-sm text-muted">Order not found.</p>;

  return (
    <div>
      <Link to="/orders" className="text-sm font-medium text-primary hover:underline">
        ← Back to Orders
      </Link>

      <div className="mt-3 mb-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">
            Order #{order.id.slice(0, 8)}
          </p>
          <h2 className="font-display text-4xl font-semibold text-ink">{order.customer_name}</h2>
        </div>
        <span className={statusStyles[order.status] || "stamp"}>{order.status}</span>
      </div>

      <div className="panel mb-6 overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">{item.product_name}</td>
                <td className="font-mono">${Number(item.unit_price).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td className="font-mono">${(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border bg-base px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-widest2 text-muted">Order Total</span>
          <span className="font-display text-2xl font-semibold text-ink">
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
          Cancel Order
        </button>
      </div>

      {confirmDelete && (
        <Modal eyebrow="Confirm" title="Cancel Order" onClose={() => setConfirmDelete(false)} width="max-w-sm">
          <p className="text-sm text-muted">
            Cancel this order and return its items to stock? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>
              Keep Order
            </button>
            <button className="btn-danger" onClick={doDelete}>
              Cancel Order
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
