function initSlackMenus_(curSheet) {
  setMenus_("Slack Automation", [{
      name: "User List",
      item: Object
        .entries(getSlackUsers_(curSheet))
        .sort(([name_a], [name_b]) => name_a.localeCompare(name_b))
        .reduce((a, [name, id]) => {
            a.push({ name: name });
            return a;
          }, [])
    }]);
}
