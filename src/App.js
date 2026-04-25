// ============================================================
// GMP Health Vietnam — Client Management System
// File: src/App.js — Phase 4: Team Login
// ============================================================

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";

const allProducts = ["NIASOM", "HEMKY-D", "HEMKY", "HETIK", "GUEVA", "FEMAKUL"];

const productColors = {
  NIASOM: { bg: "#EDE9FE", text: "#6D28D9" },
  "HEMKY-D": { bg: "#DBEAFE", text: "#1D4ED8" },
  HEMKY: { bg: "#DBEAFE", text: "#1D4ED8" },
  HETIK: { bg: "#D1FAE5", text: "#047857" },
  GUEVA: { bg: "#FEF3C7", text: "#B45309" },
  FEMAKUL: { bg: "#FCE7F3", text: "#BE185D" },
};

const statusConfig = {
  active: { label: "Đang theo dõi", color: "#059669", bg: "#ECFDF5" },
  "follow-up": { label: "Cần tái khám", color: "#D97706", bg: "#FFFBEB" },
  new: { label: "Khách mới", color: "#2563EB", bg: "#EFF6FF" },
};

const PERIODS = [
  "TUẦN 1-2", "TUẦN 3-4", "TUẦN 5-6", "TUẦN 7-8",
  "TUẦN 9-10", "TUẦN 11-12",
];

const inputStyle = {
  padding: "9px 14px",
  borderRadius: 10,
  border: "1.5px solid #E2E8F0",
  fontSize: 14,
  outline: "none",
  background: "#F8FAFC",
  color: "#334155",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748B",
  marginBottom: 4,
  display: "block",
};

function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return { bmi: null, classification: "" };
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let classification = "";
  if (bmi < 18.5) classification = "Gầy";
  else if (bmi < 25) classification = "Bình thường";
  else if (bmi < 30) classification = "Thừa cân";
  else if (bmi < 35) classification = "Béo phì độ I";
  else if (bmi < 40) classification = "Béo phì độ II";
  else classification = "Béo phì độ III";
  return { bmi: Math.round(bmi * 10) / 10, classification };
}

function assessWaist(waistCm, gender) {
  if (!waistCm || !gender) return "";
  if (gender === "Nữ") {
    if (waistCm <= 72) return "Vòng eo lý tưởng";
    if (waistCm <= 80) return "Bình thường";
    if (waistCm <= 88) return "Thừa cân, tích mỡ nội tạng";
    return "Béo phì, mỡ nội tạng tập trung vùng bụng";
  } else {
    if (waistCm <= 90) return "Vòng eo lý tưởng";
    if (waistCm <= 102) return "Thừa cân, tích mỡ nội tạng";
    return "Béo phì, mỡ nội tạng tập trung vùng bụng";
  }
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  const diff = new Date() - new Date(dateStr);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ProgressBar({ label, current, start, goal, unit, color }) {
  if (!start || !goal || !current) return null;
  const totalToLose = start - goal;
  const lost = start - current;
  const percent = totalToLose > 0 ? Math.min(Math.round((lost / totalToLose) * 100), 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "#64748B" }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>
          {current}{unit} → {goal}{unit} ({lost > 0 ? "-" : "+"}{Math.abs(lost).toFixed(1)}{unit})
        </span>
      </div>
      <div style={{ background: "#E2E8F0", borderRadius: 20, height: 10, overflow: "hidden" }}>
        <div style={{ width: percent + "%", height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 20, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, textAlign: "right" }}>{percent}% hoàn thành mục tiêu</div>
    </div>
  );
}

