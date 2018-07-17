/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 //This file stores variables common to mail windows

var messenger;
var statusFeedback;
var msgWindow;

var msgComposeService;
var accountManager;
var RDF;
var msgComposeType;
var msgComposeFormat;

var mailSession;

var gMessengerBundle;
var gBrandBundle;

var accountManagerDataSource;
var folderDataSource;

var accountCentralBox = null;
var gDisableViewsSearch = null;
var gAccountCentralLoaded = true;
//End progress and Status variables

var gOfflineManager;

// cache the last keywords
var gLastKeywords = "";

function OnMailWindowUnload()
{
  RemoveMailOfflineObserver();
  ClearPendingReadTimer();

  var searchSession = GetSearchSession();
  if (searchSession)
  {
    removeGlobalListeners();
    if (gPreQuickSearchView)     //close the cached pre quick search view
      gPreQuickSearchView.close();
  }

  var dbview = GetDBView();
  if (dbview) {
    dbview.close();
  }

  var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"]
                              .getService();
  if (mailSession instanceof Components.interfaces.nsIMsgMailSession)
    mailSession.RemoveFolderListener(folderListener);
  mailSession.RemoveMsgWindow(msgWindow);
  messenger.setWindow(null, null);

  msgWindow.closeWindow();
}

/**
 * When copying/dragging, convert imap/mailbox URLs of images into data URLs so
 * that the images can be accessed in a paste elsewhere.
 */
function onCopyOrDragStart(e) {
  let sourceDoc = getBrowser().contentDocument;
  if (e.target.ownerDocument != sourceDoc) {
    // We're only interested if this is in the message content.
    return; 
  }

  let imgMap = new Map(); // Mapping img.src -> dataURL.

  // For copy, the data of what is to be copied is not accessible at this point.
  // Figure out what images are a) part of the selection and b) visible in
  // the current document. If their source isn't http or data already, convert
  // them to data URLs.
  let selection = sourceDoc.getSelection();
  let draggedImg = selection.isCollapsed ? e.target : null;
  for (let img of sourceDoc.images) {
    if (/^(https?|data):/.test(img.src)) {
      continue;
    }

    if (img.naturalWidth == 0) {
      // Broken/inaccessible image then...
      continue;
    }

    if (!draggedImg && !selection.containsNode(img, true)) {
      continue;
    }

    let style = window.getComputedStyle(img);
    if (style.display == "none" || style.visibility == "hidden") {
      continue;
    }

    // Do not convert if the image is specifically flagged to not snarf.
    if (img.getAttribute("moz-do-not-send") == "true") {
      continue;
    }

    // We don't need to wait for the image to load. If it isn't already loaded
    // in the source document, we wouldn't want it anyway.
    let canvas = sourceDoc.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0, img.width, img.height);

    let type = /\.jpe?g$/i.test(img.src) ? "image/jpg" : "image/png";
    imgMap.set(img.src, canvas.toDataURL(type));
  }

  if (imgMap.size == 0) {
    // Nothing that needs converting!
    return;
  }

  let clonedSelection = draggedImg ? draggedImg.cloneNode(false) :
                                     selection.getRangeAt(0).cloneContents();
  let div = sourceDoc.createElement("div");
  div.appendChild(clonedSelection);

  let images = div.querySelectorAll("img");
  for (let img of images) {
    if (!imgMap.has(img.src)) {
      continue;
    }
    img.src = imgMap.get(img.src);
  }

  let html = div.innerHTML;
  let parserUtils = Components.classes["@mozilla.org/parserutils;1"]
                      .getService(Components.interfaces.nsIParserUtils);
  let plain = 
    parserUtils.convertToPlainText(html,
      Components.interfaces.nsIDocumentEncoder.OutputForPlainTextClipboardCopy,
      0);
      
  // Copy operation.
  if ("clipboardData" in e) { 
    e.clipboardData.setData("text/html", html);
    e.clipboardData.setData("text/plain", plain);
    e.preventDefault();
  }
  // Drag operation.
  else if ("dataTransfer" in e) { 
    e.dataTransfer.setData("text/html", html);
    e.dataTransfer.setData("text/plain", plain);
  }
}

