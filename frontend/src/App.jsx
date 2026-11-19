
import { useEffect, useState } from "react";
import "./App.css";

const API = "https://batloung-farm-management-system-production-650dc04b.up.railway.app/api";

const emptyData = {
  fruits: [],
  suppliers: [],
  vendors: [],
  purchases: [],
  sales: [],
  stock: [],
  payments: [],
  dashboard: {},
  reports: {},
};

const pages = {
  Fruits: {
    key: "fruits",
    id: "fruit_id",
    fields: [
      { name: "fruit_name", label: "Fruit name", required: true },
      { name: "description", label: "Description" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Available", "Unavailable"],
      },
    ],
    columns: [
      ["fruit_name", "Fruit name"],
      ["description", "Description"],
      ["status", "Status"],
    ],
  },

  Suppliers: {
    key: "suppliers",
    id: "supplier_id",
    fields: [
      { name: "supplier_name", label: "Supplier name", required: true },
      { name: "phone", label: "Phone" },
      { name: "address", label: "Address" },
      { name: "email", label: "Email", type: "email" },
    ],
    columns: [
      ["supplier_name", "Supplier"],
      ["phone", "Phone"],
      ["address", "Address"],
      ["email", "Email"],
    ],
  },

  Vendors: {
    key: "vendors",
    id: "vendor_id",
    fields: [
      { name: "vendor_name", label: "Vendor name", required: true },
      { name: "business_name", label: "Business name" },
      { name: "phone", label: "Phone" },
      { name: "location", label: "Location" },
      { name: "registration_date", label: "Registration date", type: "date" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Inactive"],
      },
    ],
    columns: [
      ["vendor_name", "Vendor"],
      ["business_name", "Business"],
      ["phone", "Phone"],
      ["location", "Location"],
      ["registration_date", "Registration date"],
      ["status", "Status"],
    ],
  },

  Purchases: {
    key: "purchases",
    id: "purchase_id",
    fields: [
      {
        name: "supplier_id",
        label: "Supplier",
        type: "select",
        source: "suppliers",
        optionId: "supplier_id",
        optionLabel: "supplier_name",
        required: true,
      },
      {
        name: "fruit_id",
        label: "Fruit",
        type: "select",
        source: "fruits",
        optionId: "fruit_id",
        optionLabel: "fruit_name",
        required: true,
      },
      { name: "quantity", label: "Quantity", type: "number", required: true },
      {
        name: "purchase_date",
        label: "Purchase date",
        type: "date",
        required: true,
      },
    ],
    columns: [
      ["supplier_name", "Supplier"],
      ["fruit_name", "Fruit"],
      ["quantity", "Quantity"],
      ["purchase_date", "Date"],
    ],
  },

  Sales: {
    key: "sales",
    id: "sale_id",
    fields: [
      {
        name: "vendor_id",
        label: "Vendor",
        type: "select",
        source: "vendors",
        optionId: "vendor_id",
        optionLabel: "vendor_name",
        required: true,
      },
      {
        name: "fruit_id",
        label: "Fruit",
        type: "select",
        source: "fruits",
        optionId: "fruit_id",
        optionLabel: "fruit_name",
        required: true,
      },
      { name: "quantity", label: "Quantity", type: "number", required: true },
      {
        name: "package_size",
        label: "Package size",
        type: "select",
        options: ["Small", "Medium", "Large"],
        required: true,
      },
      {
        name: "unit_price",
        label: "Price per package (M)",
        type: "number",
        required: true,
      },
      { name: "sale_date", label: "Sale date", type: "date", required: true },
    ],
    columns: [
      ["vendor_name", "Vendor"],
      ["fruit_name", "Fruit"],
      ["quantity", "Quantity"],
      ["sale_date", "Date"],
      ["total", "Total (M)"],
    ],
  },

  Stock: {
    key: "stock",
    id: "stock_id",
    fields: [
      {
        name: "fruit_id",
        label: "Fruit",
        type: "select",
        source: "fruits",
        optionId: "fruit_id",
        optionLabel: "fruit_name",
        required: true,
      },
      {
        name: "package_size",
        label: "Package size",
        type: "select",
        options: ["Small", "Medium", "Large"],
        required: true,
      },
      {
        name: "quantity_available",
        label: "Quantity available",
        type: "number",
        required: true,
      },
    ],
    columns: [
      ["fruit_name", "Fruit"],
      ["package_size", "Package size"],
      ["quantity_available", "Quantity available"],
      ["last_updated", "Last updated"],
    ],
  },

  Payments: {
    key: "payments",
    id: "payment_id",
    fields: [
      {
        name: "sale_id",
        label: "Sale",
        type: "select",
        source: "sales",
        optionId: "sale_id",
        optionLabel: "sale_id",
        required: true,
      },
      { name: "amount_paid", label: "Amount (M)", type: "number", required: true },
      {
        name: "payment_method",
        label: "Payment method",
        type: "select",
        options: ["Cash", "Mobile Money", "Bank Transfer"],
        required: true,
      },
      {
        name: "payment_date",
        label: "Payment date",
        type: "date",
        required: true,
      },
      {
        name: "payment_status",
        label: "Payment status",
        type: "select",
        options: ["Paid", "Pending"],
        required: true,
      },
    ],
    columns: [
      ["sale_id", "Sale ID"],
      ["vendor_name", "Vendor"],
      ["amount_paid", "Amount (M)"],
      ["payment_method", "Method"],
      ["payment_date", "Date"],
      ["payment_status", "Status"],
    ],
  },
};

