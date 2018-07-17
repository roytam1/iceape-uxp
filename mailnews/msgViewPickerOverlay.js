/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// menuitem value constants
// tag views have kViewTagMarker + their key as value
const kViewItemAll         = 0;
const kViewItemUnread      = 1;
const kViewItemTags        = 2; // former labels used values 2-6
const kViewItemNotDeleted  = 3;
const kViewItemVirtual     = 7;
const kViewItemCustomize   = 8;
const kViewItemFirstCustom = 9;

const kViewCurrent    = "current-view";
const kViewCurrentTag = "current-view-tag";
const kViewTagMarker  = ":";

var gMailViewList = null;
var gCurrentViewValue = kViewItemAll;
var gCurrentViewLabel = "";
var gSaveDefaultSVTerms;

var nsMsgSearchScope  = Components.interfaces.nsMsgSearchScope;
var nsMsgSearchAttrib = Components.interfaces.nsMsgSearchAttrib;
var nsMsgSearchOp     = Components.interfaces.nsMsgSearchOp;


// perform the view/action requested by the aValue string
// and set the view picker label to the aLabel string
function ViewChange(aValue, aLabel)
{
  if (aValue == kViewItemCustomize || aValue == kViewItemVirtual)
  {
    // restore to the previous view value, in case they cancel
    UpdateViewPicker(gCurrentViewValue, gCurrentViewLabel);
    if (aValue == kViewItemCustomize)
      LaunchCustomizeDialog();
    else
    {
      // Thunderbird uses the folder pane for this.
      if ("gFolderTreeController" in window)
        gFolderTreeController.newVirtualFolder(gCurrentViewLabel,
                                               gSaveDefaultSVTerms);
      else
        openNewVirtualFolderDialogWithArgs(gCurrentViewLabel, gSaveDefaultSVTerms);
    }
    return;
  }

  // persist the view
  gCurrentViewValue = aValue;
  gCurrentViewLabel = aLabel;
  SetMailViewForFolder(GetFirstSelectedMsgFolder(), gCurrentViewValue)
  UpdateViewPicker(gCurrentViewValue, gCurrentViewLabel);

  // tag menuitem values are of the form :<keyword>
  if (isNaN(aValue))
  {
    // split off the tag key
    var tagkey = aValue.substr(kViewTagMarker.length);
    ViewTagKeyword(tagkey);
  }
  else
  {
    var numval = Number(aValue);
    switch (numval)
    {
      case kViewItemAll: // View All
        gDefaultSearchViewTerms = null;
        break;
      case kViewItemUnread: // Unread
        ViewNewMail();
        break;
      case kViewItemNotDeleted: // Not deleted
        ViewNotDeletedMail();
        break;
      default:
        // for legacy reasons, custom views start at index 9
        LoadCustomMailView(numval - kViewItemFirstCustom);
        break;
    }
  }
  gSaveDefaultSVTerms = gDefaultSearchViewTerms;
  onEnterInSearchBar();
  gQSViewIsDirty = true;
}


function ViewChangeByMenuitem(aMenuitem)
{
  // Mac View menu menuitems don't have XBL bindings
  ViewChange(aMenuitem.getAttribute("value"), aMenuitem.getAttribute("label"));
}


function ViewChangeByValue(aValue)
{
  ViewChange(aValue, GetLabelForValue(aValue));
}

function ViewChangeByFolder(aFolder)
{
  var result = GetMailViewForFolder(aFolder);
  ViewChangeByValue(result);
}

function GetLabelForValue(aValue)
{
  var label = "";
  var viewPickerPopup = document.getElementById("viewPickerPopup");
  if (viewPickerPopup)
  {
    // grab the label for the menulist from one of its menuitems
    var selectedItems = viewPickerPopup.getElementsByAttribute("value", aValue);
    if (!selectedItems || !selectedItems.length)
    {
      // we may have a new item
      RefreshAllViewPopups(viewPickerPopup);
      selectedItems = viewPickerPopup.getElementsByAttribute("value", aValue);
    }
    label = selectedItems && selectedItems.length && selectedItems.item(0).getAttribute("label");
  }
  return label;
}

function UpdateViewPickerByValue(aValue)
{
  UpdateViewPicker(aValue, GetLabelForValue(aValue));
}

function UpdateViewPicker(aValue, aLabel)
{
  var viewPicker = document.getElementById("viewPicker");
  if (viewPicker)
  {
    viewPicker.value = aValue;
    viewPicker.setAttribute("label", aLabel);
  }
}

function GetFolderInfo(aFolder)
{
  // accounts may not have a msgDatabase, eg. Movemail or RSS
  try
  {
    var db = aFolder.msgDatabase;
    if (db)
      return db.dBFolderInfo;
  }
  catch (ex) {}
  return null;
}


