
function getSpreadSheet_() {
  return SpreadsheetApp?.getActiveSpreadsheet();
}

function getSheet_(name) {
  if (name === undefined || name === null) {
    return getSpreadSheet_().getSheets()[0];
  } else {
    return getSpreadSheet_().getSheetByName(name);
  }
}


function lockSheet_(curSheet) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(60000);

  const protectForce = curSheet.protect()
    .setDescription("Temporary protection during sheet refresh");
  /*const protectWarn = curSheet.getDataRange().protect()
    .setDescription("Temporary protection during sheet refresh")
    .setWarningOnly(true);*/
  
  const forceEditors = protectForce.getEditors().map(u => u.getEmail());
  protectForce.removeEditors(forceEditors);
  
  return {
    origColor: "SpringGreen", //curSheet.getTabColor(),
    srcSheet: curSheet.setTabColor("red"),
    protections: [protectForce], // [ protectForce, protectWarn ],
    lock: lock
  };
} 

function unlockSheet_(lockHandle) {
  lockHandle.protections.forEach(p => p.remove());
  lockHandle.srcSheet.setTabColor(lockHandle.origColor);
  lockHandle.lock.releaseLock();
}

function runWithSheetLock_(curSheet, func) {
  const lockHandle = lockSheet_(curSheet);
  try {
    func();
  } finally {
    unlockSheet_(lockHandle);
  }
}



function log_(value) {
  console.log("Slack Schedule Notifier: ", value);
}


const MD_KEY_PREFIX_ = "SlackSchedule_";


function getMetadata_(curSheet, key) {
  const rawKey = MD_KEY_PREFIX_ + curSheet?.getSheetId() + "_" + key;

  const valueStr = curSheet
      .getDeveloperMetadata()
      .find(md => md.getKey() === rawKey)
      ?.getValue();

  return valueStr != undefined ? JSON.parse(valueStr) : undefined;
}


function setMetadata_(curSheet, key, value) {
  const rawKey = MD_KEY_PREFIX_ + curSheet?.getSheetId() + "_" + key;
  
  const valueStr = JSON.stringify(value);
  
  const existingMd = curSheet
    .getDeveloperMetadata()
    .find(md => md.getKey() === rawKey);
  
  try {
    if (existingMd !== undefined) {
      existingMd.setValue(valueStr);
    } else {
      curSheet.addDeveloperMetadata(
        rawKey, valueStr,
        SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
    }
  } catch (e) {
    log_("Failed to set metadata '" + key + "': " + JSON.stringify(value) + "\n\n" + e);
    return false;
  }

  return true;
}


function deleteMetadata_(curSheet, key) {
  const rawKey = MD_KEY_PREFIX_ + curSheet?.getSheetId() + "_" + key;

  return curSheet
    .getDeveloperMetadata()
    .filter(md => md.getKey() === rawKey)
    .reduce((a, md) => {
        md.remove();
        return a+1;
      }, 0) === 0;
}





const RMD_KEY_COL_NAME_ = "SCHED_COLUMN_KEY";

function getFieldColumnMd_(curSheet, name) {
  const columnFinder =
    curSheet.getRange("1:1").createDeveloperMetadataFinder()
    .onIntersectingLocations().withKey(RMD_KEY_COL_NAME_);
  
  return (name
      ? columnFinder.withValue(name).find().pop()
        ?.getLocation().getColumn()
      : Object.fromEntries(columnFinder.find().map(m => [
            m.getValue(),
            m.getLocation().getColumn()
          ]))
    ) || null;
}

function setFieldColumnMd_(curSheet, name, idx) {
  const colA1 = idxToColumn(idx);
  const colRange = curSheet.getRange(colA1 + ":" + colA1);
  const existingCols =
    curSheet.getRange("1:1").createDeveloperMetadataFinder()
    .onIntersectingLocations().withKey(RMD_KEY_COL_NAME_).withValue(name).find();

  if (existingCols.length > 0) {
    existingCols.slice(1).forEach(m => m.remove());
    existingCols[0].moveToColumn(colRange);
  } else {
    colRange.addDeveloperMetadata(RMD_KEY_COL_NAME_, name, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
  }



  function idxToColumn(colIdx) {
    const SHEET_COL_ALPHABETS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", ""];
    const idx = colIdx - 1;
    if (idx >= 18278) throw Error("Index out of bound");

    return SHEET_COL_ALPHABETS[idx >= 702 ? ((Math.floor((idx - 26) / 676) + 25) % 26) : 26]
      + SHEET_COL_ALPHABETS[idx >= 26 ? ((Math.floor(idx / 26) + 25) % 26) : 26]
      + SHEET_COL_ALPHABETS[idx % 26];
  }
}

function deleteFieldColumnMd_(curSheet, name) {
  const columnFinder =
    curSheet.getRange("1:1").createDeveloperMetadataFinder()
    .onIntersectingLocations().withKey(RMD_KEY_COL_NAME_);
  
  return columnFinder.withValue(name).find().reduce((a, m) => {
      m.remove();
      return a+1;
    }, 0);
}

