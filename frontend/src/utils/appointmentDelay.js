import dayjs from "dayjs";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

const getArabicUnitLabel = (unit, value) => {
  switch (unit) {
    case "week":
      if (value === 1) return "أسبوع";
      if (value === 2) return "أسبوعين";
      return "أسابيع";
    case "day":
      if (value === 1) return "يوم";
      if (value === 2) return "يومين";
      return "أيام";
    case "hour":
      if (value === 1) return "ساعة";
      if (value === 2) return "ساعتين";
      return "ساعات";
    case "minute":
      if (value === 1) return "دقيقة";
      if (value === 2) return "دقيقتين";
      return "دقائق";
    case "second":
      if (value === 1) return "ثانية";
      if (value === 2) return "ثانيتين";
      return "ثواني";
    default:
      return "";
  }
};

const getUnitLabel = (language, unit, value) => {
  if (language === "ar") {
    return getArabicUnitLabel(unit, value);
  }

  switch (unit) {
    case "week":
      return value === 1 ? "semaine" : "semaines";
    case "day":
      return value === 1 ? "jour" : "jours";
    case "hour":
      return value === 1 ? "heure" : "heures";
    case "minute":
      return value === 1 ? "minute" : "minutes";
    case "second":
      return value === 1 ? "seconde" : "secondes";
    default:
      return "";
  }
};

const joinParts = (parts, language) => {
  if (parts.length <= 1) return parts[0] || "";
  if (language === "ar") return parts.join(" و ");

  if (parts.length === 2) {
    return `${parts[0]} et ${parts[1]}`;
  }

  const head = parts.slice(0, -1).join(", ");
  const tail = parts[parts.length - 1];
  return `${head} et ${tail}`;
};

export const formatDelayDuration = (dateTime, language, options = {}) => {
  const includePrefix = options.includePrefix !== false;
  const now = options.now ? dayjs(options.now) : dayjs();
  const scheduledAt = dayjs(dateTime);
  const includeSeconds = options.includeSeconds === true;

  if (!scheduledAt.isValid()) {
    return language === "ar" ? "وقت غير صالح" : "Date invalide";
  }

  const totalSeconds = now.diff(scheduledAt, "second");
  if (totalSeconds <= 0) {
    return language === "ar" ? "في الوقت" : "A l'heure";
  }

  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  let remaining = totalMinutes;
  const weeks = Math.floor(remaining / MINUTES_PER_WEEK);
  remaining %= MINUTES_PER_WEEK;
  const days = Math.floor(remaining / MINUTES_PER_DAY);
  remaining %= MINUTES_PER_DAY;
  const hours = Math.floor(remaining / MINUTES_PER_HOUR);
  const minutes = remaining % MINUTES_PER_HOUR;

  const parts = [];
  if (weeks > 0) parts.push(`${weeks} ${getUnitLabel(language, "week", weeks)}`);
  if (days > 0) parts.push(`${days} ${getUnitLabel(language, "day", days)}`);
  if (hours > 0) parts.push(`${hours} ${getUnitLabel(language, "hour", hours)}`);
  if (minutes > 0 || parts.length === 0 || includeSeconds) {
    parts.push(`${minutes} ${getUnitLabel(language, "minute", minutes)}`);
  }
  if (includeSeconds && totalMinutes < 60) {
    const seconds = totalSeconds % SECONDS_PER_MINUTE;
    if (seconds > 0) {
      parts.push(`${seconds} ${getUnitLabel(language, "second", seconds)}`);
    }
  }

  const durationText = joinParts(parts, language);

  if (!includePrefix) {
    return durationText;
  }

  return language === "ar" ? `متأخر منذ ${durationText}` : `En retard depuis ${durationText}`;
};
