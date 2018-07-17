/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource:///modules/mailServices.js");

//NOTE: gMessengerBundle must be defined and set or this Overlay won't work

/**
 * Function to change the highlighted row back to the row that is currently
 * outline/dotted without loading the contents of either rows. This is
 * triggered when the context menu for a given row is hidden/closed
 * (onpopuphiding).
 * @param tree the tree element to restore selection for
 */
function RestoreSelectionWithoutContentLoad(tree)
{
    // If a delete or move command had been issued, then we should
    // reset gRightMouseButtonDown and gThreadPaneDeleteOrMoveOccurred
    // and return (see bug 142065).
    if(gThreadPaneDeleteOrMoveOccurred)
    {
      gRightMouseButtonDown = false;
      gThreadPaneDeleteOrMoveOccurred = false;
      return;
    }

    var treeSelection = tree.view.selection;

    // make sure that currentIndex is valid so that we don't try to restore
    // a selection of an invalid row.
    if((!treeSelection.isSelected(treeSelection.currentIndex)) &&
       (treeSelection.currentIndex >= 0))
    {
        treeSelection.selectEventsSuppressed = true;
        treeSelection.select(treeSelection.currentIndex);
        treeSelection.selectEventsSuppressed = false;

        // Keep track of which row in the thread pane is currently selected.
        // This is currently only needed when deleting messages.  See
        // declaration of var in msgMail3PaneWindow.js.
        if(tree.id == "threadTree")
          gThreadPaneCurrentSelectedIndex = treeSelection.currentIndex;
    }
    else if(treeSelection.currentIndex < 0)
        // Clear the selection in the case of when a folder has just been
        // loaded where the message pane does not have a message loaded yet.
        // When right-clicking a message in this case and dismissing the
        // popup menu (by either executing a menu command or clicking
        // somewhere else),  the selection needs to be cleared.
        // However, if the 'Delete Message' or 'Move To' menu item has been
        // selected, DO NOT clear the selection, else it will prevent the
        // tree view from refreshing.
        treeSelection.clearSelection();

    // Need to reset gRightMouseButtonDown to false here because
    // TreeOnMouseDown() is only called on a mousedown, not on a key down.
    // So resetting it here allows the loading of messages in the messagepane
    // when navigating via the keyboard or the toolbar buttons *after*
    // the context menu has been dismissed.
    gRightMouseButtonDown = false;
}

/**
 * Function to clear out the global nsContextMenu, and in the case when we
 * are a threadpane context menu, restore the selection so that a right-click
 * on a non-selected row doesn't move the selection.
 * @param aTarget the target of the popup event
 */
function MailContextOnPopupHiding(aTarget)
{
  gContextMenu.hiding();
  gContextMenu = null;
  if (InThreadPane(aTarget))
    RestoreSelectionWithoutContentLoad(GetThreadTree());
}

/**
 * Determines whether the context menu was triggered by a node that's a child
 * of the threadpane by looking for an ancestor node with id="threadTree".
 * @param aTarget the target of the popup event
 * @return true if the popupNode is a child of the threadpane, otherwise false
 */
function InThreadPane(aTarget)
{
  var node = aTarget.triggerNode;
  while (node)
  {
    if (node.id == "threadTree")
      return true;
    node = node.parentNode;
  }
  return false;
}

/**
 * Function to set up the global nsContextMenu, and the mailnews overlay.
 * @param aTarget the target of the popup event
 * @return true always
 */
