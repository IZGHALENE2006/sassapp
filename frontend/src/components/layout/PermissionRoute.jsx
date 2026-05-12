import { useI18n } from "../../context/LanguageContext";
import usePermissions from "../../hooks/usePermissions";

export default function PermissionRoute({ action, children }) {
  const { language } = useI18n();
  const { can } = usePermissions();

  if (!can(action)) {
    const title = language === "ar" ? "غير مسموح" : "Acces refuse";
    const message =
      language === "ar"
        ? "ليس لديك صلاحية لهذا القسم. تواصل مع مدير النظام."
        : "Vous n'avez pas la permission pour cette section. Contactez l'administrateur.";

    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <h2 className="text-lg font-bold text-rose-900">{title}</h2>
        <p className="mt-2 text-sm text-rose-800">{message}</p>
      </div>
    );
  }

  return children;
}