function GetMailViewForFolder(aFolder)
{
  var val = "";
  var folderInfo = GetFolderInfo(aFolder);
  if (folderInfo)
  {
    val = folderInfo.getCharProperty(kViewCurrentTag);
    if (!val)
    {
      // no new view value, thus using the old
      var numval = folderInfo.getUint32Property(kViewCurrent, kViewItemAll);
      // and migrate it, if it's a former label view (label views used values 2-6)
      if ((kViewItemTags <= numval) && (numval < kViewItemVirtual))
        val = kViewTagMarker + "$label" + (val - 1);
      else
        val = numval;
    }
  }
  return val;
}


function SetMailViewForFolder(aFolder, aValue)
{
  var folderInfo = GetFolderInfo(aFolder);
  if (folderInfo)
  {
    // we can't map tags back to labels in general,
    // so set view to all for backwards compatibility in this case
    folderInfo.setUint32Property (kViewCurrent, isNaN(aValue) ? kViewItemAll : aValue);
    folderInfo.setCharProperty(kViewCurrentTag, aValue);
  }
}


function LaunchCustomizeDialog()
{
  OpenOrFocusWindow({}, "mailnews:mailviewlist", "chrome://messenger/content/mailViewList.xul");
}


function LoadCustomMailView(index)
{
  PrepareForViewChange();
  var searchTermsArrayForQS = CreateGroupedSearchTerms(gMailViewList.getMailViewAt(index).searchTerms);
  createSearchTermsWithList(searchTermsArrayForQS);
  AddVirtualFolderTerms(searchTermsArrayForQS);
  gDefaultSearchViewTerms = searchTermsArrayForQS;
}


function ViewTagKeyword(keyword)
{
  PrepareForViewChange();

  // create an i supports array to store our search terms
  var searchTermsArray = Components.classes["@mozilla.org/supports-array;1"]
                                   .createInstance(Components.interfaces.nsISupportsArray);
  var term = gSearchSession.createTerm();
  var value = term.value;

  value.str = keyword;
  value.attrib = nsMsgSearchAttrib.Keywords;
  term.value = value;
  term.attrib = nsMsgSearchAttrib.Keywords;
  term.op = nsMsgSearchOp.Contains;
  term.booleanAnd = true;

  searchTermsArray.AppendElement(term);
  AddVirtualFolderTerms(searchTermsArray);
  createSearchTermsWithList(searchTermsArray);
  gDefaultSearchViewTerms = searchTermsArray;
}


function ViewNewMail()
{
  PrepareForViewChange();

  // create an i supports array to store our search terms
  var searchTermsArray = Components.classes["@mozilla.org/supports-array;1"]
                                   .createInstance(Components.interfaces.nsISupportsArray);
  var term = gSearchSession.createTerm();
  var value = term.value;

  value.status = 1;
  value.attrib = nsMsgSearchAttrib.MsgStatus;
  term.value = value;
  term.attrib = nsMsgSearchAttrib.MsgStatus;
  term.op = nsMsgSearchOp.Isnt;
  term.booleanAnd = true;
  searchTermsArray.AppendElement(term);

  AddVirtualFolderTerms(searchTermsArray);

  createSearchTermsWithList(searchTermsArray);
  // not quite right - these want to be just the view terms...but it might not matter.
  gDefaultSearchViewTerms = searchTermsArray;
}


function ViewNotDeletedMail()
{
  PrepareForViewChange();

  // create an i supports array to store our search terms
  var searchTermsArray = Components.classes["@mozilla.org/supports-array;1"]
                                   .createInstance(Components.interfaces.nsISupportsArray);
  var term = gSearchSession.createTerm();
  var value = term.value;

  value.status = 0x00200000;
  value.attrib = nsMsgSearchAttrib.MsgStatus;
  term.value = value;
  term.attrib = nsMsgSearchAttrib.MsgStatus;
  term.op = nsMsgSearchOp.Isnt;
  term.booleanAnd = true;
  searchTermsArray.AppendElement(term);

  AddVirtualFolderTerms(searchTermsArray);

  createSearchTermsWithList(searchTermsArray);
  // not quite right - these want to be just the view terms...but it might not matter.
  gDefaultSearchViewTerms = searchTermsArray;
}


function AddVirtualFolderTerms(searchTermsArray)
{
  // add in any virtual folder terms
  var virtualFolderSearchTerms = (gVirtualFolderTerms || gXFVirtualFolderTerms);
  if (virtualFolderSearchTerms)
  {
    var isupports = null;
    var searchTerm;
    var termsArray = virtualFolderSearchTerms.QueryInterface(Components.interfaces.nsISupportsArray);
    for (var i = 0; i < termsArray.Count(); i++)
    {
      isupports = termsArray.GetElementAt(i);
      searchTerm = isupports.QueryInterface(Components.interfaces.nsIMsgSearchTerm);
      searchTermsArray.AppendElement(searchTerm);
    }
  }
}


