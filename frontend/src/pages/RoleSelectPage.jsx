import { Link } from "react-router-dom";
import { useI18n } from "../context/LanguageContext";

function RoleCard({ to, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
    >
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      <p className="mt-4 text-sm font-semibold text-brand-700 group-hover:text-brand-800">Continuer</p>
    </Link>
  );
}

export default function teRoleSelectPage() {
  const { language, setLanguage, dir } = useI18n();

  const title = language === "ar" ? "اختيار الدور" : "Choisir le role";
  const subtitle =
    language === "ar"
      ? "اختر نوع الحساب قبل تسجيل الدخول."
      : "Choisissez votre type de compte avant la connexion.";
  const adminLabel = language === "ar" ? "الطبيب" : "doctor";
  const adminHint = language === "ar" ? "ولوج خاص بالمدير." : "Acces reserve a l'administrateur.";
  const receptionistLabel = language === "ar" ? "الاستقبال" : "Reception";
  const receptionistHint =
    language === "ar"
      ? "ولوج خاص بموظف الاستقبال."
      : "Acces reserve au receptionniste.";

  return (
    
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-blue-100 px-4"
      dir={dir}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="fr">Francais</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <p className="mb-6 text-sm text-slate-600">{subtitle}</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RoleCard to="/login?role=admin" title={adminLabel} subtitle={adminHint} />
          <RoleCard
            to="/login?role=receptionist"
            title={receptionistLabel}
            subtitle={receptionistHint}
          />
        </div>
      </div>
    </div>
  );
}
