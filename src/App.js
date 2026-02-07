import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, useParams } from "react-router-dom";


const BASE_URL = "https://warehouse-backend-k1u4.onrender.com";

function SupervisorDashboard() {

  const [orders, setOrders] = useState([]);

  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState("tasks");
  const [data, setData] = useState({});
  const [tasks, setTasks] = useState([]);
  const [bins, setBins] = useState([]);
  const [priority, setPriority] = useState("P3");
  const [openFilter, setOpenFilter] = useState("");
  const [allocFilter, setAllocFilter] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);

  const safeFetch = async (url, setter) => {
    try {
      const res = await fetch(url);
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
    safeFetch(`${BASE_URL}/resource_status`, setResources);

    safeFetch(`${BASE_URL}/orders`, setOrders);
 

  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const createOrder = async () => {
    await fetch(`${BASE_URL}/create_order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority })
    });
    loadAll();
  };

  const allocateTasks = async () => {
    await fetch(`${BASE_URL}/allocate_tasks`, { method: "POST" });
    loadAll();
  };

const confirmTask = async (id) => {
  const res = await fetch(`${BASE_URL}/confirm_task/${id}`, {
    method: "POST"
  });

  const data = await res.json();

  if (data.error) {
    alert("❌ " + data.error);
    return false;     // ⭐ tell caller it failed
  }

  loadAll();
  return true;        // ⭐ tell caller it worked
};


  const refillBin = async (code) => {
    await fetch(`${BASE_URL}/refill_bin/${code}`, { method: "POST" });
    loadAll();
  };

return (
  <div style={page}>
    <div style={content}>

      {selectedResource ? (
        <ResourceDashboard
          code={selectedResource}
          goBack={() => setSelectedResource(null)}
          confirmTask={confirmTask}
          allocateTasks={allocateTasks}
        />
      ) : (
        <>
          <div style={tabs}>
            <Tab label="Tasks" active={activeTab==="tasks"} onClick={() => setActiveTab("tasks")}/>
            <Tab label="Inventory" active={activeTab==="inventory"} onClick={() => setActiveTab("inventory")}/>
            <Tab label="Resources" active={activeTab==="resources"} onClick={() => setActiveTab("resources")}/>
            <Tab
              label="Orders"
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}

            />

          </div>

 


          <div style={cardsRow}>
            <Card title="Open Tasks" value={data.open_tasks} color="#f39c12" />
            <Card title="Assigned Tasks" value={data.assigned_tasks} color="#3498db" />
            <Card title="Completed Tasks" value={data.completed_tasks} color="#27ae60" />

            <Card
              title="Completed Orders"
              value={data.completed_orders}
              color="#a2c01e"   
            />
            <Card title="Utilization %" value={data.resource_utilization_percent} color="#8e44ad" />

          </div>

          {activeTab==="tasks" && (
            <>
              <div style={controls}>
                <select value={priority} onChange={e=>setPriority(e.target.value)} style={select}>
                  <option value="P1">P1 (VIP)</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                  <option value="P4">P4</option>
                  <option value="P5">P5</option>
                </select>
                <button style={btnPrimary} onClick={createOrder}>Create Order</button>
                <button style={btnPrimary} onClick={allocateTasks}>Allocate Tasks</button>
              </div>

              <div style={taskContainer}>
                <OpenTasksSection tasks={tasks.filter(t=>t.status==="OPEN")} filter={openFilter} setFilter={setOpenFilter}/>
                <AllocatedTasksSection tasks={tasks.filter(t=>t.status==="ALLOCATED")} filter={allocFilter} setFilter={setAllocFilter} onConfirm={confirmTask}/>
              </div>
            </>
          )}

          {activeTab==="inventory" && (
            <Section title="Storage Bins">
              <div style={scrollBox}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Bin Code</th>
                      <th style={th}>Capacity</th>
                      <th style={th}>Current Qty</th>
                      <th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bins.map(b=>(
                      <tr key={b.bin_code}>
                        <td style={td}>{b.bin_code}</td>
                        <td style={td}>{b.capacity}</td>
                        <td style={td}>{b.current_qty}</td>
                        <td style={td}><button style={btnSmall} onClick={()=>refillBin(b.bin_code)}>Refill</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {activeTab==="resources" && (
            <Section title="Resource Status">
              <div style={resourceGrid}>
                {resources.map((r,i)=>(
                  <div
                    key={i}
                    onClick={() => setSelectedResource(r.resource_code)}
                    style={{ ...resourceCard(r.status), cursor: "pointer" }}
                  >
                    <div style={{fontWeight:700,fontSize:18}}>{r.resource_code}</div>
                    <div style={{color:"#555"}}>{r.resource_name}</div>
                    <div style={{margin:"8px 0",fontWeight:600}}>{r.status}</div>

                    {r.status==="Busy" ? (
                      <>
                        <div><b>Task ID:</b> {r.task_no}</div>
                        <div><b>Product:</b> {r.product}</div>
                        <div><b>From:</b> {r.source_bin}</div>
                        <div><b>To:</b> {r.dest_bin}</div>
                      </>
                    ) : (
                      <div style={{color:"#888"}}>No task assigned</div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
          {activeTab === "orders" && (
          <Section title="Orders Overview">
            <div style={scrollBox}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Order No</th>
                    <th style={th}>Priority</th>
                    <th style={th}>Order Status</th>
                    <th style={th}>Raised Time</th>
                  </tr>
                </thead>
                <tbody>

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={td}>
                        No orders found
                      </td>
                    </tr>
                  )}

                  {orders
                    .slice()
                    .sort((a, b) =>
                      (a.completed_items === a.total_items) -
                      (b.completed_items === b.total_items)
                    )
                    .map(o => (


                    <tr key={o.order_no}>
                      <td style={td}>{o.order_no}</td>
                      <td style={td}>{o.priority}</td>
                      <td
                        style={{
                          ...td,
                          fontWeight: 600,
                          color: o.status === "CONFIRMED"
                            ? "#27ae60"   // green
                            : "#e67e22"   // orange
                        }}
                      >
                        {o.completed_items}/{o.total_items}
                        {o.status === "CONFIRMED" && " ✅"}
                      </td>


                      <td style={td}>{o.raised_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}


        </>
      )}

    </div>
  </div>
);
}

/* ---------- Components ---------- */

function Section({title,children}) {
  return (
    <div style={sectionCard}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function Tab({label,active,onClick}) {
  return (
    <div onClick={onClick} style={{
      padding:"10px 25px",
      borderBottom: active?"3px solid #3498db":"3px solid transparent",
      cursor:"pointer",
      fontWeight:600
    }}>{label}</div>
  );
}

function Card({title,value,color}) {
  return (
    <div style={{flex:"1 1 220px",background:color,color:"white",padding:18,borderRadius:8}}>
      <div>{title}</div>
      <div style={{fontSize:26}}>{value}</div>
    </div>
  );
}

/* ---------- Task Sections ---------- */

function OpenTasksSection({tasks,filter,setFilter}) {
  return (
    <div style={{flex:1,minWidth:360}}>
      <h3>Open Tasks</h3>
      <input placeholder="Filter..." value={filter} onChange={e=>setFilter(e.target.value)} style={filterBox}/>
      <div style={scrollBox}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Task ID</th>
              <th style={th}>Order</th>
              <th style={th}>Priority</th>
              <th style={th}>Rank</th>
              <th style={th}>Product</th>
              <th style={th}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {tasks.filter(t=>JSON.stringify(t).toLowerCase().includes(filter.toLowerCase()))
            .map(t=>(
              <tr key={t.task_id}>
                <td style={td}>{t.task_no}</td>
                <td style={td}>{t.order_no}</td>
                <td style={td}>{t.base_priority}</td>
                <td style={td}>#{t.current_rank}</td>
                <td style={td}>{t.product}</td>
                <td style={td}>{t.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocatedTasksSection({tasks,filter,setFilter,onConfirm}) {
  return (
    <div style={{flex:1,minWidth:360}}>
      <h3>Allocated Tasks</h3>
      <input placeholder="Filter..." value={filter} onChange={e=>setFilter(e.target.value)} style={filterBox}/>
      <div style={scrollBox}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Task ID</th>
              <th style={th}>Product</th>
              <th style={th}>Qty</th>
              <th style={th}>Resource</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.filter(t=>JSON.stringify(t).toLowerCase().includes(filter.toLowerCase()))
            .map(t=>(
              <tr key={t.task_id}>
                <td style={td}>{t.task_no}</td>
                <td style={td}>{t.product}</td>
                <td style={td}>{t.qty}</td>
                <td style={td}>{t.allocated_resource}</td>
                <td style={td}><button style={btnPrimary} onClick={()=>onConfirm(t.task_id)}>Confirm</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResourceDashboard({ code, goBack, confirmTask, allocateTasks }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/resource/${code}`)
      .then(r => r.json())
      .then(setData);
  }, [code]);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={sectionCard}>
      {goBack && (
      <button style={btnSmall} onClick={goBack}>← Back</button>
      )}

      <h2>Resource {code}</h2>
      <p><b>Total Tasks Completed:</b> {data.total_completed}</p>

      {data.current_task ? (
        <>
          <h3>Current Task</h3>
          <div>Task ID: {data.current_task.task_no}</div>
          <div>Product: {data.current_task.product}</div>
          <div>From: {data.current_task.source_bin}</div>
          <div>To: {data.current_task.dest_bin}</div>

          <button
            style={btnPrimary}
            onClick={async () => {
              const res = await fetch(`${BASE_URL}/confirm_task/${data.current_task.task_id}`, { method: "POST" });
              const result = await res.json();

              if (result.error) {
                alert(result.error);
              }

              // ⭐ RELOAD resource data after confirm
              fetch(`${BASE_URL}/resource/${code}`)
                .then(r => r.json())
                .then(setData);
            }}
          >
            Confirm
          </button>


        </>
      ) : (
        <button
          style={btnPrimary}
          onClick={async () => {
            await allocateTasks();

            const res = await fetch(`${BASE_URL}/resource/${code}`);
            const fresh = await res.json();
            setData(fresh);
          }}
        >
          Allocate Task
        </button>

      )}


      <h3 style={{marginTop:20}}>Task History</h3>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Task ID</th>
            <th style={th}>Product</th>
            <th style={th}>Qty</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.history.map((t,i)=>(
            <tr key={i}>
              <td style={td}>{t.task_no}</td>
              <td style={td}>{t.product}</td>
              <td style={td}>{t.qty}</td>
              <td style={td}>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Styles ---------- */

const page={fontFamily:"Segoe UI, sans-serif",background:"#f4f6f8",minHeight:"100vh"};
const content={maxWidth:"1200px",margin:"0 auto",padding:20};
const tabs={display:"flex",gap:12,marginBottom:20};
const cardsRow={display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"};
const controls={display:"flex",gap:10,marginBottom:15,flexWrap:"wrap"};
const select={padding:8,borderRadius:4};
const btnPrimary={padding:"8px 12px",background:"#3498db",color:"white",border:"none",borderRadius:4,cursor:"pointer"};
const btnSmall={padding:"4px 10px",background:"#3498db",color:"white",border:"none",borderRadius:4,cursor:"pointer"};
const sectionCard={marginTop:30,padding:20,background:"white",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"};
const sectionTitle={marginBottom:15,fontSize:18,fontWeight:600};
const scrollBox={overflowX:"auto",padding:12,border:"1px solid #e5e7eb",borderRadius:6};
const table={width:"100%",borderCollapse:"collapse"};
const th={padding:10,textAlign:"left",borderBottom:"1px solid #eee",fontSize:13,fontWeight:600};
const td={padding:10,borderBottom:"1px solid #eee",fontSize:13};
const taskContainer={display:"flex",gap:24,flexWrap:"wrap"};
const filterBox={marginBottom:8,padding:6,width:"100%",border:"1px solid #ccc",borderRadius:4};
const resourceGrid={display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16};
const resourceCard=(status)=>({
  border:"1px solid #ddd",
  borderRadius:8,
  padding:12,
  background:"white",
  borderLeft: status==="Busy"?"6px solid #e67e22":"6px solid #27ae60"
});



function ResourcePage() {
  const { code } = useParams();

  return (
    <div style={{ padding: 30 }}>
      <ResourceDashboard
        code={code}
        goBack={null}   // ⭐ no back allowed
        confirmTask={async (id) => {
          const res = await fetch(`${BASE_URL}/confirm_task/${id}`, { method: "POST" });
          const data = await res.json();
          if (data.error) alert(data.error);
        }}
        allocateTasks={async () => {
          await fetch(`${BASE_URL}/allocate_tasks`, { method: "POST" });
        }}
      />
    </div>
  );
}


function App() {
  return (
    <Routes>
      <Route path="/" element={<SupervisorDashboard />} />
      <Route path="/resource/:code" element={<ResourcePage />} />
    </Routes>
  );
}

  export default App;