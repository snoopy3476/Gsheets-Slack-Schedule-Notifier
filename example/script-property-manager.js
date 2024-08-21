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

function setScriptProperty_(key, value) {
  return PropertiesService.getScriptProperties().setProperty(key, value);
}