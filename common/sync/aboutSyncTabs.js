/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cu = Components.utils;

Cu.import("resource://services-sync/main.js");
Cu.import("resource:///modules/PlacesUIUtils.jsm");
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var RemoteTabViewer = {
  _tabsList: null,

  init: function () {
    Services.obs.addObserver(this, "weave:service:login:finish", false);
    Services.obs.addObserver(this, "weave:engine:sync:finish", false);

    this._tabsList = document.getElementById("tabsList");

    this.buildList(true);
  },

  uninit: function () {
    Services.obs.removeObserver(this, "weave:service:login:finish");
    Services.obs.removeObserver(this, "weave:engine:sync:finish");
  },

  buildList: function(force) {
    if (!Weave.Service.isLoggedIn || !this._refetchTabs(force))
      return;
    //XXXzpao We should say something about not being logged in & not having data
    //        or tell the appropriate condition. (bug 583344)

    this._generateTabList();
  },

  createItem: function(attrs) {
    let item = document.createElement("richlistitem");

    // Copy the attributes from the argument into the item
    for (let attr in attrs)
      item.setAttribute(attr, attrs[attr]);

    if (attrs["type"] == "tab")
      item.label = attrs.title || attrs.url;

    return item;
  },

  filterTabs: function(event) {
    let val = event.target.value.toLowerCase();
    let numTabs = this._tabsList.getRowCount();
    let client = null;
    for (let i = 0; i < numTabs; i++) {
      let item = this._tabsList.getItemAtIndex(i);
      let hide = false; // By default, make sure the item is visible.
      switch (item.getAttribute("type")) {
        case "tab":
          if (item.getAttribute("url").toLowerCase().indexOf(val) == -1 &&
              item.getAttribute("title").toLowerCase().indexOf(val) == -1)
            hide = true;
          else
            client = null; // This client should not be hidden.
          break;
        case "client":
          if (client)
            client.hidden = true; // Hide the last client, it had no visible tabs.
          client = item;
          break;
      }
      item.hidden = hide;
    }
    if (client)
      client.hidden = true; // Hide the last client, it had no visible tabs.
  },

  openSelected: function() {
    let items = this._tabsList.selectedItems;
    let urls = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].getAttribute("type") == "tab") {
        urls.push(items[i].getAttribute("url"));
        let index = this._tabsList.getIndexOfItem(items[i]);
        this._tabsList.removeItemAt(index);
      }
    }
    if (urls.length) {
      getTopWin().getBrowser().loadTabs(urls);
      this._tabsList.clearSelection();
    }
  },

  bookmarkSingleTab: function() {
    let item = this._tabsList.selectedItems[0];
    let uri = Weave.Utils.makeURI(item.getAttribute("url"));
    let title = item.getAttribute("title");
    PlacesUIUtils.showMinimalAddBookmarkUI(uri, title);
  },

  bookmarkSelectedTabs: function() {
    let items = this._tabsList.selectedItems;
    let URIs = [];
    let titles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].getAttribute("type") == "tab") {
        let uri = Weave.Utils.makeURI(items[i].getAttribute("url"));
        if (!uri)
          continue;

        URIs.push(uri);
        titles.push(items[i].getAttribute("title"));
      }
    }
    if (URIs.length)
      PlacesUIUtils.showMinimalAddMultiBookmarkUI(URIs, titles);
  },

  getIcon: function (iconUri, defaultIcon) {
    try {
      let iconURI = Weave.Utils.makeURI(iconUri);
      return PlacesUtils.favicons.getFaviconLinkForIcon(iconURI).spec;
    } catch(ex) {
      // Do nothing.
    }

    // Just give the provided default icon or the system's default.
    return defaultIcon || PlacesUtils.favicons.defaultFavicon.spec;
  },

  _generateTabList: function() {
    let engine = Weave.Service.engineManager.get("tabs");
    let list = this._tabsList;

    // clear out existing richlistitems
    let count = list.getRowCount();
    if (count > 0) {
      for (let i = count - 1; i >= 0; i--)
        list.removeItemAt(i);
    }

    let seenURLs = new Set();
    let localURLs = engine.getOpenURLs();

    for (let [guid, client] in Iterator(engine.getAllClients())) {
      let appendClient = true;

      client.tabs.forEach(function({title, urlHistory, icon}) {
        let url = urlHistory[0];
        if (!url || localURLs.has(url) || seenURLs.has(url))
          return;

        seenURLs.add(url);

        if (appendClient) {
          let attrs = {
            type: "client",
            clientName: client.clientName,
            class: Weave.Service.clientsEngine.isMobile(client.id) ? "mobile" : "desktop"
          };
          let clientEnt = this.createItem(attrs);
          list.appendChild(clientEnt);
          appendClient = false;
          clientEnt.disabled = true;
        }
        let attrs = {
          type:  "tab",
          title: title || url,
          url:   url,
          icon:  this.getIcon(icon)
        }
        let tab = this.createItem(attrs);
        list.appendChild(tab);
      }, this);
    }
  },

  adjustContextMenu: function(event) {
    let mode = "all";
    switch (this._tabsList.selectedItems.length) {
      case 0:
        break;
      case 1:
        mode = "single"
        break;
      default:
        mode = "multiple";
        break;
    }
    let menu = document.getElementById("tabListContext");
    let el = menu.firstChild;
    while (el) {
      let showFor = el.getAttribute("showFor");
      if (showFor)
        el.hidden = showFor != mode && showFor != "all";
      else // menuseparator
        el.hidden = mode == "all";
      el = el.nextSibling;
    }
  },

  _refetchTabs: function(force) {
    if (!force) {
      // Don't bother refetching tabs if we already did so recently
      let lastFetch = GetIntPref("services.sync.lastTabFetch", 0);
      let now = Math.floor(Date.now() / 1000);
      if (now - lastFetch < 30)
        return false;
    }

    // if Clients hasn't synced yet this session, need to sync it as well
    if (Weave.Service.clientsEngine.lastSync == 0)
      Weave.Service.clientsEngine.sync();

    // Force a sync only for the tabs engine
    let engine = Weave.Service.engineManager.get("tabs");
    engine.lastModified = null;
    engine.sync();
    Services.prefs.setIntPref("services.sync.lastTabFetch",
                              Math.floor(Date.now() / 1000));

    return true;
  },

  observe: function(subject, topic, data) {
    switch (topic) {
      case "weave:service:login:finish":
        this.buildList(true);
        break;
      case "weave:engine:sync:finish":
        if (subject == "tabs")
          this._generateTabList();
        break;
    }
  },

  handleClick: function(event) {
    if (event.target.getAttribute("type") == "tab" && event.button == 1) {
      let url = event.target.getAttribute("url");
      openUILink(url, event);
      let index = this._tabsList.getIndexOfItem(event.target);
      this._tabsList.removeItemAt(index);
    }
  }
};

var EventDirector = {
  handleEvent: function(event) {
    switch (event.type) {
      case "click":
        RemoteTabViewer.handleClick(event);
        break;
      case "contextmenu":
        RemoteTabViewer.adjustContextMenu(event);
        break;
      case "command":
        switch (event.target.id) {
          case "openSingleTab":
          case "openSelectedTabs":
            RemoteTabViewer.openSelected();
            break;
          case "bookmarkSingleTab":
            RemoteTabViewer.bookmarkSingleTab();
            break;
          case "bookmarkSelectedTabs":
            RemoteTabViewer.bookmarkSelectedTabs();
            break;
          case "buildList":
            RemoteTabViewer.buildList();
            break;
          case "filterTabs":
            RemoteTabViewer.filterTabs(event);
            break;
        }
        break;
    }
  }
};

window.onload = function() {
  RemoteTabViewer.init();

  let tabsList = document.getElementById("tabsList");
  tabsList.addEventListener("click", EventDirector);
  tabsList.addEventListener("contextmenu", EventDirector);

  document.getElementById("tabListContext")
          .addEventListener("command", EventDirector);
  document.getElementById("filterTabs")
          .addEventListener("command", EventDirector);
}

window.onunload = function() {
  RemoteTabViewer.uninit();
}
