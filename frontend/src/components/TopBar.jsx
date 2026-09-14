import { useNavigate } from "react-router-dom";
import { SCHOOL_BRAND } from "../brand";
import BrandSeal from "./ui/BrandSeal";

export default function TopBar({ title, accent }) {
  const navigate = useNavigate();
  const fullName = localStorage.getItem("full_name") || "";

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <div style={{ ...bar, background: accent }}>
      <div style={identity}><BrandSeal /><div><div style={institution}>{SCHOOL_BRAND.institution}</div><div style={official}>{SCHOOL_BRAND.republic} · {SCHOOL_BRAND.ministry}</div></div></div>
      <div style={titleWrap}><span style={pageTitle}>{title}</span><span style={line} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: "0.88rem", opacity: 0.9 }}>{fullName}</span>
        <button onClick={logout} style={logoutBtn}>خروج</button>
      </div>
    </div>
  );
}

const bar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#fff",
  padding: "10px 22px",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const identity = { display: "flex", alignItems: "center", gap: 10 };
const seal = { width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: "#fff", border: "2px solid #CE1126", boxShadow: "inset 0 0 0 3px #007A3D", fontSize: "1.25rem" };
const institution = { fontWeight: 900, fontSize: "0.95rem" };
const official = { opacity: 0.82, fontSize: "0.66rem", marginTop: 2 };
const titleWrap = { display: "flex", alignItems: "center", gap: 10, marginRight: "auto", marginLeft: 22 };
const pageTitle = { fontWeight: 800, fontSize: "0.9rem" };
const line = { width: 4, height: 24, background: "#CE1126", borderRadius: 4 };

const logoutBtn = {
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.4)",
  color: "#fff",
  borderRadius: 6,
  padding: "5px 12px",
  fontSize: "0.82rem",
  cursor: "pointer",
};
