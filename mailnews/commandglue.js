/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/*
 * Command-specific code. This stuff should be called by the widgets
 */

Components.utils.import("resource:///modules/iteratorUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

//NOTE: gMessengerBundle and gBrandBundle must be defined and set
//      for this Overlay to work properly

var gFolderJustSwitched = false;
var gBeforeFolderLoadTime;
var gVirtualFolderTerms;
var gXFVirtualFolderTerms;
var gCurrentVirtualFolderUri;
var gPrevFolderFlags;
var gPrevSelectedFolder;
var gMsgFolderSelected;

function OpenURL(url)
{
  messenger.setWindow(window, msgWindow);
  messenger.openURL(url);
}

function GetMsgFolderFromResource(folderResource)
{
  if (!folderResource)
     return null;

  var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
  if (msgFolder && (msgFolder.parent || msgFolder.isServer))
    return msgFolder;
  else
    return null;
}

function GetServer(uri)
{
    if (!uri) return null;
    try {
        var folder = GetMsgFolderFromUri(uri, true);
        return folder.server;
    }
    catch (ex) {
        dump("GetServer("+uri+") failed, ex="+ex+"\n");
    }
    return null;
}

function LoadMessageByUri(uri)
{
  //dump("XXX LoadMessageByUri " + uri + " vs " + gCurrentDisplayedMessage + "\n");
  if(uri != gCurrentDisplayedMessage)
  {
        dump("fix this, get the nsIMsgDBHdr and the nsIMsgFolder from the uri...\n");
/*
    var resource = RDF.GetResource(uri);
    var message = resource.QueryInterface(Components.interfaces.nsIMessage);
    if (message)
      setTitleFromFolder(message.msgFolder, message.mimef2DecodedSubject);

    var nsIMsgFolder = Components.interfaces.nsIMsgFolder;
    if (message.msgFolder.server.downloadOnBiff)
      message.msgFolder.biffState = nsIMsgFolder.nsMsgBiffState_NoMail;
*/

    gCurrentDisplayedMessage = uri;
    gHaveLoadedMessage = true;
    OpenURL(uri);
  }

}

function setTitleFromFolder(msgfolder, subject)
{
    var title = subject || "";

    if (msgfolder)
    {
      if (title)
        title += " - ";

      title += msgfolder.prettyName;

      if (!msgfolder.isServer)
      {
        var server = msgfolder.server;
        var middle;
        var end;
        if (server.type == "nntp") {
          // <folder> on <hostname>
          middle = gMessengerBundle.getString("titleNewsPreHost");
          end = server.hostName;
        } else {
          // <folder> for <accountname>
          middle = gMessengerBundle.getString("titleMailPreHost");
          end = server.prettyName;
        }
        if (middle) title += " " + middle;
        if (end) title += " " + end;
      }
    }

    if (!/Mac/.test(navigator.platform))
      title += " - " + gBrandBundle.getString("brandShortName");

    document.title = title;

  // Notify the current tab, it might want to update also.
  var tabmail = GetTabMail();
  if (tabmail)
  {
    tabmail.saveCurrentTabState(); // gDBView may have changed!
    tabmail.setTabTitle();
  }
}

function UpdateMailToolbar(caller)
{
  //dump("XXX update mail-toolbar " + caller + "\n");
  document.commandDispatcher.updateCommands('mail-toolbar');

  // hook for extra toolbar items
  Services.obs.notifyObservers(window, "mail:updateToolbarItems", null);
}

/**
 * @param   folder                - If viewFolder is a single folder saved
                                  - search, this folder is the scope of the
                                  - saved search, the real, underlying folder.
                                  - Otherwise, it's the same as the viewFolder.
 * @param   viewFolder            - nsIMsgFolder selected in the folder pane.
                                  - Will be the same as folder, except if
                                  - it's a single folder saved search.
 * @param   viewType              - nsMsgViewType (see nsIMsgDBView.idl)
 * @param   viewFlags             - nsMsgViewFlagsType (see nsIMsgDBView.idl)
 * @param   sortType              - nsMsgViewSortType (see nsIMsgDBView.idl)
 * @param   sortOrder             - nsMsgViewSortOrder (see nsIMsgDBView.idl)
 **/
function ChangeFolder(folder, viewFolder, viewType, viewFlags, sortType, sortOrder)
{
  if (folder.URI == gCurrentLoadingFolderURI)
    return;

  SetUpToolbarButtons(folder.URI);

  // hook for extra toolbar items
  Services.obs.notifyObservers(window, "mail:setupToolbarItems", folder.URI);

  try {
      setTitleFromFolder(viewFolder, null);
  } catch (ex) {
      dump("error setting title: " + ex + "\n");
  }

  //if it's a server, clear the threadpane and don't bother trying to load.
  if (folder.isServer) {
    msgWindow.openFolder = null;

    ClearThreadPane();

    // Load AccountCentral page here.
    ShowAccountCentral();

    return;
  }
  else
  {
    if (folder.server.displayStartupPage)
    {
      gDisplayStartupPage = true;
      folder.server.displayStartupPage = false;
    }
  }

  // If the user clicks on folder, time to display thread pane and message pane.
  ShowThreadPane();

  gCurrentLoadingFolderURI = folder.URI;
  gNextMessageAfterDelete = null; // forget what message to select, if any

  gCurrentFolderToReroot = folder.URI;
  gCurrentLoadingFolderViewFlags = viewFlags;
  gCurrentLoadingFolderViewType = viewType;
  gCurrentLoadingFolderSortType = sortType;
  gCurrentLoadingFolderSortOrder = sortOrder;

  var showMessagesAfterLoading;
  try {
    let server = folder.server;
    if (Services.prefs.getBoolPref("mail.password_protect_local_cache"))
    {
      showMessagesAfterLoading = server.passwordPromptRequired;
      // servers w/o passwords (like local mail) will always be non-authenticated.
      // So we need to use the account manager for that case.
    }
    else
      showMessagesAfterLoading = false;
  }
  catch (ex) {
    showMessagesAfterLoading = false;
  }

  if (viewType != nsMsgViewType.eShowVirtualFolderResults &&
      (folder.manyHeadersToDownload || showMessagesAfterLoading))
  {
    gRerootOnFolderLoad = true;
    try
    {
      ClearThreadPane();
      SetBusyCursor(window, true);
      folder.startFolderLoading();
      folder.updateFolder(msgWindow);
    }
    catch(ex)
    {
      SetBusyCursor(window, false);
      dump("Error loading with many headers to download: " + ex + "\n");
    }
  }
  else
  {
    if (viewType != nsMsgViewType.eShowVirtualFolderResults)
      SetBusyCursor(window, true);
    RerootFolder(folder.URI, folder, viewType, viewFlags, sortType, sortOrder);
    gRerootOnFolderLoad = false;
    folder.startFolderLoading();

    //Need to do this after rerooting folder.  Otherwise possibility of receiving folder loaded
    //notification before folder has actually changed.
    if (viewType != nsMsgViewType.eShowVirtualFolderResults)
      folder.updateFolder(msgWindow);
  }
}

function isNewsURI(uri)
{
  return ((/^news-message:/.test(uri)) || (/^news:/.test(uri)));
}

function RerootFolder(uri, newFolder, viewType, viewFlags, sortType, sortOrder)
{
  viewDebug("In reroot folder, sortType = " +  sortType + "viewType = " + viewType + "\n");
  if (sortType == 0)
  {
    try
    {
      var dbFolderInfo = newFolder.msgDatabase.dBFolderInfo;
      sortType = dbFolderInfo.sortType;
      sortOrder = dbFolderInfo.sortOrder;
      viewFlags = dbFolderInfo.viewFlags;
      viewType = dbFolderInfo.viewType;
      dbFolderInfo = null;
    }
    catch(ex)
    {
      dump("invalid db in RerootFolder: " + ex + "\n");
    }
  }

  // workaround for #39655
  gFolderJustSwitched = true;

  ClearThreadPaneSelection();

  //Clear the new messages of the old folder
  var oldFolder = gPrevSelectedFolder;
  if (oldFolder) {
      oldFolder.clearNewMessages();
    oldFolder.hasNewMessages = false;
  }

  //Set the window's new open folder.
  msgWindow.openFolder = newFolder;

  //the new folder being selected should have its biff state get cleared.
  if(newFolder)
  {
    newFolder.biffState =
          Components.interfaces.nsIMsgFolder.nsMsgBiffState_NoMail;
  }

  //Clear out the thread pane so that we can sort it with the new sort id without taking any time.
  // folder.setAttribute('ref', "");

  // null this out, so we don't try sort.
  if (gDBView) {
    gDBView.close();
    gDBView = null;
  }

  // cancel the pending mark as read timer
  ClearPendingReadTimer();

  // If this is the  sent, drafts, templates, or send later folder,
  // we show "Recipient" instead of "Author".
  const nsMsgFolderFlags = Components.interfaces.nsMsgFolderFlags;
  let outgoingFlags = nsMsgFolderFlags.SentMail | nsMsgFolderFlags.Drafts |
                      nsMsgFolderFlags.Templates | nsMsgFolderFlags.Queue;
  SetSentFolderColumns(newFolder.isSpecialFolder(outgoingFlags, true));
  ShowLocationColumn(viewType == nsMsgViewType.eShowVirtualFolderResults);
  // Only show 'Received' column for e-mails.  For newsgroup messages, the 'Date' header is as reliable as an e-mail's
  // 'Received' header, as it is replaced with the news server's (more reliable) date.
  UpdateReceivedColumn(newFolder);

  // now create the db view, which will sort it.
  CreateDBView(newFolder, viewType, viewFlags, sortType, sortOrder);
  if (oldFolder)
  {
    /*disable quick search clear button if we were in the search view on folder switching*/
    disableQuickSearchClearButton();

     /*we don't null out the db reference for inbox because inbox is like the "main" folder
       and performance outweighs footprint */
    if (!oldFolder.isSpecialFolder(nsMsgFolderFlags.Inbox, false))
      if (oldFolder.URI != newFolder.URI)
        oldFolder.msgDatabase = null;
  }
  // that should have initialized gDBView, now re-root the thread pane
  RerootThreadPane();

  UpdateLocationBar(gMsgFolderSelected);

  UpdateStatusMessageCounts(gMsgFolderSelected);

  UpdateMailToolbar("reroot folder in 3 pane");
  // hook for extra toolbar items
  Services.obs.notifyObservers(window, "mail:updateToolbarItems", null);
  // this is to kick off cross-folder searches for virtual folders.
  if (gSearchSession && !gVirtualFolderTerms) // another var might be better...
  {
    viewDebug("doing a xf folder search in rerootFolder\n");
    gCurrentLoadingFolderURI = "";
    ViewChangeByFolder(newFolder);
    gPreQuickSearchView = null; // don't remember the cross folder search
    ScrollToMessageAfterFolderLoad(newFolder);
  }
}

function SwitchView(command)
{
  // when switching thread views, we might be coming out of quick search
  // or a message view.
  // first set view picker to all
  ViewChangeByValue(kViewItemAll);

  // clear the QS text, if we need to
  ClearQSIfNecessary();

  // now switch views
  var oldSortType = gDBView ? gDBView.sortType : nsMsgViewSortType.byThread;
  var oldSortOrder = gDBView ? gDBView.sortOrder : nsMsgViewSortOrder.ascending;
  var viewFlags = gDBView ? gDBView.viewFlags : gCurViewFlags;

  // close existing view.
  if (gDBView) {
    gDBView.close();
    gDBView = null;
  }

  switch(command)
  {
    // "All" threads and "Unread" threads don't change threading state
    case "cmd_viewAllMsgs":
      viewFlags = viewFlags & ~nsMsgViewFlagsType.kUnreadOnly;
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowAllThreads, viewFlags,
            oldSortType, oldSortOrder);
      break;
    case "cmd_viewUnreadMsgs":
      viewFlags = viewFlags | nsMsgViewFlagsType.kUnreadOnly;
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowAllThreads, viewFlags,
            oldSortType, oldSortOrder );
      break;
    // "Threads with Unread" and "Watched Threads with Unread" force threading
    case "cmd_viewThreadsWithUnread":
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowThreadsWithUnread, nsMsgViewFlagsType.kThreadedDisplay,
            oldSortType, oldSortOrder);
      break;
    case "cmd_viewWatchedThreadsWithUnread":
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowWatchedThreadsWithUnread, nsMsgViewFlagsType.kThreadedDisplay,
            oldSortType, oldSortOrder);
      break;
    // "Ignored Threads" toggles 'ignored' inclusion --
    //   but it also resets 'With Unread' views to 'All'
    case "cmd_viewIgnoredThreads":
      if (viewFlags & nsMsgViewFlagsType.kShowIgnored)
        viewFlags = viewFlags & ~nsMsgViewFlagsType.kShowIgnored;
      else
        viewFlags = viewFlags | nsMsgViewFlagsType.kShowIgnored;
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowAllThreads, viewFlags,
            oldSortType, oldSortOrder);
      break;
  }

  RerootThreadPane();

  // this is to kick off cross-folder searches for virtual folders.
  if (gSearchSession && !gVirtualFolderTerms) // another var might be better...
  {
    gDBView.searchSession = gSearchSession;
    gSearchSession.search(msgWindow);
  }
}

