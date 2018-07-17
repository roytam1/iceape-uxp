/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/PluralForm.jsm");

var searchSessionContractID = "@mozilla.org/messenger/searchSession;1";
var gDBView;
var gSearchSession;
var gMsgFolderSelected;

var nsIMsgFolder = Components.interfaces.nsIMsgFolder;
var nsIMsgWindow = Components.interfaces.nsIMsgWindow;
var nsMsgSearchScope = Components.interfaces.nsMsgSearchScope;

var gFolderDatasource;
var gFolderPicker;
var gStatusBar = null;
var gStatusFeedback = new nsMsgStatusFeedback();
var gTimelineEnabled = false;
var gMessengerBundle = null;
var RDF;
var gSearchBundle;
var gNextMessageViewIndexAfterDelete = -2;

// Datasource search listener -- made global as it has to be registered
// and unregistered in different functions.
var gDataSourceSearchListener;
var gViewSearchListener;

var gSearchStopButton;

// Controller object for search results thread pane
var nsSearchResultsController =
{
    supportsCommand: function(command)
    {
        switch(command) {
        case "cmd_openMessage":
        case "cmd_delete":
        case "cmd_shiftDelete":
        case "button_delete":
        case "file_message_button":
        case "goto_folder_button":
        case "saveas_vf_button":
        case "cmd_selectAll":
        case "cmd_markAsRead":
        case "cmd_markAsFlagged":
            return true;
        default:
            return false;
        }
    },

    // this controller only handles commands
    // that rely on items being selected in
    // the search results pane.
    isCommandEnabled: function(command)
    {
        var enabled = true;

        switch (command) {
          case "goto_folder_button":
            if (GetNumSelectedMessages() != 1)
              enabled = false;
            break;
          case "cmd_delete":
          case "cmd_shiftDelete":
          case "button_delete":
            // this assumes that advanced searches don't cross accounts
            if (GetNumSelectedMessages() <= 0)
              enabled = false;
            break;
          case "saveas_vf_button":
              // need someway to see if there are any search criteria...
              return true;
          case "cmd_selectAll":
            return GetDBView() != null;
          default:
            if (GetNumSelectedMessages() <= 0)
              enabled = false;
            break;
        }

        return enabled;
    },

    doCommand: function(command)
    {
        switch(command) {
        case "cmd_openMessage":
            MsgOpenSelectedMessages();
            return true;

        case "cmd_delete":
        case "button_delete":
            MsgDeleteSelectedMessages(nsMsgViewCommandType.deleteMsg);
            return true;
        case "cmd_shiftDelete":
            MsgDeleteSelectedMessages(nsMsgViewCommandType.deleteNoTrash);
            return true;

        case "goto_folder_button":
            GoToFolder();
            return true;

        case "saveas_vf_button":
            saveAsVirtualFolder();
            return true;

        case "cmd_selectAll":
            // move the focus to the search results pane
            GetThreadTree().focus();
            GetDBView().doCommand(nsMsgViewCommandType.selectAll)
            return true;

        case "cmd_markAsRead":
            MsgMarkMsgAsRead(null);
            return true;

        case "cmd_markAsFlagged":
            MsgMarkAsFlagged(null);
            return true;

        default:
            return false;
        }

    },

    onEvent: function(event)
    {
    }
}

function UpdateMailSearch(caller)
{
  //dump("XXX update mail-search " + caller + "\n");
  document.commandDispatcher.updateCommands('mail-search');
}

function SetAdvancedSearchStatusText(aNumHits)
{
  var statusMsg;
  // if there are no hits, it means no matches were found in the search.
  if (aNumHits == 0)
  {
    statusMsg = gSearchBundle.getString("noMatchesFound");
  }
  else
  {
    statusMsg = PluralForm.get(aNumHits,
                               gSearchBundle.getString("matchesFound"));
    statusMsg = statusMsg.replace("#1", aNumHits);
  }
  gStatusFeedback.showStatusString(statusMsg);
}

// nsIMsgSearchNotify object
var gSearchNotificationListener =
{
    onSearchHit: function(header, folder)
    {
        // XXX TODO
        // update status text?
    },

    onSearchDone: function(status)
    {
        gSearchStopButton.setAttribute("label", gSearchBundle.getString("labelForSearchButton"));
        gSearchStopButton.setAttribute("accesskey", gSearchBundle.getString("labelForSearchButton.accesskey"));
        gStatusFeedback._stopMeteors();
        SetAdvancedSearchStatusText(gDBView.QueryInterface(Components.interfaces.nsITreeView).rowCount);
    },

    onNewSearch: function()
    {
      gSearchStopButton.setAttribute("label", gSearchBundle.getString("labelForStopButton"));
      gSearchStopButton.setAttribute("accesskey", gSearchBundle.getString("labelForStopButton.accesskey"));
      UpdateMailSearch("new-search");
      gStatusFeedback._startMeteors();
      gStatusFeedback.showStatusString(gSearchBundle.getString("searchingMessage"));
    }
}

