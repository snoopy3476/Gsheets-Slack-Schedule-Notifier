// script properties
const SLACK_APP_TOKEN_ = getScriptPropertyOrThrow_(SLACK_APP_TOKEN_KEY_);
const SLACK_CHANNEL_ = getScriptPropertyOrThrow_(SLACK_CHANNEL_KEY_);
const BOT_NAME_ = getScriptProperty_(BOT_NAME_TOKEN_KEY_);
const BOT_ICON_ = getScriptProperty_(BOT_ICON_TOKEN_KEY_);
const SHEET_NAME_ = getScriptProperty_(SHEET_NAME_KEY_);
const HEADER_NAME_ = getScriptProperty_(HEADER_NAME_KEY_);
const REMINDER_HEADER_NAME_ = getScriptProperty_(REMINDER_HEADER_NAME_KEY_);
const SUMMARY_REMINDER_HEADER_NAME_ = getScriptProperty_(SUMMARY_REMINDER_HEADER_NAME_KEY_);

// user properties
const NOTIFIED_TO_SLACK_UNTIL_TS_ =
  Number(getScriptProperty_(NOTIFIED_TO_SLACK_UNTIL_TS_KEY_)) || undefined;
const REMINDED_TO_SLACK_UNTIL_TS_ =
  Number(getScriptProperty_(REMINDED_TO_SLACK_UNTIL_TS_KEY_)) || undefined;