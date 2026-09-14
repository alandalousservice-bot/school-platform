import { useNavigate } from "react-router-dom";
import { SCHOOL_BRAND } from "../brand";
import BrandSeal from "./ui/BrandSeal";
import Button from "./ui/Button";

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
        <Button onClick={logout} variant="ghost" size="sm">خروج</Button>
      </div>
    </div>
  );
}

const bar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "var(--surface)",
  padding: "10px 22px",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const identity = { display: "flex", alignItems: "center", gap: 10 };
const institution = { fontWeight: 900, fontSize: "0.95rem" };
const official = { opacity: 0.82, fontSize: "0.66rem", marginTop: 2 };
const titleWrap = { display: "flex", alignItems: "center", gap: 10, marginRight: "auto", marginLeft: 22 };
const pageTitle = { fontWeight: 800, fontSize: "0.9rem" };
const line = { width: 4, height: 24, background: "var(--danger)", borderRadius: 4 };
