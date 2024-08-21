/**
 * Run all functions of this api, one-stop function.  
 * Create and initialize base schedule sheet, scan the schedule sheet, and send notification messages for each schedule which is in target time range.
 * 
 *    - Return value: Timestamp of 'notifyTo' (schedules before this ts are notified)
 * 
 * 
 * 
 * @param {string} schedSheetName
 *    - Description: Sheet name to initialize
 * 
 * 
 * @param {{
 *            appToken: string,
 *            channel: string,
 *            botName?: string,
 *            botIcon?: string
 *        }} slackApiConfig
 *    - Description: Config object for Slack API
 *    - Object Structure
 *      - 【`appToken`】 Slack OAuth bot user token for a custom app
 *      - 【`channel`】 Slack channel name
 *        - E.g.) "General"
 *      - 【`botName`】 Sender name to display on Slack message
 *        - Default) "Schedule Notifier"
 *      - 【`botIcon`】 Sender icon string to display on Slack message
 *        - Default) ":alarm_clock:"
 * 
 * 
 * @param {Array.<({
 *                    to: Date,
 *                    from?: Date,
 *                    preserveNoti?: boolean,
 *                    buttonStyle?: integer,
 *                    headerName?: string
 *                 }|{
 *                    intervalMin: integer,
 *                    intervalFutureCnt?: integer,
 *                    from?: Date,
 *                    preserveNoti?: boolean,
 *                    buttonStyle?: integer,
 *                    headerName?: string
 *                 })>} notifyConfigs
 *    - Description: Config object about time range to notify with some metadata
 *    - Object Structure (of each array element)
 *      - 【`to`】 Ending point of the datetime range
 *      - 【`from`】 Starting point of the datetime range. If `intervalMin` is set, this value overrides 'from' timestamp generated from `intervalMin`
 *      - 【`intervalMin`】 Interval to notify in minutes. Note that this function does not repeat automatically: if you set this value to 5 (mins), then this function assume that you call this every 5 minutes
 *      - 【`intervalFutureCnt`】 If set, notify future schedules, after about '`intervalMin` * `intervalFutureCnt`' minutes
 *      - 【`preserveNoti`】 Do not uncheck after notify
 *      - 【`buttonStyle`】 Style of the schedule name button
 *      - 【`headerName`】 Header name to print
 * 
 * 
 * @return {integer} Timestamp of 'notifyTo' (schedules before this ts are notified)
 */
function run(schedSheetName, slackApiConfig, notifyConfig) {

  // validate args
  [
    { name: "schedSheetName", value: schedSheetName },
    [
      { name: "notifyConfig.to", value: notifyConfig?.to },
      { name: "notifyConfig.intervalMin", value: notifyConfig?.intervalMin }
    ],
    { name: "slackApiConfig.appToken", value: slackApiConfig?.appToken },
    { name: "slackApiConfig.channel", value: slackApiConfig?.channel },
  ].forEach(reqArg => {
      if (!Array.isArray(reqArg)) reqArg = [reqArg];
      if (reqArg.every(v => v.value === null || v.value === undefined))
        throw Error("Missing required argument: '"
          + reqArg.map(v => v.name).join("' or '") + "'");
    });
  
  const notifyConfigConv = {
      ...notifyConfig,
      ...(notifyConfig?.intervalMin
        ? getNextRangeFromInterval_(
          notifyConfig.intervalMin, notifyConfig.intervalFutureCnt, notifyConfig.from) : {})
    };
  
  // if from is later than to, do nothing
  if (notifyConfigConv.from.getTime() >= notifyConfigConv.to.getTime()) return null;
  
  // create sheet, reinitialize sheet, and notify
  console.time("Initialize or get a target sheet");
  const sheet = getOrInitSchedSheet_(schedSheetName);
  console.timeEnd("Initialize or get a target sheet");

  runWithSheetLock_(sheet, () => {
    
      console.time("Reconstruct the target sheet");
      reconstructSheetFrame_(sheet, slackApiConfig);
      console.timeEnd("Reconstruct the target sheet");

      console.time("Scan and select target data to notify");
      const scheduleList = getSchedulesBetween_(sheet, notifyConfigConv);
      console.timeEnd("Scan and select target data to notify");

      console.time("Send schedules to Slack");
      scheduleList.forEach((s, i) =>
        sendSlackSchedules_(sheet, slackApiConfig, [s], notifyConfigConv.headerName,
          i === 0, notifyConfig.buttonStyle));
      console.timeEnd("Send schedules to Slack");

    });


  return notifyConfigConv.to.getTime();
}



