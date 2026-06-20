import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CustomersAPI, OrdersAPI, ProductsAPI, extractErrorMessage } from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";

const statusStyles = {
  completed: "stamp-in-stock",
  pending: "stamp-low-stock",
  cancelled: "stamp-out-of-stock",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([OrdersAPI.list(), CustomersAPI.list(), ProductsAPI.list()])
      .then(([o, c, p]) => {
        setOrders(o);
        setCustomers(c);
        setProducts(p);
      })
      .catch(() => toast.error("Could not load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doDelete = async (order) => {
    try {
      await OrdersAPI.remove(order.id);
      toast.success("Order cancelled and stock restored.");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">Fulfillment Log</p>
          <h2 className="font-display text-4xl font-semibold text-ink">Orders</h2>
        </div>
        <button
          className="btn-primary"
          onClick={() => setModalOpen(true)}
          disabled={customers.length === 0 || products.length === 0}
          title={
            customers.length === 0 || products.length === 0
              ? "Add at least one customer and product first"
              : undefined
          }
        >
          + New Order
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted">
          No orders yet. Create one once you have customers and products on file.
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-muted">{o.id.slice(0, 8)}</td>
                  <td className="font-medium">{o.customer_name || "—"}</td>
                  <td>{o.items.reduce((sum, i) => sum + i.quantity, 0)} unit(s)</td>
                  <td className="font-mono">${Number(o.total_amount).toFixed(2)}</td>
                  <td>
                    <span className={statusStyles[o.status] || "stamp"}>{o.status}</span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link to={`/orders/${o.id}`} className="btn-secondary px-2.5 py-1 text-xs">
                        View
                      </Link>
                      <button
                        className="btn-danger px-2.5 py-1 text-xs"
                        onClick={() => setConfirmDelete(o)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <NewOrderModal
          customers={customers}
          products={products}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}

      {confirmDelete && (
        <Modal eyebrow="Confirm" title="Cancel Order" onClose={() => setConfirmDelete(null)} width="max-w-sm">
          <p className="text-sm text-muted">
            Cancel this order and return its items to stock? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>
              Keep Order
            </button>
            <button className="btn-danger" onClick={() => doDelete(confirmDelete)}>
              Cancel Order
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NewOrderModal({ customers, products, onClose, onCreated }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [lines, setLines] = useState([{ productId: products[0]?.id || "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  const total = lines.reduce((sum, line) => {
    const product = productById[line.productId];
    return product ? sum + Number(product.price) * Number(line.quantity || 0) : sum;
  }, 0);

  const addLine = () => setLines([...lines, { productId: products[0]?.id || "", quantity: 1 }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx, patch) =>
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("Select a customer.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one product line.");
      return;
    }
    for (const line of lines) {
      const product = productById[line.productId];
      if (!product) {
        setError("Select a valid product for every line.");
        return;
      }
      if (!line.quantity || line.quantity <= 0) {
        setError("Quantity must be at least 1 for every line.");
        return;
      }
      if (line.quantity > product.quantity) {
        setError(`Only ${product.quantity} unit(s) of "${product.name}" available.`);
        return;
      }
    }

    setSaving(true);
    try {
      await OrdersAPI.create({
        customer_id: customerId,
        items: lines.map((l) => ({ product_id: l.productId, quantity: Number(l.quantity) })),
      });
      toast.success("Order created and stock updated.");
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal eyebrow="New Fulfillment" title="Create Order" onClose={onClose} width="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label">Customer</label>
          <select
            className="field-input"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="field-label !mb-0">Line Items</label>
            <button type="button" onClick={addLine} className="text-sm font-medium text-primary hover:underline">
              + Add line
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((line, idx) => {
              const product = productById[line.productId];
              return (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className="field-input flex-1"
                    value={line.productId}
                    onChange={(e) => updateLine(idx, { productId: e.target.value })}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${Number(p.price).toFixed(2)} ({p.quantity} in stock)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max={product?.quantity ?? 1}
                    className="field-input w-20"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                    className="rounded-sm px-2 py-2 text-muted hover:bg-base disabled:opacity-30"
                    aria-label="Remove line"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-sm bg-base px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-widest2 text-muted">Order Total</span>
          <span className="font-display text-2xl font-semibold text-ink">${total.toFixed(2)}</span>
        </div>

        {error && <p className="rounded-sm bg-alert-light px-3 py-2 text-sm text-alert">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Placing order…" : "Create Order"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
