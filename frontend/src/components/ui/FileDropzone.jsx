import { useRef, useState } from "react";
import Icon from "./Icon";

/** FileDropzone props: accept, onChange, label, hint. */
export default function FileDropzone({ accept = ".xlsx,.xlsm", onChange, label = "اسحب الملف هنا أو اختره", hint = "ملفات Excel فقط" }) {
  const inputRef = useRef(null); const [dragging, setDragging] = useState(false);
  function select(files) { if (files?.[0]) onChange?.(files[0]); }
  return <button type="button" className={`file-dropzone ${dragging ? "is-dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); select(e.dataTransfer.files); }}><Icon name="upload" size={28} /><b>{label}</b><small>{hint}</small><input ref={inputRef} hidden type="file" accept={accept} onChange={e => select(e.target.files)} /></button>;
}