function FillMailContextMenu(aTarget, aEvent)
{
  var inThreadPane = InThreadPane(aTarget);
  gContextMenu = new nsContextMenu(aTarget);

  // Need to call nsContextMenu's initItems to hide what is not used.
  gContextMenu.initItems();

  // Initialize gContextMenuContentData.
  if (aEvent)
    gContextMenu.initContentData(aEvent);

  var numSelected = GetNumSelectedMessages();
  var oneOrMore = (numSelected > 0);
  var single = (numSelected == 1);

  var isNewsgroup = gFolderDisplay.selectedMessageIsNews;

  // Clear the global var used to keep track if a 'Delete Message' or 'Move
  // To' command has been triggered via the thread pane context menu.
  gThreadPaneDeleteOrMoveOccurred = false;

  // Don't show mail items for links/images, just show related items.
  var showMailItems = inThreadPane ||
                      (!gContextMenu.onImage && !gContextMenu.onLink);

  // Select-all and copy are only available in the message-pane
  ShowMenuItem("context-selectall", single && !inThreadPane);
  ShowMenuItem("context-copy", !inThreadPane);

  ShowMenuItem("mailContext-openNewWindow", inThreadPane && single);
  ShowMenuItem("mailContext-openNewTab",    inThreadPane && single);
  ShowMenuItem("mailContext-downloadflagged",
               inThreadPane || (numSelected > 1));
  ShowMenuItem("mailContext-downloadselected",
               inThreadPane || (numSelected > 1));

  ShowMenuItem("mailContext-editAsNew", showMailItems && oneOrMore);
  ShowMenuItem("mailContext-replySender", showMailItems && single);
  ShowMenuItem("mailContext-replyList",
               showMailItems && single && !isNewsgroup && IsListPost());
  ShowMenuItem("mailContext-replyNewsgroup",
               showMailItems && single && isNewsgroup);
  ShowMenuItem("mailContext-replySenderAndNewsgroup",
               showMailItems && single && isNewsgroup);
  ShowMenuItem("mailContext-replyAll", showMailItems && single);
  ShowMenuItem("mailContext-forward", showMailItems && single);
  ShowMenuItem("mailContext-forwardAsAttachment",
               showMailItems && (numSelected > 1));
  ShowMenuItem("mailContext-copyMessageUrl",
               showMailItems && single && isNewsgroup);
  ShowMenuItem("mailContext-archive", showMailItems && oneOrMore &&
               gFolderDisplay.canArchiveSelectedMessages);

  // Set up the move menu. We can't move from newsgroups.
  // Disable move if we can't delete message(s) from this folder.
  var msgFolder = GetLoadedMsgFolder();
  ShowMenuItem("mailContext-moveMenu",
               showMailItems && oneOrMore && !isNewsgroup);
  EnableMenuItem("mailContext-moveMenu",
                 oneOrMore && msgFolder && msgFolder.canDeleteMessages);

  // Copy is available as long as something is selected.
  var canCopy = showMailItems && oneOrMore && (!gMessageDisplay.isDummy ||
                                               window.arguments[0].scheme == "file");
  ShowMenuItem("mailContext-copyMenu", canCopy);
  ShowMenuItem("mailContext-tags", showMailItems && oneOrMore);
  ShowMenuItem("mailContext-mark", showMailItems && oneOrMore);
  ShowMenuItem("mailContext-saveAs", showMailItems && oneOrMore);
  ShowMenuItem("mailContext-printpreview", showMailItems && single);

  ShowMenuItem("mailContext-print", showMailItems);
  EnableMenuItem("mailContext-print", oneOrMore);
  ShowMenuItem("mailContext-delete", showMailItems);
  EnableMenuItem("mailContext-delete", oneOrMore);
  // This function is needed for the case where a folder is just loaded
  // (while there isn't a message loaded in the message pane), a right-click
  // is done in the thread pane.  This function will disable enable the
  // 'Delete Message' menu item.
  goUpdateCommand('cmd_delete');

  ShowMenuItem("context-addemail", gContextMenu.onMailtoLink);
  ShowMenuItem("context-composeemailto", gContextMenu.onMailtoLink);
  ShowMenuItem("context-createfilterfrom", gContextMenu.onMailtoLink);

  // Figure out separators.
  ShowSeparator("mailContext-sep-open");
  ShowSeparator("mailContext-sep-edit");
  ShowSeparator("mailContext-sep-link");
  ShowSeparator("mailContext-sep-image");
  ShowSeparator("mailContext-sep-copy");
  ShowSeparator("mailContext-sep-print");
  ShowSeparator("mailContext-sep-tags");
  ShowSeparator("mailContext-sep-mark");
  ShowSeparator("mailContext-sep-move");

  // If we are on a link, go ahead and hide this separator.
  if (gContextMenu.onLink)
    ShowMenuItem("mailContext-sep-copy", false);

  return true;
}