function CreateMailWindowGlobals()
{
  // Get the messenger instance.
  messenger = Components.classes["@mozilla.org/messenger;1"]
                        .createInstance(Components.interfaces.nsIMessenger);

  // Create windows status feedback
  // set the JS implementation of status feedback before creating the c++ one..
  window.MsgStatusFeedback = new nsMsgStatusFeedback();
  // Double register the status feedback object as the xul browser window 
  // implementation.
  window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem).treeOwner
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIXULWindow)
        .XULBrowserWindow = window.MsgStatusFeedback;

  statusFeedback = Components.classes["@mozilla.org/messenger/statusfeedback;1"]
                             .createInstance(Components.interfaces.nsIMsgStatusFeedback);
  statusFeedback.setWrappedStatusFeedback(window.MsgStatusFeedback);

  window.MsgWindowCommands = new nsMsgWindowCommands();

  //Create message window object
  msgWindow = Components.classes["@mozilla.org/messenger/msgwindow;1"]
                        .createInstance(Components.interfaces.nsIMsgWindow);

  msgComposeService = Components.classes['@mozilla.org/messengercompose;1']
                                .getService(Components.interfaces.nsIMsgComposeService);

  mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);

  accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);

  RDF = Components.classes['@mozilla.org/rdf/rdf-service;1']
                  .getService(Components.interfaces.nsIRDFService);

  msgComposeType = Components.interfaces.nsIMsgCompType;
  msgComposeFormat = Components.interfaces.nsIMsgCompFormat;

  gMessengerBundle = document.getElementById("bundle_messenger");
  gBrandBundle = document.getElementById("bundle_brand");

  //Create datasources
  var prefix = "@mozilla.org/rdf/datasource;1?name=";
  var accountManagerDSCID = prefix + "msgaccountmanager";
  var folderDSCID         = prefix + "mailnewsfolders";
  var nsIRDFDataSource = Components.interfaces.nsIRDFDataSource;

  accountManagerDataSource = Components.classes[accountManagerDSCID].getService(nsIRDFDataSource);
  folderDataSource         = Components.classes[folderDSCID].getService(nsIRDFDataSource);

  msgWindow.notificationCallbacks = new nsMsgBadCertHandler();
}

function InitMsgWindow()
{
  msgWindow.windowCommands = new nsMsgWindowCommands();
  // set the domWindow before setting the status feedback and header sink objects
  msgWindow.domWindow = window;
  msgWindow.statusFeedback = statusFeedback;
  msgWindow.msgHeaderSink = messageHeaderSink;
  mailSession.AddMsgWindow(msgWindow);

  var messagepane = getMessageBrowser();
  messagepane.docShell.allowAuth = false;
  messagepane.docShell.allowDNSPrefetch = false;
  msgWindow.rootDocShell.allowAuth = true;
  msgWindow.rootDocShell.appType = Components.interfaces.nsIDocShell.APP_TYPE_MAIL;
  // Ensure we don't load xul error pages into the main window
  msgWindow.rootDocShell.useErrorPages = false;

  document.addEventListener("copy", onCopyOrDragStart, true);
  document.addEventListener("dragstart", onCopyOrDragStart, true);
}

function messagePaneOnResize(event)
{
  // scale any overflowing images
  var messagepane = getMessageBrowser();
  var doc = messagepane.contentDocument;
  var imgs = doc.images;
  for each (var img in imgs)
  {
    if (img.className == "moz-attached-image")
    {
      if (img.naturalWidth <= doc.body.clientWidth)
      {
        img.removeAttribute("isshrunk");
        img.removeAttribute("overflowing");
      }
      else if (img.hasAttribute("shrinktofit"))
      {
        img.setAttribute("isshrunk", "true");
        img.removeAttribute("overflowing");
      }
      else
      {
        img.setAttribute("overflowing", "true");
        img.removeAttribute("isshrunk");
      }
    }
  }

}

