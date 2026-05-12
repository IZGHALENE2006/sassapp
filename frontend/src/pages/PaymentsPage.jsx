import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { PERMISSIONS } from "../constants/permissions";
import { useI18n } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import usePermissions from "../hooks/usePermissions";

const defaultForm = {
  patientId: "",
  amount: "",
  type: "consultation",
  method: "cash",
  paymentDate: ""
};

export default function PaymentsPage() {
  const { t, language } = useI18n();
  const toast = useToast();
  const { can } = usePermissions();
  const canCreatePayment = can(PERMISSIONS.PAYMENT_CREATE);
  const noAccessLabel =
    language === "ar"
      ? "لا تملك صلاحية لهذا الإجراء."
      : "Vous n'avez pas la permission pour cette action.";
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [{ data: paymentData }, { data: patientData }] = await Promise.all([
      api.get("/payments"),
      api.get("/patients")
    ]);

    setPayments(paymentData.payments);
    setPatients(patientData.patients);
    if (!form.patientId && patientData.patients[0]?._id) {
      setForm((prev) => ({ ...prev, patientId: patientData.patients[0]._id }));
    }
  };

  useEffect(() => {
    fetchData().catch((err) => {
      const message = err.response?.data?.message || t("paymentsPage.loadError");
      setError(message);
      toast.error(message);
    });
  }, [t, toast]);

  const createPayment = async (e) => {
    e.preventDefault();
    if (!canCreatePayment) {
      setError(noAccessLabel);
      toast.error(noAccessLabel);
      return;
    }
    setError("");
    try {
      await api.post("/payments", {
        patientId: form.patientId,
        amount: Number(form.amount),
        type: form.type,
        method: form.method,
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : undefined
      });
      setForm((prev) => ({ ...defaultForm, patientId: prev.patientId }));
      await fetchData();
      toast.success("Payment recorded successfully.");
    } catch (err) {
      const message = err.response?.data?.message || t("paymentsPage.createError");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{t("paymentsPage.title")}</h1>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {canCreatePayment && (
        <Card title={t("paymentsPage.recordPayment")}>
          <form onSubmit={createPayment} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              label={t("common.amount")}
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
            <Select
              label={t("common.type")}
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="consultation">{t("common.consultation")}</option>
              <option value="analysis">{t("common.analysis")}</option>
            </Select>
            <Select
              label={t("common.method")}
              value={form.method}
              onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
            >
              <option value="cash">{t("common.cash")}</option>
              <option value="card">{t("common.card")}</option>
              <option value="transfer">{t("common.transfer")}</option>
            </Select>
            <Input
              label={t("paymentsPage.paymentDate")}
              type="datetime-local"
              value={form.paymentDate}
              onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
            />
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                {t("paymentsPage.savePayment")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={t("paymentsPage.paymentHistory")}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-slate-500">
                <th className="py-2">{t("common.patient")}</th>
                <th className="py-2">{t("common.amount")}</th>
                <th className="py-2">{t("common.type")}</th>
                <th className="py-2">{t("common.method")}</th>
                <th className="py-2">{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((item) => (
                <tr key={item._id} className="border-b border-slate-100">
                  <td className="py-2 text-center" dir="auto">
                    {item.patient?.name}
                  </td>
                  <td className="py-2 font-semibold text-center" dir="ltr">
                    {Number(item.amount).toFixed(2)} MAD
                  </td>
                  <td className="py-2 text-center capitalize">{t(`common.${item.type}`)}</td>
                  <td className="py-2 text-center capitalize">{t(`common.${item.method}`)}</td>
                  <td className="py-2 text-center" dir="ltr">
                    {dayjs(item.paymentDate).format("DD/MM/YYYY HH:mm")}
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