function FolderPaneOnPopupHiding()
{
  RestoreSelectionWithoutContentLoad(GetFolderTree());
}

function FillFolderPaneContextMenu()
{
  let folders = GetSelectedMsgFolders();
  let numSelected = folders.length;
  if (numSelected != 1)
    return false;

  let folder = folders[0];
  let isServer = folder.isServer;
  let serverType = folder.server.type;
  let specialFolder = getSpecialFolderString(folder);
  var canSubscribeToFolder = (serverType == "nntp") ||
                             (serverType == "imap") ||
                             (serverType == "rss");
  var isNewsgroup = !isServer && serverType == 'nntp';
  var isMailFolder = !isServer && serverType != 'nntp';
  var isVirtualFolder = (specialFolder == "Virtual");
  const kTrashFlag = Components.interfaces.nsMsgFolderFlags.Trash;
  let isChildOfTrash = folder.isSpecialFolder(kTrashFlag, true);
  var canGetMessages =
    (isServer && serverType != "none") ||
    isNewsgroup ||
    ((serverType == "rss") && !isChildOfTrash && !isVirtualFolder);

  if (!isServer)
  {
    ShowMenuItem("folderPaneContext-settings", false);
    ShowMenuItem("folderPaneContext-properties", true);
    EnableMenuItem("folderPaneContext-properties", true);
  }
  else
  {
    ShowMenuItem("folderPaneContext-properties", false);
    ShowMenuItem("folderPaneContext-settings", true);
    EnableMenuItem("folderPaneContext-settings", true);
  }

  if ((numSelected <= 1) && canGetMessages)
    if (isServer)
      SetMenuItemLabel("folderPaneContext-getMessages",
                       gMessengerBundle.getString("getMessagesFor"));
    else
      SetMenuItemLabel("folderPaneContext-getMessages",
                       gMessengerBundle.getString("getMessages"));

  ShowMenuItem("folderPaneContext-getMessages", (numSelected <= 1) && canGetMessages);
  EnableMenuItem("folderPaneContext-getMessages", true);

  ShowMenuItem("folderPaneContext-openNewWindow", (numSelected <= 1));
  EnableMenuItem("folderPaneContext-openNewWindow", true);

  ShowMenuItem("folderPaneContext-openNewTab", (numSelected <= 1));
  EnableMenuItem("folderPaneContext-openNewTab", true);

  SetupRenameMenuItem(folder, numSelected, isServer, serverType, specialFolder);
  SetupRemoveMenuItem(folder, numSelected, isServer, serverType, specialFolder);
  SetupCompactMenuItem(folder, numSelected);

  ShowMenuItem("folderPaneContext-emptyTrash", (numSelected <= 1) && (specialFolder == 'Trash'));
  EnableMenuItem("folderPaneContext-emptyTrash", true);
  ShowMenuItem("folderPaneContext-emptyJunk", (numSelected <= 1) && (specialFolder == 'Junk'));
  EnableMenuItem("folderPaneContext-emptyJunk", true);

  var showSendUnsentMessages = (numSelected <= 1) && (specialFolder == 'Outbox');
  ShowMenuItem("folderPaneContext-sendUnsentMessages", showSendUnsentMessages);
  if (showSendUnsentMessages)
    EnableMenuItem("folderPaneContext-sendUnsentMessages", IsSendUnsentMsgsEnabled(folder));

  ShowMenuItem("folderPaneContext-sep-edit", (numSelected <= 1));

  SetupNewMenuItem(folder, numSelected, isServer, serverType, specialFolder);

  ShowMenuItem("folderPaneContext-subscribe", (numSelected <= 1) && canSubscribeToFolder && !isVirtualFolder);
  EnableMenuItem("folderPaneContext-subscribe", true);

  ShowMenuItem("folderPaneContext-sep1", (numSelected <= 1) && !isServer);
// News folder context menu =============================================

  ShowMenuItem("folderPaneContext-newsUnsubscribe", (numSelected <= 1) && canSubscribeToFolder && isNewsgroup);
  EnableMenuItem("folderPaneContext-newsUnsubscribe", true);
  ShowMenuItem("folderPaneContext-markNewsgroupAllRead", (numSelected <= 1) && isNewsgroup);
  EnableMenuItem("folderPaneContext-markNewsgroupAllRead", true);

// End of News folder context menu =======================================

  ShowMenuItem("folderPaneContext-markMailFolderAllRead", (numSelected <= 1) && isMailFolder && !isVirtualFolder);
  EnableMenuItem("folderPaneContext-markMailFolderAllRead", true);

  ShowMenuItem("folderPaneContext-searchMessages", (numSelected <= 1) && !isVirtualFolder);
  goUpdateCommand('cmd_search');

  return(true);
}