function SetSentFolderColumns(isSentFolder)
{
  var tree = GetThreadTree();
  var searchBox = document.getElementById("searchInput");

  var lastFolderSent = tree.getAttribute("lastfoldersent") == "true";
  if (isSentFolder != lastFolderSent)
  {
    var senderColumn = document.getElementById("senderCol");
    var recipientColumn = document.getElementById("recipientCol");

    var saveHidden = senderColumn.getAttribute("hidden");
    senderColumn.setAttribute("hidden", senderColumn.getAttribute("swappedhidden"));
    senderColumn.setAttribute("swappedhidden", saveHidden);

    saveHidden = recipientColumn.getAttribute("hidden");
    recipientColumn.setAttribute("hidden", recipientColumn.getAttribute("swappedhidden"));
    recipientColumn.setAttribute("swappedhidden", saveHidden);
  }

  tree.setAttribute("lastfoldersent", isSentFolder ? "true" : "false");
}

function ShowLocationColumn(show)
{
  var col = document.getElementById("locationCol");
  if (col) {
    if (show) {
      col.removeAttribute("hidden");
      col.removeAttribute("ignoreincolumnpicker");
    }
    else {
      col.setAttribute("hidden","true");
      col.setAttribute("ignoreincolumnpicker","true");
    }
  }
}

