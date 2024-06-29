// column data
const COLUMNS_DATA_ = [
  { name: "noti", width: 30, bgColor: "firebrick" },
  { name: "name", width: 200, bgColor: "dodgerblue" }, //"dodgerblue"
  { name: "date", width: 100, format: "yyyy-MM-dd" },
  { name: "time", width: 50, format: "hh:mm" },
  { name: "place" },
  { name: "user" },
  { name: "comment", width: 150 },
  { name: "link" }
];
const COLUMN_WIDTH_DEFAULT_ = 100;




/**
 * @param {{ appToken: string, botName: string, botIcon: string }} 
 * @param {string} name
 */
function getOrInitSchedSheet_(slackApiConfig, name = "Slack Schedule") {
  try {
    return getSheet_(name);
  } catch (e) {
    spreadsheet_.insertSheet(name, 0);
    const sheet = getSheet_(name);
    initSheet_(sheet, slackApiConfig);
    return sheet;
  }
}


/**
 * @param {Sheet} curSheet
 * @param {{ appToken: string, botName: string, botIcon: string }} slackApiConfig
 */
function initSheet_(curSheet, slackApiConfig) {
  if (!curSheet.getDataRange().isBlank()) return;
  curSheet.clear();

  const curSpreadsheet_ = curSheet.getParent();

  const INITIAL_ROW = 25;
  const INITIAL_COLUMN = COLUMNS_DATA_.length;


  // set max row, column
  const sheetSize = { row: curSheet.getMaxRows(), column: curSheet.getMaxColumns() };
  if (sheetSize.row > INITIAL_ROW) {
    curSheet.deleteRows(INITIAL_ROW + 1, sheetSize.row - INITIAL_ROW);
  } else if (sheetSize.row < INITIAL_ROW) {
    curSheet.insertRowsAfter(sheetSize.row, INITIAL_ROW - sheetSize.row);
  }
  if (sheetSize.column > INITIAL_COLUMN) {
    curSheet.deleteColumns(INITIAL_COLUMN + 1, sheetSize.column - INITIAL_COLUMN);
  } else if (sheetSize.column < INITIAL_COLUMN) {
    curSheet.insertColumnsAfter(sheetSize.column, INITIAL_COLUMN - sheetSize.column);
  }


  // set ranges
  const allRange = curSheet.getRange(1, 1, INITIAL_ROW, INITIAL_COLUMN);
  const headerRowRange = curSheet.getRange(1, 1, 1, INITIAL_COLUMN);
  const dataRowRange = curSheet.getRange(2, 1, INITIAL_ROW - 1, INITIAL_COLUMN);


  // init sheet style
  curSheet.setFrozenRows(1);
  curSheet.setFrozenColumns(1);
  curSheet.setColumnWidths(1, INITIAL_COLUMN - 1, COLUMN_WIDTH_DEFAULT_);
  allRange.setHorizontalAlignment("center");


  // init common style
  const headerFgStyle = SpreadsheetApp
    .newTextStyle()
    .setBold(true)
    .setForegroundColor("white")
    .build();
  const headerBgColor = "royalblue";

  headerRowRange
    .setTextStyle(headerFgStyle)
    .setBackgroundObject(SpreadsheetApp.newColor().setRgbColor(headerBgColor).build());
  headerRowRange.protect().setDescription("Protect header row");

  // init per-column style
  COLUMNS_DATA_.forEach(({ name, width, bgColor, format }, i) => {
    const columnIdx = i+1;
    const curHeaderRange = curSheet.getRange(1, columnIdx);
    const curDataRange = curSheet.getRange(2, columnIdx, INITIAL_ROW - 1);
    
    curSpreadsheet_.setNamedRange(getHeaderRangeName_(curSheet, name), curHeaderRange);
    curHeaderRange.setValue(capitalize_(name));
    bgColor && curHeaderRange.setBackgroundObject( SpreadsheetApp.newColor().setRgbColor(bgColor).build() );
    width && curSheet.setColumnWidth(columnIdx, width);

    format && curDataRange.setNumberFormat(format);
  })


  // init validations
  refreshValidationRules_(curSheet, slackApiConfig);



  function capitalize_(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }
}



