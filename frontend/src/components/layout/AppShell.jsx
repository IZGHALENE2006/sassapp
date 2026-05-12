import { useEffect, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { PERMISSIONS } from "../../constants/permissions";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/LanguageContext";
import usePermissions from "../../hooks/usePermissions";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function PatientsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19a5 5 0 0 1 10 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M14.5 19a4 4 0 0 1 5.5-3.7" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h7" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="15.5" cy="18" r="2" />
    </svg>
  );
}

function AppointmentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
      <path d="M8 14h3M8 17h6" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M16 13h6" />
      <circle cx="16" cy="13" r="1" />
      <path d="M6 6V4a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-3" />
    </svg>
  );
}

function LegacyFolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l1.8 2H18.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="9" cy="13" r="1.5" />
      <path d="M12 16.5a3 3 0 0 0-6 0" />
    </svg>
  );
}

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const { t, language, setLanguage, dir } = useI18n();
  const revenueReportLabel = language === "ar" ? "تقرير المداخيل" : "Rapport revenus";
  const legacyPatientsLabel = language === "ar" ? "المرضى القدامى" : "Patients anciens";

  const navItems = useMemo(
    () => [
      {
        to: "/",
        label: t("common.dashboard"),
        icon: <DashboardIcon />,
        action: PERMISSIONS.DASHBOARD_VIEW
      },
      {
        to: "/patients",
        label: t("common.patients"),
        icon: <PatientsIcon />,
        action: PERMISSIONS.PATIENT_READ
      },
      {
        to: "/legacy-patients",
        label: legacyPatientsLabel,
        icon: <LegacyFolderIcon />,
        action: PERMISSIONS.PATIENT_READ
      },
      {
        to: "/queue",
        label: t("common.queue"),
        icon: <QueueIcon />,
        action: PERMISSIONS.QUEUE_READ
      },
      {
        to: "/appointments",
        label: t("common.appointments"),
        icon: <AppointmentIcon />,
        action: PERMISSIONS.APPOINTMENT_READ
      },
      {
        to: "/payments",
        label: t("common.payments"),
        icon: <PaymentIcon />,
        action: PERMISSIONS.PAYMENT_READ
      },
      {
        to: "/revenue-report",
        label: revenueReportLabel,
        icon: <ReportIcon />,
        action: PERMISSIONS.REVENUE_REPORT_READ
      }
    ],
    [legacyPatientsLabel, revenueReportLabel, t]
  );

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => can(item.action)),
    [can, navItems]
  );

  const shortcutsHint =
    language === "ar"
      ? `الاختصارات: Alt+1..${visibleNavItems.length} للتنقل - Ctrl+K للبحث - Alt+L لتسجيل الخروج`
      : `Raccourcis: Alt+1..${visibleNavItems.length} naviguer - Ctrl+K recherche - Alt+L deconnexion`;

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = String(event.key || "").toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        window.dispatchEvent(new Event("app:focus-search"));
        return;
      }

      if (!event.altKey) return;

      const routeByKey = visibleNavItems.reduce((acc, item, index) => {
        acc[String(index + 1)] = item.to;
        return acc;
      }, {});

      if (routeByKey[key]) {
        event.preventDefault();
        navigate(routeByKey[key]);
        return;
      }

      if (key === "l") {
        event.preventDefault();
        logout();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [logout, navigate, visibleNavItems]);

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#f8fafc_35%,_#e2e8f0_100%)]"
      dir={dir}
    >
      <header className="border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold text-slate-900">
            {t("common.appName")}
          </Link>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span>{t("common.language")}</span>
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="fr">{t("common.fr")}</option>
                <option value="ar">{t("common.ar")}</option>
              </select>
            </label>
            <div className="text-sm text-slate-600">
              {user?.name} ({user?.role})
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-slate-900 hover:to-black"
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-soft backdrop-blur">
          <nav className="space-y-2">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-brand-200 bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-sm"
                      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            {shortcutsHint}
          </p>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
