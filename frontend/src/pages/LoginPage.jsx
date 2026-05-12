import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, logout } = useAuth();
  const { t, language, setLanguage, dir } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const selectedRoleRaw = searchParams.get("role");
  const selectedRole =
    selectedRoleRaw === "admin" || selectedRoleRaw === "receptionist" ? selectedRoleRaw : "";

  const roleLabel =
    selectedRole === "admin"
      ? language === "ar"
        ? "المدير"
        : "Admin"
      : selectedRole === "receptionist"
        ? language === "ar"
          ? "الاستقبال"
          : "Reception"
        : "";

  const roleMismatchError =
    language === "ar"
      ? "الحساب لا يطابق الدور المختار. اختر الدور الصحيح."
      : "Ce compte ne correspond pas au role choisi. Choisissez le bon role.";

  const changeRoleLabel = language === "ar" ? "تغيير الدور" : "Changer le role";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (selectedRole && user.role !== selectedRole) {
        logout();
        setError(roleMismatchError);
        toast.error(roleMismatchError);
        return;
      }
      toast.success(language === "ar" ? "تم تسجيل الدخول بنجاح." : "Connexion reussie.");
      navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || t("login.failed");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-blue-100 px-4"
      dir={dir}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{t("common.appName")}</h1>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="fr">{t("common.fr")}</option>
            <option value="ar">{t("common.ar")}</option>
          </select>
        </div>

        <p className="mb-6 text-sm text-slate-600">{t("login.subtitle")}</p>

        {selectedRole && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
            <p className="text-sm font-semibold text-brand-800">
              {language === "ar" ? "الدور المختار" : "Role choisi"}: {roleLabel}
            </p>
            <Link to="/choose-role" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
              {changeRoleLabel}
            </Link>
          </div>
        )}

        {!selectedRole && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Link to="/choose-role" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              {changeRoleLabel}
            </Link>
          </div>
        )}
    
        <div className="space-y-3">
          <Input
            label={t("common.email")}
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label={t("common.password")}
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <Button type="submit" className="mt-5 w-full" disabled={loading}>
          {loading ? t("login.signingIn") : t("login.signIn")}
        </Button>
      </form>
    </div>
  );
}
