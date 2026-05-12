export default function Card({ title, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