/**
 * Create or refresh all frames (Data validations, conditional formatting rules, etc).
 * 
 * 
 * 
 * @param {string} schedSheetName
 *    - Description: Sheet name to initialize
 * 
 * 
 * @param {{
 *            appToken: string,
 *            channel: string,
 *            botName?: string,
 *            botIcon?: string
 *        }} slackApiConfig
 *    - Description: Config object for Slack API
 *    - Object Structure
 *      - 【`appToken`】 Slack OAuth bot user token for a custom app
 *      - 【`channel`】 Slack channel name
 *        - E.g.) "General"
 *      - 【`botName`】 Sender name to display on Slack message
 *        - Default) "Schedule Notifier"
 *      - 【`botIcon`】 Sender icon string to display on Slack message
 *        - Default) ":alarm_clock:"
 */
function initSheet(schedSheetName, slackApiConfig) {

  // validate args
  [
    { name: "schedSheetName", value: schedSheetName },
    { name: "slackApiConfig.appToken", value: slackApiConfig?.appToken },
    { name: "slackApiConfig.channel", value: slackApiConfig?.channel },
  ].forEach(reqArg => {
      if (!Array.isArray(reqArg)) reqArg = [reqArg];
      if (reqArg.every(v => v.value === null || v.value === undefined))
        throw Error("Missing required argument: '"
          + reqArg.map(v => v.name).join("' or '") + "'");
    });
  
  // create sheet, reinitialize sheet, and notify
  console.time("Initialize or get a target sheet");
  const sheet = getOrInitSchedSheet_(schedSheetName);
  console.timeEnd("Initialize or get a target sheet");

  runWithSheetLock_(sheet, () => {
    
      console.time("Reconstruct the target sheet");
      reconstructSheetFrame_(sheet, slackApiConfig);
      console.timeEnd("Reconstruct the target sheet");

    });
}



/**
 * Scan a schedule sheet, and send notification messages for each schedule which is in target time range.
 * 
 *    - Return value: Timestamp of 'notifyTo' (schedules before this ts are notified)
 * 
 * 
 * 
 * @param {string} schedSheetName
 *    - Description: Sheet name to initialize
 * 
 * 
 * @param {{
 *            appToken: string,
 *            channel: string,
 *            botName?: string,
 *            botIcon?: string
 *        }} slackApiConfig
 *    - Description: Config object for Slack API
 *    - Object Structure
 *      - 【`appToken`】 Slack OAuth bot user token for a custom app
 *      - 【`channel`】 Slack channel name
 *        - E.g.) "General"
 *      - 【`botName`】 Sender name to display on Slack message
 *        - Default) "Schedule Notifier"
 *      - 【`botIcon`】 Sender icon string to display on Slack message
 *        - Default) ":alarm_clock:"
 * 
 * 
 * @param {Array.<({
 *                    to: Date,
 *                    from?: Date,
 *                    preserveNoti?: boolean,
 *                    buttonStyle?: integer,
 *                    headerName?: string
 *                 }|{
 *                    intervalMin: integer,
 *                    intervalFutureCnt?: integer,
 *                    from?: Date,
 *                    preserveNoti?: boolean,
 *                    buttonStyle?: integer,
 *                    headerName?: string
 *                 })>} notifyConfigs
 *    - Description: Config object about time range to notify with some metadata
 *    - Object Structure (of each array element)
 *      - 【`to`】 Ending point of the datetime range
 *      - 【`from`】 Starting point of the datetime range. If `intervalMin` is set, this value overrides 'from' timestamp generated from `intervalMin`
 *      - 【`intervalMin`】 Interval to notify in minutes. Note that this function does not repeat automatically: if you set this value to 5 (mins), then this function assume that you call this every 5 minutes
 *      - 【`intervalFutureCnt`】 If set, notify future schedules, after about '`intervalMin` * `intervalFutureCnt`' minutes
 *      - 【`preserveNoti`】 Do not uncheck after notify
 *      - 【`buttonStyle`】 Style of the schedule name button
 *      - 【`headerName`】 Header name to print
 * 
 * 
 * @return {integer} Timestamp of 'notifyTo' (schedules before this ts are notified)
 */
