// force rebuild
// FORCE VERCEL TO REBUILD FROM CORRECT FOLDER

import React, { useEffect, useState, useCallback } from "react";

const BASE_URL = "https://warehouse-backend-k1u4.onrender.com";


function App() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [data, setData] = useState({});
  const [tasks, setTasks] = useState([]);
  const [bins, setBins] = useState([]);
  const [priority, setPriority] = useState("P3");

  // ✅ Safe fetch helper (prevents JSON crash)
  const safeFetch = async (url, setter) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      setter(json);
    } catch (e) {
      console.error("Fetch failed:", url, e);
    }
  };

const loadAll = useCallback(() => {
  safeFetch(`${BASE_URL}/dashboard`, setData);
  safeFetch(`${BASE_URL}/tasks`, setTasks);
  safeFetch(`${BASE_URL}/bins`, setBins);
}, []);

useEffect(() => {
  loadAll();
}, [loadAll]);
  // ✅ Wait for backend before refresh
const createOrder = async () => {
  try {
    const res = await fetch(`${BASE_URL}/create_order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority })
    });

    if (!res.ok) throw new Error(res.status);
    loadAll();
  } catch (e) {
    console.error("Create order failed", e);
  }
};

const allocateTasks = async () => {
  try {
    const res = await fetch(`${BASE_URL}/allocate_tasks`, {
      method: "POST"
    });

    if (!res.ok) throw new Error(res.status);
    loadAll();
  } catch (e) {
    console.error("Allocate failed", e);
  }
};


const confirmTask = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/confirm_task/${id}`, {
      method: "POST"
    });

    const data = await res.json();

    if (data.error) {
      alert("❌ " + data.error);
    } else {
      loadAll();
    }
  } catch (e) {
    console.error("Confirm failed", e);
  }
};


const refillBin = async (code) => {
  await fetch(`${BASE_URL}/refill_bin/${code}`, { method: "POST" });
  loadAll();
};

return (
  <div style={page}>

    {/* Tabs */}
    <div style={tabs}>
      <Tab active={activeTab === "tasks"} label="Tasks" onClick={() => setActiveTab("tasks")} />
      <Tab active={activeTab === "inventory"} label="Inventory" onClick={() => setActiveTab("inventory")} />
    </div>

    {/* Cards */}
    <div style={cardsRow}>
      <Card title="Open Tasks" value={data.open_tasks} color="#f39c12" />
      <Card title="Assigned Tasks" value={data.assigned_tasks} color="#3498db" />
      <Card title="Completed Tasks" value={data.completed_tasks} color="#27ae60" />
      <Card title="Utilization %" value={data.resource_utilization_percent} color="#8e44ad" />
    </div>

    {activeTab === "tasks" && (
      <>
        {/* Controls */}
        <div style={controls}>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={select}>
            <option value="P1">P1 (VIP)</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
            <option value="P4">P4</option>
            <option value="P5">P5</option>
          </select>

          <button style={btnPrimary} onClick={createOrder}>Create Order</button>
          <button style={btnPrimary} onClick={allocateTasks}>Allocate Tasks</button>
        </div>

        {/* Two scrollable sections */}
        <div style={taskContainer}>
          <TaskSection
            title="Open Tasks"
            tasks={tasks.filter(t => t.status === "OPEN")}
          />

          <TaskSection
            title="Allocated Tasks"
            tasks={tasks.filter(t => t.status === "ALLOCATED")}
            onConfirm={confirmTask}
          />
        </div>
      </>
    )}

    {activeTab === "inventory" && (
      <Section title="Storage Bins">
        <div style={scrollBox}>
          <table style={table}>
            <thead>
              <tr>
                <th>Bin Code</th>
                <th>Capacity</th>
                <th>Current Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bins.map(b => (
                <tr key={b.bin_code}>
                  <td>{b.bin_code}</td>
                  <td>{b.capacity}</td>
                  <td>{b.current_qty}</td>
                  <td>
                    <button style={btnPrimary} onClick={() => refillBin(b.bin_code)}>
                      Refill Capacity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    )}
  </div>
);

}

/* ---------- Components ---------- */

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 35 }}>
      <h2 style={{ marginBottom: 15 }}>{title}</h2>
      {children}
    </div>
  );
}

function Tab({ active, label, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: "10px 25px",
      cursor: "pointer",
      borderBottom: active ? "3px solid #3498db" : "3px solid transparent",
      fontWeight: active ? "600" : "400"
    }}>
      {label}
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div style={{
      flex: 1,
      background: color,
      color: "white",
      padding: "25px 20px",
      borderRadius: 8,
      fontSize: 18
    }}>
      <div>{title}</div>
      <div style={{ fontSize: 32, marginTop: 10 }}>{value}</div>
    </div>
  );
}


function TaskSection({ title, tasks, onConfirm }) {
  const isOpen = title === "Open Tasks";

  return (
    <div style={{ flex: 1 }}>
      <h3 style={{ marginBottom: 10 }}>{title}</h3>
      <div style={scrollBox}>
        <table style={table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Product</th>
              <th>Qty</th>
              {!isOpen && <th>Resource</th>}
              {onConfirm && <th></th>}
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.task_id}>
                <td>{t.order_no}</td>
                <td>{t.product}</td>
                <td>{t.qty}</td>

                {!isOpen && (
                  <td>{t.allocated_resource || "-"}</td>
                )}

                {onConfirm && (
                  <td>
                    <button
                      style={btnPrimary}
                      onClick={() => onConfirm(t.task_id)}
                    >
                      Confirm
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



/* ---------- Styles ---------- */

const page = {
  fontFamily: "Segoe UI, sans-serif",
  padding: "20px 40px",
  background: "#f4f6f8",
  height: "100vh",
  overflow: "hidden"
};

const tabs = {
  display: "flex",
  gap: 30,
  marginBottom: 20
};

const cardsRow = {
  display: "flex",
  gap: 20,
  marginBottom: 20
};

const controls = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 15
};

const select = {
  padding: "6px 10px",
  borderRadius: 4
};

const btnPrimary = {
  padding: "8px 14px",
  background: "#3498db",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer"
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white"
};

const taskContainer = {
  display: "flex",
  gap: 30,
  marginTop: 10,
  height: "58vh"
};

const scrollBox = {
  height: "100%",
  overflowY: "auto",
  border: "1px solid #ddd",
  background: "white",
  padding: 10
};


export default App;
