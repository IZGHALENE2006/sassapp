export default function Button({ type = "button", children, className = "", ...props }) {
  return (
    <button
      type={type}
      className={`rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
