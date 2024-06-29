// common functions for slack
const SLACK_API_PATH_ = "https://slack.com/api/";
const BOT_NAME_DEFAULT_ = "Schedule Notifier";
const BOT_ICON_DEFAULT_ = ":alarm_clock:";


// Send slack api with apiName (in path) and args (request body).
// Throws an exception on error
function slackApi_(method, apiName, args, description,
  { appToken, botName, botIcon }) {
  //debugFcall_(arguments);

  const option = {
    "method" : method,
    "payload" : {
      "token": appToken,
      "username": botName || BOT_ICON_DEFAULT_,
      "icon_emoji": botIcon || BOT_ICON_DEFAULT_,
      ...args
    }
  };

  for (i = 0; true; i++) {
    try {
      const res = UrlFetchApp.fetch(SLACK_API_PATH_ + apiName, option);
      const resBody = JSON.parse(res.getContentText());
    
      const resCode = res.getResponseCode();
      const resCodeType = Math.floor(resCode / 100);

      //log_("slackApi: ", resBody);
      
      if (resCodeType >= 4 || resBody?.ok !== true) {
        throw Error(
          ` - Description: ${description}\n`
          + ` - HTTP Code: ${resCode}\n`
          + (resBody?.ok ? ` - ResBody > ok: ${resBody?.ok}\n` : "")
          + (resBody?.error ? ` - ResBody > error: ${resBody?.error}\n` : ""));
      }
      
      return resBody;
    } catch (e) {
      
      try {
        const ui = getUi_();
        const userPrompt = ui.alert(`[${BOT_NAME_}] Slack API call failure`,
          `Failed to call the API '${apiName}'.\n`
            + "Try again?\n\n"
            + "[Detail]\n"
            + e,
          ui.ButtonSet.YES_NO);
        if (userPrompt === ui.Button.YES) continue;

      } catch (ee) {
        if (i < 5) {
          const sleepMs = 1000 + 3000 * i;
          log_(`Sleeping ${sleepMs / 1000}s due to an error: \n${e}`)
          Utilities.sleep(sleepMs);
          continue;
        }
      }

      throw Error(`Error response while calling Slack API '${apiName}': \n${e}`);
    }
  }
}
