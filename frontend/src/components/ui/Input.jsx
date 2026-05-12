export default function Input({ label, className = "", ...props }) {
  return (
    <label className="block text-start">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      <input
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-start text-sm outline-none ring-brand-300 focus:ring ${className}`}
        {...props}
      />
    </label>
  );
}