// the folderListener object
var gFolderListener = {
    OnItemAdded: function(parentItem, item) {},

    OnItemRemoved: function(parentItem, item){},

    OnItemPropertyChanged: function(item, property, oldValue, newValue) {},

    OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {},

    OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},

    OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue){},
    OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},

    OnItemEvent: function(folder, event) {
        var eventType = event.toString();

        if (eventType == "DeleteOrMoveMsgCompleted") {
            HandleDeleteOrMoveMessageCompleted(folder);
        }
        else if (eventType == "DeleteOrMoveMsgFailed") {
            HandleDeleteOrMoveMessageFailed(folder);
        }
    }
}

function HideSearchColumn(id)
{
  var col = document.getElementById(id);
  if (col) {
    col.setAttribute("hidden","true");
    col.setAttribute("ignoreincolumnpicker","true");
  }
}

function ShowSearchColumn(id)
{
  var col = document.getElementById(id);
  if (col) {
    col.removeAttribute("hidden");
    col.removeAttribute("ignoreincolumnpicker");
  }
}

function searchOnLoad()
{
  setHelpFileURI("chrome://communicator/locale/help/suitehelp.rdf");
  initializeSearchWidgets();
  initializeSearchWindowWidgets();
  messenger = Components.classes["@mozilla.org/messenger;1"]
                        .createInstance(Components.interfaces.nsIMessenger);

  gSearchBundle = document.getElementById("bundle_search");
  gSearchStopButton.setAttribute("label", gSearchBundle.getString("labelForSearchButton"));
  gSearchStopButton.setAttribute("accesskey", gSearchBundle.getString("labelForSearchButton.accesskey"));
  gMessengerBundle = document.getElementById("bundle_messenger");
  setupDatasource();
  setupSearchListener();

  if (window.arguments && window.arguments[0])
    selectFolder(window.arguments[0].folder);

  onMore(null);
  UpdateMailSearch("onload");

  // hide and remove these columns from the column picker.  you can't thread search results
  HideSearchColumn("threadCol"); // since you can't thread search results
  HideSearchColumn("totalCol"); // since you can't thread search results
  HideSearchColumn("unreadCol"); // since you can't thread search results
  HideSearchColumn("unreadButtonColHeader");
  HideSearchColumn("idCol");
  HideSearchColumn("junkStatusCol");
  HideSearchColumn("accountCol");

  // we want to show the location column for search
  ShowSearchColumn("locationCol");
}

function searchOnUnload()
{
    // unregister listeners
    gSearchSession.unregisterListener(gViewSearchListener);
    gSearchSession.unregisterListener(gSearchNotificationListener);

    Components.classes["@mozilla.org/messenger/services/session;1"]
              .getService(Components.interfaces.nsIMsgMailSession)
              .RemoveFolderListener(gFolderListener);

    if (gDBView)
    {
        gDBView.close();
        gDBView = null;
    }

    top.controllers.removeController(nsSearchResultsController);

    // release this early because msgWindow holds a weak reference
    msgWindow.rootDocShell = null;
}

function initializeSearchWindowWidgets()
{
    gFolderPicker = document.getElementById("searchableFolders");
    gSearchStopButton = document.getElementById("search-button");
    gStatusBar = document.getElementById('statusbar-icon');
    hideMatchAllItem();

    msgWindow = Components.classes["@mozilla.org/messenger/msgwindow;1"]
                          .createInstance(nsIMsgWindow);
    msgWindow.domWindow = window;
    msgWindow.rootDocShell.allowAuth = true;
    msgWindow.rootDocShell.appType = Components.interfaces.nsIDocShell.APP_TYPE_MAIL;
    msgWindow.statusFeedback = gStatusFeedback;

    // functionality to enable/disable buttons using nsSearchResultsController
    // depending of whether items are selected in the search results thread pane.
    top.controllers.insertControllerAt(0, nsSearchResultsController);
}


function onSearchStop() {
    gSearchSession.interruptSearch();
}

function onResetSearch(event) {
    onReset(event);

    var tree = GetThreadTree();
    tree.treeBoxObject.view = null;
    gStatusFeedback.showStatusString("");
}

