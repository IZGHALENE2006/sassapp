import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { PERMISSIONS } from "../constants/permissions";
import { useI18n } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import usePermissions from "../hooks/usePermissions";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

const emptyMedication = {
  name: "",
  instructions: ""
};

const createEmptyNormalForm = () => ({
  cin: "",
  name: "",
  phone: "",
  diagnosis: "",
  notes: "",
  archiveDate: "",
  medications: [{ ...emptyMedication }]
});

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

const resolvePhotoUrl = (rawUrl) => {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${BACKEND_ORIGIN}${parsed.pathname}`;
      }
    } catch (_err) {
      return rawUrl;
    }
    return rawUrl;
  }
  if (rawUrl.startsWith("/")) return `${BACKEND_ORIGIN}${rawUrl}`;
  return `${BACKEND_ORIGIN}/${rawUrl}`;
};

export default function LegacyPatientsPage() {
  const { t, language } = useI18n();
  const toast = useToast();
  const { can } = usePermissions();

  const canCreatePatient = can(PERMISSIONS.PATIENT_CREATE);
  const canCreateVisit = can(PERMISSIONS.VISIT_CREATE);
  const canDelete = can(PERMISSIONS.PATIENT_DELETE);
  const canViewHistory = can(PERMISSIONS.PATIENT_HISTORY);
  const canReadPayments = can(PERMISSIONS.PAYMENT_READ);
  const isArabic = language === "ar";

  const [items, setItems] = useState([]);
  const [legacyNormalPatients, setLegacyNormalPatients] = useState([]);
  const [search, setSearch] = useState({ cin: "", name: "" });
  const [hasSearched, setHasSearched] = useState(false);

  const [addMode, setAddMode] = useState("photo");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [cin, setCin] = useState("");
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [normalForm, setNormalForm] = useState(createEmptyNormalForm);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedNormalHistory, setSelectedNormalHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  const labels = useMemo(
    () => ({
      title: isArabic ? "المرضى القدامى" : "Patients anciens",
      subtitle: isArabic
        ? "يمكنك إضافة ملف قديم كصورة أو تسجيل المريض كملف عادي مع أرشفة الحالة."
        : "Vous pouvez ajouter un ancien dossier en photo ou enregistrer le patient comme dossier normal.",
      normalFilesTitle: isArabic ? "الملفات العادية للمرضى القدامى" : "Dossiers normaux des patients anciens",
      addTitle: isArabic ? "إضافة مريض قديم" : "Ajouter patient ancien",
      openAddDialog: isArabic ? "إضافة مريض" : "Ajouter patient",
      modeTitle: isArabic ? "طريقة الإدخال" : "Mode d'ajout",
      modePhoto: isArabic ? "صورة فقط" : "Photo seulement",
      modeNormal: isArabic ? "ملف عادي" : "Dossier normal",
      cin: isArabic ? "رقم CIN" : "CIN",
      uploadPhoto: isArabic ? "صورة الملف" : "Photo dossier",
      patientName: isArabic ? "اسم المريض" : "Nom patient",
      phone: isArabic ? "الهاتف" : "Telephone",
      diagnosis: isArabic ? "التشخيص المؤرشف" : "Diagnostic archive",
      notes: isArabic ? "ملاحظات الأرشيف" : "Notes archive",
      archiveDate: isArabic ? "تاريخ الأرشيف" : "Date archive",
      medicationsTitle: isArabic ? "الأدوية المؤرشفة" : "Medicaments archives",
      medicationName: isArabic ? "اسم الدواء" : "Nom medicament",
      medicationInstructions: isArabic ? "تعليمات" : "Instructions",
      addMedication: isArabic ? "إضافة دواء" : "Ajouter medicament",
      removeMedication: isArabic ? "حذف" : "Supprimer",
      noVisitPermission: isArabic
        ? "تم إنشاء المريض لكنك لا تملك صلاحية حفظ أرشيف الزيارة."
        : "Patient cree, mais vous n'avez pas la permission d'enregistrer l'archive visite.",
      searchTitle: isArabic ? "البحث" : "Recherche",
      searchByCinOrName: isArabic ? "بحث بـ CIN أو الاسم" : "Rechercher par CIN ou nom",
      search: isArabic ? "بحث" : "Rechercher",
      clear: isArabic ? "مسح" : "Effacer",
      noResults: isArabic ? "لا توجد نتائج." : "Aucun resultat.",
      addButton: isArabic ? "إضافة" : "Ajouter",
      addNormalButton: isArabic ? "تسجيل ملف عادي" : "Enregistrer dossier normal",
      added: isArabic ? "تمت إضافة الملف المصور بنجاح." : "Dossier photo ajoute avec succes.",
      normalAdded: isArabic ? "تم تسجيل المريض في الملفات العادية." : "Patient enregistre en dossier normal.",
      deleted: isArabic ? "تم الحذف بنجاح." : "Suppression effectuee.",
      loadError: isArabic ? "فشل تحميل المرضى القدامى." : "Echec du chargement des patients anciens.",
      createError: isArabic ? "فشل إضافة المريض القديم." : "Echec d'ajout du patient ancien.",
      normalCreateError: isArabic ? "فشل تسجيل الملف العادي." : "Echec d'enregistrement du dossier normal.",
      deleteError: isArabic ? "فشل حذف المريض." : "Echec de suppression du patient.",
      noItems: isArabic ? "لا توجد ملفات حالياً." : "Aucun dossier pour le moment.",
      imageRequired: isArabic ? "الصورة مطلوبة." : "La photo est obligatoire.",
      nameRequired: isArabic ? "الاسم مطلوب." : "Le nom est obligatoire.",
      cinRequired: isArabic ? "رقم CIN مطلوب." : "Le CIN est obligatoire.",
      phoneRequired: isArabic ? "الهاتف مطلوب." : "Le telephone est obligatoire.",
      deleteConfirm: isArabic ? "تأكيد حذف هذا الملف؟" : "Confirmer la suppression de ce dossier ?",
      viewImage: isArabic ? "عرض الصورة" : "Voir image",
      close: isArabic ? "إغلاق" : "Fermer",
      imageFailed: isArabic ? "الصورة غير متاحة" : "Image indisponible",
      normalHistoryTitle: isArabic ? "سجل المريض القديم" : "Historique patient ancien",
      historyLoadError: isArabic ? "فشل تحميل السجل." : "Echec du chargement de l'historique.",
      openHistory: isArabic ? "عرض السجل" : "Voir historique",
      exportPdf: isArabic ? "PDF المريض" : "PDF patient",
      pdfSuccess: isArabic ? "تم تحميل تقرير PDF بنجاح." : "Rapport PDF telecharge avec succes.",
      visitsTitle: isArabic ? "الزيارات" : "Visites",
      appointmentsTitle: isArabic ? "المواعيد" : "Rendez-vous",
      paymentsTitle: isArabic ? "المدفوعات" : "Paiements",
      noVisits: isArabic ? "لا توجد زيارات." : "Aucune visite.",
      noAppointments: isArabic ? "لا توجد مواعيد." : "Aucun rendez-vous.",
      noPayments: isArabic ? "لا توجد مدفوعات." : "Aucun paiement.",
      medsTitle: isArabic ? "الأدوية" : "Medicaments",
      medName: isArabic ? "الاسم" : "Nom",
      medInstructions: isArabic ? "التعليمات" : "Instructions"
    }),
    [isArabic]
  );

  const buildSearchParams = (values) => {
    const params = {};
    if (values?.cin?.trim()) params.cin = values.cin.trim().toUpperCase();
    if (values?.name?.trim()) params.name = values.name.trim();
    return params;
  };

  const loadItems = async (values = {}) => {
    const params = buildSearchParams(values);
    const { data } = await api.get("/legacy-patients", { params });
    setItems(data.items || []);
  };

  const loadLegacyNormalPatients = async (values = {}) => {
    const baseParams = buildSearchParams(values);
    const params = { ...baseParams, segment: "legacy" };
    const endpoint = baseParams.cin || baseParams.name ? "/patients/search" : "/patients";
    const { data } = await api.get(endpoint, { params });
    setLegacyNormalPatients(data.patients || []);
  };

  useEffect(() => {
    Promise.all([loadItems(), loadLegacyNormalPatients()]).catch((err) => {
      setError(err.response?.data?.message || labels.loadError);
    });
  }, [labels.loadError]);

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  useEffect(() => {
    if (!selectedItem) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedItem(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem]);

  useEffect(() => {
    if (!isAddDialogOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsAddDialogOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAddDialogOpen]);

  useEffect(() => {
    if (!selectedNormalHistory) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedNormalHistory(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedNormalHistory]);

  const refresh = async (nextSearch = search) => {
    await Promise.all([loadItems(nextSearch), loadLegacyNormalPatients(nextSearch)]);
  };

  const loadNormalHistory = async (patientId) => {
    if (!canViewHistory) return;
    setError("");
    setHistoryLoading(true);

    try {
      const { data } = await api.get(`/patients/${patientId}/history`);
      setSelectedNormalHistory(data);
    } catch (err) {
      const message = err.response?.data?.message || labels.historyLoadError;
      setError(message);
      toast.error(message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const exportNormalPatientPdf = async (patient) => {
    if (!canViewHistory || !patient?._id) return;

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
      toast.success(labels.pdfSuccess);
    } catch (err) {
      const message = err.response?.data?.message || labels.historyLoadError;
      setError(message);
      toast.error(message);
    }
  };

  const normalizeMedications = (medications) =>
    (medications || [])
      .map((medication) => ({
        name: medication.name?.trim() || "",
        instructions: medication.instructions?.trim() || ""
      }))
      .filter((medication) => medication.name);

  const addMedicationField = () => {
    setNormalForm((prev) => ({
      ...prev,
      medications: [...(prev.medications || []), { ...emptyMedication }]
    }));
  };

  const removeMedicationField = (indexToRemove) => {
    setNormalForm((prev) => {
      const list = prev.medications || [];
      if (list.length <= 1) {
        return { ...prev, medications: [{ ...emptyMedication }] };
      }
      return { ...prev, medications: list.filter((_, index) => index !== indexToRemove) };
    });
  };

  const updateMedicationField = (indexToUpdate, field, value) => {
    setNormalForm((prev) => ({
      ...prev,
      medications: (prev.medications || []).map((item, index) =>
        index === indexToUpdate ? { ...item, [field]: value } : item
      )
    }));
  };

  const onSubmitPhoto = async (event) => {
    event.preventDefault();
    if (!canCreatePatient) return;

    if (!name.trim()) {
      setError(labels.nameRequired);
      return;
    }
    if (!cin.trim()) {
      setError(labels.cinRequired);
      return;
    }
    if (!photoFile) {
      setError(labels.imageRequired);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("cin", cin.trim().toUpperCase());
      formData.append("name", name.trim());
      formData.append("photo", photoFile);

      await api.post("/legacy-patients", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setCin("");
      setName("");
      setPhotoFile(null);
      setIsAddDialogOpen(false);
      await refresh();
      toast.success(labels.added);
    } catch (err) {
      const message = err.response?.data?.message || labels.createError;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitNormal = async (event) => {
    event.preventDefault();
    if (!canCreatePatient) return;

    if (!normalForm.cin.trim()) {
      setError(labels.cinRequired);
      return;
    }
    if (!normalForm.name.trim()) {
      setError(labels.nameRequired);
      return;
    }
    if (!normalForm.phone.trim()) {
      setError(labels.phoneRequired);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const patientPayload = {
        cin: normalForm.cin.trim().toUpperCase(),
        name: normalForm.name.trim(),
        phone: normalForm.phone.trim(),
        recordSource: "legacy"
      };

      const patientResponse = await api.post("/patients", patientPayload);
      const patientId = patientResponse?.data?.patient?._id;

      const medicationsPayload = normalizeMedications(normalForm.medications);
      const shouldArchiveVisit =
        Boolean(normalForm.diagnosis.trim()) ||
        Boolean(normalForm.notes.trim()) ||
        Boolean(normalForm.archiveDate) ||
        medicationsPayload.length > 0;

      if (shouldArchiveVisit && patientId) {
        if (canCreateVisit) {
          const visitPayload = {
            patientId,
            diagnosis: normalForm.diagnosis.trim(),
            notes: normalForm.notes.trim(),
            medications: medicationsPayload
          };

          if (normalForm.archiveDate) {
            const parsed = dayjs(normalForm.archiveDate);
            if (parsed.isValid()) {
              visitPayload.visitDate = parsed.toISOString();
            }
          }

          await api.post("/visits", visitPayload);
        } else {
          toast.info(labels.noVisitPermission);
        }
      }

      setNormalForm(createEmptyNormalForm());
      setIsAddDialogOpen(false);
      await loadLegacyNormalPatients(search);
      toast.success(labels.normalAdded);
    } catch (err) {
      const message = err.response?.data?.message || labels.normalCreateError;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async (event) => {
    event.preventDefault();
    setError("");
    setHasSearched(true);
    try {
      await refresh(search);
    } catch (err) {
      const message = err.response?.data?.message || labels.loadError;
      setError(message);
      toast.error(message);
    }
  };

  const onClearSearch = async () => {
    const cleared = { cin: "", name: "" };
    setSearch(cleared);
    setHasSearched(false);
    setError("");
    try {
      await refresh(cleared);
    } catch (err) {
      const message = err.response?.data?.message || labels.loadError;
      setError(message);
      toast.error(message);
    }
  };

  const onDelete = async (id) => {
    if (!canDelete) return;
    if (!window.confirm(labels.deleteConfirm)) return;

    setError("");
    try {
      await api.delete(`/legacy-patients/${id}`);
      await refresh();
      if (selectedItem?._id === id) {
        setSelectedItem(null);
      }
      toast.success(labels.deleted);
    } catch (err) {
      const message = err.response?.data?.message || labels.deleteError;
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{labels.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{labels.subtitle}</p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <Card title={labels.searchTitle}>
        <form onSubmit={onSearch} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            label={labels.cin}
            value={search.cin}
            onChange={(e) => setSearch((prev) => ({ ...prev, cin: e.target.value }))}
          />
          <Input
            label={labels.patientName}
            value={search.name}
            onChange={(e) => setSearch((prev) => ({ ...prev, name: e.target.value }))}
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              {labels.search}
            </Button>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              onClick={onClearSearch}
            >
              {labels.clear}
            </button>
          </div>
        </form>
        <p className="mt-2 text-xs text-slate-500">{labels.searchByCinOrName}</p>
      </Card>

      {canCreatePatient && (
        <Card title={labels.addTitle}>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setAddMode("photo");
                setIsAddDialogOpen(true);
              }}
            >
              {labels.openAddDialog}
            </Button>
          </div>
        </Card>
      )}

      {canCreatePatient && isAddDialogOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setIsAddDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">{labels.addTitle}</h3>
              <button
                type="button"
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                onClick={() => setIsAddDialogOpen(false)}
              >
                {labels.close}
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">{labels.modeTitle}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    addMode === "photo"
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                  onClick={() => setAddMode("photo")}
                >
                  {labels.modePhoto}
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    addMode === "normal"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                  onClick={() => setAddMode("normal")}
                >
                  {labels.modeNormal}
                </button>
              </div>
            </div>

            {addMode === "photo" && (
              <>
                <form onSubmit={onSubmitPhoto} className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Input
                    label={labels.cin}
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    required
                  />
                  <Input
                    label={labels.patientName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <label className="block text-start">
                    <span className="mb-1 block text-sm font-medium text-slate-700">{labels.uploadPhoto}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                  </label>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t("common.loading") : labels.addButton}
                    </Button>
                  </div>
                </form>
                {previewUrl && (
                  <div className="mt-3">
                    <img
                      src={previewUrl}
                      alt={labels.uploadPhoto}
                      className="h-40 w-40 rounded-lg border border-slate-200 object-cover"
                    />
                  </div>
                )}
              </>
            )}

            {addMode === "normal" && (
              <form onSubmit={onSubmitNormal} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    label={labels.cin}
                    value={normalForm.cin}
                    onChange={(e) => setNormalForm((prev) => ({ ...prev, cin: e.target.value }))}
                    required
                  />
                  <Input
                    label={labels.patientName}
                    value={normalForm.name}
                    onChange={(e) => setNormalForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Input
                    label={labels.phone}
                    value={normalForm.phone}
                    onChange={(e) => setNormalForm((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    label={labels.diagnosis}
                    value={normalForm.diagnosis}
                    onChange={(e) => setNormalForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  />
                  <Input
                    label={labels.archiveDate}
                    type="datetime-local"
                    value={normalForm.archiveDate}
                    onChange={(e) => setNormalForm((prev) => ({ ...prev, archiveDate: e.target.value }))}
                  />
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">{labels.notes}</span>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={normalForm.notes}
                    onChange={(e) => setNormalForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </label>

                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{labels.medicationsTitle}</p>
                    <button
                      type="button"
                      className="rounded bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700"
                      onClick={addMedicationField}
                    >
                      {labels.addMedication}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(normalForm.medications || []).map((medication, index) => (
                      <div key={`normal-medication-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <Input
                            label={labels.medicationName}
                            value={medication.name}
                            onChange={(e) => updateMedicationField(index, "name", e.target.value)}
                          />
                          <Input
                            label={labels.medicationInstructions}
                            value={medication.instructions}
                            onChange={(e) => updateMedicationField(index, "instructions", e.target.value)}
                          />
                        </div>

                        {(normalForm.medications || []).length > 1 && (
                          <div className="mt-2">
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-700"
                              onClick={() => removeMedicationField(index)}
                            >
                              {labels.removeMedication}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? t("common.loading") : labels.addNormalButton}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      <Card title={labels.normalFilesTitle}>
        {legacyNormalPatients.length === 0 ? (
          <p className="text-sm text-slate-500">{hasSearched ? labels.noResults : labels.noItems}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-start text-slate-500">
                  <th className="py-2">#</th>
                  <th className="py-2">{labels.cin}</th>
                  <th className="py-2">{t("common.name")}</th>
                  <th className="py-2">{labels.phone}</th>
                  <th className="py-2">{t("common.date")}</th>
                  <th className="py-2">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {legacyNormalPatients.map((patient, index) => (
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
                    <td className="py-2 text-center" dir="ltr">
                      {dayjs(patient.createdAt).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {canViewHistory ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                              disabled={historyLoading}
                              onClick={() => loadNormalHistory(patient._id)}
                            >
                              {historyLoading ? t("common.loading") : labels.openHistory}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
                              onClick={() => exportNormalPatientPdf(patient)}
                            >
                              {labels.exportPdf}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={labels.title}>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{hasSearched ? labels.noResults : labels.noItems}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button type="button" className="w-full" onClick={() => setSelectedItem(item)}>
                  <img
                    src={resolvePhotoUrl(item.photoUrl)}
                    alt={item.name}
                    className="h-48 w-full object-cover transition hover:scale-[1.01]"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      const fallback = event.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div
                    className="hidden h-48 w-full items-center justify-center bg-slate-100 text-sm text-slate-500"
                    aria-label={labels.imageFailed}
                  >
                    {labels.imageFailed}
                  </div>
                </button>
                <div className="space-y-2 p-3">
                  <p className="font-semibold text-slate-900" dir="auto">
                    {item.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-700" dir="ltr">
                    {labels.cin}: {item.cin || "-"}
                  </p>
                  <p className="text-xs text-slate-500" dir="ltr">
                    {dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                      onClick={() => setSelectedItem(item)}
                    >
                      {labels.viewImage}
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        onClick={() => onDelete(item._id)}
                      >
                        {t("common.delete")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedNormalHistory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onClick={() => setSelectedNormalHistory(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900" dir="auto">
                {labels.normalHistoryTitle} - {selectedNormalHistory.patient?.name}
              </h3>
              <div className="flex items-center gap-2">
                {canViewHistory && (
                  <button
                    type="button"
                    className="rounded-lg bg-fuchsia-100 px-4 py-2 text-sm font-semibold text-fuchsia-700 hover:bg-fuchsia-200"
                    onClick={() => exportNormalPatientPdf(selectedNormalHistory.patient)}
                  >
                    {labels.exportPdf}
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                  onClick={() => setSelectedNormalHistory(null)}
                >
                  {labels.close}
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <p>
                  <span className="font-semibold">{labels.cin}:</span>{" "}
                  <span dir="ltr">{selectedNormalHistory.patient?.cin || "-"}</span>
                </p>
                <p>
                  <span className="font-semibold">{labels.phone}:</span>{" "}
                  <span dir="ltr">{selectedNormalHistory.patient?.phone || "-"}</span>
                </p>
                <p>
                  <span className="font-semibold">{t("common.date")}:</span>{" "}
                  <span dir="ltr">{formatDateTime(selectedNormalHistory.patient?.createdAt)}</span>
                </p>
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-4 ${canReadPayments ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
              <Card title={labels.visitsTitle}>
                <div className="space-y-2">
                  {(selectedNormalHistory.history?.visits || []).map((visit) => (
                    <div key={visit._id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500" dir="ltr">
                        {formatDateTime(visit.visitDate)}
                      </p>
                      {visit.diagnosis && <p className="mt-1 text-sm font-semibold text-slate-800">{visit.diagnosis}</p>}
                      {visit.notes && <p className="mt-1 text-sm text-slate-700">{visit.notes}</p>}
                      <div className="mt-2 rounded-md bg-slate-50 p-2">
                        <p className="mb-1 text-xs font-semibold text-slate-700">{labels.medsTitle}</p>
                        {Array.isArray(visit.medications) && visit.medications.length > 0 ? (
                          <div className="space-y-2">
                            {visit.medications.map((medication, medIndex) => (
                              <div
                                key={`${visit._id}-legacy-med-${medIndex}`}
                                className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700"
                              >
                                <p>
                                  <span className="font-semibold text-slate-800">{labels.medName}:</span>{" "}
                                  {medication.name}
                                </p>
                                <p className="mt-1">
                                  <span className="font-semibold text-slate-800">{labels.medInstructions}:</span>{" "}
                                  {medication.instructions || "-"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : visit.prescribedMedication ? (
                          <p className="text-xs text-slate-700">{visit.prescribedMedication}</p>
                        ) : (
                          <p className="text-xs text-slate-500">{t("common.noData")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(selectedNormalHistory.history?.visits || []).length === 0 && (
                    <p className="text-sm text-slate-500">{labels.noVisits}</p>
                  )}
                </div>
              </Card>

              <Card title={labels.appointmentsTitle}>
                <div className="space-y-2">
                  {(selectedNormalHistory.history?.appointments || []).map((appointment) => (
                    <div key={appointment._id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500" dir="ltr">
                        {formatDateTime(appointment.dateTime)}
                      </p>
                      <p className="text-sm text-slate-800" dir="auto">
                        {appointment.doctorName || "-"}
                      </p>
                      {appointment.reason && <p className="mt-1 text-xs text-slate-600">{appointment.reason}</p>}
                    </div>
                  ))}
                  {(selectedNormalHistory.history?.appointments || []).length === 0 && (
                    <p className="text-sm text-slate-500">{labels.noAppointments}</p>
                  )}
                </div>
              </Card>

              {canReadPayments && (
                <Card title={labels.paymentsTitle}>
                  <div className="space-y-2">
                    {(selectedNormalHistory.history?.payments || []).map((payment) => (
                      <div key={payment._id} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500" dir="ltr">
                          {formatDateTime(payment.paymentDate)}
                        </p>
                        <p className="text-sm text-slate-800">
                          {Number(payment.amount).toFixed(2)} MAD - {t(`common.${payment.type}`)}
                        </p>
                      </div>
                    ))}
                    {(selectedNormalHistory.history?.payments || []).length === 0 && (
                      <p className="text-sm text-slate-500">{labels.noPayments}</p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900" dir="auto">
                {selectedItem.name}
              </h3>
              <button
                type="button"
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                onClick={() => setSelectedItem(null)}
              >
                {labels.close}
              </button>
            </div>
            <img
              src={resolvePhotoUrl(selectedItem.photoUrl)}
              alt={selectedItem.name}
              className="max-h-[70vh] w-full rounded-xl border border-slate-200 object-contain"
            />
            <p className="mt-2 text-sm font-semibold text-slate-700" dir="ltr">
              {labels.cin}: {selectedItem.cin || "-"}
            </p>
            <p className="mt-2 text-xs text-slate-500" dir="ltr">
              {dayjs(selectedItem.createdAt).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
