import { SCHOOL_BRAND } from "../../brand";
export default function BrandSeal({ size = 42 }) {
  return <div className="brand-seal" style={{ width: size, height: size }} aria-label={`${SCHOOL_BRAND.institution} - شعار المؤسسة`}><span>م</span><small>مدرسة</small></div>;
}