const VALIDATION_CHECKED_ = "✓";
function refreshValidationRules_(curSheet, slackApiConfig) {
  
  // clear first
  curSheet.clearConditionalFormatRules();


  // common range
  const headerRanges = getHeaderRanges_(curSheet);
  const notiCell = getHeaderDataRange_(curSheet, "noti");
  const notiCellStr = "$" + notiCell.getA1Notation().replace(":", ":$")
  const nameCell = getHeaderDataRange_(curSheet, "name");
  const nameCellStr = "$" + nameCell.getA1Notation().replace(":", ":$")


  // conditional format
  const dataRange = curSheet.getRange(2, 1, curSheet.getMaxRows() - 1, curSheet.getMaxColumns());
  curSheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied("=ISBLANK(" + nameCellStr + ")")
      .setRanges([dataRange]).setBackground("dimgray").setFontColor("darkgray").build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(
        "=" + notiCellStr + "=\"" + VALIDATION_CHECKED_ + "\"")
      .setRanges([dataRange]).setBackground("lightgreen").setBold(true).build(),
    SpreadsheetApp.newConditionalFormatRule().whenCellEmpty()
      .setRanges([dataRange]).setBackground("lightpink").setFontColor("red").build(),
  ]);



  // noti
  //const notiCell = getHeaderDataRange_(curSheet, "noti");
  notiCell.setDataValidation(
      SpreadsheetApp
      .newDataValidation()
      .requireCheckbox(VALIDATION_CHECKED_, "")
      .setAllowInvalid(false)
      .build()
    );
    

  // date
  const dateCell = getHeaderDataRange_(curSheet, "date");
  const dateCellA1 = dateCell.getA1Notation();
  const daysOfWeek = refreshLocalizedDaysOfWeek_(curSheet);
  const dayOfWeekRegex = "(" + daysOfWeek.join("|") + ")";
  dateCell.setDataValidation(
      SpreadsheetApp
      .newDataValidation()
      .requireFormulaSatisfied(
        "=OR(" + dateCellA1 + " = \"*\"; REGEXMATCH(TO_TEXT(" + dateCellA1 + "); \"^ *(("
        + dayOfWeekRegex + "[, ] *)*" + dayOfWeekRegex
        + " *)?( \\*)? *$\"); NOT(ISERROR(DATEVALUE(" + dateCellA1 + "))))")
      .setAllowInvalid(false)
      .build()
    );
  headerRanges["date"]
    .setNote("Valid Input List ('*': Repeated noti.)\n - <Empty: everyday> [*]\n - <Date>\n - "
      + dayOfWeekRegex + ", ... [*]");

  // time
  const timeCell = getHeaderDataRange_(curSheet, "time");
  const timeCellA1 = timeCell.getA1Notation();
  timeCell.setDataValidation(
      SpreadsheetApp
      .newDataValidation()
      .requireFormulaSatisfied("=NOT(ISERROR(TIMEVALUE(" + timeCellA1 + ")))")
      .setAllowInvalid(false)
      .build()
    );
  headerRanges["time"].setNote("Valid Input List\n - <Empty: full day>\n - <Time>");

  // user
  const userCell = getHeaderDataRange_(curSheet, "user");
  const userCellA1 = userCell.getA1Notation();
  const userList = Object.entries(slackApiConfig
    ? refreshSlackUsers_(curSheet, slackApiConfig) : getSlackUsers_(curSheet));
  const userRegex = "(" + userList.map(([key]) => key).join("|") + ")";
  userCell.setDataValidation(
      SpreadsheetApp
      .newDataValidation()
      .requireFormulaSatisfied(
        "=OR(" + userCellA1 + " = \"*\"; REGEXMATCH(TO_TEXT(" + userCellA1 + "); \"^ *("
        + userRegex + "[, ] *)*" + userRegex
        + " *$\"))")
      .setAllowInvalid(false)
      .build()
    );
  headerRanges["user"]
    .setNote("Valid Input List ('*': All Slack users)\n - <Empty> [*]\n - "
      + userRegex + ", ...");

  // link
  const linkCell = getHeaderDataRange_(curSheet, "link");
  linkCell.setDataValidation(
      SpreadsheetApp
      .newDataValidation()
      .requireTextIsUrl()
      .setAllowInvalid(false)
      .build()
    );
  headerRanges["link"].setNote("Valid Input List\n - <Empty>\n - <URL>");
}
