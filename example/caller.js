function init() {
  const slackApiConfig = {
      appToken: SLACK_APP_TOKEN_,
      channel: SLACK_CHANNEL_,
      botName: BOT_NAME_,
      botIcon: BOT_ICON_
    };
  
  GSheetsSlackScheduleNotifier
    .initSheet(SHEET_NAME_, slackApiConfig);
}

function notifyEveryInterval() {
  const slackApiConfig = {
      appToken: SLACK_APP_TOKEN_,
      channel: SLACK_CHANNEL_,
      botName: BOT_NAME_,
      botIcon: BOT_ICON_
    };


  // send reminder notifications of future events before 30 mins
  const remindConfig = {
      headerName: REMINDER_HEADER_NAME_,
      intervalMin: 5,
      intervalFutureCnt: 5,
      preserveNoti: true,
      ...(REMINDED_TO_SLACK_UNTIL_TS_ ? {
          from: new Date(REMINDED_TO_SLACK_UNTIL_TS_)
        } : {})
    };
  const notifyConfig = {
      headerName: HEADER_NAME_,
      intervalMin: 5,
      buttonStyle: "primary",
      ...(NOTIFIED_TO_SLACK_UNTIL_TS_ ? {
          from: new Date(NOTIFIED_TO_SLACK_UNTIL_TS_)
        } : {}) };

  const timestamps = GSheetsSlackScheduleNotifier
    .notifySlack(SHEET_NAME_, slackApiConfig, [remindConfig, notifyConfig]);

  // set last remind & notify ts
  if (timestamps?.length === 2) {
    const [remindToTs, notifyToTs] = timestamps;
    setScriptProperty_(REMINDED_TO_SLACK_UNTIL_TS_KEY_,
      Number(remindToTs).toFixed() || REMINDED_TO_SLACK_UNTIL_TS_);
    setScriptProperty_(NOTIFIED_TO_SLACK_UNTIL_TS_KEY_,
      Number(notifyToTs).toFixed() || NOTIFIED_TO_SLACK_UNTIL_TS_);
  }

}

function remindBeforehand24h() {
  const slackApiConfig = {
      appToken: SLACK_APP_TOKEN_,
      channel: SLACK_CHANNEL_,
      botName: BOT_NAME_,
      botIcon: BOT_ICON_
    };

  const fromDate = new Date();
  const toDate = new Date(fromDate.getTime() + 24*60*60*1000);

  const notifyConfig = {
      headerName: SUMMARY_REMINDER_HEADER_NAME_,
      from: fromDate,
      to: toDate,
      preserveNoti: true
    };
  GSheetsSlackScheduleNotifier
    .notifySlack(SHEET_NAME_, slackApiConfig, [notifyConfig]);
}



function doPost(e) {
  return ContentService.createTextOutput();
}