function SetupRenameMenuItem(msgFolder, numSelected, isServer, serverType, specialFolder)
{
  var canRename = (specialFolder == "Junk") ?
                  CanRenameDeleteJunkMail(msgFolder.URI) : msgFolder.canRename;
  ShowMenuItem("folderPaneContext-rename", (numSelected <= 1) && canRename);
  EnableMenuItem("folderPaneContext-rename", !isServer && msgFolder.isCommandEnabled("cmd_renameFolder"));

  if (canRename)
    SetMenuItemLabel("folderPaneContext-rename", gMessengerBundle.getString("renameFolder"));
}

function SetupRemoveMenuItem(msgFolder, numSelected, isServer, serverType, specialFolder)
{
  var isMail = serverType != 'nntp';
  var canDelete = (specialFolder == "Junk") ?
                  CanRenameDeleteJunkMail(msgFolder.URI) : msgFolder.deletable;

  var showRemove = (numSelected <=1) && isMail && canDelete;

  ShowMenuItem("folderPaneContext-remove", showRemove);
  if (showRemove)
    EnableMenuItem("folderPaneContext-remove", msgFolder.isCommandEnabled("cmd_delete"));
  if (canDelete)
    SetMenuItemLabel("folderPaneContext-remove", gMessengerBundle.getString("removeFolder"));
}

function SetupCompactMenuItem(folder, numSelected)
{
  let canCompact = folder.canCompact;
  ShowMenuItem("folderPaneContext-compact", numSelected <= 1 && canCompact);
  EnableMenuItem("folderPaneContext-compact", folder.isCommandEnabled("cmd_compactFolder"));

  if (canCompact)
    SetMenuItemLabel("folderPaneContext-compact", gMessengerBundle.getString("compactFolder"));
}

function SetupNewMenuItem(folder, numSelected, isServer, serverType, specialFolder)
{
  var isInbox = specialFolder == "Inbox";

  let showNew = (numSelected <= 1 && serverType != "nntp" &&
                 folder.canCreateSubfolders) || isInbox;
  ShowMenuItem("folderPaneContext-new", showNew);
  EnableMenuItem("folderPaneContext-new",
                 folder.server.type != "imap" || !Services.io.offline);
  if (showNew)
  {
    if (isServer || isInbox)
      SetMenuItemLabel("folderPaneContext-new", gMessengerBundle.getString("newFolder"));
    else
      SetMenuItemLabel("folderPaneContext-new", gMessengerBundle.getString("newSubfolder"));
  }
}

function ShowMenuItem(id, showItem)
{
  var item = document.getElementById(id);
  if(item && item.hidden != "true")
    item.hidden = !showItem;
}