function UpdateReceivedColumn(newFolder)
{
  // Only show 'Received' column for e-mails.  For newsgroup messages, the 'Date' header is as reliable as an e-mail's
  // 'Received' header, as it is replaced with the news server's (more reliable) date.
  var receivedColumn = document.getElementById("receivedCol");

  const nsMsgFolderFlags = Components.interfaces.nsMsgFolderFlags;
  var newFolderShowsRcvd = (newFolder.flags & nsMsgFolderFlags.Mail) &&
    !(newFolder.flags & (nsMsgFolderFlags.Queue | nsMsgFolderFlags.Templates |
                         nsMsgFolderFlags.Drafts | nsMsgFolderFlags.SentMail));

  var tempHidden = receivedColumn.getAttribute("temphidden") == "true";
  var isHidden = receivedColumn.getAttribute("hidden") == "true";

  if (!newFolderShowsRcvd && !isHidden)
  {
    // Record state & hide
    receivedColumn.setAttribute("temphidden", "true");
    receivedColumn.setAttribute("hidden", "true");
  }
  else if (newFolderShowsRcvd && tempHidden && isHidden)
  {
    receivedColumn.setAttribute("hidden", "false");
  }

  if (newFolderShowsRcvd)
  {
    receivedColumn.removeAttribute("ignoreincolumnpicker");
    receivedColumn.removeAttribute("temphidden");
  }
  else
    receivedColumn.setAttribute("ignoreincolumnpicker", "true");
}


