/**
 * Initialize a Slack schedule sheet, if it does not exist.
 * 
 * @param {Object} slackApiConfig - Configs for Slack API
 * @param {string} slackApiConfig.appToken - Slack Custom App Token
 * @param {string} [slackApiConfig.botName] - Sender name to display on Slack message (e.g. "Notifier")
 * @param {string} [slackApiConfig.botIcon] - Sender icon string to display on Slack message (e.g. ":alarm_clock:")
 * @param {string} [schedSheetName] - Sheet name to initialize
 * @returns {Integer} - ID of the target sheet
 */
function initSchedSheet(slackApiConfig, schedSheetName) {
  return getOrInitSchedSheet_(slackApiConfig, schedSheetName)?.getSheetId();
}

/**
 * Scan a schedule sheet, and send notification messages for each schedule which is in target time range.
 * 
 * @param {Object} notifyBetween - Notify if datetime of each schedule is in this range.
 * @param {Date} notifyBetween.from - Starting point of the datetime range.
 * @param {Date} notifyBetween.to - Ending point of the datetime range.
 * @param {Object} slackApiConfig - Configs for Slack API
 * @param {string} slackApiConfig.appToken - Slack Custom App Token
 * @param {string} [slackApiConfig.botName] - Sender name to display on Slack message (e.g. "Notifier")
 * @param {string} [slackApiConfig.botIcon] - Sender icon string to display on Slack message (e.g. ":alarm_clock:")
 * @param {string} [schedSheetName] - Sheet name to initialize
 */
function notifySlack(notifyBetween, slackApiConfig, schedSheetName) {
  const sheet = getOrInitSchedSheet_(slackApiConfig, schedSheetName);
  const schedule = getSchedulesBetween_(sheet, notifyBetween);
  debugVar_("schedule", schedule);
}

function initSlackMenus() {
  const sheet = getOrInitSchedSheet_(slackApiConfig, schedSheetName);
  initSlackMenus_(sheet);
}
