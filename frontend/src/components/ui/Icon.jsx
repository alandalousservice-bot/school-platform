/** Icon props: name (school-icons.svg symbol, required), size (default 20), title, className. */
export default function Icon({ name, size = 20, title, className = "" }) {
  return <svg className={`ui-icon ui-icon-${name} ${className}`} width={size} height={size} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}><title>{title}</title><use href={`/school-icons.svg#${name}`} /></svg>;
}
