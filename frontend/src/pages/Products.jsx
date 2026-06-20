import React, { useEffect, useState } from "react";
import { ProductsAPI, extractErrorMessage } from "../api/client.js";
import StockBadge from "../components/StockBadge.jsx";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";

const emptyForm = { name: "", sku: "", price: "", quantity: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited, or null for create
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    ProductsAPI.list()
      .then(setProducts)
      .catch(() => toast.error("Could not load products."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setFormError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");

    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!form.name.trim() || !form.sku.trim()) {
      setFormError("Name and SKU are required.");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setFormError("Price must be a non-negative number.");
      return;
    }
    if (Number.isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
      setFormError("Quantity must be a non-negative whole number.");
      return;
    }

    const payload = { name: form.name.trim(), sku: form.sku.trim(), price, quantity };
    setSaving(true);
    try {
      if (editing) {
        await ProductsAPI.update(editing.id, payload);
        toast.success(`"${payload.name}" updated.`);
      } else {
        await ProductsAPI.create(payload);
        toast.success(`"${payload.name}" added to inventory.`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (product) => {
    try {
      await ProductsAPI.remove(product.id);
      toast.success(`"${product.name}" removed.`);
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
          <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">Stock Ledger</p>
          <h2 className="font-display text-4xl font-semibold text-ink">Products</h2>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Add Product
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading products…</p>
      ) : products.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted">
          No products yet. Add your first item to start tracking stock.
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="font-mono text-muted">{p.sku}</td>
                  <td className="font-mono">${Number(p.price).toFixed(2)}</td>
                  <td>
                    <StockBadge quantity={p.quantity} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => openEdit(p)}>
                        Edit
                      </button>
                      <button
                        className="btn-danger px-2.5 py-1 text-xs"
                        onClick={() => setConfirmDelete(p)}
                      >
                        Delete
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
        <Modal
          eyebrow={editing ? "Edit Item" : "New Item"}
          title={editing ? "Update Product" : "Add Product"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="field-label">Product Name</label>
              <input
                className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Stainless Steel Water Bottle"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">SKU / Code</label>
                <input
                  className="field-input font-mono"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU-0001"
                />
              </div>
              <div>
                <label className="field-label">Price (USD)</label>
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="field-label">Quantity in Stock</label>
              <input
                className="field-input"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
              />
            </div>

            {formError && (
              <p className="rounded-sm bg-alert-light px-3 py-2 text-sm text-alert">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal eyebrow="Confirm" title="Delete Product" onClose={() => setConfirmDelete(null)} width="max-w-sm">
          <p className="text-sm text-muted">
            Remove <span className="font-medium text-ink">{confirmDelete.name}</span> from inventory?
            This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button className="btn-danger" onClick={() => doDelete(confirmDelete)}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