const navigation = [
  "Dashboard",
  "Fruits",
  "Suppliers",
  "Vendors",
  "Purchases",
  "Sales",
  "Stock",
  "Payments",
  "Reports",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [data, setData] = useState(emptyData);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    return result;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        fruits,
        suppliers,
        vendors,
        purchases,
        sales,
        stock,
        payments,
        dashboard,
        reports,
      ] = await Promise.all([
        request("/fruits"),
        request("/suppliers"),
        request("/vendors"),
        request("/purchases"),
        request("/sales"),
        request("/stock"),
        request("/payments"),
        request("/dashboard"),
        request("/reports"),
      ]);

      setData({
        fruits,
        suppliers,
        vendors,
        purchases,
        sales,
        stock,
        payments,
        dashboard,
        reports,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openPage(page) {
    setActivePage(page);
    setForm({});
    setEditingId(null);
    setSearch("");
    setMessage("");
    setError("");
  }

  function startAdd() {
    const config = pages[activePage];
    const newForm = {};

    config.fields.forEach((field) => {
      if (field.type === "date") newForm[field.name] = today();
      else if (field.type === "select" && field.options) {
        newForm[field.name] = field.options[0];
      } else {
        newForm[field.name] = "";
      }
    });

    setForm(newForm);
    setEditingId(null);
    setMessage("");
    setError("");
  }

  function startEdit(record) {
    const config = pages[activePage];
    const newForm = {};

    config.fields.forEach((field) => {
      newForm[field.name] = record[field.name] ?? "";
    });

    if (activePage === "Sales" && record.details) {
      const parts = record.details.split("|")[0]?.split(":");
      if (parts?.length === 3) {
        newForm.package_size = parts[0];
        newForm.quantity = parts[1];
        newForm.unit_price = parts[2];
      }
    }

    setForm(newForm);
    setEditingId(record[config.id]);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const config = pages[activePage];
    const payload = { ...form };

    config.fields.forEach((field) => {
      if (field.type === "number") {
        payload[field.name] = Number(payload[field.name]);
      }
      if (field.type === "select" && field.source) {
        payload[field.name] = Number(payload[field.name]);
      }
    });

    if (
      activePage === "Stock" &&
      Number(payload.quantity_available) < 0
    ) {
      setError("Stock quantity cannot be negative.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const url = `/${config.key}${editingId ? `/${editingId}` : ""}`;
      const method = editingId ? "PUT" : "POST";

      await request(url, {
        method,
        body: JSON.stringify(payload),
      });

      setMessage(editingId ? "Record updated successfully." : "Record added successfully.");
      setForm({});
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecord(record) {
    const config = pages[activePage];
    const id = record[config.id];

    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await request(`/${config.key}/${id}`, { method: "DELETE" });
      setMessage("Record deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelForm() {
    setForm({});
    setEditingId(null);
    setError("");
  }

  const config = pages[activePage];

  const records = config
    ? data[config.key].filter((record) =>
        Object.values(record).some((value) =>
          String(value ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : [];

  function fieldOptions(field) {
    if (field.options) {
      return field.options.map((option) => ({
        value: option,
        label: option,
      }));
    }

    if (field.source) {
      return (data[field.source] || []).map((item) => ({
        value: item[field.optionId],
        label:
          field.source === "sales"
            ? `Sale #${item.sale_id} - ${item.vendor_name || ""}`
            : item[field.optionLabel],
      }));
    }

    return [];
  }

  function formatMoney(value) {
    return `M ${Number(value || 0).toFixed(2)}`;
  }

  function renderDashboard() {
    const cards = [
      ["Total fruits", data.dashboard.fruits ?? 0],
      ["Suppliers", data.dashboard.suppliers ?? 0],
      ["Vendors", data.dashboard.vendors ?? 0],
      ["Total sales", formatMoney(data.dashboard.sales)],
      ["Purchases", data.dashboard.purchases ?? 0],
      ["Stock quantity", data.dashboard.stock ?? 0],
    ];

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to the Batloung Farm Management System.</p>
          </div>
          <button className="secondary-button" onClick={loadData}>
            Refresh data
          </button>
        </div>

        <div className="dashboard-grid">
          {cards.map(([label, value]) => (
            <div className="dashboard-card" key={label}>
              <p>{label}</p>
              <h2>{value}</h2>
            </div>
          ))}
        </div>

        <div className="welcome-panel">
          <h2>Farm overview</h2>
          <p>
            Use the menu on the left to manage fruits, suppliers, vendors,
            purchases, sales, stock and payments. Your records are loaded
            from the MySQL database.
          </p>
        </div>
      </>
    );
  }

  function renderReports() {
    const report = data.reports;

    const items = [
      ["Total sales", formatMoney(report.totalSales)],
      ["Payments received", formatMoney(report.paymentsReceived)],
      ["Pending payments", formatMoney(report.pendingPayments)],
      ["Number of purchases", report.numberOfPurchases ?? 0],
      ["Total stock quantity", report.totalStock ?? 0],
    ];

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Reports</h1>
            <p>A summary of your farm's recorded activities.</p>
          </div>
          <button className="secondary-button" onClick={loadData}>
            Refresh reports
          </button>
        </div>

        <div className="dashboard-grid">
          {items.map(([label, value]) => (
            <div className="dashboard-card" key={label}>
              <p>{label}</p>
              <h2>{value}</h2>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderManagementPage() {
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>{activePage}</h1>
            <p>Manage your {activePage.toLowerCase()} records.</p>
          </div>
          <button className="primary-button" onClick={startAdd}>
            + Add {activePage === "Stock" ? "Stock" : activePage.slice(0, -1)}
          </button>
        </div>

        {Object.keys(form).length > 0 && (
          <form className="form-panel" onSubmit={handleSubmit}>
            <h2>{editingId ? `Edit ${activePage} record` : `Add ${activePage} record`}</h2>

            <div className="form-grid">
              {config.fields.map((field) => (
                <label className="form-field" key={field.name}>
                  <span>{field.label}</span>

                  {field.type === "select" ? (
                    <select
                      value={form[field.name] ?? ""}
                      required={field.required}
                      onChange={(event) =>
                        setForm({ ...form, [field.name]: event.target.value })
                      }
                    >
                      <option value="">Choose {field.label.toLowerCase()}</option>
                      {fieldOptions(field).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={form[field.name] ?? ""}
                      required={field.required}
                      min={field.type === "number" ? 0 : undefined}
                      step={field.type === "number" ? "any" : undefined}
                      onChange={(event) =>
                        setForm({ ...form, [field.name]: event.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update record" : "Save record"}
              </button>
              <button className="secondary-button" type="button" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="table-panel">
          <div className="table-heading">
            <h2>{activePage} records</h2>
            <input
              className="search-input"
              type="search"
              placeholder={`Search ${activePage.toLowerCase()}...`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {config.columns.map(([, label]) => (
                    <th key={label}>{label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record[config.id]}>
                    {config.columns.map(([key]) => (
                      <td key={key}>
                        {key === "total"
                          ? formatMoney(record[key])
                          : record[key] ?? "-"}
                      </td>
                    ))}
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => startEdit(record)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => deleteRecord(record)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="empty-row">
                      {loading ? "Loading records..." : "No records found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">B</div>
          <div>
            <h2>Batloung Farm</h2>
            <span>Management System</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {navigation.map((page) => (
            <button
              key={page}
              className={`nav-button ${activePage === page ? "active" : ""}`}
              onClick={() => openPage(page)}
            >
              <span>{page}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">Batloung Farm © 2026</div>
      </aside>

      <main className="main-content">
        {error && <div className="alert error-alert">{error}</div>}
        {message && <div className="alert success-alert">{message}</div>}

        {loading && activePage === "Dashboard" && (
          <p className="loading-text">Loading your farm records...</p>
        )}

        {activePage === "Dashboard" && renderDashboard()}
        {activePage === "Reports" && renderReports()}
        {config && renderManagementPage()}
      </main>
    </div>
  );
}

export default App;
