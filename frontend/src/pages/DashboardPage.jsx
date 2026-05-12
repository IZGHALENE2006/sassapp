import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Card from "../components/ui/Card";
import { useI18n } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { formatDelayDuration } from "../utils/appointmentDelay";

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M16 13h6" />
      <path d="M6 6V4a2 2 0 0 1 2-2h10" />
      <circle cx="16" cy="13" r="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 17H5l2-2v-4a5 5 0 0 1 10 0v4l2 2h-4" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r=".5" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function StatCard({ label, value, tone, icon }) {
  const tones = {
    blue: {
      container: "border-blue-100 bg-gradient-to-b from-blue-50 to-white",
      badge: "bg-blue-100 text-blue-700",
      value: "text-blue-900"
    },
    green: {
      container: "border-emerald-100 bg-gradient-to-b from-emerald-50 to-white",
      badge: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-900"
    },
    amber: {
      container: "border-amber-100 bg-gradient-to-b from-amber-50 to-white",
      badge: "bg-amber-100 text-amber-700",
      value: "text-amber-900"
    },
    rose: {
      container: "border-rose-100 bg-gradient-to-b from-rose-50 to-white",
      badge: "bg-rose-100 text-rose-700",
      value: "text-rose-900"
    },
    violet: {
      container: "border-violet-100 bg-gradient-to-b from-violet-50 to-white",
      badge: "bg-violet-100 text-violet-700",
      value: "text-violet-900"
    }
  };

  const style = tones[tone] || tones.blue;

  return (
    <div className={`rounded-xl border p-4 shadow-soft ${style.container}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`inline-flex rounded-lg p-2 ${style.badge}`}>{icon}</span>
      </div>
      <p className={`mt-3 text-2xl font-bold ${style.value}`}>{value}</p>
    </div>
  );
}

const toDelayLabel = (dateTime, language, now) =>
  formatDelayDuration(dateTime, language, { now });

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const toast = useToast();
  const [clockMs, setClockMs] = useState(() => Date.now());
  const [data, setData] = useState({
    totalPatientsToday: 0,
    totalRevenueToday: 0,
    revenueVisible: true,
    upcomingAppointments: [],
    todayAppointments: [],
    waitingAppointments: [],
    waitingAppointmentsCount: 0,
    overdueAppointments: [],
    overdueAppointmentsCount: 0
  });
  const [error, setError] = useState("");
  const previousWaitingCountRef = useRef(0);
  const previousOverdueCountRef = useRef(0);

  const todayAppointmentsLabel =
    language === "ar" ? "مواعيد اليوم" : "Rendez-vous d'aujourd'hui";
  const waitingNowLabel =
    language === "ar" ? "وصل وقت الموعد اليوم" : "Rendez-vous arrives aujourd'hui";
  const waitingSectionTitle =
    language === "ar" ? "المواعيد التي وصلت اليوم" : "Rendez-vous arrives aujourd'hui";
  const waitingStatusLabel = language === "ar" ? "ينتظر" : "En attente";
  const noWaitingLabel =
    language === "ar"
      ? "لا توجد مواعيد وصلت حاليا."
      : "Aucun rendez-vous arrive pour le moment.";
  const overdueLabel =
    language === "ar" ? "المواعيد المتأخرة" : "Rendez-vous en retard";
  const overdueSectionTitle =
    language === "ar" ? "لائحة المواعيد المتأخرة" : "Liste des rendez-vous en retard";
  const noOverdueLabel =
    language === "ar" ? "لا توجد مواعيد متأخرة حاليا." : "Aucun rendez-vous en retard.";
  const delayLabel = language === "ar" ? "مدة التأخر" : "Retard";
  const openOverdueButtonLabel =
    language === "ar" ? "فتح المواعيد المتأخرة" : "Voir les rendez-vous en retard";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockMs(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard/today");
        if (!isActive) return;

        const nextData = {
          totalPatientsToday: res.data.totalPatientsToday || 0,
          totalRevenueToday: res.data.totalRevenueToday || 0,
          revenueVisible: Boolean(res.data.revenueVisible),
          upcomingAppointments: Array.isArray(res.data.upcomingAppointments) ? res.data.upcomingAppointments : [],
          todayAppointments: Array.isArray(res.data.todayAppointments) ? res.data.todayAppointments : [],
          waitingAppointments: Array.isArray(res.data.waitingAppointments) ? res.data.waitingAppointments : [],
          waitingAppointmentsCount:
            Number(res.data.waitingAppointmentsCount) ||
            (Array.isArray(res.data.waitingAppointments) ? res.data.waitingAppointments.length : 0),
          overdueAppointments: Array.isArray(res.data.overdueAppointments) ? res.data.overdueAppointments : [],
          overdueAppointmentsCount:
            Number(res.data.overdueAppointmentsCount) ||
            (Array.isArray(res.data.overdueAppointments) ? res.data.overdueAppointments.length : 0)
        };

        setData(nextData);
        setError("");

        if (nextData.waitingAppointmentsCount > previousWaitingCountRef.current) {
          const reminderMessage =
            language === "ar"
              ? `تنبيه: لديك ${nextData.waitingAppointmentsCount} موعد وصل اليوم وينتظر.`
              : `Alerte: ${nextData.waitingAppointmentsCount} rendez-vous arrives aujourd'hui en attente.`;
          toast.info(reminderMessage);
        }

        if (nextData.overdueAppointmentsCount > previousOverdueCountRef.current) {
          const overdueMessage =
            language === "ar"
              ? `تنبيه: لديك ${nextData.overdueAppointmentsCount} موعد متأخر.`
              : `Alerte: ${nextData.overdueAppointmentsCount} rendez-vous en retard.`;
          toast.info(overdueMessage);
        }

        previousWaitingCountRef.current = nextData.waitingAppointmentsCount;
        previousOverdueCountRef.current = nextData.overdueAppointmentsCount;
      } catch (err) {
        if (!isActive) return;
        setError(err.response?.data?.message || t("dashboardPage.loadError"));
      }
    };

    fetchDashboard().catch(() => null);
    const intervalId = window.setInterval(() => {
      fetchDashboard().catch(() => null);
    }, 60000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [language, t, toast]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{t("dashboardPage.title")}</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t("dashboardPage.totalPatientsToday")}
          value={data.totalPatientsToday}
          tone="blue"
          icon={<UsersIcon />}
        />
        {data.revenueVisible && (
          <StatCard
            label={t("dashboardPage.totalRevenueToday")}
            value={`${Number(data.totalRevenueToday).toFixed(2)} MAD`}
            tone="green"
            icon={<WalletIcon />}
          />
        )}
        <StatCard
          label={todayAppointmentsLabel}
          value={data.todayAppointments.length}
          tone="amber"
          icon={<CalendarIcon />}
        />
        <StatCard
          label={waitingNowLabel}
          value={data.waitingAppointmentsCount}
          tone="rose"
          icon={<BellIcon />}
        />
        <StatCard
          label={overdueLabel}
          value={data.overdueAppointmentsCount}
          tone="violet"
          icon={<AlertIcon />}
        />
      </div>

      <Card title={overdueSectionTitle}>
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
            onClick={() => navigate("/appointments?filter=overdue")}
          >
            {openOverdueButtonLabel}
          </button>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!error && data.overdueAppointments.length === 0 && (
          <p className="text-sm text-slate-500">{noOverdueLabel}</p>
        )}
        {!error && data.overdueAppointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-start text-slate-500">
                  <th className="py-2">{t("common.patient")}</th>
                  <th className="py-2">{t("common.doctor")}</th>
                  <th className="py-2">{t("common.date")}</th>
                  <th className="py-2">{delayLabel}</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueAppointments.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100">
                    <td className="py-2 text-center" dir="auto">
                      {item.patient?.name}
                    </td>
                    <td className="py-2 text-center" dir="auto">
                      {item.doctorName}
                    </td>
                    <td className="py-2 text-center" dir="ltr">
                      {dayjs(item.dateTime).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="py-2 text-center">{toDelayLabel(item.dateTime, language, clockMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={waitingSectionTitle}>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!error && data.waitingAppointments.length === 0 && (
          <p className="text-sm text-slate-500">{noWaitingLabel}</p>
        )}
        {!error && data.waitingAppointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-start text-slate-500">
                  <th className="py-2">{t("common.patient")}</th>
                  <th className="py-2">{t("common.doctor")}</th>
                  <th className="py-2">{t("common.date")}</th>
                  <th className="py-2">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {data.waitingAppointments.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100">
                    <td className="py-2 text-center" dir="auto">
                      {item.patient?.name}
                    </td>
                    <td className="py-2 text-center" dir="auto">
                      {item.doctorName}
                    </td>
                    <td className="py-2 text-center" dir="ltr">
                      {dayjs(item.dateTime).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="py-2 text-center">
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        {waitingStatusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={t("dashboardPage.upcomingAppointments")}>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!error && data.upcomingAppointments.length === 0 && (
          <p className="text-sm text-slate-500">{t("dashboardPage.noUpcoming")}</p>
        )}
        {!error && data.upcomingAppointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-start text-slate-500">
                  <th className="py-2">{t("common.patient")}</th>
                  <th className="py-2">{t("common.doctor")}</th>
                  <th className="py-2">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody>
                {data.upcomingAppointments.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100">
                    <td className="py-2 text-center" dir="auto">
                      {item.patient?.name}
                    </td>
                    <td className="py-2 text-center" dir="auto">
                      {item.doctorName}
                    </td>
                    <td className="py-2 text-center" dir="ltr">
                      {dayjs(item.dateTime).format("DD/MM/YYYY HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}


