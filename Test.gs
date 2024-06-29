const SLACK_APP_TOKEN_KEY_TEST_ = "SLACK_SCHED_NOTIFIER__SLACK_APP_TOKEN";
const SLACK_API_TOKEN_TEST_ = getScriptPropertyOrThrow_(SLACK_APP_TOKEN_KEY_TEST_);

const BOT_NAME_TOKEN_KEY_TEST_ = "SLACK_SCHED_NOTIFIER__BOT_NAME";
const BOT_NAME_TEST_ = getScriptProperty_(BOT_NAME_TOKEN_KEY_TEST_);

const BOT_ICON_TOKEN_KEY_TEST_ = "SLACK_SCHED_NOTIFIER__BOT_ICON";
const BOT_ICON_TEST_ = getScriptProperty_(BOT_ICON_TOKEN_KEY_TEST_);

const SHEET_NAME_KEY_TEST_ = "SLACK_SCHED_NOTIFIER__SHEET_NAME";
const SHEET_NAME_TEST_ = getScriptProperty_(SHEET_NAME_KEY_TEST_);

function initTest() {
  const slackApiConfig = {
      appToken: SLACK_API_TOKEN_TEST_,
      botName: BOT_NAME_TEST_,
      botIcon: BOT_ICON_TEST_
    };
  initSchedSheet(slackApiConfig, SHEET_NAME_TEST_);
}

function notifyTest() {
  const slackApiConfig = {
      appToken: SLACK_API_TOKEN_TEST_,
      botName: BOT_NAME_TEST_,
      botIcon: BOT_ICON_TEST_
    };

  var fromDate = new Date();
  //var toDate = new Date();
  //toDate.setHours(24, 0, 0, 0);
  var toDate = new Date(fromDate.getTime() + /*7**/24*60*60*1000);

  const notifyBetween = { notifyFrom: fromDate, notifyTo: toDate };
  notifySlack(notifyBetween, slackApiConfig, SHEET_NAME_TEST_);
}