function SetNewsFolderColumns()
{
  var sizeColumn = document.getElementById("sizeCol");

  if (gDBView.usingLines) {
     sizeColumn.setAttribute("tooltiptext",gMessengerBundle.getString("linesColumnTooltip2"));
     sizeColumn.setAttribute("label",gMessengerBundle.getString("linesColumnHeader"));
  }
  else {
     sizeColumn.setAttribute("tooltiptext", gMessengerBundle.getString("sizeColumnTooltip2"));
     sizeColumn.setAttribute("label", gMessengerBundle.getString("sizeColumnHeader"));
  }
}

function UpdateStatusMessageCounts(folder)
{
  var unreadElement = GetUnreadCountElement();
  var totalElement = GetTotalCountElement();
  if(folder && unreadElement && totalElement)
  {
    var numSelected = GetNumSelectedMessages();

    var numUnread = (numSelected > 1) ?
            gMessengerBundle.getFormattedString("selectedMsgStatus",
                                                [numSelected]) :
            gMessengerBundle.getFormattedString("unreadMsgStatus",
                                                [ folder.getNumUnread(false)]);
    var numTotal =
            gMessengerBundle.getFormattedString("totalMsgStatus",
                                                [folder.getTotalMessages(false)]);

    unreadElement.setAttribute("label", numUnread);
    totalElement.setAttribute("label", numTotal);
    unreadElement.hidden = false;
    totalElement.hidden = false;

  }

}