function messagePaneOnClick(event)
{
  // if this is stand alone mail (no browser)
  // or this isn't a simple left click, do nothing, and let the normal code execute
  if (event.button != 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return contentAreaClick(event);

  // try to determine the href for what you are clicking on.
  // for example, it might be "" if you aren't left clicking on a link
  var ceParams = hrefAndLinkNodeForClickEvent(event);
  if (!ceParams && !event.button)
  {
    var target = event.target;
    // is this an image that we might want to scale?
    if (target instanceof Components.interfaces.nsIImageLoadingContent)
    {
      // make sure it loaded successfully
      var req = target.getRequest(Components.interfaces.nsIImageLoadingContent.CURRENT_REQUEST);
      if (!req || req.imageStatus & Components.interfaces.imgIRequest.STATUS_ERROR)
        return true;
      // is it an inline attachment?
      if (/^moz-attached-image/.test(target.className))
      {
        if (target.hasAttribute("isshrunk"))
        {
          // currently shrunk to fit, so unshrink it
          target.removeAttribute("isshrunk");
          target.removeAttribute("shrinktofit");
          target.setAttribute("overflowing", "true");
        }
        else if (target.hasAttribute("overflowing"))
        {
          // user wants to shrink now
          target.setAttribute("isshrunk", "true");
          target.setAttribute("shrinktofit", "true");
          target.removeAttribute("overflowing");
        }
      }
    }
    return true;
  }
  var href = ceParams.href;

  // we know that http://, https://, ftp://, file://, chrome://,
  // resource://, and about, should load in a browser.  but if
  // we don't have one of those (examples are mailto, imap, news, mailbox, snews,
  // nntp, ldap, and externally handled schemes like aim) we may or may not
  // want a browser window, in which case we return here and let the normal code
  // handle it
  var needABrowser = /(^http(s)?:|^ftp:|^file:|^chrome:|^resource:|^about:)/i;
  if (href.search(needABrowser) == -1)
    return true;

  // however, if the protocol should not be loaded internally, then we should
  // not put up a new browser window.  we should just let the usual processing
  // take place.
  try {
    var extProtService = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                                   .getService(Components.interfaces.nsIExternalProtocolService);
    var scheme = href.substring(0, href.indexOf(":"));
    if (!extProtService.isExposedProtocol(scheme))
      return true;
  }
  catch (ex) {} // ignore errors, and just assume that we can proceed.

  // if you get here, the user did a simple left click on a link
  // that we know should be in a browser window.
  // since we are in the message pane, send it to the top most browser window
  // (or open one) right away, instead of waiting for us to get some data and
  // determine the content type, and then open a browser window
  // we want to preventDefault, so that in
  // nsGenericHTMLElement::HandleDOMEventForAnchors(), we don't try to handle the click again
  event.preventDefault();
  if (isPhishingURL(ceParams.linkNode, false, href))
    return false;

  openAsExternal(href);
  return true;
}

function AddDataSources()
{
  SetupMoveCopyMenus('moveMenu', accountManagerDataSource, folderDataSource);
  SetupMoveCopyMenus('copyMenu', accountManagerDataSource, folderDataSource);
  SetupMoveCopyMenus('button-file', accountManagerDataSource, folderDataSource);
  SetupMoveCopyMenus('mailContext-copyMenu', accountManagerDataSource, folderDataSource);
  SetupMoveCopyMenus('mailContext-moveMenu', accountManagerDataSource, folderDataSource);
}

function SetupMoveCopyMenus(menuid, accountManagerDataSource, folderDataSource)
{
  var menu = document.getElementById(menuid);
  if (menu)
  {
    menu.database.AddDataSource(accountManagerDataSource);
    menu.database.AddDataSource(folderDataSource);
    menu.setAttribute('ref', 'msgaccounts:/');
  }
}

// We're going to implement our status feedback for the mail window in JS now.
// the following contains the implementation of our status feedback object

function nsMsgStatusFeedback()
{
}

nsMsgStatusFeedback.prototype =
{
  // global variables for status / feedback information....
  statusTextFld : null,
  statusBar     : null,
  statusPanel   : null,
  throbber      : null,
  stopCmd       : null,
  startTimeoutID : null,
  stopTimeoutID  : null,
  pendingStartRequests : 0,
  meteorsSpinning : false,
  myDefaultStatus : "",

  ensureStatusFields : function()
    {
      if (!this.statusTextFld ) this.statusTextFld = document.getElementById("statusText");
      if (!this.statusBar) this.statusBar = document.getElementById("statusbar-icon");
      if (!this.statusPanel) this.statusPanel = document.getElementById("statusbar-progresspanel");
      if (!this.throbber)   this.throbber = document.getElementById("navigator-throbber");
      if (!this.stopCmd)   this.stopCmd = document.getElementById("cmd_stop");
    },

  // nsIXULBrowserWindow implementation
  setJSStatus : function(status)
    {
      if (status.length > 0)
        this.showStatusString(status);
    },
  setOverLink : function(link, context)
    {
      this.ensureStatusFields();
      this.statusTextFld.label = link;
    },

  // Called before links are navigated to to allow us to retarget them if needed.
  onBeforeLinkTraversal: function(aOriginalTarget, aLinkURI, aLinkNode, aIsAppTab)
  {
    return aOriginalTarget;
  },

  QueryInterface : function(iid)
    {
      if (iid.equals(Components.interfaces.nsIMsgStatusFeedback) ||
          iid.equals(Components.interfaces.nsIXULBrowserWindow) ||
          iid.equals(Components.interfaces.nsISupportsWeakReference) ||
          iid.equals(Components.interfaces.nsISupports))
        return this;
      throw Components.results.NS_NOINTERFACE;
    },

  // nsIMsgStatusFeedback implementation.
  showStatusString : function(statusText)
    {
      this.ensureStatusFields();
      if ( !statusText.length )
        statusText = this.myDefaultStatus;
      else
        this.myDefaultStatus = "";
      this.statusTextFld.label = statusText;
  },
  setStatusString : function(status)
    {
      if (status.length > 0)
      {
        this.myDefaultStatus = status;
        this.statusTextFld.label = status;
      }
    },
  _startMeteors : function()
    {
      this.ensureStatusFields();

      this.meteorsSpinning = true;
      this.startTimeoutID = null;

      // Show progress meter
      this.statusPanel.collapsed = false;

      // Turn progress meter on.
      this.statusBar.setAttribute("mode","undetermined");

      // start the throbber
      if (this.throbber)
        this.throbber.setAttribute("busy", true);

      //turn on stop button and menu
      if (this.stopCmd)
        this.stopCmd.removeAttribute("disabled");
    },
  startMeteors : function()
    {
      this.pendingStartRequests++;
      // if we don't already have a start meteor timeout pending
      // and the meteors aren't spinning, then kick off a start
      if (!this.startTimeoutID && !this.meteorsSpinning && window.MsgStatusFeedback)
        this.startTimeoutID = setTimeout('window.MsgStatusFeedback._startMeteors();', 500);

      // since we are going to start up the throbber no sense in processing
      // a stop timeout...
      if (this.stopTimeoutID)
      {
        clearTimeout(this.stopTimeoutID);
        this.stopTimeoutID = null;
      }
  },
   _stopMeteors : function()
    {
      if(gTimelineEnabled){
        gTimelineService.stopTimer("FolderLoading");
        gTimelineService.markTimer("FolderLoading");
        gTimelineService.resetTimer("FolderLoading");
      }
      this.ensureStatusFields();
      this.showStatusString(this.myDefaultStatus);

      // stop the throbber
      if (this.throbber)
        this.throbber.setAttribute("busy", false);

      // Turn progress meter off.
      this.statusPanel.collapsed = true;
      this.statusBar.setAttribute("mode","normal");
      this.statusBar.value = 0;  // be sure to clear the progress bar
      this.statusBar.label = "";
      if (this.stopCmd)
        this.stopCmd.setAttribute("disabled", "true");

      this.meteorsSpinning = false;
      this.stopTimeoutID = null;
    },
   stopMeteors : function()
    {
      if (this.pendingStartRequests > 0)
        this.pendingStartRequests--;

      // if we are going to be starting the meteors, cancel the start
      if (this.pendingStartRequests == 0 && this.startTimeoutID)
      {
        clearTimeout(this.startTimeoutID);
        this.startTimeoutID = null;
      }

      // if we have no more pending starts and we don't have a stop timeout already in progress
      // AND the meteors are currently running then fire a stop timeout to shut them down.
      if (this.pendingStartRequests == 0 && !this.stopTimeoutID)
      {
        if (this.meteorsSpinning && window.MsgStatusFeedback)
          this.stopTimeoutID = setTimeout('window.MsgStatusFeedback._stopMeteors();', 500);
      }
  },
  showProgress : function(percentage)
    {
      this.ensureStatusFields();
      if (percentage >= 0)
      {
        this.statusBar.setAttribute("mode", "normal");
        this.statusBar.value = percentage;
        this.statusBar.label = Math.round(percentage) + "%";
      }
    }
}


function nsMsgWindowCommands()
{
}

nsMsgWindowCommands.prototype =
{
  QueryInterface : function(iid)
  {
    if (iid.equals(Components.interfaces.nsIMsgWindowCommands) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  selectFolder: function(folderUri)
  {
    SelectFolder(folderUri);
  },

  selectMessage: function(messageUri)
  {
    SelectMessage(messageUri);
  },

  clearMsgPane: function()
  {
    if (gDBView)
      setTitleFromFolder(gDBView.msgFolder,null);
    else
      setTitleFromFolder(null,null);
    ClearMessagePane();
  }
}

function StopUrls()
{
  msgWindow.StopUrls();
}

function loadStartPage()
{
  try
  {
    gMessageNotificationBar.clearMsgNotifications();

    var startpageenabled = Services.prefs.getBoolPref("mailnews.start_page.enabled");
    if (startpageenabled)
    {
      var startpage = GetLocalizedStringPref("mailnews.start_page.url");
      if (startpage)
      {
        GetMessagePaneFrame().location.href = startpage;
        //dump("start message pane with: " + startpage + "\n");
        ClearMessageSelection();
      }
    }
  }
  catch (ex)
  {
    dump("Error loading start page.\n");
    return;
  }
}

// Given the server, open the twisty and the set the selection
// on inbox of that server.
// prompt if offline.
function OpenInboxForServer(server)
{
    try {
        ShowThreadPane();
        var inboxFolder = GetInboxFolder(server);
        SelectFolder(inboxFolder.URI);

        if (!Services.io.offline) {
            if (server.type != "imap")
                GetMessagesForInboxOnServer(server);
        }
        else if (DoGetNewMailWhenOffline()) {
                GetMessagesForInboxOnServer(server);
        }
    }
    catch (ex) {
        dump("Error opening inbox for server -> " + ex + "\n");
        return;
    }
}

function GetSearchSession()
{
  if (("gSearchSession" in top) && gSearchSession)
    return gSearchSession;
  else
    return null;
}

function SetKeywords(aKeywords)
{
  // we cache the last keywords.
  // if there is no chagne, we do nothing.
  // most of the time, this will be the case.
  if (aKeywords == gLastKeywords)
    return;

  // these are the UI elements who care about keywords
  var elements = document.getElementsByAttribute("keywordrelated","true");
  var len = elements.length;
  for (var i=0; i<len; i++) {
    var element = elements[i];
    var originalclass = element.getAttribute("originalclass");

    // we use XBL for certain headers.
    // if the element has keywordrelated="true"
    // but no original class, it's an XBL widget
    // so to get the real element, use getAnonymousElementByAttribute()
    if (!originalclass) {
      element = document.getAnonymousElementByAttribute(element, "keywordrelated", "true");
      originalclass = element.getAttribute("originalclass");
    }

    if (aKeywords) {
      if (element.getAttribute("appendoriginalclass") == "true") {
        aKeywords += " " + originalclass;
      }
      element.setAttribute("class", aKeywords);
    }
    else {
      // if no keywords, reset class to the original class
      element.setAttribute("class", originalclass);
    }
  }

  // cache the keywords
  gLastKeywords = aKeywords;
}

function MailSetCharacterSet(aEvent)
{
  if (aEvent.target.hasAttribute("charset")) {
    msgWindow.mailCharacterSet = aEvent.target.getAttribute("charset");
    msgWindow.charsetOverride = true;
  }
  messenger.setDocumentCharset(msgWindow.mailCharacterSet);
}