function EnableMenuItem(id, enableItem)
{
  var item = document.getElementById(id);
  if(item)
  {
    var enabled = (item.getAttribute('disabled') !='true');
    if(enableItem != enabled)
    {
      item.setAttribute('disabled', enableItem ? '' : 'true');
    }
  }
}

function SetMenuItemLabel(id, label)
{
  var item = document.getElementById(id);
  if(item)
    item.setAttribute('label', label);
}

function SetMenuItemAccessKey(id, accessKey)
{
  var item = document.getElementById(id);
  if(item)
    item.setAttribute('accesskey', accessKey);
}

function SiblingHidden(aSibling, aNext)
{
  var siblingID;
  while (aSibling)
  {
    siblingID = aSibling.id;
    // For some reason, context-blockimage and context-unblockimage are not
    // hidden on the very first time the context menu is invoked. They are only
    // hidden on subsequent triggers of the context menu. Since we're not
    // using these two menuitems in mailnews, we can ignore them if encountered.
    if (!aSibling.hidden && (siblingID != "context-blockimage") &&
        (siblingID != "context-unblockimage"))
      return aSibling.localName == "menuseparator";
    aSibling = aNext ? aSibling.nextSibling : aSibling.previousSibling;
  }
  return true;
}

function ShowSeparator(aSeparatorID)
{
  var separator = document.getElementById(aSeparatorID);
  // Check to see if there are visible siblings before the next and
  // previous separators.
  var hidden = SiblingHidden(separator.nextSibling, true) ||
               SiblingHidden(separator.previousSibling, false);
  ShowMenuItem(aSeparatorID, !hidden);
}

// message pane context menu helper methods
function AddContact(aEmailAddressNode)
{
  if (aEmailAddressNode)
    AddEmailToAddressBook(aEmailAddressNode.getAttribute("emailAddress"),
                          aEmailAddressNode.getAttribute("displayName"));
}

function AddEmailToAddressBook(primaryEmail, displayName)
{
    window.openDialog("chrome://messenger/content/addressbook/abNewCardDialog.xul",
                      "", "chrome,resizable=no,titlebar,modal,centerscreen",
                      {primaryEmail:primaryEmail, displayName:displayName});
}

function EditContact(aEmailAddressNode)
{
  if (aEmailAddressNode.cardDetails.card)
  {
    window.openDialog("chrome://messenger/content/addressbook/abEditCardDialog.xul",
                      "", "chrome,resizable=no,modal,titlebar,centerscreen",
                      { abURI: aEmailAddressNode.cardDetails.book.URI,
                        card: aEmailAddressNode.cardDetails.card });
  }
}

/**
 * SendMailToNode takes the email address title button, extracts the email address
 * we stored in there and opens a compose window with that address.
 *
 * @param addressNode  a node which has a "fullAddress" attribute
 * @param aEvent       the event object when user triggers the menuitem
 */
function SendMailToNode(emailAddressNode, aEvent)
{
  if (emailAddressNode)
    SendMailTo(emailAddressNode.getAttribute("fullAddress"), aEvent);
}

function SendMailTo(fullAddress, aEvent)
{
  var fields = Components.classes["@mozilla.org/messengercompose/composefields;1"]
                         .createInstance(Components.interfaces.nsIMsgCompFields);
  var params = Components.classes["@mozilla.org/messengercompose/composeparams;1"]
                         .createInstance(Components.interfaces.nsIMsgComposeParams);

  var headerParser = MailServices.headerParser;
  var addresses = headerParser.makeFromDisplayAddress(fullAddress);
  fields.to = headerParser.makeMimeHeader(addresses, 1);
  params.type = Components.interfaces.nsIMsgCompType.New;

  // If aEvent is passed, check if Shift key was pressed for composition in
  // non-default format (HTML vs. plaintext).
  params.format = (aEvent && aEvent.shiftKey) ?
    Components.interfaces.nsIMsgCompFormat.OppositeOfDefault :
    Components.interfaces.nsIMsgCompFormat.Default;

  params.identity = accountManager.getFirstIdentityForServer(GetLoadedMsgFolder().server);
  params.composeFields = fields;
  MailServices.compose.OpenComposeWindowWithParams(null, params);
}