function ConvertSortTypeToColumnID(sortKey)
{
  var columnID;

  // Hack to turn this into an integer, if it was a string.
  // It would be a string if it came from xulstore.json
  sortKey = sortKey - 0;

  switch (sortKey) {
    // In the case of None, we default to the date column
    // This appears to be the case in such instances as
    // Global search, so don't complain about it.
    case nsMsgViewSortType.byNone:
    case nsMsgViewSortType.byDate:
      columnID = "dateCol";
      break;
    case nsMsgViewSortType.byReceived:
      columnID = "receivedCol";
      break;
    case nsMsgViewSortType.byAuthor:
      columnID = "senderCol";
      break;
    case nsMsgViewSortType.byRecipient:
      columnID = "recipientCol";
      break;
    case nsMsgViewSortType.bySubject:
      columnID = "subjectCol";
      break;
    case nsMsgViewSortType.byLocation:
      columnID = "locationCol";
      break;
    case nsMsgViewSortType.byAccount:
      columnID = "accountCol";
      break;
    case nsMsgViewSortType.byUnread:
      columnID = "unreadButtonColHeader";
      break;
    case nsMsgViewSortType.byStatus:
      columnID = "statusCol";
      break;
    case nsMsgViewSortType.byTags:
      columnID = "tagsCol";
      break;
    case nsMsgViewSortType.bySize:
      columnID = "sizeCol";
      break;
    case nsMsgViewSortType.byPriority:
      columnID = "priorityCol";
      break;
    case nsMsgViewSortType.byFlagged:
      columnID = "flaggedCol";
      break;
    case nsMsgViewSortType.byThread:
      columnID = "threadCol";
      break;
    case nsMsgViewSortType.byId:
      columnID = "idCol";
      break;
    case nsMsgViewSortType.byJunkStatus:
      columnID = "junkStatusCol";
      break;
    case nsMsgViewSortType.byAttachments:
      columnID = "attachmentCol";
      break;
    case nsMsgViewSortType.byCustom:
      columnID = gDBView.db.dBFolderInfo.getProperty("customSortCol");
      if (!columnID) {
        dump("ConvertSortTypeToColumnID: custom sort key but columnID not found\n");
        columnID = "dateCol";
      }
      break;
    default:
      dump("unsupported sort key: " + sortKey + "\n");
      columnID = null;
      break;
  }
  return columnID;
}

var nsMsgViewSortType = Components.interfaces.nsMsgViewSortType;
var nsMsgViewSortOrder = Components.interfaces.nsMsgViewSortOrder;
var nsMsgViewFlagsType = Components.interfaces.nsMsgViewFlagsType;
var nsMsgViewCommandType = Components.interfaces.nsMsgViewCommandType;
var nsMsgViewType = Components.interfaces.nsMsgViewType;
var nsMsgNavigationType = Components.interfaces.nsMsgNavigationType;

var gDBView = null;
var gCurViewFlags;
var gCurSortType;

// CreateDBView is called when we have a thread pane. CreateBareDBView is called when there is no
// tree associated with the view. CreateDBView will call into CreateBareDBView...

function CreateBareDBView(originalView, msgFolder, viewType, viewFlags, sortType, sortOrder)
{
  var dbviewContractId = "@mozilla.org/messenger/msgdbview;1?type=";
  // hack to turn this into an integer, if it was a string
  // it would be a string if it came from xulstore.json
  viewType = viewType - 0;

  switch (viewType) {
      case nsMsgViewType.eShowQuickSearchResults:
          dbviewContractId += "quicksearch";
          break;
      case nsMsgViewType.eShowSearch:
          dbviewContractId += "search";
          break;
      case nsMsgViewType.eShowThreadsWithUnread:
          dbviewContractId += "threadswithunread";
          break;
      case nsMsgViewType.eShowWatchedThreadsWithUnread:
          dbviewContractId += "watchedthreadswithunread";
          break;
      case nsMsgViewType.eShowVirtualFolderResults:
          dbviewContractId += "xfvf";
          break;
      case nsMsgViewType.eShowAllThreads:
      default:
          if (viewFlags & nsMsgViewFlagsType.kGroupBySort)
            dbviewContractId += "group";
          else
            dbviewContractId += "threaded";
          break;
  }

//  dump ("contract id = " + dbviewContractId + "original view = " + originalView + "\n");
  if (!originalView)
    gDBView = Components.classes[dbviewContractId].createInstance(Components.interfaces.nsIMsgDBView);

  gCurViewFlags = viewFlags;
  var count = new Object;
  if (!gThreadPaneCommandUpdater)
    gThreadPaneCommandUpdater = new nsMsgDBViewCommandUpdater();

  gCurSortType = sortType;

  if (!originalView) {
    gDBView.init(messenger, msgWindow, gThreadPaneCommandUpdater);
    gDBView.open(msgFolder, gCurSortType, sortOrder, viewFlags, count);
    if (viewType == nsMsgViewType.eShowVirtualFolderResults)
    {
      // the view is a listener on the search results
      gViewSearchListener = gDBView.QueryInterface(Components.interfaces.nsIMsgSearchNotify);
      gSearchSession.registerListener(gViewSearchListener);
    }
  }
  else {
    gDBView = originalView.cloneDBView(messenger, msgWindow, gThreadPaneCommandUpdater);
  }
}

