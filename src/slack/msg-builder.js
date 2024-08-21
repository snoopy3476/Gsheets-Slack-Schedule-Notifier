function genSlackMsg_(
  scheduleList, curSheet, title = "📅 Schedules", withHeader = false, buttonStyle = null) {
  const curSheetId = curSheet.getSheetId();
  const curSheetUrl =
    curSheet.getParent().getUrl() + "#gid=" + curSheetId
  const userList = getSlackUsers_(curSheet);
  
  return {
    blocks: JSON.stringify([

      withHeader ? {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": title,
          "emoji": false
        }
      } : null,
      withHeader ? {
        "type": "divider"
      } : null,
      
      ...scheduleList.flatMap(s => getSlackMsgSingleSchedule_(s))
    ].filter(v => v)),
    text: title + ": "
      + scheduleList.map(sched =>
          "【" + sched.ts.toLocaleString([], {
              hour12: false, timeZone: TZ_STR_,
              hour: "numeric", minute: "numeric"
            })
            + (isString_(sched.value.place) && sched.value.place.length > 0
              ? " ▸ " + sched.value.place : "")
            + "】"
          + " " + (isString_(sched.value.name)
            ? sched.value.name : "(Invalid name)" ) + " "
        )
        .join("|")
  };



  function getSlackMsgSingleSchedule_(schedule) {
    const range = schedule.range;

    const rangeUrlStr = curSheetUrl + "&range=" + range.getA1Notation();

    const nameStr = isString_(schedule.value.name)
      ? schedule.value.name : "(Invalid name)";

    const datetimeStr =
      " 🕘 <!date^" + Math.trunc(schedule.ts.getTime() / 1000)
        + "^{date_short_pretty} {time}|"
        + schedule.ts.toISOString() + ">";

    const placeStr = isString_(schedule.value.place)
      ? schedule.value.place : null;

    const schedUserList = isString_(schedule.value.user)
      ? [...new Set(schedule.value.user
        .split(",").map(u => u.trim()).filter(v => v))]
      : [];
    const schedUserListStr =
      schedUserList?.length > 0
      ? (
        (schedUserList?.length === 1 && schedUserList[0] === "*")
          ? "<!here>"
          : schedUserList.map(n => "<@" + escapeSlackStr(userList[[n]]) + ">").join(" ")
        )
      : null;
    
    const linkEscaped = isString_(schedule.value.link)
      ? escapeSlackStr(schedule.value.link.trim()) : "";
    const linkHost =
      linkEscaped
        .match(/^([^.\/]*\/\/)?(www\.)?(([^./]+)(\.[^./]+)*)(\/.*)?$/)?.[3]
            + "/..."
          || "#";
    const linkStr = linkEscaped ? "<" + linkEscaped + "|" + linkHost + ">" : null;

    const extraValuesStr =
      Object.entries(schedule.extra)
        .map(([k, v]) => "📌 " + k + " 🔸 " + v).join("\n")
      || "(No custom data)";



    return [
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": ("⏰ " + nameStr).substring(0, 75)
            },
            "confirm": {
              "title": {
                "type": "plain_text",
                "text": ("⏰ " + nameStr).substring(0, 100), //"🗃️ Custom Data Field",
                "emoji": false
              },
              "text": {
                "type": "plain_text",
                "text": extraValuesStr.substring(0, 300),
                "emoji": false
              },
              "confirm": {
                "type": "plain_text",
                "text": "➜📝",
                "emoji": false
              },
              "deny": {
                "type": "plain_text",
                "text": "❌",
                "emoji": false
              },
              "style": "primary"
            },
            "url": rangeUrlStr.length <= 3000
              ? rangeUrlStr.substring(0, 3000)
              : curSheetUrl,
            ...(buttonStyle ? {"style": buttonStyle} : {})
          }
        ]
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": datetimeStr.substring(0, 3000),
            "verbatim": false
          },
          (
            placeStr
            ? {
              "type": "mrkdwn",
              "text": (
                  " 📍 `"
                    + escapeSlackStr(placeStr)
                    + "`"
                ).substring(0, 3000),
              "verbatim": false
            }
            : null
          ),
          (
            schedUserListStr
            ? {
              "type": "mrkdwn",
              "text": (" 👤 " + schedUserListStr)
                .substring(0, 3000),
              "verbatim": false
            }
            : null
          ),
          (
            linkStr
            ? {
              "type": "mrkdwn",
              "text": (" 🔗 " + linkStr).substring(0, 3000),
              "verbatim": false
            }
            : null
          )
        ].filter(v => v)
      }
    ];
  }

  function escapeSlackStr(input) {
    return input
      ?.replaceAll("&", "&amp;")
      ?.replaceAll("<", "&lt;")
      ?.replaceAll(">", "&gt;")
      ?.replaceAll(/[!^|*_~`]+/g, "");
  }
}