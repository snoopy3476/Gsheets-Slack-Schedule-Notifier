const MD_KEY_SLACK_USER_ID_MAP_ = "SLACK_USER_ID_MAP";

// Update Slack user ID metadata for all users on the sheets (A column)
function refreshSlackUsers_(curSheet, slackApiConfig) {

  const userList = getUsersWithId();
  if (!setMetadata_(curSheet, MD_KEY_SLACK_USER_ID_MAP_, userList)) {
    throw Error("Failed to set Slack user metadata");
  }

  return userList;



  function getUsersWithId() {
    const userList =
      slackApi_("get", "users.list", null, "Slack user ID synchronization", slackApiConfig)?.members;
    //debugVar_("getUsers()", userList);

    return userList
      ?.filter(u => !(u.is_bot || u.is_app_user || u.deleted || u.id === "USLACKBOT"))
      ?.reduce((a, u) => {
          const name = u?.profile?.display_name || u?.real_name;
          const id = u?.id;
          if (name) a[[name]] = id || name;
          return a;
        }, {});
  }
}

//
function getSlackUsers_(curSheet) {
  return getMetadata_(curSheet, MD_KEY_SLACK_USER_ID_MAP_);
}