function getSchedulesBetween_(curSheet, {
      from: notifyFrom = new Date(CUR_TS_),
      to: notifyTo,
      preserveNoti
    }) {
  const notifyFromTs = notifyFrom.getTime();
  log_("getSchedulesBetween_(): Between ts '" + notifyFromTs + "'-'" + notifyTo.getTime() + "'");

  const MAX_COLUMNS = curSheet.getMaxColumns();
  const MAX_DATA_ROWS = curSheet.getMaxRows() - 1;
  const LOCAL_DAYS_OF_WEEK_STR = getLocalizedDayNs_(
    curSheet.getParent().getSpreadsheetLocale().replaceAll("_", "-"));

  // init headers & indice info
  const colFullRanges = getFieldColumnMd_(curSheet);
  const colFullRangesIndice = Object.entries(colFullRanges)
    .map(([n, r]) => [n, r.getColumn() - 1]);
  const headerRangesIdx = colFullRangesIndice.map(([_, i]) => i);
  const headerNames = getColNames(curSheet);
  
  // get usable data range
  const dataRange = curSheet.getRange(2, 1, MAX_DATA_ROWS, MAX_COLUMNS);
  const dataTmpValues = dataRange.getNotes();
  const dataValues = dataRange.getValues();

  const [notiIdx, nameIdx, repIdx, dateIdx, timeIdx]
    = [
      colFullRanges["noti"].getColumn() - 1,
      colFullRanges["name"].getColumn() - 1,
      colFullRanges["rep"].getColumn() - 1,
      colFullRanges["date"].getColumn() - 1,
      colFullRanges["time"].getColumn() - 1,
    ];

  // filter enabled data
  const enabledRowValues = dataValues.reduce((a, sched, i) => {
      if (sched?.[notiIdx] === CHAR_CHECKED_ && sched?.[nameIdx] !== "") {
        a[i] = sched;
      }
      return a;
    }, Array(dataValues.length));
  
  // convert to temp data
  const enabledColsConvIndice = [dateIdx, timeIdx];

  const enabledConvertedRowValues = enabledRowValues.map((sched, i) => {
      const curTmpValues = dataTmpValues[i];

      // do nothing if no tmp value
      if (curTmpValues.findIndex(v => v) === -1) return sched;

      // replace original with tmp value if exists
      var retSched = sched.map((v, i) => curTmpValues[i] || v);

      // validate tmp values that needs sheet data validations
      enabledColsConvIndice.filter(j => curTmpValues[j]).forEach(j => {
          const cellRange = dataRange.getCell(i+1, j+1);
          try {
            cellRange.setValue(curTmpValues[j]);
            retSched[j] = cellRange.getValue();
          } catch (e) {
            log_("Invalid tmp value: " + curTmpValues[j]);
            retSched[j] = "";
          }
        });
      
      return retSched;
    });
  
  // map to return data
  var targetSchedules = null;
  try {

    targetSchedules = enabledConvertedRowValues
      .map((sched, i) => ({
          ts: parseNextDatetime_(sched[dateIdx], sched[timeIdx],
            notifyFromTs, LOCAL_DAYS_OF_WEEK_STR),
          idx: i,
          range: curSheet.getRange(i+2, 1, 1, MAX_COLUMNS),
          value: Object.fromEntries(
            colFullRangesIndice.map(([name, i]) => [name, sched[i]])),
          extra: Object.fromEntries(
              sched.map((v, j) => [headerNames[j], v])
                .filter(([_, v], j) =>
                  headerRangesIdx.indexOf(j) < 0 && v !== "")
            )
        }))
      .filter(({ts}) => ts >= notifyFrom && ts < notifyTo)
      .sort(({ts: tsA}, {ts: tsB}) => tsA - tsB);

  } finally {

    // revert tmp data that were overridden to original
    colFullRanges["date"].offset(1,0,MAX_DATA_ROWS)
      .setValues(dataValues.map(row => [row[dateIdx]]));
    colFullRanges["time"].offset(1,0,MAX_DATA_ROWS)
      .setValues(dataValues.map(row => [row[timeIdx]]));

    if (targetSchedules && !preserveNoti) {
      const targetRowIndice = targetSchedules.reduce((a, sched, idx) => {
          a[sched.idx] = idx;
          return a;
        }, Array(enabledConvertedRowValues.length));
      
      // unset noti if target
      colFullRanges["noti"].offset(1,0,MAX_DATA_ROWS)
        .setValues(dataValues.map((row, i) => [
            targetRowIndice[i] !== undefined
              && row[repIdx] !== CHAR_CHECKED_
              ? null : row[notiIdx]
          ]));
      
      // reset all notes if target
      const emptyRowNotes = Array(MAX_COLUMNS).fill(null);
      dataRange
        .setNotes(dataTmpValues.map((row, i) => 
            targetRowIndice[i] !== undefined
              && row[repIdx] !== CHAR_CHECKED_
              ? emptyRowNotes : row
          ));
      
      // set temporal disabled flag to the sched
      // if orig time is later than tmp time
      // (avoid notifying twice on a day)
      colFullRanges["noti"].offset(1,0,MAX_DATA_ROWS)
        .setNotes(dataValues.map((row, i) => [
            targetRowIndice[i] !== undefined ? (
                row[timeIdx] instanceof Date
                  && (parseNextDatetime_(null, row[timeIdx],
                    notifyFromTs, LOCAL_DAYS_OF_WEEK_STR) > notifyTo)
                  ? CHAR_UNCHECKED_ : null
              ) : dataTmpValues[i][notiIdx]
          ]));

      // remove all temporal disabled items from the returned notify list,
      // then remove the related notes (temporary marks)
      targetSchedules = targetSchedules.filter(sched =>
        sched.value["noti"] !== CHAR_UNCHECKED_);
    }

  }


  return targetSchedules;



  function getColNames(curSheet) {
    const range = curSheet.getRange(1, 1, 1, curSheet.getLastColumn());
    return range.getValues()[0];
  }
}