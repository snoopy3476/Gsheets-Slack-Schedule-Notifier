function setMenus_(menuName, menuObj) {
  //debugFcall_(arguments);
  genMenus_(menuName, menuObj).addToUi();
}

function genMenus_(menuName, menuObj, ui = getUi_()) {
  //debugFcall_(arguments);
  return menuObj.reduce((a, obj) => {
    if (!obj.name) {
      return a.addSeparator();
    } else if (!obj.item) {
      return a.addItem(obj.name, doNothing_.name);
    } else if (typeof obj.item === "function") {
      return a.addItem(obj.name, obj.item.name);
    } else if (Array.isArray(obj.item)) {
      return a.addSubMenu(genMenus_(obj.name, obj.item, ui));
    } else {
      log_("genMenus(): Unrecognized menu object:", obj);
      return a;
    }
  }, ui.createMenu(menuName));
}

function doNothing_() { }
