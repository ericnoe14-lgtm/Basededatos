import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "tecnomaya_db";
const BACKUP_KEY = "tecnomaya_backups";

const initialData = [];

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDB(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadBackups() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBackup(data) {
  const backups = loadBackups();
  const now = new Date().toISOString();
  backups.unshift({ date: now, records: data });
  const trimmed = backups.slice(0, 10);
  localStorage.setItem(BACKUP_KEY, JSON.stringify(trimmed));
  localStorage.setItem("tecnomaya_last_backup", now);
  return now;
}

const BRANDS = ["Samsung", "Huawei", "Xiaomi", "Motorola", "LG", "iPhone", "ZTE", "Alcatel", "Nokia", "Otro"];
const METHODS = ["FRP Tool", "Unlocktool", "Testpoint", "DC Unlocker", "GSM Flasher", "Manual ADB", "Chimera", "Otro"];
const STATUSES = ["Completado", "En proceso", "Fallido", "Pendiente"];

const STATUS_COLORS = {
  "Completado": "#00e676",
  "En proceso": "#ffb300",
  "Fallido": "#ff1744",
  "Pendiente": "#40c4ff",
};

export default function TecnoMayaDB() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list"); // list | add | detail
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastBackup, setLastBackup] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const backupTimerRef = useRef(null);

  function emptyForm() {
    return {
      id: null,
      fecha: new Date().toISOString().slice(0, 10),
      marca: "",
      modelo: "",
      imei: "",
      tipo_desbloqueo: "",
      herramienta: "",
      notas: "",
      costo: "",
      estado: "Completado",
      cliente: "",
    };
  }

  useEffect(() => {
    const db = loadDB();
    setRecords(db);
    const lb = localStorage.getItem("tecnomaya_last_backup");
    setLastBackup(lb);
    scheduleBackup(db);
    return () => clearTimeout(backupTimerRef.current);
  }, []);

  function scheduleBackup(data) {
    clearTimeout(backupTimerRef.current);
    backupTimerRef.current = setTimeout(() => {
      const db = loadDB();
      const date = saveBackup(db);
      setLastBackup(date);
      showToast("💾 Copia automática guardada");
      scheduleBackup(db);
    }, 24 * 60 * 60 * 1000);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    if (!form.marca || !form.modelo || !form.tipo_desbloqueo) {
      showToast("⚠️ Marca, modelo y tipo de desbloqueo son requeridos");
      return;
    }
    let updated;
    if (editMode && form.id) {
      updated = records.map(r => r.id === form.id ? { ...form } : r);
      showToast("✅ Registro actualizado");
    } else {
      const newRecord = { ...form, id: Date.now() };
      updated = [newRecord, ...records];
      showToast("✅ Dispositivo guardado");
    }
    setRecords(updated);
    saveDB(updated);
    setView("list");
    setForm(emptyForm());
    setEditMode(false);
  }

  function handleDelete(id) {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveDB(updated);
    setView("list");
    setSelected(null);
    showToast("🗑️ Registro eliminado");
  }

  function handleManualBackup() {
    const date = saveBackup(records);
    setLastBackup(date);
    showToast("💾 Copia manual guardada exitosamente");
  }

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.modelo?.toLowerCase().includes(q) ||
      r.marca?.toLowerCase().includes(q) ||
      r.tipo_desbloqueo?.toLowerCase().includes(q) ||
      r.herramienta?.toLowerCase().includes(q) ||
      r.imei?.includes(q) ||
      r.cliente?.toLowerCase().includes(q) ||
      r.notas?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Todos" || r.estado === filterStatus;
    return matchSearch && matchStatus;
  });

  const styles = {
    root: {
      minHeight: "100vh",
      background: "#0a0e1a",
      color: "#e0e8ff",
      fontFamily: "'Rajdhani', 'Share Tech Mono', monospace",
    },
    header: {
      background: "linear-gradient(135deg, #0d1b2a 0%, #112240 100%)",
      borderBottom: "2px solid #1e3a5f",
      padding: "18px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 4px 20px rgba(0,180,255,0.1)",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    logoIcon: {
      width: 40,
      height: 40,
      background: "linear-gradient(135deg, #00b4ff, #0066cc)",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      boxShadow: "0 0 16px rgba(0,180,255,0.4)",
    },
    logoText: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: 2,
      color: "#fff",
      textShadow: "0 0 20px rgba(0,180,255,0.5)",
    },
    logoSub: {
      fontSize: 11,
      color: "#4a9eff",
      letterSpacing: 3,
      textTransform: "uppercase",
    },
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    backupInfo: {
      fontSize: 11,
      color: "#4a6a8a",
      textAlign: "right",
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #0066cc, #00b4ff)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "10px 20px",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      letterSpacing: 1,
      boxShadow: "0 4px 15px rgba(0,102,204,0.4)",
      transition: "all 0.2s",
    },
    btnSecondary: {
      background: "transparent",
      color: "#4a9eff",
      border: "1px solid #1e3a5f",
      borderRadius: 8,
      padding: "9px 16px",
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer",
      letterSpacing: 1,
      transition: "all 0.2s",
    },
    btnDanger: {
      background: "rgba(255,23,68,0.15)",
      color: "#ff1744",
      border: "1px solid rgba(255,23,68,0.3)",
      borderRadius: 8,
      padding: "9px 16px",
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer",
      letterSpacing: 1,
    },
    container: {
      maxWidth: 900,
      margin: "0 auto",
      padding: "24px 16px",
    },
    searchBar: {
      display: "flex",
      gap: 10,
      marginBottom: 20,
      alignItems: "center",
    },
    searchInput: {
      flex: 1,
      background: "#0d1b2a",
      border: "1px solid #1e3a5f",
      borderRadius: 10,
      padding: "12px 16px 12px 44px",
      color: "#e0e8ff",
      fontFamily: "inherit",
      fontSize: 15,
      outline: "none",
      transition: "border-color 0.2s",
    },
    searchWrap: {
      position: "relative",
      flex: 1,
    },
    searchIcon: {
      position: "absolute",
      left: 14,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 18,
      color: "#4a6a8a",
      pointerEvents: "none",
    },
    filters: {
      display: "flex",
      gap: 8,
      marginBottom: 20,
      flexWrap: "wrap",
    },
    filterBtn: (active) => ({
      padding: "6px 14px",
      borderRadius: 20,
      border: active ? "none" : "1px solid #1e3a5f",
      background: active ? "linear-gradient(135deg, #0066cc, #00b4ff)" : "transparent",
      color: active ? "#fff" : "#4a9eff",
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer",
      letterSpacing: 0.5,
      transition: "all 0.2s",
    }),
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      background: "#0d1b2a",
      border: "1px solid #1e3a5f",
      borderRadius: 12,
      padding: "14px 16px",
      textAlign: "center",
    },
    statNum: {
      fontSize: 28,
      fontWeight: 700,
      color: "#00b4ff",
    },
    statLabel: {
      fontSize: 11,
      color: "#4a6a8a",
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },
    card: {
      background: "#0d1b2a",
      border: "1px solid #1e3a5f",
      borderRadius: 12,
      padding: "16px 18px",
      marginBottom: 10,
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    cardIcon: (color) => ({
      width: 44,
      height: 44,
      borderRadius: 10,
      background: `${color}20`,
      border: `1px solid ${color}40`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
      flexShrink: 0,
    }),
    cardContent: {
      flex: 1,
      minWidth: 0,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: 600,
      color: "#e0e8ff",
      marginBottom: 3,
    },
    cardSub: {
      fontSize: 13,
      color: "#4a9eff",
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 12,
      color: "#4a6a8a",
    },
    badge: (color) => ({
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: `${color}20`,
      color: color,
      border: `1px solid ${color}40`,
      letterSpacing: 0.5,
      whiteSpace: "nowrap",
    }),
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#4a6a8a",
    },
    panel: {
      background: "#0d1b2a",
      border: "1px solid #1e3a5f",
      borderRadius: 16,
      padding: 28,
    },
    panelTitle: {
      fontSize: 20,
      fontWeight: 700,
      color: "#fff",
      marginBottom: 24,
      letterSpacing: 1,
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginBottom: 20,
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    formLabel: {
      fontSize: 12,
      color: "#4a9eff",
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },
    formInput: {
      background: "#0a0e1a",
      border: "1px solid #1e3a5f",
      borderRadius: 8,
      padding: "10px 14px",
      color: "#e0e8ff",
      fontFamily: "inherit",
      fontSize: 14,
      outline: "none",
    },
    formSelect: {
      background: "#0a0e1a",
      border: "1px solid #1e3a5f",
      borderRadius: 8,
      padding: "10px 14px",
      color: "#e0e8ff",
      fontFamily: "inherit",
      fontSize: 14,
      outline: "none",
    },
    formTextarea: {
      background: "#0a0e1a",
      border: "1px solid #1e3a5f",
      borderRadius: 8,
      padding: "10px 14px",
      color: "#e0e8ff",
      fontFamily: "inherit",
      fontSize: 14,
      outline: "none",
      resize: "vertical",
      minHeight: 80,
    },
    formActions: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      marginTop: 8,
    },
    detailRow: {
      display: "flex",
      gap: 12,
      marginBottom: 14,
      alignItems: "flex-start",
    },
    detailLabel: {
      width: 140,
      fontSize: 12,
      color: "#4a6a8a",
      letterSpacing: 1,
      textTransform: "uppercase",
      paddingTop: 2,
      flexShrink: 0,
    },
    detailValue: {
      fontSize: 15,
      color: "#e0e8ff",
      flex: 1,
    },
    divider: {
      borderTop: "1px solid #1e3a5f",
      margin: "20px 0",
    },
    toast: {
      position: "fixed",
      bottom: 30,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#112240",
      border: "1px solid #1e3a5f",
      color: "#e0e8ff",
      padding: "12px 24px",
      borderRadius: 10,
      fontSize: 14,
      zIndex: 999,
      boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      letterSpacing: 0.5,
    },
    backBtn: {
      background: "transparent",
      color: "#4a9eff",
      border: "none",
      fontSize: 14,
      cursor: "pointer",
      fontFamily: "inherit",
      padding: "0 0 16px 0",
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
  };

  const getBrandEmoji = (marca) => {
    const m = marca?.toLowerCase();
    if (m?.includes("samsung")) return "📱";
    if (m?.includes("iphone") || m?.includes("apple")) return "🍎";
    if (m?.includes("huawei")) return "🔷";
    if (m?.includes("xiaomi")) return "🟠";
    if (m?.includes("motorola")) return "〽️";
    return "📲";
  };

  const completados = records.filter(r => r.estado === "Completado").length;
  const enProceso = records.filter(r => r.estado === "En proceso").length;

  return (
    <div style={styles.root}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🔓</div>
          <div>
            <div style={styles.logoText}>TecnoMaya</div>
            <div style={styles.logoSub}>Base de Desbloqueos</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.backupInfo}>
            {lastBackup
              ? <>💾 Última copia:<br />{new Date(lastBackup).toLocaleString("es-GT")}</>
              : "Sin copia aún"}
          </div>
          <button style={styles.btnSecondary} onClick={handleManualBackup}>
            💾 Respaldar
          </button>
          {view !== "add" && (
            <button style={styles.btnPrimary} onClick={() => { setForm(emptyForm()); setEditMode(false); setView("add"); }}>
              + Nuevo
            </button>
          )}
        </div>
      </div>

      <div style={styles.container}>

        {/* LIST VIEW */}
        {view === "list" && (
          <>
            {/* Stats */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statNum}>{records.length}</div>
                <div style={styles.statLabel}>Total</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNum, color: "#00e676" }}>{completados}</div>
                <div style={styles.statLabel}>Completados</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNum, color: "#ffb300" }}>{enProceso}</div>
                <div style={styles.statLabel}>En proceso</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ ...styles.statNum, color: "#ff1744" }}>{records.filter(r => r.estado === "Fallido").length}</div>
                <div style={styles.statLabel}>Fallidos</div>
              </div>
            </div>

            {/* Search */}
            <div style={styles.searchBar}>
              <div style={styles.searchWrap}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  style={styles.searchInput}
                  placeholder="Buscar por modelo, marca, IMEI, herramienta, cliente..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div style={styles.filters}>
              {["Todos", ...STATUSES].map(s => (
                <button key={s} style={styles.filterBtn(filterStatus === s)} onClick={() => setFilterStatus(s)}>
                  {s}
                </button>
              ))}
            </div>

            {/* Results count */}
            {search && (
              <div style={{ fontSize: 13, color: "#4a6a8a", marginBottom: 12 }}>
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </div>
            )}

            {/* Cards */}
            {filtered.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>
                  {search ? "No se encontraron resultados" : "No hay registros aún"}
                </div>
                <div style={{ fontSize: 13 }}>
                  {search ? "Intenta con otro término" : 'Presiona "+ Nuevo" para agregar el primer desbloqueo'}
                </div>
              </div>
            ) : (
              filtered.map(r => (
                <div
                  key={r.id}
                  style={styles.card}
                  onClick={() => { setSelected(r); setView("detail"); }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#4a9eff"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#1e3a5f"}
                >
                  <div style={styles.cardIcon(STATUS_COLORS[r.estado] || "#4a9eff")}>
                    {getBrandEmoji(r.marca)}
                  </div>
                  <div style={styles.cardContent}>
                    <div style={styles.cardTitle}>{r.marca} {r.modelo}</div>
                    <div style={styles.cardSub}>{r.tipo_desbloqueo}{r.herramienta ? ` · ${r.herramienta}` : ""}</div>
                    <div style={styles.cardMeta}>
                      {r.fecha}{r.cliente ? ` · ${r.cliente}` : ""}{r.imei ? ` · IMEI: ${r.imei}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={styles.badge(STATUS_COLORS[r.estado] || "#4a9eff")}>{r.estado}</span>
                    {r.costo && <span style={{ fontSize: 13, color: "#00e676" }}>Q{r.costo}</span>}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ADD / EDIT VIEW */}
        {view === "add" && (
          <div style={styles.panel}>
            <button style={styles.backBtn} onClick={() => { setView("list"); setEditMode(false); setForm(emptyForm()); }}>
              ← Volver
            </button>
            <div style={styles.panelTitle}>
              🔧 {editMode ? "Editar registro" : "Nuevo desbloqueo"}
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Marca *</label>
                <select style={styles.formSelect} value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {BRANDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Modelo *</label>
                <input style={styles.formInput} placeholder="Ej: A54 5G, iPhone 14..." value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tipo de desbloqueo *</label>
                <input style={styles.formInput} placeholder="Ej: FRP, Patrón, PIN..." value={form.tipo_desbloqueo} onChange={e => setForm({ ...form, tipo_desbloqueo: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Herramienta usada</label>
                <select style={styles.formSelect} value={form.herramienta} onChange={e => setForm({ ...form, herramienta: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>IMEI</label>
                <input style={styles.formInput} placeholder="15 dígitos" value={form.imei} onChange={e => setForm({ ...form, imei: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Cliente</label>
                <input style={styles.formInput} placeholder="Nombre del cliente" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Fecha</label>
                <input type="date" style={styles.formInput} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Costo (Q)</label>
                <input style={styles.formInput} placeholder="0.00" type="number" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Estado</label>
                <select style={styles.formSelect} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Notas / Procedimiento</label>
              <textarea style={styles.formTextarea} placeholder="Describe el proceso, via testpoint, pasos especiales, etc..." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
            </div>
            <div style={styles.formActions}>
              <button style={styles.btnSecondary} onClick={() => { setView("list"); setEditMode(false); setForm(emptyForm()); }}>
                Cancelar
              </button>
              <button style={styles.btnPrimary} onClick={handleSave}>
                {editMode ? "Guardar cambios" : "Guardar dispositivo"}
              </button>
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selected && (
          <div style={styles.panel}>
            <button style={styles.backBtn} onClick={() => { setView("list"); setSelected(null); }}>
              ← Volver a la lista
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                  {getBrandEmoji(selected.marca)} {selected.marca} {selected.modelo}
                </div>
                <span style={styles.badge(STATUS_COLORS[selected.estado] || "#4a9eff")}>{selected.estado}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={styles.btnSecondary} onClick={() => {
                  setForm({ ...selected });
                  setEditMode(true);
                  setView("add");
                }}>✏️ Editar</button>
                <button style={styles.btnDanger} onClick={() => {
                  if (confirm("¿Eliminar este registro?")) handleDelete(selected.id);
                }}>🗑️ Eliminar</button>
              </div>
            </div>
            <div style={styles.divider} />
            {[
              ["Tipo de desbloqueo", selected.tipo_desbloqueo],
              ["Herramienta", selected.herramienta],
              ["IMEI", selected.imei],
              ["Cliente", selected.cliente],
              ["Fecha", selected.fecha],
              ["Costo", selected.costo ? `Q${selected.costo}` : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={styles.detailRow}>
                <div style={styles.detailLabel}>{label}</div>
                <div style={styles.detailValue}>{value}</div>
              </div>
            ))}
            {selected.notas && (
              <>
                <div style={styles.divider} />
                <div style={styles.formGroup}>
                  <div style={{ ...styles.detailLabel, marginBottom: 8 }}>Notas / Procedimiento</div>
                  <div style={{
                    background: "#0a0e1a",
                    border: "1px solid #1e3a5f",
                    borderRadius: 10,
                    padding: "14px 16px",
                    fontSize: 14,
                    color: "#b0c4de",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}>{selected.notas}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}