function CreateDBView(msgFolder, viewType, viewFlags, sortType, sortOrder)
{
  // call the inner create method
  CreateBareDBView(null, msgFolder, viewType, viewFlags, sortType, sortOrder);

  // now do tree specific work

  // based on the collapsed state of the thread pane/message pane splitter,
  // suppress message display if appropriate.
  gDBView.suppressMsgDisplay = IsMessagePaneCollapsed();

  UpdateSortIndicators(gCurSortType, sortOrder);
  Services.obs.notifyObservers(msgFolder, "MsgCreateDBView", viewType + ":" + viewFlags);
}

function FolderPaneSelectionChange()
{
    var folderTree = GetFolderTree();
    var folderSelection = folderTree.view.selection;

    // This prevents a folder from being loaded in the case that the user
    // has right-clicked on a folder different from the one that was
    // originally highlighted.  On a right-click, the highlight (selection)
    // of a row will be different from the value of currentIndex, thus if
    // the currentIndex is not selected, it means the user right-clicked
    // and we don't want to load the contents of the folder.
    if (!folderSelection.isSelected(folderSelection.currentIndex))
      return;

    if(gTimelineEnabled) {
      gTimelineService.startTimer("FolderLoading");
      gTimelineService.enter("FolderLoading has Started");
    }

    gVirtualFolderTerms = null;
    gXFVirtualFolderTerms = null;

    let folders = GetSelectedMsgFolders();
    if (folders.length == 1)
    {
        let msgFolder = folders[0];
        let uriToLoad = msgFolder.URI;

        if (msgFolder == gMsgFolderSelected)
           return;
        // If msgFolder turns out to be a single folder saved search, not a virtual folder,
        // realFolder will get set to the underlying folder the saved search is based on.
        let realFolder = msgFolder;
        gPrevSelectedFolder = gMsgFolderSelected;
        gMsgFolderSelected = msgFolder;
        UpdateLocationBar(gMsgFolderSelected);
        var folderFlags = msgFolder.flags;
        const kVirtual = Components.interfaces.nsMsgFolderFlags.Virtual;
        // if this is same folder, and we're not showing a virtual folder
        // then do nothing.
        if (msgFolder == msgWindow.openFolder &&
            !(folderFlags & kVirtual) && !(gPrevFolderFlags & kVirtual))
          return;

            OnLeavingFolder(gPrevSelectedFolder);  // mark all read in last folder
            var sortType = 0;
            var sortOrder = 0;
            var viewFlags = 0;
            var viewType = 0;
            gDefaultSearchViewTerms = null;
            gVirtualFolderTerms = null;
            gXFVirtualFolderTerms = null;
            gPrevFolderFlags = folderFlags;
            gCurrentVirtualFolderUri = null;
            // don't get the db if this folder is a server
            // we're going to be display account central
            if (!(msgFolder.isServer))
            {
              try
              {
                var msgDatabase = msgFolder.msgDatabase;
                if (msgDatabase)
                {
                  gSearchSession = null;
                  var dbFolderInfo = msgDatabase.dBFolderInfo;
                  sortType = dbFolderInfo.sortType;
                  sortOrder = dbFolderInfo.sortOrder;
                  viewType = dbFolderInfo.viewType;
                  viewFlags = dbFolderInfo.viewFlags;
                  if (folderFlags & kVirtual)
                  {
                    viewType = nsMsgViewType.eShowQuickSearchResults;
                    var searchTermString = dbFolderInfo.getCharProperty("searchStr");
                    // trick the view code into updating the real folder...
                    gCurrentVirtualFolderUri = uriToLoad;
                    var srchFolderUri = dbFolderInfo.getCharProperty("searchFolderUri");
                    var srchFolderUriArray = srchFolderUri.split('|');
                    var searchOnline = dbFolderInfo.getBooleanProperty("searchOnline", false);
                    // cross folder search
                    var filterService = Components.classes["@mozilla.org/messenger/services/filters;1"].getService(Components.interfaces.nsIMsgFilterService);
                    var filterList = filterService.getTempFilterList(msgFolder);
                    var tempFilter = filterList.createFilter("temp");
                    filterList.parseCondition(tempFilter, searchTermString);
                    if (srchFolderUriArray.length > 1)
                    {
                      viewType = nsMsgViewType.eShowVirtualFolderResults;
                      gXFVirtualFolderTerms = CreateGroupedSearchTerms(tempFilter.searchTerms);
                      setupXFVirtualFolderSearch(srchFolderUriArray, gXFVirtualFolderTerms, searchOnline);
                      // need to set things up so that reroot folder issues the search
                    }
                    else
                    {
                      uriToLoad = srchFolderUri;
                      // we need to load the db for the actual folder so that many hdrs to download
                      // will return false...
                      realFolder = GetMsgFolderFromUri(uriToLoad);
                      msgDatabase = realFolder.msgDatabase;
//                      dump("search term string = " + searchTermString + "\n");

                      gVirtualFolderTerms = CreateGroupedSearchTerms(tempFilter.searchTerms);
                    }
                  }
                  msgDatabase = null;
                  dbFolderInfo = null;
                }
              }
              catch (ex)
              {
                dump("failed to get view & sort values.  ex = " + ex +"\n");
              }
            }
            // clear cached view if we have no db or a pending quick search
            if (!gDBView || gDBView.viewType == nsMsgViewType.eShowQuickSearchResults)
            {
              if (gPreQuickSearchView) //close cached view before quick search
              {
                gPreQuickSearchView.close();
                gPreQuickSearchView = null;
              }
              var searchInput = document.getElementById("searchInput");  //reset the search input on folder switch
              if (searchInput)
                searchInput.value = "";
            }
            ClearMessagePane();

            if (gXFVirtualFolderTerms)
              viewType = nsMsgViewType.eShowVirtualFolderResults;
            else if (gSearchEmailAddress || gVirtualFolderTerms)
              viewType = nsMsgViewType.eShowQuickSearchResults;
            else if (viewType == nsMsgViewType.eShowQuickSearchResults)
              viewType = nsMsgViewType.eShowAllThreads;  //override viewType - we don't want to start w/ quick search
            ChangeFolder(realFolder, msgFolder, viewType, viewFlags, sortType, sortOrder);
           if (gVirtualFolderTerms)
             gDBView.viewFolder = msgFolder;

    let tabmail = GetTabMail();
    if (tabmail)
    {
      tabmail.saveCurrentTabState(); // gDBView may have changed!
      tabmail.setTabTitle();
    }
  }
    else
    {
        msgWindow.openFolder = null;
        ClearThreadPane();
    }

    if (gAccountCentralLoaded)
      UpdateMailToolbar("gAccountCentralLoaded");

    if (gDisplayStartupPage)
    {
        loadStartPage();
        gDisplayStartupPage = false;
        UpdateMailToolbar("gDisplayStartupPage");
    }
}

