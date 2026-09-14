/** Button props: variant primary|secondary|danger|ghost, size md|sm, children, native button props. */
export default function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  return <button className={`ui-button ui-button-${variant} ui-button-${size} ${className}`} {...props}>{children}</button>;
}
