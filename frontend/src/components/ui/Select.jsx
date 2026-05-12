export default function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block text-start">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      <select
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-start text-sm outline-none ring-brand-300 focus:ring ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
