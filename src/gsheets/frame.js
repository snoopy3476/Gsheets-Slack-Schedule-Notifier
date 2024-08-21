// column data
const COLUMNS_DATA_ = [
  { name: "noti", width: 30, bgColor: "firebrick" },
  { name: "name", width: 200, bgColor: "dodgerblue" },
  { name: "rep", width: 30 },
  { name: "date", width: 100, format: "yyyy-MM-dd" },
  { name: "time", width: 45, format: "hh:mm" },
  { name: "place" },
  { name: "user" },
  { name: "link" }
];
const COLUMN_WIDTH_DEFAULT_ = 100;



function getOrInitSchedSheet_(name = "Slack Schedule") {
  return getSheet_(name) || initSheet_(name);
}



function initSheet_(name) {
  const curSheet = getSpreadSheet_().insertSheet(name, 0);

  const INITIAL_ROW = 25;
  const INITIAL_COLUMN = 1; //COLUMNS_DATA_.length;


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

  curSheet.setTabColor("SpringGreen")

  return curSheet;
}



const CHAR_CHECKED_ = "☑", CHAR_UNCHECKED_ = "☐", CHAR_UNCHECKED_EMPTY_ = " ";
function reconstructSheetFrame_(curSheet, slackApiConfig) {
  
  initBaseSkeleton();

  const colDataRanges = getColumnDataRange_(curSheet);

  setConditionalFormatRules();
  setValidationsAndNotes();



  function initBaseSkeleton() {
    const FUNC_TIME_MSG =
      "reconstructSheetFrame_() - Initialize base skeleton";
    console.time(FUNC_TIME_MSG);


    const colRanges = getFieldColumnMd_(curSheet);

    const { good, existingCols } = COLUMNS_DATA_
      .map(v => ({
        name: v.name,
        col: (colRanges[[v.name]]?.getRow() === 1)
          ? colRanges[[v.name]].getColumn() : null 
      }) )
      .reduce((a, { name, col }) => 
        (a.existingCols !== ({}) && col !== null
          && !Object.values(a.existingCols).includes(col))
          ? { good: a.good, existingCols: {...a.existingCols, [name]: col} }
          : { good: false, existingCols: a.existingCols },
        { good: true, existingCols: {} });

    if (good) return;


    const SHEET_MAX_ROWS_BEFORE = curSheet.getMaxRows();
    const SHEET_MAX_COLUMNS_BEFORE = curSheet.getMaxColumns();
    const headerRowRangeBefore = curSheet.getRange(1, 1, 1, SHEET_MAX_COLUMNS_BEFORE);

    // init common style
    const headerFgStyle = SpreadsheetApp
      .newTextStyle()
      .setBold(true)
      .setForegroundColor("white")
      .build();
    const headerBgColor = "royalblue";

    headerRowRangeBefore
      .setTextStyle(headerFgStyle);
    headerRowRangeBefore.protect().setDescription("Protect header row");

    // init per-column style
    COLUMNS_DATA_.filter(({ name }) => !existingCols?.[[name]])
      .forEach(({ name, width, bgColor, format }) => {
        const columnIdx = curSheet.getMaxColumns() + 1;
        curSheet.insertColumnAfter(columnIdx - 1);
        const curHeaderRange = curSheet.getRange(1, columnIdx);
        const curDataRange =
          curSheet.getRange(2, columnIdx, SHEET_MAX_ROWS_BEFORE - 1);
        
        setFieldColumnMd_(curSheet, name, columnIdx);
        curHeaderRange
          .setValue(capitalize_(name))
          .setBackground(bgColor || headerBgColor);
        curSheet.setColumnWidth(columnIdx, width || COLUMN_WIDTH_DEFAULT_);

        format && curDataRange.setNumberFormat(format);
    })

    // rearrange major columns
    const newHeaderRanges = getFieldColumnMd_(curSheet);
    Object.entries(newHeaderRanges)
      .map(([name, range]) => [name, range, range.getColumn()])
      .sort(([_x, _y, aCol], [_z, _w, bCol]) => aCol < bCol)
      .forEach(([name, range, col], i) =>
        col != i+1 && curSheet.moveColumns(range, i+1));



    // remove blank columns
    const headerRowRange =
      curSheet.getRange(1, 1, 1, curSheet.getMaxColumns());
    headerRowRange.getValues()[0]
      .map((v, i) => ({value: v, i: i+1}))
      .filter(({value}) => value === "")
      .sort(({i: aIdx}, {i: bIdx}) => aIdx > bIdx)
      .forEach(({i: idx}, i) => {
          curSheet.getRange(1, idx)
            .setValue("(Custom Field)")
            .setBackground(headerBgColor);
        });
    

    // set ranges
    const allRange = curSheet.getRange(1, 1, curSheet.getMaxRows(), curSheet.getMaxColumns());


    // init sheet style
    curSheet.setFrozenRows(1);
    curSheet.setFrozenColumns(1);
    allRange.setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);


    console.timeEnd(FUNC_TIME_MSG);
  }



  function setConditionalFormatRules() {
    const FUNC_TIME_MSG =
      "reconstructSheetFrame_() - Set conditional format rules";
    console.time(FUNC_TIME_MSG);


    // conditional format
    const VAL_OF_CURCELL = "INDIRECT(ADDRESS(ROW();COLUMN()))"
    const notiCellStr = "$" + colDataRanges["noti"].getCell(1, 1)
      .getA1Notation().replace(":", ":$");
    const nameCellStr = "$" + colDataRanges["name"].getCell(1, 1)
      .getA1Notation().replace(":", ":$");
    const fullDataRange = curSheet.getRange(2, 1, curSheet.getMaxRows() - 1, curSheet.getMaxColumns());
    const condFormatRules = [
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied("=ISBLANK(" + nameCellStr + ")")
        .setRanges([fullDataRange]).setBackground("dimgray").setFontColor("darkgray").build(),
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(
          "=" + notiCellStr + "=\"" + CHAR_CHECKED_ + "\"")
        .setRanges([fullDataRange]).setBackground("lightgreen").setBold(true).build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(
          "=OR(NOT(" + VAL_OF_CURCELL + "<>\"\");"
          + VAL_OF_CURCELL + "=\"☐\")")
        .setRanges([fullDataRange]).setBackground("lightpink").setFontColor("red").build(),
    ];
    if (! equalCondFormatRules(
      curSheet.getConditionalFormatRules(),
      condFormatRules)) {
      log_("Refreshing conditional format rules...");
      curSheet.setConditionalFormatRules(condFormatRules);
    }


    console.timeEnd(FUNC_TIME_MSG);



    function equalCondFormatRules(a, b) {
      return equalArr(a, b, (a, b) =>
        equalBoolCond(a.getBooleanCondition(), b.getBooleanCondition())
          && a.getGradientCondition() === null
          && b.getGradientCondition() === null
          && equalArr(a.getRanges(), b.getRanges(),
            (a, b) => a.getA1Notation() === b.getA1Notation()));


      function equalBoolCond(a, b) {
        return equalColor(a.getBackgroundObject(), b.getBackgroundObject())
          && a.getBold() === b.getBold()
          && a.getCriteriaType() === b.getCriteriaType()
          && equalArr(a.getCriteriaValues(), b.getCriteriaValues(),
            (a, b) => a === b)
          && equalColor(a.getFontColorObject(), b.getFontColorObject())
          && a.getItalic() === b.getItalic()
          && a.getStrikethrough() === b.getStrikethrough()
          && a.getUnderline() === b.getUnderline();


        function equalColor(a, b) {
          try {
            return a?.asRgbColor()?.asHexString() === b?.asRgbColor()?.asHexString();
          } catch (e) {
            return false;
          }
        }
      }
    }
  }

  function setValidationsAndNotes() {
    const FUNC_TIME_MSG =
      "reconstructSheetFrame_() - Set data validations and notes";
    console.time(FUNC_TIME_MSG);



    const colHeaderRanges = getColumnHeaderRange_(curSheet);
    const VAL_OF_CURCELL = "INDIRECT(ADDRESS(ROW();COLUMN()))"

    const dayOfWeekRegex = "("
      + refreshLocalizedDayNs_(curSheet).join("|") + ")";
    const userRegex = "("
      + Object.keys(slackApiConfig
          ? refreshSlackUsers_(curSheet, slackApiConfig)
          : getSlackUsers_(curSheet)
        ).join("|") + ")";
    
    const dataValidations = {
      noti: SpreadsheetApp.newDataValidation()
        .requireCheckbox(CHAR_CHECKED_, CHAR_UNCHECKED_)
        .setAllowInvalid(false).build(),
      name: newDataValidationFormula(
        "=ISTEXT(" + VAL_OF_CURCELL + ")"),
      rep: SpreadsheetApp.newDataValidation()
        .requireCheckbox(CHAR_CHECKED_, CHAR_UNCHECKED_EMPTY_)
        .setAllowInvalid(false).build(),
      date: newDataValidationFormula(
        "=OR(" + VAL_OF_CURCELL + " = \"*\"; REGEXMATCH(TO_TEXT(" + VAL_OF_CURCELL + "); \"^ *((" + dayOfWeekRegex + "[, ] *)*" + dayOfWeekRegex
        + " *)?( \\*)? *$\"); NOT(ISERROR(DATEVALUE(" + VAL_OF_CURCELL + "))))"),
      time: newDataValidationFormula(
        "=NOT(ISERROR(TIMEVALUE(" + VAL_OF_CURCELL + ")))"),
      place: newDataValidationFormula(
        "=ISTEXT(" + VAL_OF_CURCELL + ")"),
      user: newDataValidationFormula(
        "=OR(" + VAL_OF_CURCELL + " = \"*\"; REGEXMATCH(TO_TEXT(" + VAL_OF_CURCELL + "); \"^ *(" + userRegex + "[, ] *)*" + userRegex
        + " *$\"))"),
      link: SpreadsheetApp.newDataValidation()
        .requireTextIsUrl().setAllowInvalid(false).build()
    }

    Object.entries(colDataRanges).forEach(([name, dataRange]) => {
      const dataValidation = dataValidations[[name]];
      if (dataValidation
        && !equalDataValidations(
          dataValidation, dataRange.getDataValidations().flat())) {
        log_("Refreshing data validations for '" + name + "'...");
        dataRange.setDataValidation(dataValidation);
      }
    })


    const notes = {
      date:
        "Valid Input List ('*': Weekday)\n - <Empty: everyday>\n - <Date>\n - "
        + dayOfWeekRegex + ", ...\n - *",
      time: "Valid Input List\n - <Empty: full day>\n - <Time>",
      user: "Valid Input List ('*': All Slack users)\n - <Empty>\n - "
        + userRegex + ", ...\n - *",
      link: "Valid Input List\n - <Empty>\n - <URL>",

    }

    Object.entries(colHeaderRanges).forEach(([name, headerRange]) => {
      const note = notes[[name]];
      if (note && note !== headerRange.getNote()) {
        log_("Refreshing note for '" + name + "'...");
        headerRange.setNote(note);
      }
    })

    
    console.timeEnd(FUNC_TIME_MSG);



    function newDataValidationFormula(formula) {
      return SpreadsheetApp
        .newDataValidation()
        .requireFormulaSatisfied(formula)
        .setAllowInvalid(false)
        .build();
    }

    function equalDataValidations(a, b) {
      return equalSingleWithArr(a, b, (a, b) => a && b
        && a.getAllowInvalid() === b.getAllowInvalid()
        && a.getCriteriaType() === b.getCriteriaType()
        && equalArr(
          a.getCriteriaValues().map(v => v.replaceAll(",", ";")),
          b.getCriteriaValues().map(v => v.replaceAll(",", ";")),
          (a, b) => a === b)
        && (a.getHelpText() || "") === (b.getHelpText() || "")
      );

      function equalSingleWithArr(a, b, compareCall) {
        return Array.from({length: b.length}).reduce((acc, _, i) =>
            acc && compareCall(a, b[i]), true);
      }
    }
  }


  function equalArr(a, b, compareCall) {
    return a?.length === b?.length
      && Array.from({length: a.length}).reduce((acc, _, i) =>
        acc && compareCall(a[i], b[i]), true);
  }

}



function getColumnHeaderRange_(curSheet, headerName) {
  const headerFullRanges = getFieldColumnMd_(curSheet);
  
  return headerName
    ? headerFullRanges[[headerName]]?.getCell(1,1)
    : Object.fromEntries(Object.entries(headerFullRanges)
      .map(([k, v]) => [k, v.getCell(1,1)]));
}

function getColumnDataRange_(curSheet, headerName) {
  const headerFullRanges = getFieldColumnMd_(curSheet);
  const dataOnlyRowCount = curSheet.getMaxRows() - 1;

  return headerName
    ? headerFullRanges[[headerName]]?.offset(1, 0, dataOnlyRowCount)
    : Object.fromEntries(Object.entries(headerFullRanges)
      .map(([n, r]) => [n, r.offset(1, 0, dataOnlyRowCount)]));
}