function ClearThreadPane()
{
  if (gDBView) {
    gDBView.close();
    gDBView = null;
  }
}

var mailOfflineObserver = {
  observe: function(subject, topic, state) {
    // sanity checks
    if (topic != "network:offline-status-changed") return;
    MailOfflineStateChanged(state == "offline");
  }
}

function AddMailOfflineObserver()
{
  Services.obs.addObserver(mailOfflineObserver, "network:offline-status-changed", false);
}

function RemoveMailOfflineObserver()
{
  Services.obs.removeObserver(mailOfflineObserver, "network:offline-status-changed");
}

function getSearchTermString(searchTerms)
{
  var searchIndex;
  var condition = "";
  var count = searchTerms.Count();
  for (searchIndex = 0; searchIndex < count; )
  {
    var term = searchTerms.QueryElementAt(searchIndex++, Components.interfaces.nsIMsgSearchTerm);

    if (condition.length > 1)
      condition += ' ';

    if (term.matchAll)
    {
        condition = "ALL";
        break;
    }
    condition += (term.booleanAnd) ? "AND (" : "OR (";
    condition += term.termAsString + ')';
  }
  return condition;
}

function  CreateVirtualFolder(newName, parentFolder, searchFolderURIs, searchTerms, searchOnline)
{
  // ### need to make sure view/folder doesn't exist.
  if (searchFolderURIs && (searchFolderURIs != "") && newName && (newName != ""))
  {
    var newFolder;
    try
    {
      if (parentFolder instanceof(Components.interfaces.nsIMsgLocalMailFolder))
        newFolder = parentFolder.createLocalSubfolder(newName);
      else
        newFolder = parentFolder.addSubfolder(newName);
      newFolder.setFlag(Components.interfaces.nsMsgFolderFlags.Virtual);
      var vfdb = newFolder.msgDatabase;
      var searchTermString = getSearchTermString(searchTerms);
      var dbFolderInfo = vfdb.dBFolderInfo;
      // set the view string as a property of the db folder info
      // set the original folder name as well.
      dbFolderInfo.setCharProperty("searchStr", searchTermString);
      dbFolderInfo.setCharProperty("searchFolderUri", searchFolderURIs);
      dbFolderInfo.setBooleanProperty("searchOnline", searchOnline);
      vfdb.summaryValid = true;
      vfdb.Close(true);
      parentFolder.NotifyItemAdded(newFolder);
      var accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
      accountManager.saveVirtualFolders();
    }
    catch(e)
    {
      throw(e); // so that the dialog does not automatically close
      dump ("Exception : creating virtual folder \n");
    }
  }
  else
  {
    dump("no name or nothing selected\n");
  }
}

