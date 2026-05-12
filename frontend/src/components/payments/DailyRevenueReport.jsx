import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { api } from "../../api/client";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useI18n } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import useFocusSearchShortcut from "../../hooks/useFocusSearchShortcut";

const buildDefaultFilters = () => {
  const today = dayjs().format("YYYY-MM-DD");
  return {
    fromDate: today,
    toDate: today,
    type: "all",
    method: "all",
    cin: "",
    patientName: "",
    minAmount: "",
    maxAmount: "",
    sort: "desc"
  };
};

const toCsvCell = (value) => {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export default function DailyRevenueReport({ refreshKey = 0 }) {
  const { t, language } = useI18n();
  const toast = useToast();
  useFocusSearchShortcut("revenue-filter-cin");

  const [filters, setFilters] = useState(buildDefaultFilters);
  const [reportPayments, setReportPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isArabic = language === "ar";
  const reportTitle = isArabic ? "تقرير المداخيل المتقدم" : "Rapport Revenus Avance";
  const subtitle = isArabic
    ? "فلترة حسب التاريخ، نوع الدفع، طريقة الدفع، CIN، الاسم، والمبلغ."
    : "Filtrer par date, type, methode, CIN, nom et montant.";
  const applyLabel = isArabic ? "تطبيق الفلاتر" : "Appliquer les filtres";
  const resetLabel = isArabic ? "إعادة التعيين" : "Reinitialiser";
  const exportExcelLabel = isArabic ? "Export Excel" : "Exporter Excel";
  const exportPdfLabel = isArabic ? "Export PDF" : "Exporter PDF";
  const countLabel = isArabic ? "عدد الدفعات" : "Nombre de paiements";
  const averageLabel = isArabic ? "المعدل" : "Moyenne";
  const keyboardHint = isArabic ? "Ctrl+K للتركيز على CIN" : "Ctrl+K pour focus CIN";
  const loadingLabel = isArabic ? "جاري التحميل..." : "Chargement...";

  const reportTotal = useMemo(
    () => reportPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [reportPayments]
  );
  const reportAverage = reportPayments.length > 0 ? reportTotal / reportPayments.length : 0;

  const fetchReportByFilters = useCallback(
    async (activeFilters, showToast = false) => {
      setLoading(true);
      setError("");
      try {
        const params = {};

        if (activeFilters.fromDate) {
          params.from = dayjs(activeFilters.fromDate).startOf("day").toISOString();
        }
        if (activeFilters.toDate) {
          params.to = dayjs(activeFilters.toDate).endOf("day").toISOString();
        }
        if (activeFilters.type !== "all") params.type = activeFilters.type;
        if (activeFilters.method !== "all") params.method = activeFilters.method;
        if (activeFilters.cin.trim()) params.cin = activeFilters.cin.trim();
        if (activeFilters.patientName.trim()) params.name = activeFilters.patientName.trim();
        if (activeFilters.minAmount !== "") params.minAmount = activeFilters.minAmount;
        if (activeFilters.maxAmount !== "") params.maxAmount = activeFilters.maxAmount;
        if (activeFilters.sort) params.sort = activeFilters.sort;

        const { data } = await api.get("/payments", { params });
        setReportPayments(data.payments);

        if (showToast) {
          const found = data.payments.length;
          const message = isArabic ? `تم العثور على ${found} نتيجة.` : `${found} resultat(s) trouves.`;
          toast.info(message);
        }
      } catch (err) {
        const message = err.response?.data?.message || t("paymentsPage.loadError");
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [isArabic, t, toast]
  );

  useEffect(() => {
    fetchReportByFilters(filters).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReportByFilters, refreshKey]);

  const onApplyFilters = async (event) => {
    event.preventDefault();
    await fetchReportByFilters(filters, true);
  };

  const onResetFilters = async () => {
    const reset = buildDefaultFilters();
    setFilters(reset);
    await fetchReportByFilters(reset, true);
  };

  const exportRows = reportPayments.map((item) => ({
    patient: item.patient?.name || "",
    cin: item.patient?.cin || "",
    amount: Number(item.amount || 0).toFixed(2),
    type: t(`common.${item.type}`),
    method: t(`common.${item.method}`),
    date: dayjs(item.paymentDate).format("DD/MM/YYYY HH:mm")
  }));

  const onExportExcel = () => {
    if (exportRows.length === 0) {
      toast.info(t("common.noResults"));
      return;
    }

    const headers = [
      isArabic ? "المريض" : "Patient",
      "CIN",
      isArabic ? "المبلغ" : "Montant",
      isArabic ? "النوع" : "Type",
      isArabic ? "الطريقة" : "Methode",
      isArabic ? "التاريخ" : "Date"
    ];
    const csvLines = [
      headers.map(toCsvCell).join(","),
      ...exportRows.map((row) =>
        [row.patient, row.cin, row.amount, row.type, row.method, row.date].map(toCsvCell).join(",")
      )
    ];

    const csvContent = `\uFEFF${csvLines.join("\n")}`;
    const filename = `revenue-report-${dayjs().format("YYYYMMDD-HHmm")}.csv`;
    downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), filename);
    toast.success(isArabic ? "تم تصدير ملف Excel." : "Fichier Excel exporte.");
  };

  const onExportPdf = () => {
    if (exportRows.length === 0) {
      toast.info(t("common.noResults"));
      return;
    }

    const popup = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
    if (!popup) {
      toast.error(isArabic ? "اسمح بالنوافذ المنبثقة للتصدير PDF." : "Autorisez les popups pour exporter PDF.");
      return;
    }

    const rowsHtml = exportRows
      .map(
        (row) => `
          <tr>
            <td>${row.patient}</td>
            <td>${row.cin}</td>
            <td>${row.amount} MAD</td>
            <td>${row.type}</td>
            <td>${row.method}</td>
            <td>${row.date}</td>
          </tr>
        `
      )
      .join("");

    popup.document.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            p { margin: 0 0 14px; color: #475569; font-size: 13px; }
            .stats { margin: 14px 0; padding: 12px; background: #ecfeff; border: 1px solid #bae6fd; border-radius: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <p>${dayjs().format("DD/MM/YYYY HH:mm")}</p>
          <div class="stats">
            <strong>${isArabic ? "إجمالي المداخيل" : "Total revenus"}:</strong> ${reportTotal.toFixed(2)} MAD
            <br />
            <strong>${countLabel}:</strong> ${reportPayments.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>${isArabic ? "المريض" : "Patient"}</th>
                <th>CIN</th>
                <th>${isArabic ? "المبلغ" : "Montant"}</th>
                <th>${isArabic ? "النوع" : "Type"}</th>
                <th>${isArabic ? "الطريقة" : "Methode"}</th>
                <th>${isArabic ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
    toast.success(isArabic ? "تم فتح نافذة PDF للطباعة." : "Fenetre PDF ouverte pour impression.");
  };

  return (
    <Card title={reportTitle}>
      <p className="mb-3 text-sm text-slate-600">{subtitle}</p>
      <p className="mb-4 text-xs text-slate-500">{keyboardHint}</p>
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

      <form onSubmit={onApplyFilters} className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label={isArabic ? "من تاريخ" : "Date debut"}
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
        />
        <Input
          label={isArabic ? "إلى تاريخ" : "Date fin"}
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
        />
        <Select
          label={t("common.type")}
          value={filters.type}
          onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
        >
          <option value="all">{isArabic ? "الكل" : "Tous"}</option>
          <option value="consultation">{t("common.consultation")}</option>
          <option value="analysis">{t("common.analysis")}</option>
        </Select>
        <Select
          label={t("common.method")}
          value={filters.method}
          onChange={(e) => setFilters((prev) => ({ ...prev, method: e.target.value }))}
        >
          <option value="all">{isArabic ? "الكل" : "Tous"}</option>
          <option value="cash">{t("common.cash")}</option>
          <option value="card">{t("common.card")}</option>
          <option value="transfer">{t("common.transfer")}</option>
        </Select>
        <Input
          id="revenue-filter-cin"
          label={t("common.cin")}
          value={filters.cin}
          onChange={(e) => setFilters((prev) => ({ ...prev, cin: e.target.value }))}
          placeholder={t("common.cin")}
        />
        <Input
          label={isArabic ? "اسم المريض" : "Nom patient"}
          value={filters.patientName}
          onChange={(e) => setFilters((prev) => ({ ...prev, patientName: e.target.value }))}
          placeholder={isArabic ? "ادخل الاسم" : "Entrer le nom"}
        />
        <Input
          label={isArabic ? "أقل مبلغ" : "Montant min"}
          type="number"
          min="0"
          step="0.01"
          value={filters.minAmount}
          onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
        />
        <Input
          label={isArabic ? "أعلى مبلغ" : "Montant max"}
          type="number"
          min="0"
          step="0.01"
          value={filters.maxAmount}
          onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
        />
        <Select
          label={isArabic ? "ترتيب التاريخ" : "Tri date"}
          value={filters.sort}
          onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
        >
          <option value="desc">{isArabic ? "الأحدث" : "Plus recent"}</option>
          <option value="asc">{isArabic ? "الأقدم" : "Plus ancien"}</option>
        </Select>
        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? loadingLabel : applyLabel}
          </Button>
          <button
            type="button"
            className="w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            onClick={onResetFilters}
            disabled={loading}
          >
            {resetLabel}
          </button>
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={onExportExcel}>
            {exportExcelLabel}
          </Button>
          <Button type="button" className="w-full bg-rose-700 hover:bg-rose-800" onClick={onExportPdf}>
            {exportPdfLabel}
          </Button>
        </div>
      </form>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">{isArabic ? "إجمالي المداخيل" : "Total revenus"}</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900" dir="ltr">
            {reportTotal.toFixed(2)} MAD
          </p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-sm text-sky-700">{countLabel}</p>
          <p className="mt-2 text-2xl font-bold text-sky-900" dir="ltr">
            {reportPayments.length}
          </p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-sm text-violet-700">{averageLabel}</p>
          <p className="mt-2 text-2xl font-bold text-violet-900" dir="ltr">
            {reportAverage.toFixed(2)} MAD
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-start text-slate-500">
              <th className="py-2">{t("common.patient")}</th>
              <th className="py-2">{t("common.cin")}</th>
              <th className="py-2">{t("common.amount")}</th>
              <th className="py-2">{t("common.type")}</th>
              <th className="py-2">{t("common.method")}</th>
              <th className="py-2">{t("common.date")}</th>
            </tr>
          </thead>
          <tbody>
            {reportPayments.map((item) => (
              <tr key={item._id} className="border-b border-slate-100">
                <td className="py-2 text-center" dir="auto">
                  {item.patient?.name}
                </td>
                <td className="py-2 text-center" dir="ltr">
                  {item.patient?.cin}
                </td>
                <td className="py-2 text-center font-semibold" dir="ltr">
                  {Number(item.amount).toFixed(2)} MAD
                </td>
                <td className="py-2 text-center">{t(`common.${item.type}`)}</td>
                <td className="py-2 text-center">{t(`common.${item.method}`)}</td>
                <td className="py-2 text-center" dir="ltr">
                  {dayjs(item.paymentDate).format("DD/MM/YYYY HH:mm")}
                </td>
              </tr>
            ))}
            {reportPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-sm text-slate-500">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