// ============================================================
// ✅ NEW: LOGIN SCREEN COMPONENT
// ============================================================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // "login" or "signup"

  async function handleLogin() {
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu!");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Đăng nhập thất bại: " + authError.message);
    } else {
      onLogin(data.user);
    }
    setLoading(false);
  }

  async function handleSignup() {
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu!");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError("Đăng ký thất bại: " + authError.message);
    } else {
      onLogin(data.user);
    }
    setLoading(false);
  }

  // Handle Enter key to submit
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else handleSignup();
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 50%, #0D9488 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      padding: 20,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏥</div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#0F172A", fontWeight: 700 }}>
            GMP Health Vietnam
          </h1>
          <p style={{ margin: "6px 0 0", color: "#94A3B8", fontSize: 14 }}>
            Hệ Thống Quản Lý Khách Hàng
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: "flex",
          background: "#F1F5F9",
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
        }}>
          <button
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "login" ? "#fff" : "transparent",
              color: mode === "login" ? "#0F766E" : "#94A3B8",
              boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "signup" ? "#fff" : "transparent",
              color: mode === "signup" ? "#0F766E" : "#94A3B8",
              boxShadow: mode === "signup" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
            }}
          >
            Đăng Ký
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, marginBottom: 6 }}>Email</label>
          <input
            type="email"
            placeholder="ten@gmphealth.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ ...inputStyle, padding: "12px 16px", fontSize: 15 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, marginBottom: 6 }}>Mật khẩu</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ ...inputStyle, padding: "12px 16px", fontSize: 15 }}
          />
        </div>

        {/* Confirm password — only show for signup */}
        {mode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 6 }}>Xác nhận mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ ...inputStyle, padding: "12px 16px", fontSize: 15 }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: "#FEF2F2",
            color: "#DC2626",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 16,
            border: "1px solid #FECACA",
          }}>
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={mode === "login" ? handleLogin : handleSignup}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 0",
            background: loading
              ? "#94A3B8"
              : "linear-gradient(135deg, #0F766E, #14B8A6)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(15,118,110,0.3)",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? "Đang xử lý..."
            : mode === "login"
            ? "Đăng Nhập"
            : "Tạo Tài Khoản"}
        </button>

        {/* Footer hint */}
        <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 20, marginBottom: 0 }}>
          {mode === "login"
            ? "Chưa có tài khoản? Chuyển sang tab Đăng Ký"
            : "Mật khẩu cần ít nhất 6 ký tự"}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function App() {
  // ✅ NEW: Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState("list");
  const [activeClient, setActiveClient] = useState(null);
  const [progressRecords, setProgressRecords] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  const [checkIn, setCheckIn] = useState({
    period: "TUẦN 1-2", weight_kg: "", waist_cm: "", hip_cm: "",
    water_litres: "", exercise_minutes: "", sleep_hours: "",
    meal_compliance: "", notes: "",
  });

  const [form, setForm] = useState({
    name: "", gender: "Nữ", nickname: "", region: "",
    phone: "", occupation: "", birth_year: "",
    height_cm: "", weight_kg: "", waist_cm: "", hip_cm: "",
    cholesterol: "", ldl: "", triglyceride: "", fatty_liver_grade: "",
    treatment_days: "90", target_weight: "", target_waist: "",
    products: [], notes: "",
  });

  // ✅ NEW: Check if user is already logged in when app starts
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load clients when user logs in
  useEffect(() => {
    if (user) loadClients();
  }, [user]);

  // ✅ NEW: Logout function
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setClients([]);
    setView("list");
    setActiveClient(null);
  }

  async function loadClients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients").select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading clients:", error);
      alert("Lỗi khi tải dữ liệu: " + error.message);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  }

  async function loadProgress(clientId) {
    setLoadingProgress(true);
    const { data, error } = await supabase
      .from("progress_records").select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });
    if (error) console.error("Error loading progress:", error);
    else setProgressRecords(data || []);
    setLoadingProgress(false);
  }

  function openClientDetail(client) {
    setActiveClient(client);
    setView("detail");
    loadProgress(client.id);
    setShowCheckInForm(false);
  }

  function backToList() {
    setView("list");
    setActiveClient(null);
    setProgressRecords([]);
    setShowCheckInForm(false);
  }

  async function handleSaveCheckIn() {
    if (!checkIn.weight_kg) { alert("Vui lòng nhập cân nặng!"); return; }
    setSaving(true);
    const record = {
      client_id: activeClient.id,
      period: checkIn.period,
      check_in_date: new Date().toISOString().split("T")[0],
      weight_kg: parseFloat(checkIn.weight_kg) || null,
      waist_cm: parseFloat(checkIn.waist_cm) || null,
      hip_cm: parseFloat(checkIn.hip_cm) || null,
      water_litres: parseFloat(checkIn.water_litres) || null,
      exercise_minutes: parseInt(checkIn.exercise_minutes) || null,
      sleep_hours: parseFloat(checkIn.sleep_hours) || null,
      meal_compliance: checkIn.meal_compliance || null,
      notes: checkIn.notes || null,
    };
    const { error } = await supabase.from("progress_records").insert([record]);
    if (error) { alert("Lỗi khi lưu: " + error.message); }
    else {
      const currentIndex = PERIODS.indexOf(checkIn.period);
      const nextPeriod = PERIODS[Math.min(currentIndex + 1, PERIODS.length - 1)];
      setCheckIn({ period: nextPeriod, weight_kg: "", waist_cm: "", hip_cm: "", water_litres: "", exercise_minutes: "", sleep_hours: "", meal_compliance: "", notes: "" });
      setShowCheckInForm(false);
      loadProgress(activeClient.id);
      if (activeClient.status === "new") {
        await supabase.from("clients").update({ status: "active" }).eq("id", activeClient.id);
        setActiveClient({ ...activeClient, status: "active" });
        loadClients();
      }
    }
    setSaving(false);
  }

  async function updateClientStatus(newStatus) {
    const { error } = await supabase.from("clients").update({ status: newStatus }).eq("id", activeClient.id);
    if (!error) { setActiveClient({ ...activeClient, status: newStatus }); loadClients(); }
  }

  async function handleSaveClient() {
    if (!form.name || !form.phone) { alert("Vui lòng nhập họ tên và số điện thoại!"); return; }
    setSaving(true);
    const clientData = {
      name: form.name, gender: form.gender, nickname: form.nickname || null,
      region: form.region || null, phone: form.phone, occupation: form.occupation || null,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null,
      hip_cm: form.hip_cm ? parseFloat(form.hip_cm) : null,
      cholesterol: form.cholesterol ? parseFloat(form.cholesterol) : null,
      ldl: form.ldl ? parseFloat(form.ldl) : null,
      triglyceride: form.triglyceride ? parseFloat(form.triglyceride) : null,
      fatty_liver_grade: form.fatty_liver_grade ? parseInt(form.fatty_liver_grade) : null,
      treatment_days: parseInt(form.treatment_days) || 90,
      target_bmi: 25,
      target_weight: form.target_weight ? parseFloat(form.target_weight) : null,
      target_waist: form.target_waist ? parseFloat(form.target_waist) : null,
      products: form.products, status: "new", notes: form.notes || null,
    };
    const { error } = await supabase.from("clients").insert([clientData]);
    if (error) { alert("Lỗi khi lưu: " + error.message); }
    else {
      setForm({ name: "", gender: "Nữ", nickname: "", region: "", phone: "", occupation: "", birth_year: "", height_cm: "", weight_kg: "", waist_cm: "", hip_cm: "", cholesterol: "", ldl: "", triglyceride: "", fatty_liver_grade: "", treatment_days: "90", target_weight: "", target_waist: "", products: [], notes: "" });
      setShowForm(false);
      loadClients();
    }
    setSaving(false);
  }

  const filtered = clients.filter((client) => {
    const matchSearch = search === "" || (client.name || "").toLowerCase().includes(search.toLowerCase()) || (client.region || "").toLowerCase().includes(search.toLowerCase()) || (client.nickname || "").toLowerCase().includes(search.toLowerCase());
    const matchProduct = filterProduct === "all" || (client.products || []).includes(filterProduct);
    const matchStatus = filterStatus === "all" || client.status === filterStatus;
    return matchSearch && matchProduct && matchStatus;
  });

  const stats = {
    total: clients.length,
    followUp: clients.filter((c) => c.status === "follow-up").length,
    newClients: clients.filter((c) => c.status === "new").length,
    active: clients.filter((c) => c.status === "active").length,
  };

  const formBMI = calculateBMI(parseFloat(form.weight_kg), parseFloat(form.height_cm));
  const formWaist = assessWaist(parseFloat(form.waist_cm), form.gender);
  const setField = (field, value) => setForm({ ...form, [field]: value });
  const toggleProduct = (product) => {
    const current = form.products;
    if (current.includes(product)) setForm({ ...form, products: current.filter((p) => p !== product) });
    else setForm({ ...form, products: [...current, product] });
  };

  // ✅ NEW: Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F766E, #14B8A6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 18, fontFamily: "'Segoe UI', sans-serif",
      }}>
        Đang tải...
      </div>
    );
  }

  // ✅ NEW: Show login screen if not logged in
  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  // ============================================================
  // CLIENT DETAIL VIEW
  // ============================================================
  if (view === "detail" && activeClient) {
    const bmiData = calculateBMI(activeClient.weight_kg, activeClient.height_cm);
    const latestRecord = progressRecords.length > 0 ? progressRecords[progressRecords.length - 1] : null;
    const currentWeight = latestRecord ? latestRecord.weight_kg : activeClient.weight_kg;
    const currentWaist = latestRecord ? latestRecord.waist_cm : activeClient.waist_cm;
    const st = statusConfig[activeClient.status] || statusConfig["new"];

    return (
      <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F0F4F8", minHeight: "100vh", color: "#1E293B" }}>
        <div style={{ background: "linear-gradient(135deg, #0F766E, #14B8A6)", padding: "24px 32px", boxShadow: "0 4px 20px rgba(15,118,110,0.3)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={backToList} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Quay lại</button>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, color: "#fff" }}>{activeClient.nickname || activeClient.name}</h1>
                <p style={{ margin: "2px 0 0", color: "#A7F3D0", fontSize: 13 }}>{activeClient.name} • {activeClient.gender}{activeClient.birth_year && ` • ${new Date().getFullYear() - activeClient.birth_year} tuổi`}</p>
              </div>
            </div>
            <select value={activeClient.status} onChange={(e) => updateClientStatus(e.target.value)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, background: st.bg, color: st.color, cursor: "pointer" }}>
              <option value="new">Khách mới</option>
              <option value="active">Đang theo dõi</option>
              <option value="follow-up">Cần tái khám</option>
            </select>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
          {/* Client info summary */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F766E", marginBottom: 14 }}>📊 Thông Tin Ban Đầu</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
              {[
                { label: "Cân nặng", value: activeClient.weight_kg, unit: "kg", icon: "⚖️" },
                { label: "Chiều cao", value: activeClient.height_cm, unit: "cm", icon: "📏" },
                { label: "Vòng bụng", value: activeClient.waist_cm, unit: "cm", icon: "📐" },
                { label: "Vòng hông", value: activeClient.hip_cm, unit: "cm", icon: "📐" },
                { label: "BMI", value: bmiData.bmi, unit: "", icon: "🩺", sub: bmiData.classification },
                { label: "Liệu trình", value: activeClient.treatment_days, unit: "ngày", icon: "📅" },
              ].filter(m => m.value).map((m) => (
                <div key={m.label} style={{ background: "#F8FAFC", borderRadius: 12, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 20 }}>{m.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "4px 0" }}>{m.value}{m.unit && <span style={{ fontSize: 13, color: "#94A3B8" }}> {m.unit}</span>}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{m.label}</div>
                  {m.sub && <div style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>{m.sub}</div>}
                </div>
              ))}
            </div>
            {(activeClient.target_weight || activeClient.target_waist) && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F766E", marginBottom: 10 }}>🎯 Tiến Độ Mục Tiêu</div>
                <ProgressBar label="Cân nặng" current={currentWeight} start={activeClient.weight_kg} goal={activeClient.target_weight} unit="kg" color="#0F766E" />
                <ProgressBar label="Vòng bụng" current={currentWaist} start={activeClient.waist_cm} goal={activeClient.target_waist} unit="cm" color="#B45309" />
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {(activeClient.products || []).map((p) => {
                const pc = productColors[p] || { bg: "#F1F5F9", text: "#475569" };
                return <span key={p} style={{ background: pc.bg, color: pc.text, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>{p}</span>;
              })}
            </div>
            {activeClient.notes && (
              <div style={{ marginTop: 14, padding: 12, background: "#F0FDFA", borderRadius: 10, fontSize: 13, color: "#334155", borderLeft: "3px solid #14B8A6" }}>
                <strong>Ghi chú:</strong> {activeClient.notes}
              </div>
            )}
          </div>

          {/* Check-in section */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F766E" }}>📈 Theo Dõi Tiến Trình ({progressRecords.length} lần check-in)</div>
              <button onClick={() => setShowCheckInForm(!showCheckInForm)} style={{ background: showCheckInForm ? "#EF4444" : "linear-gradient(135deg, #0F766E, #14B8A6)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {showCheckInForm ? "✕ Đóng" : "+ Thêm Check-in"}
              </button>
            </div>

            {showCheckInForm && (
              <div style={{ padding: 20, background: "#F0FDFA", borderRadius: 12, marginBottom: 20, border: "2px solid #14B8A6" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  <div><label style={labelStyle}>Giai đoạn *</label><select value={checkIn.period} onChange={(e) => setCheckIn({ ...checkIn, period: e.target.value })} style={inputStyle}>{PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label style={labelStyle}>Cân nặng (kg) *</label><input type="number" step="0.1" placeholder="87.5" value={checkIn.weight_kg} onChange={(e) => setCheckIn({ ...checkIn, weight_kg: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Vòng bụng (cm)</label><input type="number" step="0.1" placeholder="95" value={checkIn.waist_cm} onChange={(e) => setCheckIn({ ...checkIn, waist_cm: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Vòng hông (cm)</label><input type="number" step="0.1" placeholder="108" value={checkIn.hip_cm} onChange={(e) => setCheckIn({ ...checkIn, hip_cm: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Nước uống (lít/ngày)</label><input type="number" step="0.1" placeholder="2.0" value={checkIn.water_litres} onChange={(e) => setCheckIn({ ...checkIn, water_litres: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Vận động (phút/ngày)</label><input type="number" placeholder="30" value={checkIn.exercise_minutes} onChange={(e) => setCheckIn({ ...checkIn, exercise_minutes: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Giấc ngủ (giờ/đêm)</label><input type="number" step="0.5" placeholder="7" value={checkIn.sleep_hours} onChange={(e) => setCheckIn({ ...checkIn, sleep_hours: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Tuân thủ bữa ăn</label><select value={checkIn.meal_compliance} onChange={(e) => setCheckIn({ ...checkIn, meal_compliance: e.target.value })} style={inputStyle}><option value="">-- Chọn --</option><option value="Tốt">Tốt — Trên 80%</option><option value="Khá">Khá — 50-80%</option><option value="Kém">Kém — Dưới 50%</option></select></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Ghi chú TVV</label><textarea placeholder="Nhận xét về tiến trình..." value={checkIn.notes} onChange={(e) => setCheckIn({ ...checkIn, notes: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} /></div>
                </div>
                {checkIn.weight_kg && activeClient.weight_kg && (
                  <div style={{ marginTop: 12, padding: 12, background: "#fff", borderRadius: 10, fontSize: 13, display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {(() => { const diff = parseFloat(checkIn.weight_kg) - activeClient.weight_kg; return (<span>Thay đổi cân nặng: <strong style={{ color: diff <= 0 ? "#059669" : "#DC2626", marginLeft: 6 }}>{diff > 0 ? "+" : ""}{diff.toFixed(1)} kg</strong><span style={{ color: "#94A3B8", marginLeft: 4 }}> so với ban đầu</span></span>); })()}
                    {checkIn.waist_cm && activeClient.waist_cm && (() => { const diff = parseFloat(checkIn.waist_cm) - activeClient.waist_cm; return (<span>Vòng bụng: <strong style={{ color: diff <= 0 ? "#059669" : "#DC2626", marginLeft: 6 }}>{diff > 0 ? "+" : ""}{diff.toFixed(1)} cm</strong></span>); })()}
                  </div>
                )}
                <button onClick={handleSaveCheckIn} disabled={saving} style={{ marginTop: 14, background: saving ? "#94A3B8" : "linear-gradient(135deg, #0F766E, #14B8A6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Đang lưu..." : "✓ Lưu Check-in"}
                </button>
              </div>
            )}

            {loadingProgress && <div style={{ textAlign: "center", padding: 30, color: "#94A3B8" }}>Đang tải...</div>}
            {!loadingProgress && progressRecords.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 14 }}>Chưa có lần check-in nào. Nhấn "+ Thêm Check-in" để bắt đầu.</div>}

            {!loadingProgress && progressRecords.length > 0 && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", gap: 2, marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#64748B", padding: "8px 12px", background: "#F1F5F9", borderRadius: 8 }}>
                  <div>Giai đoạn</div><div>Cân nặng</div><div>Vòng bụng</div><div>Vòng hông</div><div>Tuân thủ</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", gap: 2, padding: "10px 12px", fontSize: 13, background: "#FFFBEB", borderRadius: 8, marginBottom: 4, borderLeft: "3px solid #F59E0B" }}>
                  <div style={{ fontWeight: 600, color: "#92400E" }}>Ban đầu</div>
                  <div>{activeClient.weight_kg || "—"} kg</div><div>{activeClient.waist_cm || "—"} cm</div><div>{activeClient.hip_cm || "—"} cm</div><div>—</div>
                </div>
                {progressRecords.map((record, index) => {
                  const prevWeight = index === 0 ? activeClient.weight_kg : progressRecords[index - 1].weight_kg;
                  const weightDiff = record.weight_kg && prevWeight ? record.weight_kg - prevWeight : null;
                  const complianceColor = { "Tốt": "#059669", "Khá": "#D97706", "Kém": "#DC2626" };
                  return (
                    <div key={record.id} style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", gap: 2, padding: "10px 12px", fontSize: 13, background: index % 2 === 0 ? "#fff" : "#F8FAFC", borderRadius: 8, marginBottom: 2, borderLeft: "3px solid #14B8A6" }}>
                      <div style={{ fontWeight: 600, color: "#0F766E" }}>{record.period}</div>
                      <div>{record.weight_kg || "—"} kg {weightDiff !== null && <span style={{ fontSize: 11, marginLeft: 4, color: weightDiff <= 0 ? "#059669" : "#DC2626" }}>({weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)})</span>}</div>
                      <div>{record.waist_cm || "—"} cm</div><div>{record.hip_cm || "—"} cm</div>
                      <div style={{ color: complianceColor[record.meal_compliance] || "#94A3B8", fontWeight: 600 }}>{record.meal_compliance || "—"}</div>
                    </div>
                  );
                })}
                {(() => {
                  const latest = progressRecords[progressRecords.length - 1];
                  const totalWeight = latest.weight_kg && activeClient.weight_kg ? (latest.weight_kg - activeClient.weight_kg).toFixed(1) : null;
                  const totalWaist = latest.waist_cm && activeClient.waist_cm ? (latest.waist_cm - activeClient.waist_cm).toFixed(1) : null;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "120px repeat(4, 1fr)", gap: 2, padding: "12px 12px", fontSize: 13, fontWeight: 700, background: "#F0FDFA", borderRadius: 8, marginTop: 4, borderLeft: "3px solid #0F766E" }}>
                      <div style={{ color: "#0F766E" }}>TỔNG KẾT</div>
                      <div style={{ color: totalWeight <= 0 ? "#059669" : "#DC2626" }}>{totalWeight !== null ? `${totalWeight > 0 ? "+" : ""}${totalWeight} kg` : "—"}</div>
                      <div style={{ color: totalWaist <= 0 ? "#059669" : "#DC2626" }}>{totalWaist !== null ? `${totalWaist > 0 ? "+" : ""}${totalWaist} cm` : "—"}</div>
                      <div>—</div><div>—</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F766E", marginBottom: 10 }}>📞 Liên Hệ</div>
            <div style={{ fontSize: 14, color: "#334155", lineHeight: 2 }}>
              {activeClient.phone && <div><strong>Điện thoại:</strong> {activeClient.phone}</div>}
              {activeClient.region && <div><strong>Khu vực:</strong> {activeClient.region}</div>}
              {activeClient.occupation && <div><strong>Nghề nghiệp:</strong> {activeClient.occupation}</div>}
              {activeClient.cholesterol && <div><strong>Cholesterol:</strong> {activeClient.cholesterol} mmol/l</div>}
              {activeClient.ldl && <div><strong>LDL:</strong> {activeClient.ldl} mmol/l</div>}
              {activeClient.triglyceride && <div><strong>Triglyceride:</strong> {activeClient.triglyceride} mmol/l</div>}
              {activeClient.fatty_liver_grade && <div><strong>Gan nhiễm mỡ:</strong> Độ {activeClient.fatty_liver_grade}</div>}
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "32px 0 16px", fontSize: 12, color: "#94A3B8" }}>GMP Health Vietnam — CMS v4.0 • Phase 4</div>
        </div>
      </div>
    );
  }

  // ============================================================
  // CLIENT LIST VIEW
  // ============================================================
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F0F4F8", minHeight: "100vh", color: "#1E293B" }}>
      <div style={{ background: "linear-gradient(135deg, #0F766E, #14B8A6)", padding: "24px 32px", boxShadow: "0 4px 20px rgba(15,118,110,0.3)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: "#fff" }}>🏥 GMP Health — Quản Lý Khách Hàng</h1>
            <p style={{ margin: "4px 0 0", color: "#A7F3D0", fontSize: 14 }}>
              {/* ✅ NEW: Show logged-in user email */}
              {user.email} • {clients.length} khách hàng
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowForm(!showForm)} style={{ background: "#fff", color: "#0F766E", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
              {showForm ? "✕ Đóng" : "+ Thêm Khách Hàng"}
            </button>
            {/* ✅ NEW: Logout button */}
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Tổng khách", value: stats.total, icon: "👥", color: "#0F766E" },
            { label: "Cần tái khám", value: stats.followUp, icon: "🔔", color: "#D97706" },
            { label: "Khách mới", value: stats.newClients, icon: "✨", color: "#2563EB" },
            { label: "Đang theo dõi", value: stats.active, icon: "📋", color: "#7C3AED" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderLeft: "4px solid " + s.color }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: "4px 0" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add client form */}
        {showForm && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: "2px solid #14B8A6" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 20, color: "#0F766E" }}>Thêm Khách Hàng Mới</h3>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F766E", marginBottom: 12, borderBottom: "2px solid #D1FAE5", paddingBottom: 6 }}>👤 Thông Tin Cá Nhân</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div><label style={labelStyle}>Họ và tên *</label><input placeholder="Nguyễn Thị..." value={form.name} onChange={(e) => setField("name", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Giới tính</label><select value={form.gender} onChange={(e) => setField("gender", e.target.value)} style={inputStyle}><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
                <div><label style={labelStyle}>Gọi tắt</label><input placeholder="Chị Trang" value={form.nickname} onChange={(e) => setField("nickname", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Năm sinh</label><input type="number" placeholder="1986" value={form.birth_year} onChange={(e) => setField("birth_year", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Số điện thoại *</label><input placeholder="0901 234 567" value={form.phone} onChange={(e) => setField("phone", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Khu vực</label><input placeholder="Hà Nội" value={form.region} onChange={(e) => setField("region", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nghề nghiệp</label><input placeholder="Nhân viên" value={form.occupation} onChange={(e) => setField("occupation", e.target.value)} style={inputStyle} /></div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F766E", marginBottom: 12, borderBottom: "2px solid #D1FAE5", paddingBottom: 6 }}>📏 Số Đo Cơ Thể</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div><label style={labelStyle}>Chiều cao (cm)</label><input type="number" placeholder="170" value={form.height_cm} onChange={(e) => setField("height_cm", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Cân nặng (kg)</label><input type="number" placeholder="90" value={form.weight_kg} onChange={(e) => setField("weight_kg", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Vòng bụng (cm)</label><input type="number" placeholder="97" value={form.waist_cm} onChange={(e) => setField("waist_cm", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Vòng hông (cm)</label><input type="number" placeholder="110" value={form.hip_cm} onChange={(e) => setField("hip_cm", e.target.value)} style={inputStyle} /></div>
              </div>
              {(formBMI.bmi || formWaist) && (
                <div style={{ marginTop: 12, padding: 14, background: "#F0FDFA", borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 20, fontSize: 14 }}>
                  {formBMI.bmi && <div><span style={{ color: "#64748B" }}>BMI: </span><span style={{ fontWeight: 700, color: formBMI.bmi >= 25 ? "#DC2626" : "#059669" }}>{formBMI.bmi}</span><span style={{ color: "#64748B", marginLeft: 6 }}>— {formBMI.classification}</span></div>}
                  {formWaist && <div><span style={{ color: "#64748B" }}>Vòng bụng: </span><span style={{ fontWeight: 600, color: "#B45309" }}>{formWaist}</span></div>}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F766E", marginBottom: 12, borderBottom: "2px solid #D1FAE5", paddingBottom: 6 }}>🩺 Chỉ Số Sức Khỏe</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div><label style={labelStyle}>Cholesterol (mmol/l)</label><input type="number" step="0.1" value={form.cholesterol} onChange={(e) => setField("cholesterol", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>LDL (mmol/l)</label><input type="number" step="0.1" value={form.ldl} onChange={(e) => setField("ldl", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Triglyceride (mmol/l)</label><input type="number" step="0.1" value={form.triglyceride} onChange={(e) => setField("triglyceride", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Gan nhiễm mỡ</label><select value={form.fatty_liver_grade} onChange={(e) => setField("fatty_liver_grade", e.target.value)} style={inputStyle}><option value="">Không có</option><option value="1">Độ 1</option><option value="2">Độ 2</option><option value="3">Độ 3</option></select></div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F766E", marginBottom: 12, borderBottom: "2px solid #D1FAE5", paddingBottom: 6 }}>🎯 Liệu Trình & Mục Tiêu</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div><label style={labelStyle}>Số ngày liệu trình</label><select value={form.treatment_days} onChange={(e) => setField("treatment_days", e.target.value)} style={inputStyle}><option value="30">30 ngày</option><option value="60">60 ngày</option><option value="90">90 ngày</option><option value="120">120 ngày</option></select></div>
                <div><label style={labelStyle}>Cân nặng mục tiêu (kg)</label><input type="number" placeholder="72" value={form.target_weight} onChange={(e) => setField("target_weight", e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Vòng bụng mục tiêu (cm)</label><input type="number" placeholder="83" value={form.target_waist} onChange={(e) => setField("target_waist", e.target.value)} style={inputStyle} /></div>
              </div>
              {form.weight_kg && form.target_weight && (
                <div style={{ marginTop: 12, padding: 14, background: "#FEF3C7", borderRadius: 10, fontSize: 14, color: "#92400E" }}>
                  Cần giảm: <strong>{(parseFloat(form.weight_kg) - parseFloat(form.target_weight)).toFixed(1)} kg</strong>
                  {form.waist_cm && form.target_waist && <span style={{ marginLeft: 16 }}>Vòng bụng cần giảm: <strong>{(parseFloat(form.waist_cm) - parseFloat(form.target_waist)).toFixed(1)} cm</strong></span>}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F766E", marginBottom: 12, borderBottom: "2px solid #D1FAE5", paddingBottom: 6 }}>💊 Sản Phẩm</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allProducts.map((p) => {
                  const selected = form.products.includes(p);
                  const pc = productColors[p];
                  return <button key={p} onClick={() => toggleProduct(p)} style={{ background: selected ? pc.bg : "#F8FAFC", color: selected ? pc.text : "#94A3B8", border: "2px solid " + (selected ? pc.text : "#E2E8F0"), borderRadius: 20, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{selected ? "✓ " : ""}{p}</button>;
                })}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F766E", marginBottom: 12, borderBottom: "2px solid #D1FAE5", paddingBottom: 6 }}>📝 Ghi Chú</div>
              <textarea placeholder="Ghi chú tư vấn..." value={form.notes} onChange={(e) => setField("notes", e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
            </div>
            <button onClick={handleSaveClient} disabled={saving} style={{ background: saving ? "#94A3B8" : "linear-gradient(135deg, #0F766E, #14B8A6)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: 15, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Đang lưu..." : "✓ Lưu Khách Hàng"}
            </button>
          </div>
        )}

        {/* Search & Filter */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <input type="text" placeholder="🔍 Tìm theo tên, khu vực..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: "1 1 220px" }} />
          <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="all">Tất cả sản phẩm</option>
            {allProducts.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang theo dõi</option>
            <option value="follow-up">Cần tái khám</option>
            <option value="new">Khách mới</option>
          </select>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{filtered.length} kết quả</span>
        </div>

        {/* Client cards */}
        {loading && <div style={{ textAlign: "center", padding: 60, color: "#64748B" }}>Đang tải...</div>}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map((client) => {
              const st = statusConfig[client.status] || statusConfig["new"];
              const bmiData = calculateBMI(client.weight_kg, client.height_cm);
              return (
                <div key={client.id} onClick={() => openClientDetail(client)} style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", cursor: "pointer", transition: "all 0.2s", border: "2px solid transparent" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; e.currentTarget.style.border = "2px solid #14B8A6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.08)"; e.currentTarget.style.border = "2px solid transparent"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #0F766E, #14B8A6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{(client.name || "?").charAt(0)}</div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{client.nickname || client.name}</div>
                        <div style={{ fontSize: 12, color: "#94A3B8" }}>{client.gender}{client.birth_year && ` • ${new Date().getFullYear() - client.birth_year} tuổi`}{client.region && ` • ${client.region}`}</div>
                      </div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>{st.label}</span>
                  </div>
                  {bmiData.bmi && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 12, color: "#64748B" }}>
                      <span>BMI: <strong style={{ color: bmiData.bmi >= 25 ? "#DC2626" : "#059669" }}>{bmiData.bmi}</strong></span>
                      {client.weight_kg && <span>{client.weight_kg}kg</span>}
                      {client.waist_cm && <span>VB: {client.waist_cm}cm</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                    {(client.products || []).map((product) => {
                      const pc = productColors[product] || { bg: "#F1F5F9", text: "#475569" };
                      return <span key={product} style={{ background: pc.bg, color: pc.text, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{product}</span>;
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94A3B8", borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
                    <span>📞 {client.phone || "—"}</span>
                    <span style={{ color: "#14B8A6", fontWeight: 600 }}>Xem chi tiết →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 15 }}>
            {clients.length === 0 ? "Chưa có khách hàng nào. Nhấn '+ Thêm Khách Hàng' để bắt đầu!" : "Không tìm thấy khách hàng phù hợp."}
          </div>
        )}
        <div style={{ textAlign: "center", padding: "32px 0 16px", fontSize: 12, color: "#94A3B8" }}>GMP Health Vietnam — CMS v4.0 • Phase 4</div>
      </div>
    </div>
  );
}

export default App;