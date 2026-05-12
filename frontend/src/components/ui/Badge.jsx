import { useI18n } from "../../context/LanguageContext";

const toneClasses = {
  waiting: "bg-amber-100 text-amber-800",
  called: "bg-blue-100 text-blue-800",
  in_consultation: "bg-indigo-100 text-indigo-800",
  done: "bg-emerald-100 text-emerald-800",
  skipped: "bg-slate-200 text-slate-700",
  scheduled: "bg-brand-100 text-brand-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
  no_show: "bg-slate-200 text-slate-700"
};

export default function Badge({ value }) {
  const { t } = useI18n();
  const label = t(`badge.${value}`);

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        toneClasses[value] || "bg-slate-100 text-slate-700"
      }`}
    >
      {label === `badge.${value}` ? String(value).replaceAll("_", " ") : label}
    </span>
  );
}
