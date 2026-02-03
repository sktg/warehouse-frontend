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

//refresh every 15 seconds for priority updates
useEffect(() => {
  loadAll();

  const interval = setInterval(() => {
    loadAll();
  }, 15000);

  return () => clearInterval(interval);
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
        <OpenTasksSection
          tasks={tasks.filter(t => t.status === "OPEN")}
        />

        <AllocatedTasksSection
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
            <colgroup>
              <col style={{ width: "35%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>

            <thead>
              <tr>
                <th style={thtd}>Bin Code</th>
                <th style={thtd}>Capacity</th>
                <th style={thtd}>Current Qty</th>
                <th style={thtd}></th>
              </tr>
            </thead>

            <tbody>
              {bins.map(b => (
                <tr key={b.bin_code}>
                  <td style={thtd}>{b.bin_code}</td>
                  <td style={thtd}>{b.capacity}</td>
                  <td style={thtd}>{b.current_qty}</td>
                  <td style={thtd}>
                    <button
                      style={btnPrimary}
                      onClick={() => refillBin(b.bin_code)}
                    >
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

//added base priority and current rank columns for open tasks
function OpenTasksSection({ tasks }) {
  return (
    <div style={{ flex: 1 }}>
      <h3 style={{ marginBottom: 10 }}>Open Tasks</h3>
      <div style={scrollBox}>
        <table style={table}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>

          <thead>
            <tr>
              <th style={thtd}>Order</th>
              <th style={thtd}>Base Priority</th>
              <th style={thtd}>Current Rank</th>
              <th style={thtd}>Product</th>
              <th style={thtd}>Qty</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map(t => (
              <tr key={t.task_id}>
                <td style={thtd}>{t.order_no}</td>

                <td style={{
                  ...thtd,
                  fontWeight: 600,
                  color:
                    t.base_priority === "P1" ? "red" :
                    t.base_priority === "P2" ? "orange" :
                    "#444"
                }}>
                  {t.base_priority}
                </td>

                <td style={{ ...thtd, fontWeight: 600 }}>
                  #{t.current_rank}
                </td>

                <td style={thtd}>{t.product}</td>
                <td style={thtd}>{t.qty}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

function AllocatedTasksSection({ tasks, onConfirm }) {
  return (
    <div style={{ flex: 1 }}>
      <h3 style={{ marginBottom: 10 }}>Allocated Tasks</h3>
      <div style={scrollBox}>

        <table style={table}>
          <colgroup>
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>

          <thead>
            <tr>
              <th style={thtd}>Order</th>
              <th style={thtd}>Product</th>
              <th style={thtd}>Qty</th>
              <th style={thtd}>Resource</th>
              <th style={thtd}></th>
            </tr>
          </thead>

          <tbody>
            {tasks.map(t => (
              <tr key={t.task_id}>
                <td>{t.order_no}</td>
                <td>{t.product}</td>
                <td>{t.qty}</td>
                <td>{t.allocated_resource}</td>
                <td>
                  <button
                    style={btnPrimary}
                    onClick={() => onConfirm(t.task_id)}
                  >
                    Confirm
                  </button>
                </td>
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
  tableLayout: "fixed",   // ⭐ CRITICAL
  background: "white"
};

const thtd = {
  padding: "8px 6px",
  textAlign: "left",
  borderBottom: "1px solid #eee"
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
  background: "white"
};


export default App;