// CopyEmailAddress takes the email address title button, extracts
// the email address we stored in there and copies it to the clipboard
function CopyEmailAddress(emailAddressNode)
{
  if (emailAddressNode)
    CopyString(emailAddressNode.getAttribute("emailAddress"));
}

// show the message id in the context menu
function FillMessageIdContextMenu(messageIdNode)
{
  var msgId = messageIdNode.getAttribute("messageid");
  document.getElementById("messageIdContext-messageIdTarget")
          .setAttribute("label", msgId);

  // We don't want to show "Open Message For ID" for the same message
  // we're viewing.
  var currentMsgId = "<" + gFolderDisplay.selectedMessage.messageId + ">";
  document.getElementById("messageIdContext-openMessageForMsgId")
          .hidden = (currentMsgId == msgId);

  // We don't want to show "Open Browser With Message-ID" for non-nntp messages.
  document.getElementById("messageIdContext-openBrowserWithMsgId")
          .hidden = !gFolderDisplay.selectedMessageIsNews;
}

function GetMessageIdFromNode(messageIdNode, cleanMessageId)
{
  var messageId  = messageIdNode.getAttribute("messageid");

  // remove < and >
  if (cleanMessageId)
    messageId = messageId.substring(1, messageId.length - 1);

  return messageId;
}

// take the message id from the messageIdNode and use the
// url defined in the hidden pref "mailnews.messageid_browser.url"
// to open it in a browser window (%mid is replaced by the message id)
function OpenBrowserWithMessageId(messageId)
{
  var browserURL = GetLocalizedStringPref("mailnews.messageid_browser.url");
  if (browserURL)
    openAsExternal(browserURL.replace(/%mid/, messageId));
}

// take the message id from the messageIdNode, search for the
// corresponding message in all folders starting with the current
// selected folder, then the current account followed by the other
// accounts and open corresponding message if found
function OpenMessageForMessageId(messageId)
{
  var startServer = gDBView.msgFolder.server;
  var messageHeader;

  window.setCursor("wait");

  // first search in current folder for message id
  var messageHeader = CheckForMessageIdInFolder(gDBView.msgFolder, messageId);

  // if message id not found in current folder search in all folders
  if (!messageHeader)
  {
    var accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"]
                                   .getService(Components.interfaces.nsIMsgAccountManager);
    var allServers = accountManager.allServers;

    messageHeader = SearchForMessageIdInSubFolder(startServer.rootFolder, messageId);

    for (var i = 0; i < allServers.length && !messageHeader; i++)
    {
      var currentServer =
        allServers.queryElementAt(i, Components.interfaces.nsIMsgIncomingServer);
      if (currentServer && startServer != currentServer &&
          currentServer.canSearchMessages && !currentServer.isDeferredTo)
      {
        messageHeader = SearchForMessageIdInSubFolder(currentServer.rootFolder, messageId);
      }
    }
  }
  window.setCursor("auto");

  // if message id was found open corresponding message
  // else show error message
  if (messageHeader)
    OpenMessageByHeader(messageHeader, Services.prefs.getBoolPref("mailnews.messageid.openInNewWindow"));
  else
  {
    var messageIdStr = "<" + messageId + ">";
    var errorTitle   = gMessengerBundle.getString("errorOpenMessageForMessageIdTitle");
    var errorMessage = gMessengerBundle.getFormattedString("errorOpenMessageForMessageIdMessage",
                                                           [messageIdStr]);
    Services.prompt.alert(window, errorTitle, errorMessage);
  }
}