function selectFolder(folder)
{
    var folderURI;

    // if we can't search messages on this folder, just select the first one
    if (!folder || !folder.server.canSearchMessages ||
        (folder.flags & Components.interfaces.nsMsgFolderFlags.Virtual)) {
        // find first item in our folder picker menu list
        folderURI = gFolderPicker.firstChild.tree.builderView.getResourceAtIndex(0).Value;
    } else {
        folderURI = folder.URI;
    }
    updateSearchFolderPicker(folderURI);
}

function updateSearchFolderPicker(folderURI)
{
    SetFolderPicker(folderURI, gFolderPicker.id);

    // use the URI to get the real folder
    gMsgFolderSelected = GetMsgFolderFromUri(folderURI);

    var searchSubFolders = document.getElementById("checkSearchSubFolders");
    if (searchSubFolders)
      searchSubFolders.disabled = !gMsgFolderSelected.hasSubFolders;
    var searchLocalSystem = document.getElementById("menuSearchLocalSystem");
    if (searchLocalSystem)
        searchLocalSystem.disabled = gMsgFolderSelected.server.searchScope == nsMsgSearchScope.offlineMail;
    setSearchScope(GetScopeForFolder(gMsgFolderSelected));
}

function updateSearchLocalSystem()
{
  setSearchScope(GetScopeForFolder(gMsgFolderSelected));
}

function UpdateAfterCustomHeaderChange()
{
  updateSearchAttributes();
}

function onChooseFolder(event) {
    var folderURI = event.id;
    if (folderURI) {
        updateSearchFolderPicker(folderURI);
    }
}

function onEnterInSearchTerm()
{
  // on enter
  // if not searching, start the search
  // if searching, stop and then start again
  if (gSearchStopButton.getAttribute("label") == gSearchBundle.getString("labelForSearchButton")) {
     onSearch();
  }
  else {
     onSearchStop();
     onSearch();
  }
}

function onSearch()
{
    // set the view.  do this on every search, to
    // allow the tree to reset itself
    var treeView = gDBView.QueryInterface(Components.interfaces.nsITreeView);
    if (treeView)
    {
      var tree = GetThreadTree();
      tree.treeBoxObject.view = treeView;
    }

    gSearchSession.clearScopes();
    // tell the search session what the new scope is
    if (!gMsgFolderSelected.isServer && !gMsgFolderSelected.noSelect)
        gSearchSession.addScopeTerm(GetScopeForFolder(gMsgFolderSelected),
                                    gMsgFolderSelected);

    var searchSubfolders = document.getElementById("checkSearchSubFolders").checked;
    if (gMsgFolderSelected && (searchSubfolders || gMsgFolderSelected.isServer || gMsgFolderSelected.noSelect))
    {
        AddSubFolders(gMsgFolderSelected);
    }
    // reflect the search widgets back into the search session
    saveSearchTerms(gSearchSession.searchTerms, gSearchSession);

    try
    {
      gSearchSession.search(msgWindow);
    }
    catch(ex)
    {
       dump("Search Exception\n");
    }
    // refresh the tree after the search starts, because initiating the
    // search will cause the datasource to clear itself
}

function AddSubFolders(folder) {
  var subFolders = folder.subFolders;
  while (subFolders.hasMoreElements())
  {
    var nextFolder =
      subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);

    if (!(nextFolder.flags & Components.interfaces.nsMsgFolderFlags.Virtual))
    {
      if (!nextFolder.noSelect)
        gSearchSession.addScopeTerm(GetScopeForFolder(nextFolder), nextFolder);

      AddSubFolders(nextFolder);
    }
  }
}

function AddSubFoldersToURI(folder)
{
  var returnString = "";

  var subFolders = folder.subFolders;

  while (subFolders.hasMoreElements())
  {
    var nextFolder =
      subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);

    if (!(nextFolder.flags & Components.interfaces.nsMsgFolderFlags.Virtual))
    {
      if (!nextFolder.noSelect && !nextFolder.isServer)
      {
        if (returnString.length > 0)
          returnString += '|';
        returnString += nextFolder.URI;
      }
      var subFoldersString = AddSubFoldersToURI(nextFolder);
      if (subFoldersString.length > 0)
      {
        if (returnString.length > 0)
          returnString += '|';
        returnString += subFoldersString;
      }
    }
  }
  return returnString;
}


function GetScopeForFolder(folder)
{
  var searchLocalSystem = document.getElementById("menuSearchLocalSystem");
  return searchLocalSystem && searchLocalSystem.value == "local" ?
                              nsMsgSearchScope.offlineMail :
                              folder.server.searchScope;
}