function notifySlack(schedSheetName, slackApiConfig, notifyConfigs) {

  // validate args
  notifyConfigs.forEach((notifyConfig) =>
      [
        { name: "schedSheetName", value: schedSheetName },
        { name: "slackApiConfig.appToken", value: slackApiConfig?.appToken },
        { name: "slackApiConfig.channel", value: slackApiConfig?.channel },
        [
          { name: "notifyConfig.to", value: notifyConfig?.to },
          { name: "notifyConfig.intervalMin", value: notifyConfig?.intervalMin }
        ],
      ].forEach(reqArg => {
          if (!Array.isArray(reqArg)) reqArg = [reqArg];
          if (reqArg.every(v => v.value === null || v.value === undefined))
            throw Error("Missing required argument: '"
              + reqArg.map(v => v.name).join("' or '") + "'");
        })
    );
  

  const notifyConfigsConv = notifyConfigs
    .map(notifyConfig => ({
        ...notifyConfig,
        ...(notifyConfig?.intervalMin
          ? getNextRangeFromInterval_(
            notifyConfig.intervalMin, notifyConfig.intervalFutureCnt, notifyConfig.from) : {})
      }))
    .filter(notifyConfigConv => notifyConfigConv.from.getTime() < notifyConfigConv.to.getTime());
  
  // if from is later than to, do nothing
  if (!(notifyConfigsConv.length > 0)) return null;
  
  // create sheet, reinitialize sheet, and notify
  console.time("Initialize or get a target sheet");
  const sheet = getOrInitSchedSheet_(schedSheetName);
  console.timeEnd("Initialize or get a target sheet");

  runWithSheetLock_(sheet, () => {

      console.time("Scan and select target data to notify");
      const scheduleList = notifyConfigsConv
        .flatMap(notifyConfigConv => getSchedulesBetween_(sheet, notifyConfigConv)
          .map((sched, idx) => ({
              sched: sched,
              notifyConfigConv: notifyConfigConv,
              printHeader: idx === 0
            })));
      console.timeEnd("Scan and select target data to notify");

      console.time("Send schedules to Slack");
      scheduleList.forEach(({sched: s, notifyConfigConv, printHeader}) =>
        sendSlackSchedules_(sheet, slackApiConfig, [s], notifyConfigConv.headerName,
          printHeader, notifyConfigConv.buttonStyle));
      console.timeEnd("Send schedules to Slack");

    });



  return notifyConfigsConv.map(notifyConfigConv => notifyConfigConv.to.getTime());
}



function sendSlackSchedules_(
  curSheet, slackApiConfig, scheduleList, title,
  withHeader = true, buttonStyle = null) {
  slackApi_("post", "chat.postMessage", {
      ...genSlackMsg_(scheduleList, curSheet, title, withHeader, buttonStyle),
      channel: slackApiConfig.channel
    }, "NotifySlack", slackApiConfig);
}