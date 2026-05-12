import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { PERMISSIONS } from "../constants/permissions";
import { useI18n } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import useFocusSearchShortcut from "../hooks/useFocusSearchShortcut";
import usePermissions from "../hooks/usePermissions";
import { formatDelayDuration } from "../utils/appointmentDelay";

const defaultForm = {
  patientId: "",
  doctorName: "",
  reason: "",
  dateTime: ""
};

const toDateTimeLocal = (value) => dayjs(value).format("YYYY-MM-DDTHH:mm");

export default function AppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useI18n();
  const toast = useToast();
  const { can } = usePermissions();
  useFocusSearchShortcut("appointments-search-cin");
  const canCreateAppointment = can(PERMISSIONS.APPOINTMENT_CREATE);
  const canUpdateAppointment = can(PERMISSIONS.APPOINTMENT_UPDATE);
  const canDeleteAppointment = can(PERMISSIONS.APPOINTMENT_DELETE);
  const actionBtnBase =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition";
  const actionEditBtn = `${actionBtnBase} border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100`;
  const actionDeleteBtn = `${actionBtnBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`;
  const noAccessLabel =
    language === "ar"
      ? "لا تملك صلاحية لهذا الإجراء."
      : "Vous n'avez pas la permission pour cette action.";
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState("");
  const [cinQuery, setCinQuery] = useState("");
  const [error, setError] = useState("");
  const [clockMs, setClockMs] = useState(() => Date.now());
  const isOverdueFilter = searchParams.get("filter") === "overdue";
  const overdueFilterLabel = language === "ar" ? "المواعيد المتأخرة" : "Rendez-vous en retard";
  const allFilterLabel = language === "ar" ? "كل المواعيد" : "Tous les rendez-vous";
  const delayLabel = language === "ar" ? "مدة التأخر" : "Retard";
  const noOverdueLabel =
    language === "ar"
      ? "لا توجد مواعيد متأخرة حسب البحث."
      : "Aucun rendez-vous en retard pour cette recherche.";
  const now = dayjs(clockMs);
  const toDelayLabel = (dateTime) =>
    formatDelayDuration(dateTime, language, { includePrefix: false, now: clockMs });

  const closeEditDialog = () => {
    setEditId("");
    setForm((prev) => ({
      ...defaultForm,
      patientId: patients[0]?._id || prev.patientId || ""
    }));
  };

  const normalizedCinQuery = cinQuery.trim().toUpperCase();
  const baseAppointments = appointments.filter((item) => {
    if (!isOverdueFilter) return true;
    return item.status === "scheduled" && dayjs(item.dateTime).isBefore(now);
  });
  const filteredAppointments = baseAppointments.filter((item) => {
    if (!normalizedCinQuery) return true;
    return (item.patient?.cin || "").toUpperCase().includes(normalizedCinQuery);
  });

  const setFilterMode = (mode) => {
    const next = new URLSearchParams(searchParams);
    if (mode === "overdue") {
      next.set("filter", "overdue");
    } else {
      next.delete("filter");
    }
    setSearchParams(next, { replace: true });
  };

  const fetchData = async () => {
    const [{ data: apptData }, { data: patientData }] = await Promise.all([
      api.get("/appointments"),
      api.get("/patients")
    ]);
    setAppointments(apptData.appointments);
    setPatients(patientData.patients);
    if (!form.patientId && patientData.patients[0]?._id) {
      setForm((prev) => ({ ...prev, patientId: patientData.patients[0]._id }));
    }
  };

  useEffect(() => {
    fetchData().catch((err) => {
      setError(err.response?.data?.message || t("appointmentsPage.loadError"));
    });
  }, [t]);

  useEffect(() => {
    if (!editId) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeEditDialog();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockMs(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!canCreateAppointment) {
      setError(noAccessLabel);
      toast.error(noAccessLabel);
      return;
    }
    setError("");
    const selectedIso = new Date(form.dateTime).toISOString();
    const slotTaken = appointments.some((item) => item.dateTime === selectedIso);
    if (slotTaken) {
      setError("This appointment time is already reserved.");
      toast.error("This appointment time is already reserved.");
      return;
    }

    try {
      await api.post("/appointments", {
        ...form,
        dateTime: selectedIso
      });
      setForm((prev) => ({ ...defaultForm, patientId: prev.patientId }));
      await fetchData();
      toast.success("Appointment created successfully.");
    } catch (err) {
      const message = err.response?.data?.message || t("appointmentsPage.createError");
      setError(message);
      toast.error(message);
    }
  };

  const startEdit = (item) => {
    if (!canUpdateAppointment) {
      setError(noAccessLabel);
      return;
    }
    setEditId(item._id);
    setForm({
      patientId: item.patient?._id || "",
      doctorName: item.doctorName,
      reason: item.reason || "",
      dateTime: toDateTimeLocal(item.dateTime),
      status: item.status
    });
  };

  const saveEdit = async () => {
    if (!canUpdateAppointment) {
      setError(noAccessLabel);
      toast.error(noAccessLabel);
      return;
    }
    setError("");
    const selectedIso = new Date(form.dateTime).toISOString();
    const slotTaken = appointments.some(
      (item) => item._id !== editId && item.dateTime === selectedIso
    );
    if (slotTaken) {
      setError("This appointment time is already reserved.");
      toast.error("This appointment time is already reserved.");
      return;
    }

    try {
      await api.put(`/appointments/${editId}`, {
        doctorName: form.doctorName,
        reason: form.reason,
        dateTime: selectedIso,
        status: form.status
      });
      closeEditDialog();
      await fetchData();
      toast.success("Appointment updated successfully.");
    } catch (err) {
      const message = err.response?.data?.message || t("appointmentsPage.updateError");
      setError(message);
      toast.error(message);
    }
  };

  const deleteAppointment = async (id) => {
    if (!canDeleteAppointment) {
      setError(noAccessLabel);
      toast.error(noAccessLabel);
      return;
    }
    setError("");
    try {
      await api.delete(`/appointments/${id}`);
      if (editId === id) closeEditDialog();
      await fetchData();
      toast.success("Appointment deleted successfully.");
    } catch (err) {
      const message = err.response?.data?.message || t("appointmentsPage.deleteError");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{t("appointmentsPage.title")}</h1>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {canCreateAppointment && (
        <Card title={t("appointmentsPage.scheduleAppointment")}>
          <form onSubmit={createAppointment} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              label={t("common.patient")}
              value={form.patientId}
              onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value }))}
              required
            >
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.name} - {patient.cin}
                </option>
              ))}
            </Select>
            <Input
              label={t("appointmentsPage.doctorName")}
              value={form.doctorName}
              onChange={(e) => setForm((p) => ({ ...p, doctorName: e.target.value }))}
              required
            />
            <Input
              label={t("appointmentsPage.reason")}
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            />
            <Input
              label={t("appointmentsPage.dateTime")}
              type="datetime-local"
              value={form.dateTime}
              onChange={(e) => setForm((p) => ({ ...p, dateTime: e.target.value }))}
              required
            />
            <Button type="submit" className="md:col-span-2">
              {t("appointmentsPage.createAppointment")}
            </Button>
          </form>
        </Card>
      )}

      <Card title={t("appointmentsPage.manageAppointments")}>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              !isOverdueFilter
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
            onClick={() => setFilterMode("all")}
          >
            {allFilterLabel}
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              isOverdueFilter
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
            onClick={() => setFilterMode("overdue")}
          >
            {overdueFilterLabel}
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:max-w-sm">
          <Input
            id="appointments-search-cin"
            label={`${t("patientsPage.search")} ${t("common.cin")}`}
            value={cinQuery}
            onChange={(e) => setCinQuery(e.target.value)}
            placeholder={t("common.cin")}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-slate-500">
                <th className="py-2">{t("common.patient")}</th>
                <th className="py-2">{t("common.cin")}</th>
                <th className="py-2">{t("common.doctor")}</th>
                <th className="py-2">{t("common.date")}</th>
                <th className="py-2">{t("common.status")}</th>
                {isOverdueFilter && <th className="py-2">{delayLabel}</th>}
                <th className="py-2">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((item) => (
                <tr key={item._id} className="border-b border-slate-100">
                  <td className="py-2 text-center" dir="auto">
                    {item.patient?.name}
                  </td>
                  <td className="py-2 text-center" dir="ltr">
                    {item.patient?.cin || "-"}
                  </td>
                  <td className="py-2 text-center" dir="auto">
                    {item.doctorName}
                  </td>
                  <td className="py-2 text-center" dir="ltr">
                    {dayjs(item.dateTime).format("DD/MM/YYYY HH:mm")}
                  </td>
                  <td className="py-2 text-center">
                    <Badge value={item.status} />
                  </td>
                  {isOverdueFilter && (
                    <td className="py-2 text-center font-semibold text-rose-700">{toDelayLabel(item.dateTime)}</td>
                  )}
                  <td className="py-2 text-center flex justify-center">
                    <div className="flex justify-center gap-2">
                      {canUpdateAppointment && (
                        <button className={actionEditBtn} onClick={() => startEdit(item)}>
                          {t("common.edit")}
                        </button>
                      )}
                      {canDeleteAppointment && (
                        <button className={actionDeleteBtn} onClick={() => deleteAppointment(item._id)}>
                          {t("common.delete")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={isOverdueFilter ? 7 : 6} className="py-4 text-center text-sm text-slate-500">
                    {isOverdueFilter
                      ? noOverdueLabel
                      : normalizedCinQuery
                        ? t("common.noResults")
                        : t("common.noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editId && canUpdateAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onClick={closeEditDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t("appointmentsPage.editAppointment")}</h2>
              <button
                type="button"
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                onClick={closeEditDialog}
              >
                {t("common.close")}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                label={t("appointmentsPage.doctorName")}
                value={form.doctorName}
                onChange={(e) => setForm((p) => ({ ...p, doctorName: e.target.value }))}
              />
              <Input
                label={t("appointmentsPage.reason")}
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              />
              <Input
                label={t("appointmentsPage.dateTime")}
                type="datetime-local"
                value={form.dateTime}
                onChange={(e) => setForm((p) => ({ ...p, dateTime: e.target.value }))}
              />
              <Select
                label={t("common.status")}
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="scheduled">{t("badge.scheduled")}</option>
                <option value="completed">{t("badge.completed")}</option>
                <option value="cancelled">{t("badge.cancelled")}</option>
                <option value="no_show">{t("badge.no_show")}</option>
              </Select>
              <div className="md:col-span-2">
                <Button onClick={saveEdit}>{t("appointmentsPage.saveChanges")}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


