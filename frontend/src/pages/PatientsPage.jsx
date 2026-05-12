import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { PERMISSIONS } from "../constants/permissions";
import { useI18n } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import useFocusSearchShortcut from "../hooks/useFocusSearchShortcut";
import usePermissions from "../hooks/usePermissions";

const emptyPatient = {
  cin: "",
  name: "",
  phone: ""
};

const emptyMedication = {
  name: "",
  instructions: ""
};

const createEmptyVisit = () => ({
  notes: "",
  diagnosis: "",
  medications: [{ ...emptyMedication }]
});

const emptyPayment = {
  amount: "",
  type: "consultation",
  method: "cash"
};

const sanitizeFilePart = (value) =>
  String(value ?? "patient")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "patient";

const formatDateTime = (value) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : "-";
};

export default function PatientsPage() {
  const { t, language } = useI18n();
  const toast = useToast();
  const { can } = usePermissions();
  useFocusSearchShortcut("patients-search-cin");

  const canCreatePatient = can(PERMISSIONS.PATIENT_CREATE);
  const canUpdatePatient = can(PERMISSIONS.PATIENT_UPDATE);
  const canDeletePatient = can(PERMISSIONS.PATIENT_DELETE);
  const canViewHistory = can(PERMISSIONS.PATIENT_HISTORY);
  const canCreateVisit = can(PERMISSIONS.VISIT_CREATE);
  const canReadPayments = can(PERMISSIONS.PAYMENT_READ);
  const canCreatePayment = can(PERMISSIONS.PAYMENT_CREATE);

  const [patients, setPatients] = useState([]);
  const [newPatient, setNewPatient] = useState(emptyPatient);
  const [search, setSearch] = useState({ cin: "", phone: "" });
  const [hasSearchedPatients, setHasSearchedPatients] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [visitPaymentPatient, setVisitPaymentPatient] = useState(null);
  const [isVisitPaymentDialogOpen, setIsVisitPaymentDialogOpen] = useState(false);
  const [visitForm, setVisitForm] = useState(createEmptyVisit);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [error, setError] = useState("");

  const noAccessLabel =
    language === "ar"
      ? "لا تملك صلاحية لهذا الإجراء."
      : "Vous n'avez pas la permission pour cette action.";
  const medCardNameLabel = language === "ar" ? "الاسم" : "Nom";
  const medCardInstructionsLabel = language === "ar" ? "التعليمات" : "Instructions";
  const medsTitle = language === "ar" ? "الأدوية الموصوفة" : "Medicaments prescrits";
  const addMedLabel = language === "ar" ? "إضافة دواء" : "Ajouter medicament";
  const removeMedLabel = language === "ar" ? "حذف الدواء" : "Supprimer medicament";
  const medNameLabel = language === "ar" ? "اسم الدواء" : "Nom medicament";
  const instructionsLabel = language === "ar" ? "تعليمات" : "Instructions";
  const noMedsLabel = language === "ar" ? "لا توجد أدوية مسجلة." : "Aucun medicament enregistre.";
  const openFormLabel = language === "ar" ? "إضافة زيارة أو دفعة" : "Ajouter visite ou paiement";
  const patientCreatedLabel = language === "ar" ? "تمت إضافة المريض بنجاح." : "Patient ajoute avec succes.";
  const patientUpdatedLabel = language === "ar" ? "تم تحديث بيانات المريض." : "Patient mis a jour.";
  const patientDeletedLabel = language === "ar" ? "تم حذف المريض." : "Patient supprime.";
  const visitSavedLabel = language === "ar" ? "تم حفظ الزيارة." : "Visite enregistree.";
  const paymentSavedLabel = language === "ar" ? "تم تسجيل الدفعة." : "Paiement enregistre.";
  const actionBtnBase =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition";
  const actionViewBtn = `${actionBtnBase} border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100`;
  const actionEditBtn = `${actionBtnBase} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`;
  const actionVisitPayBtn =
    `${actionBtnBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;
  const actionPdfBtn = `${actionBtnBase} border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100`;
  const actionDeleteBtn = `${actionBtnBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`;
  const exportPdfLabel = language === "ar" ? "تصدير PDF" : "Exporter PDF";
  const pdfButtonLabel = language === "ar" ? "PDF المريض" : "PDF patient";
  const pdfSuccessLabel =
    language === "ar"
      ? "تم تحميل تقرير المريض PDF بنجاح."
      : "Rapport patient PDF telecharge avec succes.";

  const visibleModalCardsCount = useMemo(() => {
    let count = 1;
    if (canReadPayments) count += 1;
    return count;
  }, [canReadPayments]);

  const closeVisitPaymentDialog = () => {
    setIsVisitPaymentDialogOpen(false);
    setVisitPaymentPatient(null);
    setVisitForm(createEmptyVisit());
    setPaymentForm(emptyPayment);
  };

  const openVisitPaymentDialogForPatient = (patient) => {
    if (!(canCreateVisit || canCreatePayment)) {
      setError(noAccessLabel);
      return;
    }
    setVisitPaymentPatient({ _id: patient._id, name: patient.name });
    setVisitForm(createEmptyVisit());
    setPaymentForm(emptyPayment);
    setIsVisitPaymentDialogOpen(true);
  };

  const closeHistoryModal = () => {
    setSelectedHistory(null);
    setIsVisitPaymentDialogOpen(false);
    setVisitPaymentPatient(null);
    setVisitForm(createEmptyVisit());
    setPaymentForm(emptyPayment);
  };

  const fetchPatients = async () => {
    const { data } = await api.get("/patients", { params: { segment: "regular" } });
    setPatients(data.patients);
  };

  useEffect(() => {
    fetchPatients().catch((err) => {
      setError(err.response?.data?.message || t("patientsPage.loadError"));
    });
  }, [t]);

  useEffect(() => {
    if (!selectedHistory) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isVisitPaymentDialogOpen) {
          closeVisitPaymentDialog();
        } else {
          closeHistoryModal();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isVisitPaymentDialogOpen, selectedHistory]);

  const addPatient = async (e) => {
    e.preventDefault();
    if (!canCreatePatient) {
      setError(noAccessLabel);
      return;
    }

    setError("");
    try {
      await api.post("/patients", newPatient);
      setNewPatient(emptyPatient);
      await fetchPatients();
      setHasSearchedPatients(false);
      toast.success(patientCreatedLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.createError");
      setError(message);
      toast.error(message);
    }
  };

  const searchPatients = async (e) => {
    e.preventDefault();
    setError("");
    setHasSearchedPatients(true);
    try {
      const params = {};
      if (search.cin) params.cin = search.cin;
      if (search.phone) params.phone = search.phone;
      params.segment = "regular";
      const { data } = await api.get("/patients/search", { params });
      setPatients(data.patients);
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.searchError");
      setError(message);
      toast.error(message);
    }
  };

  const loadHistory = async (id, options = {}) => {
    if (!canViewHistory) {
      setError(noAccessLabel);
      return;
    }

    setError("");
    try {
      const { data } = await api.get(`/patients/${id}/history`);
      setSelectedHistory(data);
      if (!options.keepVisitPaymentDialogOpen) {
        setVisitForm(createEmptyVisit());
        setPaymentForm(emptyPayment);
        setIsVisitPaymentDialogOpen(false);
      }
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.historyError");
      setError(message);
      toast.error(message);
    }
  };

  const exportPatientReportPdf = async (patient) => {
    if (!canViewHistory) {
      setError(noAccessLabel);
      return;
    }
    if (!patient?._id) return;

    setError("");
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const { data } = await api.get(`/patients/${patient._id}/history`);
      const reportPatient = data?.patient || patient;
      const history = data?.history || {};
      const visits = Array.isArray(history.visits) ? history.visits : [];
      const appointments = Array.isArray(history.appointments) ? history.appointments : [];
      const toCellValue = (value, fallback = "N/A") => {
        const normalized = String(value ?? "").trim();
        return normalized || fallback;
      };

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Patient Medical Report", margin, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${formatDateTime(new Date())}`, margin, 21);

      autoTable(doc, {
        startY: 25,
        margin: { left: margin, right: margin },
        theme: "grid",
        head: [["Field", "Value"]],
        body: [
          ["Name", toCellValue(reportPatient?.name)],
          ["CIN", toCellValue(reportPatient?.cin)],
          ["Phone", toCellValue(reportPatient?.phone)]
        ],
        headStyles: { fillColor: [15, 23, 42], fontSize: 10 },
        styles: { fontSize: 10, cellPadding: 2, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 35, fontStyle: "bold" }, 1: { cellWidth: "auto" } }
      });

      let cursorY = doc.lastAutoTable.finalY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Visits", margin, cursorY);
      cursorY += 2;

      if (visits.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("No visits found.", margin, cursorY + 6);
        cursorY += 10;
      } else {
        visits.forEach((visit, visitIndex) => {
          const medications =
            Array.isArray(visit.medications) && visit.medications.length > 0
              ? visit.medications
              : visit.prescribedMedication
                ? [{ name: visit.prescribedMedication, instructions: "" }]
                : [];

          const medicationsText =
            medications.length > 0
              ? medications
                  .map((medication) => {
                    const medName = toCellValue(medication?.name);
                    const instructions = toCellValue(medication?.instructions);
                    return `${medName} (${instructions})`;
                  })
                  .join(" | ")
              : "No medications";

          autoTable(doc, {
            startY: cursorY + 4,
            margin: { left: margin, right: margin },
            theme: "grid",
            head: [[`Visit ${visitIndex + 1}`, "Details"]],
            body: [
              ["Date", formatDateTime(visit.visitDate)],
              ["Diagnosis", toCellValue(visit.diagnosis)],
              ["Notes", toCellValue(visit.notes)],
              ["Medications", medicationsText]
            ],
            headStyles: { fillColor: [30, 64, 175], fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
            columnStyles: { 0: { cellWidth: 35, fontStyle: "bold" }, 1: { cellWidth: "auto" } }
          });

          cursorY = doc.lastAutoTable.finalY + 5;
        });
      }

      const appointmentRows =
        appointments.length > 0
          ? appointments.map((appointment) => [
              formatDateTime(appointment.dateTime),
              toCellValue(appointment.doctorName),
              toCellValue(appointment.reason),
              toCellValue(appointment.status)
            ])
          : [["-", "-", "No appointments found", "-"]];

      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        theme: "grid",
        head: [["Date", "Doctor", "Reason", "Status"]],
        body: appointmentRows,
        headStyles: { fillColor: [12, 74, 110], fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" }
      });

      const fileName = `patient-report-${sanitizeFilePart(
        reportPatient?.name || reportPatient?.cin
      )}-${dayjs().format("YYYYMMDD-HHmm")}.pdf`;
      doc.save(fileName);
      toast.success(pdfSuccessLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.historyError");
      setError(message);
      toast.error(message);
    }
  };

  const addVisit = async (e) => {
    e.preventDefault();
    if (!canCreateVisit) {
      setError(noAccessLabel);
      return;
    }
    const activePatientId = visitPaymentPatient?._id || selectedHistory?.patient?._id;
    if (!activePatientId) return;

    const medicationsPayload = (visitForm.medications || [])
      .map((medication) => ({
        name: medication.name?.trim() || "",
        instructions: medication.instructions?.trim() || ""
      }))
      .filter((medication) => medication.name);

    setError("");
    try {
      await api.post("/visits", {
        patientId: activePatientId,
        notes: visitForm.notes,
        diagnosis: visitForm.diagnosis,
        medications: medicationsPayload
      });
      setVisitForm(createEmptyVisit());
      if (selectedHistory?.patient?._id === activePatientId) {
        await loadHistory(activePatientId, { keepVisitPaymentDialogOpen: true });
      }
      toast.success(visitSavedLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.visitError");
      setError(message);
      toast.error(message);
    }
  };

  const addMedicationField = () => {
    setVisitForm((current) => ({
      ...current,
      medications: [...(current.medications || []), { ...emptyMedication }]
    }));
  };

  const removeMedicationField = (indexToRemove) => {
    setVisitForm((current) => {
      const currentMedications = current.medications || [];
      if (currentMedications.length <= 1) {
        return { ...current, medications: [{ ...emptyMedication }] };
      }
      return {
        ...current,
        medications: currentMedications.filter((_, index) => index !== indexToRemove)
      };
    });
  };

  const updateMedicationField = (indexToUpdate, field, value) => {
    setVisitForm((current) => ({
      ...current,
      medications: (current.medications || []).map((medication, index) =>
        index === indexToUpdate ? { ...medication, [field]: value } : medication
      )
    }));
  };

  const startEditPatient = (patient) => {
    if (!canUpdatePatient) {
      setError(noAccessLabel);
      return;
    }

    setEditPatient({
      _id: patient._id,
      cin: patient.cin,
      name: patient.name,
      phone: patient.phone
    });
  };

  const updatePatient = async (e) => {
    e.preventDefault();
    if (!canUpdatePatient) {
      setError(noAccessLabel);
      return;
    }
    if (!editPatient?._id) return;

    setError("");
    try {
      await api.put(`/patients/${editPatient._id}`, {
        cin: editPatient.cin,
        name: editPatient.name,
        phone: editPatient.phone
      });
      const editedId = editPatient._id;
      setEditPatient(null);
      await fetchPatients();
      if (selectedHistory?.patient?._id === editedId) {
        await loadHistory(editedId);
      }
      toast.success(patientUpdatedLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.updateError");
      setError(message);
      toast.error(message);
    }
  };

  const addPayment = async (e) => {
    e.preventDefault();
    if (!canCreatePayment) {
      setError(noAccessLabel);
      return;
    }
    const activePatientId = visitPaymentPatient?._id || selectedHistory?.patient?._id;
    if (!activePatientId) return;

    setError("");
    try {
      await api.post("/payments", {
        patientId: activePatientId,
        amount: Number(paymentForm.amount),
        type: paymentForm.type,
        method: paymentForm.method
      });
      setPaymentForm(emptyPayment);
      if (selectedHistory?.patient?._id === activePatientId) {
        await loadHistory(activePatientId, { keepVisitPaymentDialogOpen: true });
      }
      toast.success(paymentSavedLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.paymentError");
      setError(message);
      toast.error(message);
    }
  };

  const deletePatient = async (patient) => {
    if (!canDeletePatient) {
      setError(noAccessLabel);
      return;
    }

    setError("");
    const confirmed = window.confirm(t("patientsPage.deleteConfirm", { name: patient.name }));
    if (!confirmed) return;

    try {
      await api.delete(`/patients/${patient._id}`);
      if (selectedHistory?.patient?._id === patient._id) {
        closeHistoryModal();
      }
      if (editPatient?._id === patient._id) {
        setEditPatient(null);
      }
      await fetchPatients();
      setHasSearchedPatients(false);
      toast.success(patientDeletedLabel);
    } catch (err) {
      const message = err.response?.data?.message || t("patientsPage.deleteError");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{t("patientsPage.title")}</h1>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {canCreatePatient && (
          <Card title={t("patientsPage.addPatient")}>
            <form onSubmit={addPatient} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                label={t("common.cin")}
                value={newPatient.cin}
                onChange={(e) => setNewPatient((p) => ({ ...p, cin: e.target.value }))}
                required
              />
              <Input
                label={t("common.name")}
                value={newPatient.name}
                onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Input
                label={t("common.phone")}
                value={newPatient.phone}
                onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
                required
              />
              <Button type="submit" className="md:col-span-3">
                {t("patientsPage.createPatient")}
              </Button>
            </form>
          </Card>
        )}

        <Card title={t("patientsPage.searchByCinPhone")}>
          <form onSubmit={searchPatients} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              id="patients-search-cin"
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
              {t("patientsPage.search")}
            </Button>
          </form>
        </Card>
      </div>

      {canUpdatePatient && editPatient && (
        <Card title={t("patientsPage.updatePatient")}>
          <form onSubmit={updatePatient} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              label={t("common.cin")}
              value={editPatient.cin}
              onChange={(e) => setEditPatient((p) => ({ ...p, cin: e.target.value }))}
              required
            />
            <Input
              label={t("common.name")}
              value={editPatient.name}
              onChange={(e) => setEditPatient((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              label={t("common.phone")}
              value={editPatient.phone}
              onChange={(e) => setEditPatient((p) => ({ ...p, phone: e.target.value }))}
              required
            />
            <div className="flex items-end gap-2">
              <Button type="submit" className="w-full">
                {t("patientsPage.saveUpdate")}
              </Button>
              <button
                type="button"
                className="w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setEditPatient(null)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title={t("patientsPage.patientsList")}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-slate-500">
                <th className="py-2">#</th>
                <th className="py-2">{t("common.cin")}</th>
                <th className="py-2">{t("common.name")}</th>
                <th className="py-2">{t("common.phone")}</th>
                <th className="py-2">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={patient._id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold" dir="ltr">
                    {patient.patientNumber ?? index + 1}
                  </td>
                  <td className="py-2 text-center" dir="ltr">
                    {patient.cin}
                  </td>
                  <td className="py-2 text-center" dir="auto">
                    {patient.name}
                  </td>
                  <td className="py-2 text-center" dir="ltr">
                    {patient.phone}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {canViewHistory && (
                        <button className={actionViewBtn} onClick={() => loadHistory(patient._id)}>
                          {t("patientsPage.viewHistory")}
                        </button>
                      )}
                      {canViewHistory && (
                        <button className={actionPdfBtn} onClick={() => exportPatientReportPdf(patient)}>
                          {pdfButtonLabel}
                        </button>
                      )}
                      {canUpdatePatient && (
                        <button className={actionEditBtn} onClick={() => startEditPatient(patient)}>
                          {t("common.edit")}
                        </button>
                      )}
                      {(canCreateVisit || canCreatePayment) && (
                        <button
                          className={actionVisitPayBtn}
                          onClick={() => openVisitPaymentDialogForPatient(patient)}
                        >
                          {openFormLabel}
                        </button>
                      )}
                      {canDeletePatient && (
                        <button className={actionDeleteBtn} onClick={() => deletePatient(patient)}>
                          {t("common.delete")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {hasSearchedPatients && patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-slate-500">
                    {t("common.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onClick={closeHistoryModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {t("patientsPage.history", { name: selectedHistory.patient.name })}
              </h2>
              <div className="flex items-center gap-2">
                {canViewHistory && (
                  <button
                    type="button"
                    className="rounded-lg bg-fuchsia-100 px-4 py-2 text-sm font-semibold text-fuchsia-700 hover:bg-fuchsia-200"
                    onClick={() => exportPatientReportPdf(selectedHistory.patient)}
                  >
                    {exportPdfLabel}
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                  onClick={closeHistoryModal}
                >
                  {t("common.close")}
                </button>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 gap-4 ${
                visibleModalCardsCount === 1
                  ? "xl:grid-cols-1"
                  : visibleModalCardsCount === 2
                    ? "xl:grid-cols-2"
                    : "xl:grid-cols-3"
              }`}
            >
              <Card title={t("patientsPage.visits")}>
                <div className="space-y-2">
                  {selectedHistory.history.visits.map((visit) => (
                    <div key={visit._id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500" dir="ltr">
                        {dayjs(visit.visitDate).format("DD/MM/YYYY HH:mm")}
                      </p>
                      {visit.notes && <p className="text-sm text-slate-800">{visit.notes}</p>}
                      {visit.diagnosis && (
                        <p className="mt-1 text-xs text-slate-600">
                          {t("patientsPage.diagnosis")}: {visit.diagnosis}
                        </p>
                      )}
                      <div className="mt-2 rounded-md bg-slate-50 p-2">
                        <p className="mb-1 text-xs font-semibold text-slate-700">{medsTitle}</p>
                        {Array.isArray(visit.medications) && visit.medications.length > 0 ? (
                          <div className="space-y-2">
                            {visit.medications.map((medication, medIndex) => {
                              return (
                                <div
                                  key={`${visit._id}-med-${medIndex}`}
                                  className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700"
                                >
                                  <p>
                                    <span className="font-semibold text-slate-800">{medCardNameLabel}:</span>{" "}
                                    {medication.name}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold text-slate-800">
                                      {medCardInstructionsLabel}:
                                    </span>{" "}
                                    {medication.instructions || "-"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : visit.prescribedMedication ? (
                          <p className="text-xs text-slate-700">{visit.prescribedMedication}</p>
                        ) : (
                          <p className="text-xs text-slate-500">{noMedsLabel}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedHistory.history.visits.length === 0 && (
                    <p className="text-sm text-slate-500">{t("patientsPage.noVisits")}</p>
                  )}
                </div>

                <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-700">
                  {t("patientsPage.appointments")}
                </h3>
                <div className="space-y-2">
                  {selectedHistory.history.appointments.map((appointment) => (
                    <div key={appointment._id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500" dir="ltr">
                        {dayjs(appointment.dateTime).format("DD/MM/YYYY HH:mm")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {appointment.doctorName} - {t(`badge.${appointment.status}`)}
                      </p>
                    </div>
                  ))}
                  {selectedHistory.history.appointments.length === 0 && (
                    <p className="text-sm text-slate-500">{t("patientsPage.noAppointments")}</p>
                  )}
                </div>
              </Card>

              {canReadPayments && (
                <Card title={t("patientsPage.paymentHistory")}>
                  <div className="space-y-2">
                    {selectedHistory.history.payments.map((payment) => (
                      <div key={payment._id} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500" dir="ltr">
                          {dayjs(payment.paymentDate).format("DD/MM/YYYY HH:mm")}
                        </p>
                        <p className="text-sm text-slate-800">
                          {t(`common.${payment.type}`)} ({t(`common.${payment.method}`)})
                        </p>
                      </div>
                    ))}
                    {selectedHistory.history.payments.length === 0 && (
                      <p className="text-sm text-slate-500">{t("patientsPage.noPayments")}</p>
                    )}
                  </div>
                </Card>
              )}

            </div>
          </div>
        </div>
      )}

      {visitPaymentPatient && isVisitPaymentDialogOpen && (canCreateVisit || canCreatePayment) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onClick={closeVisitPaymentDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {t("patientsPage.addVisitAndPayment")} - {visitPaymentPatient.name}
              </h3>
              <button
                type="button"
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                onClick={closeVisitPaymentDialog}
              >
                {t("common.close")}
              </button>
            </div>

            <div className="space-y-4">
              {canCreateVisit && (
                <form onSubmit={addVisit} className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      {t("patientsPage.notes")}
                    </span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={visitForm.notes}
                      onChange={(e) => setVisitForm((v) => ({ ...v, notes: e.target.value }))}
                    />
                  </label>
                  <Input
                    label={t("patientsPage.diagnosis")}
                    value={visitForm.diagnosis}
                    onChange={(e) => setVisitForm((v) => ({ ...v, diagnosis: e.target.value }))}
                  />
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">{medsTitle}</p>
                      <button
                        type="button"
                        className="rounded bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700"
                        onClick={addMedicationField}
                      >
                        {addMedLabel}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(visitForm.medications || []).map((medication, medicationIndex) => (
                        <div
                          key={`visit-medication-${medicationIndex}`}
                          className="rounded-md border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="grid grid-cols-1 gap-2">
                            <Input
                              label={medNameLabel}
                              value={medication.name}
                              onChange={(e) =>
                                updateMedicationField(medicationIndex, "name", e.target.value)
                              }
                            />
                            <Input
                              label={instructionsLabel}
                              value={medication.instructions}
                              onChange={(e) =>
                                updateMedicationField(medicationIndex, "instructions", e.target.value)
                              }
                            />
                          </div>

                          {(visitForm.medications || []).length > 1 && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-xs font-semibold text-rose-700"
                                onClick={() => removeMedicationField(medicationIndex)}
                              >
                                {removeMedLabel}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button type="submit">{t("patientsPage.saveVisit")}</Button>
                </form>
              )}

              {canCreatePayment && (
                <form onSubmit={addPayment} className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <Input
                    label={t("common.amount")}
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                    required
                  />
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      {t("common.type")}
                    </span>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={paymentForm.type}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, type: e.target.value }))}
                    >
                      <option value="consultation">{t("common.consultation")}</option>
                      <option value="analysis">{t("common.analysis")}</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      {t("common.method")}
                    </span>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                    >
                      <option value="cash">{t("common.cash")}</option>
                      <option value="card">{t("common.card")}</option>
                      <option value="transfer">{t("common.transfer")}</option>
                    </select>
                  </label>
                  <Button type="submit">{t("patientsPage.savePayment")}</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