var nsMsgViewSortType = Components.interfaces.nsMsgViewSortType;
var nsMsgViewSortOrder = Components.interfaces.nsMsgViewSortOrder;
var nsMsgViewFlagsType = Components.interfaces.nsMsgViewFlagsType;
var nsMsgViewCommandType = Components.interfaces.nsMsgViewCommandType;

function goUpdateSearchItems(commandset)
{
  for (var i = 0; i < commandset.childNodes.length; i++)
  {
    var commandID = commandset.childNodes[i].getAttribute("id");
    if (commandID)
    {
      goUpdateCommand(commandID);
    }
  }
}

function nsMsgSearchCommandUpdater()
{}

nsMsgSearchCommandUpdater.prototype =
{
  updateCommandStatus : function()
  {
    // the back end is smart and is only telling us to update command status
    // when the # of items in the selection has actually changed.
    document.commandDispatcher.updateCommands('mail-search');
  },
  displayMessageChanged : function(aFolder, aSubject, aKeywords)
  {
  },

  updateNextMessageAfterDelete : function()
  {
    SetNextMessageAfterDelete();
  },

  summarizeSelection: function() {return false},

  QueryInterface : function(iid)
  {
    if (iid.equals(Components.interfaces.nsIMsgDBViewCommandUpdater) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;

    throw Components.results.NS_NOINTERFACE;
  }
}

function setupDatasource() {
    gDBView = Components.classes["@mozilla.org/messenger/msgdbview;1?type=search"]
                        .createInstance(Components.interfaces.nsIMsgDBView);
    var count = new Object;
    var cmdupdator = new nsMsgSearchCommandUpdater();

    gDBView.init(messenger, msgWindow, cmdupdator);
    gDBView.open(null, nsMsgViewSortType.byId, nsMsgViewSortOrder.ascending, nsMsgViewFlagsType.kNone, count);

    // the thread pane needs to use the search datasource (to get the
    // actual list of messages) and the message datasource (to get any
    // attributes about each message)
    gSearchSession = Components.classes[searchSessionContractID].createInstance(Components.interfaces.nsIMsgSearchSession);

    var nsIFolderListener = Components.interfaces.nsIFolderListener;
    var notifyFlags = nsIFolderListener.event;
    Components.classes["@mozilla.org/messenger/services/session;1"]
              .getService(Components.interfaces.nsIMsgMailSession)
              .AddFolderListener(gFolderListener, notifyFlags);

    // the datasource is a listener on the search results
    gViewSearchListener = gDBView.QueryInterface(Components.interfaces.nsIMsgSearchNotify);
    gSearchSession.registerListener(gViewSearchListener);
}


function setupSearchListener()
{
    // Setup the javascript object as a listener on the search results
    gSearchSession.registerListener(gSearchNotificationListener);
}

// stuff after this is implemented to make the thread pane work
function GetFolderDatasource()
{
    if (!gFolderDatasource)
        gFolderDatasource = Components.classes["@mozilla.org/rdf/datasource;1?name=mailnewsfolders"]
                                      .getService(Components.interfaces.nsIRDFDataSource);
    return gFolderDatasource;
}

// used to determine if we should try to load a message
function IsThreadAndMessagePaneSplitterCollapsed()
{
    return true;
}

// used to toggle functionality for Search/Stop button.
function onSearchButton(event)
{
    if (event.target.label == gSearchBundle.getString("labelForSearchButton"))
        onSearch();
    else
        onSearchStop();
}

// threadPane.js will be needing this, too
function GetNumSelectedMessages()
{
   try {
       return gDBView.numSelected;
   }
   catch (ex) {
       return 0;
   }
}

function GetDBView()
{
    return gDBView;
}

function MsgDeleteSelectedMessages(aCommandType)
{
    SetNextMessageAfterDelete();
    gDBView.doCommand(aCommandType);
}

function SetNextMessageAfterDelete()
{
  gNextMessageViewIndexAfterDelete = gDBView.msgToSelectAfterDelete;
}

function HandleDeleteOrMoveMessageFailed(folder)
{
  gDBView.onDeleteCompleted(false);
  gNextMessageViewIndexAfterDelete = -2;
}

function HandleDeleteOrMoveMessageCompleted(folder)
{
  gDBView.onDeleteCompleted(true);
  var treeView = gDBView.QueryInterface(Components.interfaces.nsITreeView);
  var treeSelection = treeView.selection;
  var viewSize = treeView.rowCount;

  if (gNextMessageViewIndexAfterDelete == -2) {
    // a move or delete can cause our selection can change underneath us.
    // this can happen when the user
    // deletes message from the stand alone msg window
    // or the three pane
    if (!treeSelection) {
      // this can happen if you open the search window
      // and before you do any searches
      // and you do delete from another mail window
      return;
    }
    else if (treeSelection.count == 0) {
      // this can happen if you double clicked a message
      // in the thread pane, and deleted it from the stand alone msg window
      // see bug #185147
      treeSelection.clearSelection();

      UpdateMailSearch("delete from another view, 0 rows now selected");
    }
    else if (treeSelection.count == 1) {
      // this can happen if you had two messages selected
      // in the search results pane, and you deleted one of them from another view
      // (like the view in the stand alone msg window or the three pane)
      // since one item is selected, we should load it.
      var startIndex = {};
      var endIndex = {};
      treeSelection.getRangeAt(0, startIndex, endIndex);

      // select the selected item, so we'll load it
      treeSelection.select(startIndex.value);
      treeView.selectionChanged();

      EnsureRowInThreadTreeIsVisible(startIndex.value);
      UpdateMailSearch("delete from another view, 1 row now selected");
    }
    else {
      // this can happen if you have more than 2 messages selected
      // in the search results pane, and you deleted one of them from another view
      // (like the view in the stand alone msg window or the three pane)
      // since multiple messages are still selected, do nothing.
    }
  }
  else {
    if (gNextMessageViewIndexAfterDelete != nsMsgViewIndex_None && gNextMessageViewIndexAfterDelete >= viewSize)
    {
      if (viewSize > 0)
        gNextMessageViewIndexAfterDelete = viewSize - 1;
      else
      {
        gNextMessageViewIndexAfterDelete = nsMsgViewIndex_None;

        // there is nothing to select since viewSize is 0
        treeSelection.clearSelection();

        UpdateMailSearch("delete from current view, 0 rows left");
      }
    }

    // if we are about to set the selection with a new element then DON'T clear
    // the selection then add the next message to select. This just generates
    // an extra round of command updating notifications that we are trying to
    // optimize away.
    if (gNextMessageViewIndexAfterDelete != nsMsgViewIndex_None)
    {
      treeSelection.select(gNextMessageViewIndexAfterDelete);
      // since gNextMessageViewIndexAfterDelete probably has the same value
      // as the last index we had selected, the tree isn't generating a new
      // selectionChanged notification for the tree view. So we aren't loading the
      // next message. to fix this, force the selection changed update.
      if (treeView)
        treeView.selectionChanged();

      EnsureRowInThreadTreeIsVisible(gNextMessageViewIndexAfterDelete);

      // XXX TODO
      // I think there is a bug in the suppression code above.
      // what if I have two rows selected, and I hit delete,
      // and so we load the next row.
      // what if I have commands that only enable where
      // exactly one row is selected?
      UpdateMailSearch("delete from current view, at least one row selected");
    }
  }

  // default value after delete/move/copy is over
  gNextMessageViewIndexAfterDelete = -2;

  // something might have been deleted, so update the status text
  SetAdvancedSearchStatusText(viewSize);
}

function MoveMessageInSearch(destFolder)
{
  if (destFolder._folder)
  {
    try {
      SetNextMessageAfterDelete();
      gDBView.doCommandWithFolder(nsMsgViewCommandType.moveMessages,
                                  destFolder._folder);
    }
    catch (ex) {
      dump("MoveMessageInSearch failed: " + ex + "\n");
    }
  }
}

function GoToFolder()
{
  var hdr = gDBView.hdrForFirstSelectedMessage;
  MsgOpenNewWindowForFolder(hdr.folder.URI, hdr.messageKey);
}

function saveAsVirtualFolder()
{
  let searchFolderURIs = window.arguments[0].folder.URI;

  var searchSubfolders = document.getElementById("checkSearchSubFolders").checked;
  if (gMsgFolderSelected && (searchSubfolders || gMsgFolderSelected.isServer || gMsgFolderSelected.noSelect))
  {
    var subFolderURIs = AddSubFoldersToURI(gMsgFolderSelected);
    if (subFolderURIs.length > 0)
      searchFolderURIs += '|' + subFolderURIs;
  }

  var dialog = window.openDialog("chrome://messenger/content/virtualFolderProperties.xul", "",
                                 "chrome,titlebar,modal,centerscreen",
                                 {folder:window.arguments[0].folder,
                                  searchTerms:gSearchSession.searchTerms,
                                  searchFolderURIs: searchFolderURIs});
}

function OnTagsChange()
{
  // Dummy, called by RemoveAllMessageTags and ToggleMessageTag
}
