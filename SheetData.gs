function getSchedulesBetween_(curSheet, {notifyFrom, notifyTo}) {

  // init headers & indice info
  const headerRanges = getHeaderRanges_(curSheet);
  const hIdxs = COLUMNS_DATA_.reduce((a, {name}) => {
      const curRange = headerRanges[[name]];
      a[[name]] = curRange.getColumn() - 1;
      return a;
    }, {});
  
  // get usable data range
  const dataValues =
    curSheet
      .getRange(
        2, 1,
        curSheet.getLastRow() - 1,
        Math.max(...Object.values(hIdxs)) + 1
      )
      .getValues();

  // filter target data
  const targetRows =
      dataValues
      .map(r => 
        (r[hIdxs["noti"]] && r[hIdxs["name"]] !== "")
          ? {
            ...parseNextDatetime(r[hIdxs["date"]], r[hIdxs["time"]]),
            value: Object.fromEntries(
              Object.entries(hIdxs).map(([name, idx]) => [name, r[idx]]))
          }
          : null)
      .filter(v => v === VALIDATION_CHECKED_ && v.ts >= notifyFrom && v.ts < notifyTo)
      .sort(({ts: tsA}, {ts: tsB}) => tsA - tsB);

  return targetRows;
}


function getHeaderRanges_(curSheet) {
  const curNamedRanges = curSheet.getNamedRanges();
  return COLUMNS_DATA_.reduce((a, {name}) => {
    return {
      ...a,
      [name]: curNamedRanges
        .find(nr => nr.getName() === getHeaderRangeName_(curSheet, name))
        ?.getRange()
    }
  }, {});
}

function getHeaderRangeName_(curSheet, name) {
  const RANGE_NAME_PREFIX = "SlackSchedule_";
  return RANGE_NAME_PREFIX + curSheet.getSheetId() + "_" + name;
}

function getHeaderDataRange_(curSheet, headerName) {
  const curHeader = getHeaderRanges_(curSheet)[[headerName]];
  const headerIdx = {
      row: curHeader?.getLastRow(),
      column: curHeader?.getLastColumn()
    };
  const range = curSheet.getRange(
    headerIdx.row + 1, headerIdx.column,
    curSheet.getMaxRows() - headerIdx.row + 1); // (val + 1) for row expansion

  return range;
}
