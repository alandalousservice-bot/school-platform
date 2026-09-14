/** Card props: className, children, and native div props. */
export default function Card({ className = "", children, ...props }) {
  return <section className={`ui-card ${className}`} {...props}>{children}</section>;
}
