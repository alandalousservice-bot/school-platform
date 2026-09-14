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
    <div className="topbar" style={{ "--topbar-accent": accent }}>
      <div className="topbar-identity"><BrandSeal /><div><div className="topbar-institution">{SCHOOL_BRAND.institution}</div><div className="topbar-official">{SCHOOL_BRAND.republic} · {SCHOOL_BRAND.ministry}</div></div></div>
      <div className="topbar-title-wrap"><span className="topbar-page-title">{title}</span><span className="topbar-line" /></div>
      <div className="topbar-account">
        <span className="topbar-full-name">{fullName}</span>
        <Button onClick={logout} variant="ghost" size="sm">خروج</Button>
      </div>
    </div>
  );
}
