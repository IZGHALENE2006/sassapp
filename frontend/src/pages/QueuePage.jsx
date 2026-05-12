import { useEffect, useState } from "react";
import { api } from "../api/client";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { PERMISSIONS } from "../constants/permissions";
import { useI18n } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import useFocusSearchShortcut from "../hooks/useFocusSearchShortcut";
import usePermissions from "../hooks/usePermissions";

export default function QueuePage() {
  const { t, language } = useI18n();
  const toast = useToast();
  const { can } = usePermissions();
  useFocusSearchShortcut("queue-search-cin");
  const canCheckIn = can(PERMISSIONS.QUEUE_CHECKIN);
  const canUpdateStatus = can(PERMISSIONS.QUEUE_UPDATE_STATUS);
  const noAccessLabel =
    language === "ar"
      ? "لا تملك صلاحية لهذا الإجراء."
      : "Vous n'avez pas la permission pour cette action.";
  const checkInSuccessLabel =
    language === "ar" ? "تمت إضافة المريض للطابور." : "Patient ajoute a la file d'attente.";
  const statusUpdatedLabel =
    language === "ar" ? "تم تحديث حالة الطابور." : "Statut de la file mis a jour.";
  const actionBtnBase =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition";
  const actionCallBtn = `${actionBtnBase} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`;
  const actionConsultBtn =
    `${actionBtnBase} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`;
  const actionDoneBtn =
    `${actionBtnBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [search, setSearch] = useState({ cin: "", phone: "" });
  const [candidates, setCandidates] = useState([]);
  const [hasSearchedCandidates, setHasSearchedCandidates] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [error, setError] = useState("");

  const fetchQueueData = async () => {
    const [{ data: todayData }, { data: currentData }] = await Promise.all([
      api.get("/queue/today"),
      api.get("/queue/current")
    ]);
    setQueue(todayData.queue);
    setCurrent(currentData.current);
    setWaitingCount(currentData.waitingCount);
  };

  useEffect(() => {
    fetchQueueData().catch((err) => {
      const message = err.response?.data?.message || t("queuePage.queueError");
      setError(message);
      toast.error(message);
    });
    const interval = setInterval(() => {
      fetchQueueData().catch(() => null);
    }, 10000);
    return () => clearInterval(interval);
  }, [t, toast]);

  const findPatient = async (e) => {
    e.preventDefault();
    if (!canCheckIn) {
      setError(noAccessLabel);
      return;
    }
    setError("");
    setHasSearchedCandidates(true);
    try {
      const params = {};
      if (search.cin) params.cin = search.cin;
      if (search.phone) params.phone = search.phone;
      const { data } = await api.get("/patients/search", { params });
      setCandidates(data.patients);
      setSelectedPatientId(data.patients[0]?._id || "");
    } catch (err) {
      const message = err.response?.data?.message || t("queuePage.findPatientError");
      setError(message);
      toast.error(message);
    }
  };

  const addToQueue = async () => {
    if (!canCheckIn) {
      setError(noAccessLabel);
      return;
    }
    if (!selectedPatientId) return;
    setError("");
    try {
      await api.post("/queue/check-in", { patientId: selectedPatientId });
      await fetchQueueData();
      setCandidates([]);
      setHasSearchedCandidates(false);
      setSelectedPatientId("");
      setSearch({ cin: "", phone: "" });
      toast.success(checkInSuccessLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("queuePage.addQueueError");
      setError(message);
      toast.error(message);
    }
  };

  const updateStatus = async (id, status) => {
    if (!canUpdateStatus) {
      setError(noAccessLabel);
      return;
    }
    try {
      await api.patch(`/queue/${id}/status`, { status });
      await fetchQueueData();
      toast.success(statusUpdatedLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("queuePage.updateStatusError");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{t("queuePage.title")}</h1>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title={t("queuePage.receptionCheckIn")}>
          {!canCheckIn && <p className="text-sm text-slate-500">{noAccessLabel}</p>}
          {canCheckIn && (
            <>
              <form onSubmit={findPatient} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input
                  id="queue-search-cin"
                  label={t("common.cin")}
                  value={search.cin}
                  onChange={(e) => setSearch((s) => ({ ...s, cin: e.target.value }))}
                />
                <Input
                  label={t("common.phone")}
                  value={search.phone}
                  onChange={(e) => setSearch((s) => ({ ...s, phone: e.target.value }))}
                />
                <Button type="submit" className="md:self-end">
                  {t("queuePage.findPatient")}
                </Button>
              </form>

              {candidates.length > 0 && (
                <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-3">
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    {candidates.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} - {patient.cin} - {patient.phone}
                      </option>
                    ))}
                  </select>
                  <Button onClick={addToQueue}>{t("queuePage.addToQueue")}</Button>
                </div>
              )}
              {hasSearchedCandidates && candidates.length === 0 && (
                <p className="mt-3 text-sm text-slate-500">{t("common.noResults")}</p>
              )}
            </>
          )}
        </Card>

        <Card title={t("queuePage.waitingRoomDisplay")}>
          <div className="rounded-xl bg-slate-900 p-5 text-white">
            <p className="text-sm uppercase tracking-widest text-slate-300">{t("queuePage.currentNumber")}</p>
            <p className="mt-2 text-5xl font-bold">{current?.queueNumber || "--"}</p>
            <p className="mt-2 text-sm text-slate-300">
              {t("queuePage.waitingPatients")}:{" "}
              <span className="font-semibold text-white">{waitingCount}</span>
            </p>
          </div>
        </Card>
      </div>

      <Card title={t("queuePage.todayQueue")}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-slate-500">
                <th className="py-2">#</th>
                <th className="py-2">{t("common.patient")}</th>
                <th className="py-2">{t("common.status")}</th>
                <th className="py-2">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((entry) => (
                <tr key={entry._id} className="border-b border-slate-100">
                  <td className="py-2  text-center font-semibold" dir="ltr">
                    {entry.queueNumber}
                  </td>
                  <td className="py-2 text-center" dir="auto">
                    {entry.patient?.name}
                  </td>
                  <td className="py-2 text-center">
                    <Badge value={entry.status} />
                  </td>
                  <td className="py-2 flex justify-center">
                    {canUpdateStatus ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={actionCallBtn}
                          onClick={() => updateStatus(entry._id, "called")}
                        >
                          {t("queuePage.call")}
                        </button>
                        <button
                          className={actionConsultBtn}
                          onClick={() => updateStatus(entry._id, "in_consultation")}
                        >
                          {t("queuePage.inConsultation")}
                        </button>
                        <button
                          className={actionDoneBtn}
                          onClick={() => updateStatus(entry._id, "done")}
                        >
                          {t("queuePage.done")}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
