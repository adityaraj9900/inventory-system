import React, { useEffect, useState } from "react";
import { CustomersAPI, extractErrorMessage } from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { useToast } from "../components/Toast.jsx";

const emptyForm = { full_name: "", email: "", phone: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    CustomersAPI.list()
      .then(setCustomers)
      .catch(() => toast.error("Could not load customers."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError("All fields are required.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      await CustomersAPI.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      toast.success(`"${form.full_name.trim()}" added.`);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (customer) => {
    try {
      await CustomersAPI.remove(customer.id);
      toast.success(`"${customer.full_name}" removed.`);
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
          <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">Account Roster</p>
          <h2 className="font-display text-4xl font-semibold text-ink">Customers</h2>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Add Customer
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading customers…</p>
      ) : customers.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted">
          No customers yet. Add one to start creating orders.
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.full_name}</td>
                  <td className="font-mono text-muted">{c.email}</td>
                  <td className="font-mono text-muted">{c.phone}</td>
                  <td>
                    <div className="flex justify-end">
                      <button
                        className="btn-danger px-2.5 py-1 text-xs"
                        onClick={() => setConfirmDelete(c)}
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
        <Modal eyebrow="New Account" title="Add Customer" onClose={() => setModalOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="field-label">Full Name</label>
              <input
                className="field-input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Jordan Reyes"
                autoFocus
              />
            </div>
            <div>
              <label className="field-label">Email Address</label>
              <input
                className="field-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jordan@example.com"
              />
            </div>
            <div>
              <label className="field-label">Phone Number</label>
              <input
                className="field-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 010 2030"
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
                {saving ? "Saving…" : "Add Customer"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal eyebrow="Confirm" title="Delete Customer" onClose={() => setConfirmDelete(null)} width="max-w-sm">
          <p className="text-sm text-muted">
            Remove <span className="font-medium text-ink">{confirmDelete.full_name}</span> from the
            roster? This cannot be undone.
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