function PrepareForViewChange()
{
  // this is a problem - it saves the current view in gPreQuickSearchView
  // then we eventually call onEnterInSearchBar, and we think we need to restore the pre search view!
  initializeSearchBar();
  ClearThreadPaneSelection();
  ClearMessagePane();
}


// refresh view popup and its subpopups
function RefreshAllViewPopups(aViewPopup)
{
  var menupopups = aViewPopup.getElementsByTagName("menupopup");
  if (menupopups.length > 1)
  {
    // when we have menupopups, we assume both tags and custom views are there
    RefreshTagsPopup(menupopups[0]);
    RefreshCustomViewsPopup(menupopups[1]);
  }
}


function RefreshViewPopup(aViewPopup)
{
  // mark default views if selected
  let viewAll = aViewPopup.getElementsByAttribute("value", kViewItemAll)[0];
  viewAll.setAttribute("checked", gCurrentViewValue == kViewItemAll);
  let viewUnread =
    aViewPopup.getElementsByAttribute("value", kViewItemUnread)[0];
  viewUnread.setAttribute("checked", gCurrentViewValue == kViewItemUnread);

  let viewNotDeleted =
    aViewPopup.getElementsByAttribute("value", kViewItemNotDeleted)[0];
  var folderArray = GetSelectedMsgFolders();
  if (folderArray.length == 0)
    return;

  // Only show the "Not Deleted" item for IMAP servers
  // that are using the IMAP delete model.
  viewNotDeleted.setAttribute("hidden", true);
  var msgFolder = folderArray[0];
  var server = msgFolder.server;
  if (server.type == "imap")
  {
    let imapServer =
      server.QueryInterface(Components.interfaces.nsIImapIncomingServer);
    if (imapServer.deleteModel == 0)  // nsMsgImapDeleteModels.IMAPDelete == 0
    {
      viewNotDeleted.setAttribute("hidden", false);
      viewNotDeleted.setAttribute("checked",
                                  gCurrentViewValue == kViewItemNotDeleted);
    }
  }
}


function RefreshCustomViewsPopup(aMenupopup)
{
  // for each mail view in the msg view list, add an entry in our combo box
  if (!gMailViewList)
    gMailViewList = Components.classes["@mozilla.org/messenger/mailviewlist;1"]
                              .getService(Components.interfaces.nsIMsgMailViewList);
  // remove all menuitems
  while (aMenupopup.hasChildNodes())
    aMenupopup.lastChild.remove();

  // now rebuild the list
  var currentView = isNaN(gCurrentViewValue) ? kViewItemAll : Number(gCurrentViewValue);
  var numItems = gMailViewList.mailViewCount;
  for (var i = 0; i < numItems; ++i)
  {
    var viewInfo = gMailViewList.getMailViewAt(i);
    var menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", viewInfo.prettyName);
    menuitem.setAttribute("value", kViewItemFirstCustom + i);
    menuitem.setAttribute("name", "viewmessages");
    menuitem.setAttribute("type", "radio");
    if (kViewItemFirstCustom + i == currentView)
      menuitem.setAttribute("checked", true);
    aMenupopup.appendChild(menuitem);
  }
}


function RefreshTagsPopup(aMenupopup)
{
  // remove all menuitems
  while (aMenupopup.hasChildNodes())
    aMenupopup.lastChild.remove();

  // create tag menuitems
  var currentTagKey = isNaN(gCurrentViewValue) ? gCurrentViewValue.substr(kViewTagMarker.length) : "";
  var tagService = Components.classes["@mozilla.org/messenger/tagservice;1"]
                             .getService(Components.interfaces.nsIMsgTagService);
  var tagArray = tagService.getAllTags({});
  for (var i = 0; i < tagArray.length; ++i)
  {
    var tagInfo = tagArray[i];
    var menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", tagInfo.tag);
    menuitem.setAttribute("value", kViewTagMarker + tagInfo.key);
    menuitem.setAttribute("name", "viewmessages");
    menuitem.setAttribute("type", "radio");
    if (tagInfo.key == currentTagKey)
      menuitem.setAttribute("checked", true);
    var color = tagInfo.color;
    if (color)
      menuitem.setAttribute("class", "lc-" + color.substr(1));
    aMenupopup.appendChild(menuitem);
  }
}


function ViewPickerOnLoad()
{
  var viewPickerPopup = document.getElementById("viewPickerPopup");
  if (viewPickerPopup)
    RefreshAllViewPopups(viewPickerPopup);
}


window.addEventListener("load", ViewPickerOnLoad, false);
