function getScriptProperty_(key, defaultValue = undefined) {
  return PropertiesService.getScriptProperties().getProperty(key) || defaultValue;
}

function getScriptPropertyOrThrow_(key) {
  const value = getScriptProperty_(key, undefined);
  if (value === undefined) {
    throw Error("Missing required script property: '" + key + "'");
  }
  return value;
}


function getSpreadSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
const spreadsheet_ = getSpreadSheet_();

function getSheet_(name) {
  if (name === undefined || name === null) {
    return spreadsheet_.getSheets()[0];
  } else {
    const returnSheet = spreadsheet_.getSheetByName(name);
    if (!returnSheet) throw Error("Missing sheet with name '" + name + "'");
    return returnSheet;
  }
}



function getSpreadSheetUrl_() {
  return spreadsheet_.getUrl();
}



function getUi_() {
  return SpreadsheetApp.getUi();
}




function log_(value) {
  console.log(value);
}

const GLOBAL_DEBUG_MODE_ = true;
function debug_(value) {
  if (typeof GLOBAL_DEBUG_MODE_ !== "undefined"
    && GLOBAL_DEBUG_MODE_ === true)
    log_(value);
}
function debugVar_(name, value) {
  if (typeof GLOBAL_DEBUG_MODE_ !== "undefined"
    && GLOBAL_DEBUG_MODE_ === true)
    debug_("<" + name + "> " + JSON.stringify(value, null, "\t"));
}

function debugFcall_(parentArgs) {
  debug_("Called " + parentArgs?.callee?.name + "()\n"
    + [...Array(parentArgs?.length || 0)?.keys()]
      .reduce((a, i) => a + "\t[" + i + "] " + JSON.stringify(parentArgs[i], null)+ "\n", ""));
}
