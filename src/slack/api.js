// common functions for slack
const SLACK_API_PATH_ = "https://slack.com/api/";
const BOT_NAME_DEFAULT_ = "Schedule Notifier";
const BOT_ICON_DEFAULT_ = ":alarm_clock:";


// Send slack api with apiName (in path) and args (request body).
// Throws an exception on error
function slackApi_(method, apiName, args, description,
  { appToken, botName, botIcon }) {

  const option = {
    "method": method,
    "payload": {
      "token": appToken,
      "username": botName || BOT_ICON_DEFAULT_,
      "icon_emoji": botIcon || BOT_ICON_DEFAULT_,
      //"unfurl_links": false,
      "unfurl_media": false,
      ...args
    }
  };


  for (i = 0; true; i++) {
    try {
      const res = UrlFetchApp.fetch(SLACK_API_PATH_ + apiName, option);
      const resBody = JSON.parse(res.getContentText());
    
      const resCode = res.getResponseCode();
      const resCodeType = Math.floor(resCode / 100);
      
      if (resCodeType >= 4 || resBody?.ok !== true) {
        throw {resCode, resBody};
      }
      
      return resBody;
    } catch (e) {
      const errMsgDetail =
        " - Description: " + description + "\n"
          + " - HTTP Code: " + e.resCode + "\n"
          + (e.resBody?.ok ? " - ResBody > ok: " + e.resBody.ok + "\n" : "")
          + (e.resBody?.error ? " - ResBody > error: " + e.resBody.error + "\n" : "");
      
      // retry if rate limited error
      if (!e?.resCode || e.resCode === 429) {
        if (i < 5) {
          const sleepMs = 1000 + 3000 * i;
          log_("Sleeping " + sleepMs / 1000 + "s due to an error: \n" + e)
          Utilities.sleep(sleepMs);
          continue;
        }
      }

      throw Error("Error response while calling Slack API '" + apiName + "': \n" + errMsgDetail);
    }
  }
}