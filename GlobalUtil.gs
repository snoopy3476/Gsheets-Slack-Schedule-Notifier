const TIMEZONE_STR_ = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

const TIMEZONE_TS_DIFF_ =
  new Date(new Date(86400000).toLocaleString([], { timeZone: TIMEZONE_STR_ }))
  - new Date(new Date(86400000).toLocaleString([], {timeZone: "UTC" }));

const CUR_DATETIME_ = new Date();
const CUR_DATETIME_TS_ = CUR_DATETIME_.getTime();
const CUR_DAY_OF_WEEK_ = CUR_DATETIME_.getDay();


function parseNextDatetime(date, time) {

  const timeObj = new Date(time instanceof Date ? time : CUR_DATETIME_TS_);
  const [timeHours, timeMinutes, timeSeconds] = timeObj.toLocaleTimeString([], {
      timeZone: TIMEZONE_STR_, hour12: false
    }).split(":");

  if (date instanceof Date) return { ts: combineDatetime(), repeat: false };
  else return getNextDatetimeFromStr();


  function combineDatetime() {
    const datetimeObj = new Date(date);

    return new Date(datetimeObj.setHours(timeHours, timeMinutes, timeSeconds, 0) - TIMEZONE_TS_DIFF_);
  }


  function getNextDatetimeFromStr() {
    const daysOfWeekIdx = Object.fromEntries(Object.entries(getLocalizedDaysOfWeek_()).map(([k, v]) => [v, Number(k)]));
    const tokens = date.split(",").join(" ").split(" ").filter(t => t !== "");
    const repeat = (tokens.length > 0 && tokens[tokens.length - 1] === "*")
      ? tokens.pop() === "*" : false;

    const daysToNotifyFromToday =
      tokens.length > 0
      ? tokens.reduce((a, str) => {
        const idx = daysOfWeekIdx[[str]];
        if (idx === undefined) throw Error("Invalid day of week: " + str);
        a[(idx + 7 - CUR_DAY_OF_WEEK_) % 7] = true;
        return a;
      }, Array(7).fill(false))
      : Array(7).fill(true);

    const daysFromToday = daysToNotifyFromToday.indexOf(true);
    const targetDatetimeTs =
      new Date(CUR_DATETIME_TS_).setHours(timeHours, timeMinutes, timeSeconds, 0)
      + (86400000 * daysFromToday)
      - TIMEZONE_TS_DIFF_;

    if (targetDatetimeTs >= CUR_DATETIME_TS_) {
      return { ts: new Date(targetDatetimeTs), repeat: repeat };
    } else {
      return { ts: new Date(targetDatetimeTs + (86400000 * 7)), repeat: repeat };
    }
  }
}




function getLocalizedDaysOfWeek_() {

  const sheetLocale = new Intl.Locale(
      spreadsheet_.getSpreadsheetLocale().replace('_', '-')
    );
  
  const d = new Date();
  d.setHours(-24 * d.getDay(), 0, 0, 0);

  const daysOfWeek = Array
    .from({length: 7})
    .reduce((a, _) => {
      a.push(d.toLocaleString(sheetLocale, { weekday: "short" }));
      d.setHours(24, 0, 0, 0);
      return a;
    }, []);
  
  return daysOfWeek;
}


const LOCAL_DAYS_OF_WEEK_KEY_ = "LOCAL_DAYS_OF_WEEK"
function refreshLocalizedDaysOfWeek_(curSheet) {
  const daysOfWeek = getLocalizedDaysOfWeek_();
  setMetadata_(curSheet, LOCAL_DAYS_OF_WEEK_KEY_, daysOfWeek);

  return daysOfWeek;
}