var searchSessionContractID = "@mozilla.org/messenger/searchSession;1";
var gSearchView;
var gSearchSession;

var nsIMsgFolder = Components.interfaces.nsIMsgFolder;
var nsIMsgWindow = Components.interfaces.nsIMsgWindow;
var nsMsgSearchScope = Components.interfaces.nsMsgSearchScope;

var gFolderDatasource;
var gFolderPicker;
var gStatusBar = null;
var gTimelineEnabled = false;
var gMessengerBundle = null;

// Datasource search listener -- made global as it has to be registered
// and unregistered in different functions.
var gDataSourceSearchListener;
var gViewSearchListener;

var gMailSession;

function GetScopeForFolder(folder)
{
  return folder.server.searchScope;
}

function setupXFVirtualFolderSearch(folderUrisToSearch, searchTerms, searchOnline)
{
    var count = new Object;
  var i;

    gSearchSession = Components.classes[searchSessionContractID].createInstance(Components.interfaces.nsIMsgSearchSession);

    gMailSession = Components.classes["@mozilla.org/messenger/services/session;1"]
                             .getService(Components.interfaces.nsIMsgMailSession);

  for (i in folderUrisToSearch)
    {
      let realFolder = GetMsgFolderFromUri(folderUrisToSearch[i]);
      if (!realFolder.isServer)
        gSearchSession.addScopeTerm(!searchOnline ? nsMsgSearchScope.offlineMail : GetScopeForFolder(realFolder), realFolder);
    }

    var termsArray = searchTerms.QueryInterface(Components.interfaces.nsISupportsArray);
    const nsIMsgSearchTerm = Components.interfaces.nsIMsgSearchTerm;
    for (let term in fixIterator(termsArray, nsIMsgSearchTerm)) {
      gSearchSession.appendTerm(term);
    }
}

function CreateGroupedSearchTerms(searchTermsArray)
{

  var searchSession = gSearchSession ||
    Components.classes[searchSessionContractID].createInstance(Components.interfaces.nsIMsgSearchSession);

  // create a temporary isupports array to store our search terms
  // since we will be modifying the terms so they work with quick search
  var searchTermsArrayForQS = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);

  var numEntries = searchTermsArray.Count();
  for (var i = 0; i < numEntries; i++) {
    var searchTerm = searchTermsArray.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgSearchTerm);

    // clone the term, since we might be modifying it
    var searchTermForQS = searchSession.createTerm();
    searchTermForQS.value = searchTerm.value;
    searchTermForQS.attrib = searchTerm.attrib;
    searchTermForQS.arbitraryHeader = searchTerm.arbitraryHeader
    searchTermForQS.hdrProperty = searchTerm.hdrProperty;
    searchTermForQS.customId = searchTerm.customId
    searchTermForQS.op = searchTerm.op;

    // mark the first node as a group
    if (i == 0)
      searchTermForQS.beginsGrouping = true;
    else if (i == numEntries - 1)
      searchTermForQS.endsGrouping = true;

    // turn the first term to true to work with quick search...
    searchTermForQS.booleanAnd = i ? searchTerm.booleanAnd : true;

    searchTermsArrayForQS.AppendElement(searchTermForQS);
  }
  return searchTermsArrayForQS;
}

function OnLeavingFolder(aFolder)
{
  try
  {
    // Mark all messages of aFolder as read:
    // We can't use the command controller, because it is already tuned in to the
    // new folder, so we just mimic its behaviour wrt goDoCommand('cmd_markAllRead').
    if (gDBView && Services.prefs.getBoolPref("mailnews.mark_message_read." + aFolder.server.type))
    {
      gDBView.doCommand(nsMsgViewCommandType.markAllRead);
    }
  }
  catch(e){/* ignore */}
}

var gViewDebug = false;

function viewDebug(str)
{
  if (gViewDebug)
    dump(str);
}

