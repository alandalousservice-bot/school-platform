/** Icon props: name (school-icons.svg symbol, required), size (default 20), title. */
export default function Icon({ name, size = 20, title }) {
  return <svg className="ui-icon" width={size} height={size} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}><title>{title}</title><use href={`/school-icons.svg#${name}`} /></svg>;
}