function OpenMessageByHeader(messageHeader, openInNewWindow)
{
  var folder    = messageHeader.folder;
  var folderURI = folder.URI;

  if (openInNewWindow)
  {
    var messageURI = folder.getUriForMsg(messageHeader);

    window.openDialog("chrome://messenger/content/messageWindow.xul",
                      "_blank", "all,chrome,dialog=no,status,toolbar",
                      messageURI, folderURI, null);
  }
  else
  {
    if (msgWindow.openFolder != folderURI)
      SelectFolder(folderURI);

    var tree = null;
    var wintype = document.documentElement.getAttribute('windowtype');
    if (wintype != "mail:messageWindow")
    {
      tree = GetThreadTree();
      tree.view.selection.clearSelection();
    }

    try
    {
      gDBView.selectMsgByKey(messageHeader.messageKey);
    }
    catch(e)
    { // message not in the thread pane
      try
      {
        goDoCommand("cmd_viewAllMsgs");
        gDBView.selectMsgByKey(messageHeader.messageKey);
      }
      catch(e)
      {
         dump("select messagekey " + messageHeader.messageKey +
              " failed in folder " + folder.URI);
      }
    }

    if (tree && tree.currentIndex != -1)
      tree.treeBoxObject.ensureRowIsVisible(tree.currentIndex);
  }
}

// search for message by message id in given folder and its subfolders
// return message header if message was found
function SearchForMessageIdInSubFolder(folder, messageId)
{
  var messageHeader;
  var subFolders = folder.subFolders;

  // search in folder
  if (!folder.isServer)
    messageHeader = CheckForMessageIdInFolder(folder, messageId);

  // search subfolders recursively
  while (subFolders.hasMoreElements() && !messageHeader)
  {
    // search in current folder
    var currentFolder =
      subFolders.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);

    messageHeader = CheckForMessageIdInFolder(currentFolder, messageId);

    // search in its subfolder
    if (!messageHeader && currentFolder.hasSubFolders)
      messageHeader = SearchForMessageIdInSubFolder(currentFolder, messageId);
  }

  return messageHeader;
}

// check folder for corresponding message to given message id
// return message header if message was found
function CheckForMessageIdInFolder(folder, messageId)
{
  var messageDatabase = folder.msgDatabase;
  var messageHeader;

  try
  {
    messageHeader = messageDatabase.getMsgHdrForMessageID(messageId);
  }
  catch (ex)
  {
    dump("Failed to find message-id in folder!");
  }

  if (!gMailSession)
  {
    gMailSession = Components.classes["@mozilla.org/messenger/services/session;1"]
                             .getService(Components.interfaces.nsIMsgMailSession);
  }

  const nsMsgFolderFlags = Components.interfaces.nsMsgFolderFlags;
  if (!gMailSession.IsFolderOpenInWindow(folder) &&
      !(folder.flags & (nsMsgFolderFlags.Trash | nsMsgFolderFlags.Inbox)))
  {
    folder.msgDatabase = null;
  }

  return messageHeader;
}

// CreateFilter opens the Message Filters and Filter Rules dialogs.
//The Filter Rules dialog has focus. The window is prefilled with filtername <email address>
//Sender condition is selected and the value is prefilled <email address>
function CreateFilter(emailAddressNode)
{
  if (emailAddressNode)
    CreateFilterFromMail(emailAddressNode.getAttribute("emailAddress"));
}

function CreateFilterFromMail(emailAddress)
{
  if (emailAddress)
    top.MsgFilters(emailAddress, GetFirstSelectedMsgFolder());
}

function CopyMessageUrl()
{
  try
  {
    var hdr = gDBView.hdrForFirstSelectedMessage;
    var server = hdr.folder.server;

    // TODO let backend construct URL and return as attribute
    var url = (server.socketType == Components.interfaces.nsMsgSocketType.SSL) ?
              "snews://" : "news://";
    url += server.hostName + ":" + server.port + "/" + hdr.messageId;
    CopyString(url);
  }
  catch (ex)
  {
    dump("ex="+ex+"\n");
  }
}

function CopyString(aString)
{
  Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper)
            .copyString(aString);
}
