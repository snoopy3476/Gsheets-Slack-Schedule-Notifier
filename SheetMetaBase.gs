const MD_KEY_PREFIX_ = "SlackSchedule_";


function getMetadata_(curSheet, key) {
  const rawKey = MD_KEY_PREFIX_ + curSheet?.getSheetId() + "_" + key;

  const valueStr = spreadsheet_
      .getDeveloperMetadata()
      .find(md => md.getKey() === rawKey)
      ?.getValue();

  return valueStr != undefined ? JSON.parse(valueStr) : undefined;
}


function setMetadata_(curSheet, key, value) {
  const rawKey = MD_KEY_PREFIX_ + curSheet?.getSheetId() + "_" + key;
  
  const valueStr = JSON.stringify(value);
  
  const existingMd = spreadsheet_
    .getDeveloperMetadata()
    .find(md => md.getKey() === rawKey);
  
  try {
    if (existingMd !== undefined) {
      existingMd.setValue(valueStr);
    } else {
      spreadsheet_.addDeveloperMetadata(
        rawKey, valueStr,
        SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
    }
  } catch (e) {
    return false;
  }

  return true;
}


function deleteMetadata_(curSheet, key) {
  const rawKey = MD_KEY_PREFIX_ + curSheet?.getSheetId() + "_" + key;

  return spreadsheet_
    .getDeveloperMetadata()
    .filter(md => md.getKey() === rawKey)
    .reduce((a, md) => {
        md.remove();
        return a+1;
      }, 0) === 0;
}
