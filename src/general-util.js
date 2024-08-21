const TZ_STR_ = getSpreadSheet_()?.getSpreadsheetTimeZone() || "UTC";

const DUMMY_TS_ = 86400000 * 14;
const TZ_LOCALE_STR_OPTS_ = { dateStyle: "short", timeStyle: "short" };
const TZ_LOCALE_STR_OPTS_LOCAL_ = { ...TZ_LOCALE_STR_OPTS_, timeZone: TZ_STR_ };
const TZ_TS_DIFF_ =
  new Date(new Date(DUMMY_TS_).toLocaleString([], { ...TZ_LOCALE_STR_OPTS_, timeZone: TZ_STR_ }))
  - new Date(new Date(DUMMY_TS_).toLocaleString([], TZ_LOCALE_STR_OPTS_));

const CUR_TS_ = Date.now();
const CUR_DAY_N_ = new Date(CUR_TS_+ TZ_TS_DIFF_).getDay();


function parseNextDatetime_(date, time,
  notifyFromTs = CUR_TS_, dayStrList = getLocalizedDayNs_()) {
  const timeObj = new Date(time instanceof Date ? time : CUR_TS_);

  if (isString_(date)) return getNextDatetimeFromStr(date, timeObj);
  else return combineDateAndTime(
    new Date((date instanceof Date) ? date.getTime() : CUR_TS_), timeObj);



  function combineDateAndTime(dateObj, timeObj) {
    const [timeH, timeM, timeS] = timeObj.toLocaleTimeString([], {
        timeZone: TZ_STR_, hour12: false
      }).split(":");

    const tzConvDatetimeObj = new Date(dateObj.getTime() + TZ_TS_DIFF_);

    return new Date(
      tzConvDatetimeObj.setHours(timeH, timeM, timeS, 0) - TZ_TS_DIFF_);
  }


  function getNextDatetimeFromStr(dateStr, timeObj) {
    const dayNsIdx = Object.fromEntries(
        Object.entries(dayStrList).map(([k, v]) => [v, Number(k)])
      );
    const tokens = (dateStr === "*")
      ? dayStrList.slice(1, 6) // weekday if *
      : dateStr.split(",").map(d => d.trim()).filter(t => t !== "");

    const daysToNotifyFromToday =
      tokens.length > 0
      ? tokens.reduce((a, str) => {
        const idx = dayNsIdx[[str]];
        if (idx === undefined) log_("Invalid day of week: '" + str + "'");
        else a[(idx + 7 - CUR_DAY_N_) % 7] = true;
        return a;
      }, Array(8).fill(false))
      : Array(8).fill(true);
    daysToNotifyFromToday[7] = daysToNotifyFromToday[0]; // for case if the first target is today, but the time is already passed

    const targetDaysFromToday = daysToNotifyFromToday.indexOf(true);
    const targetFirstDate = combineDateAndTime(
      new Date(CUR_TS_ + (86400000 * targetDaysFromToday)), timeObj);
    if (targetFirstDate.getTime() >= notifyFromTs) return targetFirstDate;

    const secondTargetDaysFromToday = daysToNotifyFromToday.indexOf(
      true, targetDaysFromToday + 1);
    const targetSecondDate = combineDateAndTime(
      new Date(CUR_TS_ + (86400000 * secondTargetDaysFromToday)), timeObj);
    return targetSecondDate;
  }
}




function getLocalizedDayNs_(localeStr = "en") {
  const localeObj = new Intl.Locale(localeStr);
  const d = new Date(CUR_TS_+ TZ_TS_DIFF_);
  d.setHours(-24 * CUR_DAY_N_, 0, 0, 0);

  const dayNs = Array
    .from({length: 7})
    .reduce((a, _) => {
      a.push(d.toLocaleString(localeObj, { weekday: "short" }));
      d.setHours(24, 0, 0, 0);
      return a;
    }, []);
  
  return dayNs;
}


const MD_KEY_LOCAL_DAYS_STR_ = "LOCAL_DAYS_OF_WEEK_STR"
function refreshLocalizedDayNs_(curSheet) {
  const locale = 
    curSheet.getParent().getSpreadsheetLocale().replaceAll('_', '-');
  const md = getMetadata_(curSheet, MD_KEY_LOCAL_DAYS_STR_);

  if (md?.locale === locale) return md.value;

  const dayNs = getLocalizedDayNs_(locale);
  log_("Refreshing localized days of week str... <" + locale + "> (" + JSON.stringify(dayNs) + ")");
  setMetadata_(curSheet, MD_KEY_LOCAL_DAYS_STR_, {
      locale: locale,
      value: dayNs
    });

  return dayNs;
}



function getNextRangeFromInterval_(intervalMin, intervalFutureCnt = 0, from = null) {
  const intervalTs = intervalMin * 60000;
  const intervalFutureTs = intervalTs * intervalFutureCnt;
  const startingTsOfCurrentHourTz =
    new Date(CUR_TS_ + intervalFutureTs + TZ_TS_DIFF_).setMinutes(0, 0, 0) - TZ_TS_DIFF_;
  const tsDiffFromHourStart = CUR_TS_ + intervalFutureTs - startingTsOfCurrentHourTz;

  const fromTs = startingTsOfCurrentHourTz
    + Math.ceil(tsDiffFromHourStart / intervalTs) * intervalTs;
  const toTs = fromTs + intervalTs;
  return { from: from || new Date(fromTs), to: new Date(toTs) };
}



function capitalize_(input) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}


function isString_(input) {
  return typeof input === "string" || input instanceof String;
}