/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource:///modules/mailServices.js");
Components.utils.import("resource:///modules/IOUtils.js");

var gDirTree = null;
var abList = null;
var gAbResultsTree = null;
var gAbView = null;
var gAddressBookBundle;

const kDefaultSortColumn = "GeneratedName";
const kDefaultAscending = "ascending";
const kDefaultDescending = "descending";
// kDefaultYear will be used in birthday calculations when no year is given;
// this is a leap year so that Feb 29th works.
const kDefaultYear = nearestLeap(new Date().getFullYear());
const kMaxYear = 9999;
const kMinYear = 1;
const kAllDirectoryRoot = "moz-abdirectory://";
const kLdapUrlPrefix = "moz-abldapdirectory://";
const kPersonalAddressbookURI = "moz-abmdbdirectory://abook.mab";
const kCollectedAddressbookURI = "moz-abmdbdirectory://history.mab";
// The default image for contacts
var defaultPhotoURI = "chrome://messenger/skin/addressbook/icons/contact-generic.png";

// Controller object for Dir Pane
var DirPaneController =
{
  supportsCommand: function(command)
  {
    switch (command) {
      case "cmd_selectAll":
      case "cmd_delete":
      case "button_delete":
      case "cmd_properties":
      case "cmd_newlist":
        return true;
      default:
        return false;
    }
  },

  isCommandEnabled: function(command)
  {
    switch (command) {
      case "cmd_selectAll":
        // The gDirTree pane only handles single selection, but normally we
        // enable cmd_selectAll as it will get forwarded to the results pane.
        // But if there is no gAbView, disable as we can't forward to anywhere.
        return (gAbView != null);
      case "cmd_delete":
      case "button_delete": {
        let selectedDir = getSelectedDirectory();
        if (!selectedDir)
          return false;
        let selectedDirURI = selectedDir.URI;

        // Context-sensitive labels for Edit > Delete menuitem.
        if (command == "cmd_delete") {
          goSetMenuValue(command, selectedDir.isMailList ?
                                  "valueList" : "valueAddressBook");
        }

        // If it's one of these special ABs, return false to disable deletion.
        if (selectedDirURI == kPersonalAddressbookURI ||
            selectedDirURI == kCollectedAddressbookURI)
          return false;

        // If the directory is a mailing list, and it is read-only,
        // return false to disable deletion.
        if (selectedDir.isMailList && selectedDir.readOnly)
          return false;

        // If the selected directory is an ldap directory,
        // and if the prefs for this directory are locked,
        // return false to disable deletion.
        if (selectedDirURI.startsWith(kLdapUrlPrefix)) {
          let disable = false;
          try {
            let prefName = selectedDirURI.substr(kLdapUrlPrefix.length);
            disable = Services.prefs.getBoolPref(prefName + ".disable_delete");
          }
          catch(ex) {
            // If this preference is not set, that's ok.
          }
          if (disable)
            return false;
        }

        // Else return true to enable deletion (default).
        return true;
      }
      case "cmd_properties":
        return (getSelectedDirectoryURI() != null);
      case "cmd_newlist":
        return true;
      default:
        return false;
    }
  },

  doCommand: function(command)
  {
    switch (command) {
      case "cmd_selectAll":
        SendCommandToResultsPane(command);
        break;
      case "cmd_delete":
      case "button_delete":
        if (gDirTree)
          AbDeleteSelectedDirectory();
        break;
      case "cmd_properties":
        AbEditSelectedDirectory();
        break;
      case "cmd_newlist":
        AbNewList();
        break;
    }
  },

  onEvent: function(event)
  {
    // on blur events set the menu item texts back to the normal values
    if (event == "blur")
      goSetMenuValue("cmd_delete", "valueDefault");
  }
};

function SendCommandToResultsPane(command)
{
  ResultsPaneController.doCommand(command);

  // if we are sending the command so the results pane
  // we should focus the results pane
  gAbResultsTree.focus();
}

function AbNewLDAPDirectory()
{
  window.openDialog("chrome://messenger/content/addressbook/pref-directory-add.xul",
                    "",
                    "chrome,modal,resizable=no,centerscreen",
                    null);
}

function AbNewAddressBook()
{
  window.openDialog("chrome://messenger/content/addressbook/abAddressBookNameDialog.xul",
                    "",
                    "chrome,modal,resizable=no,centerscreen",
                    null);
}

function AbEditSelectedDirectory()
{
  let selectedDir = getSelectedDirectory();
  if (!selectedDir)
    return;

  if (selectedDir.isMailList) {
    goEditListDialog(null, selectedDir.URI);
  } else {
    window.openDialog(selectedDir.propertiesChromeURI,
                      "",
                      "chrome,modal,resizable=no,centerscreen",
                      {selectedDirectory: selectedDir});
  }
}

function AbDeleteSelectedDirectory()
{
  let selectedDirURI = getSelectedDirectoryURI();
  if (!selectedDirURI)
    return;

  AbDeleteDirectory(selectedDirURI);
}

function AbDeleteDirectory(aURI)
{
  var directory = GetDirectoryFromURI(aURI);
  var confirmDeleteMessage;
  var clearPrefsRequired = false;

  if (directory.isMailList)
    confirmDeleteMessage = gAddressBookBundle.getString("confirmDeleteMailingList");
  else {
    // Check if this address book is being used for collection
    if (Services.prefs.getCharPref("mail.collect_addressbook") == aURI &&
        (Services.prefs.getBoolPref("mail.collect_email_address_outgoing") ||
         Services.prefs.getBoolPref("mail.collect_email_address_incoming") ||
         Services.prefs.getBoolPref("mail.collect_email_address_newsgroup"))) {
      let brandShortName = document.getElementById("bundle_brand").getString("brandShortName");
      confirmDeleteMessage = gAddressBookBundle.getFormattedString("confirmDeleteCollectionAddressbook", [brandShortName]);
      clearPrefsRequired = true;
    } else {
      confirmDeleteMessage = gAddressBookBundle.getString("confirmDeleteAddressbook");
    }
  }

  let title = gAddressBookBundle.getString(directory.isMailList ?
                                             "confirmDeleteMailingListTitle" :
                                             "confirmDeleteAddressbookTitle");
  if (!Services.prompt.confirm(window, title, confirmDeleteMessage))
    return;

  // First clear all the prefs if required
  if (clearPrefsRequired) {
    Services.prefs.setBoolPref("mail.collect_email_address_outgoing", false);
    Services.prefs.setBoolPref("mail.collect_email_address_incoming", false);
    Services.prefs.setBoolPref("mail.collect_email_address_newsgroup", false);

    // Also reset the displayed value so that we don't get a blank item in the
    // prefs dialog if it gets enabled.
    Services.prefs.setCharPref("mail.collect_addressbook",
                               kPersonalAddressbookURI);
  }

  MailServices.ab.deleteAddressBook(aURI);
}

function InitCommonJS()
{
  gDirTree = document.getElementById("dirTree");
  abList = document.getElementById("addressbookList");
  gAddressBookBundle = document.getElementById("bundle_addressBook");
}

function UpgradeAddressBookResultsPaneUI(prefName)
{
  // placeholder in case any new columns get added to the address book
  // var resultsPaneUIVersion = Services.prefs.getIntPref(prefName);
}

function AbDelete()
{
  var types = GetSelectedCardTypes();

  if (types == kNothingSelected)
    return;

  var confirmDeleteMessage;

  if (types == kCardsOnly)
  {
    if (gAbView && gAbView.selection.count < 2)
      confirmDeleteMessage = gAddressBookBundle.getString("confirmDeleteContact");
    else
      confirmDeleteMessage = gAddressBookBundle.getString("confirmDeleteContacts");
  }
  // If at least one mailing list is selected then prompt users for deletion.
  else
  {
    if (types == kListsAndCards)
      confirmDeleteMessage = gAddressBookBundle.getString("confirmDeleteListsAndContacts");
    else if (types == kMultipleListsOnly)
      confirmDeleteMessage = gAddressBookBundle.getString("confirmDeleteMailingLists");
    else if (types == kSingleListOnly)
      confirmDeleteMessage = gAddressBookBundle.getString("confirmDeleteMailingList");
  }

  if (confirmDeleteMessage &&
      Services.prompt.confirm(window, null, confirmDeleteMessage))
    gAbView.deleteSelectedCards();
}

function AbNewCard()
{
  goNewCardDialog(getSelectedDirectoryURI());
}

function AbEditCard(card)
{
  // Need a card,
  if (!card)
    return;

  if (card.isMailList) {
    goEditListDialog(card, card.mailListURI);
  } else {
    goEditCardDialog(getSelectedDirectoryURI(), card);
  }
}

function AbNewMessage()
{
  let params = Components.classes["@mozilla.org/messengercompose/composeparams;1"].createInstance(Components.interfaces.nsIMsgComposeParams);
  if (params) {
    let composeFields = Components.classes["@mozilla.org/messengercompose/composefields;1"].createInstance(Components.interfaces.nsIMsgCompFields);
    if (composeFields) {
      params.type = Components.interfaces.nsIMsgCompType.New;
      params.format = Components.interfaces.nsIMsgCompFormat.Default;
      if (DirPaneHasFocus()) {
        let selectedDir = getSelectedDirectory();
        let hidesRecipients = false;
        try {
          // This is a bit of hackery so that extensions can have mailing lists
          // where recipients are sent messages via BCC.
          hidesRecipients = selectedDir.getBoolValue("HidesRecipients", false);
        } catch(e) {
          // Standard Thunderbird mailing lists do not have preferences
          // associated with them, so we'll silently eat the error.
        }

        if (selectedDir && selectedDir.isMailList && hidesRecipients)
          // Bug 669301 (https://bugzilla.mozilla.org/show_bug.cgi?id=669301)
          // We're using BCC right now to hide recipients from one another.
          // We should probably use group syntax, but that's broken
          // right now, so this will have to do.
          composeFields.bcc = GetSelectedAddressesFromDirTree();
        else
          composeFields.to = GetSelectedAddressesFromDirTree();
      } else {
        composeFields.to = GetSelectedAddresses();
      }
      params.composeFields = composeFields;
      MailServices.compose.OpenComposeWindowWithParams(null, params);
    }
  }
}

function AbCopyAddress()
{
  var cards = GetSelectedAbCards();
  if (!cards)
    return;

  var count = cards.length;
  if (!count)
    return;

  var addresses = cards[0].primaryEmail;
  for (var i = 1; i < count; i++)
    addresses += "," + cards[i].primaryEmail;

  Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper)
            .copyString(addresses);
}

/**
 * Set up items in the View > Layout menupopup.  This function is responsible
 * for updating the menu items' state to reflect reality.
 *
 * @param aEvent the event that caused the View > Layout menupopup to be shown
 */
function InitViewLayoutMenuPopup(aEvent)
{
  let dirTreeVisible = document.getElementById("dirTree-splitter")
                               .getAttribute("state") != "collapsed";
  document.getElementById("menu_showDirectoryPane")
          .setAttribute("checked", dirTreeVisible);

  let cardPaneVisible = document.getElementById("results-splitter")
                                .getAttribute("state") != "collapsed";
  document.getElementById("menu_showCardPane")
          .setAttribute("checked", cardPaneVisible);
}

// Generate a list of cards from the selected mailing list
// and get a comma separated list of card addresses. If the
// item selected in the directory pane is not a mailing list,
// an empty string is returned.
function GetSelectedAddressesFromDirTree()
{
  let selectedDir = getSelectedDirectory();

  if (!selectedDir || !selectedDir.isMailList)
    return "";

  let listCardsCount = selectedDir.addressLists.length;
  let cards = new Array(listCardsCount);
  for (let i = 0; i < listCardsCount; ++i)
    cards[i] = selectedDir.addressLists
                 .queryElementAt(i, Components.interfaces.nsIAbCard);
  return GetAddressesForCards(cards);
}

// Generate a comma separated list of addresses from a given
// set of cards.
function GetAddressesForCards(cards)
{
  var addresses = "";

  if (!cards)
    return addresses;

  var count = cards.length;
  for (var i = 0; i < count; ++i) {
    var generatedAddress = GenerateAddressFromCard(cards[i]);
    if (generatedAddress) {
      // If it's not the first address in the list, add a comma separator.
      if (addresses)
        addresses += ",";
      addresses += generatedAddress;
    }
  }

  return addresses;
}


function SelectFirstAddressBook()
{
  gDirectoryTreeView.selection.select(0);

  ChangeDirectoryByURI(getSelectedDirectoryURI());
  gAbResultsTree.focus();
}

function DirPaneClick(event)
{
  // we only care about left button events
  if (event.button != 0)
    return;

  // if the user clicks on the header / trecol, do nothing
  if (event.originalTarget.localName == "treecol") {
    event.stopPropagation();
    return;
  }

  let searchInput = document.getElementById("searchInput");
  // if there is a searchInput element, and it's not blank
  // then we need to act like the user cleared the
  // search text
  if (searchInput && searchInput.value) {
    searchInput.value = "";
    onEnterInSearchBar();
  }
}

function DirPaneDoubleClick(event)
{
  // We only care about left button events.
  if (event.button != 0)
    return;

  // Ignore double clicking on invalid rows.
  let row = gDirTree.treeBoxObject.getRowAt(event.clientX, event.clientY);
  if (row == -1 || row >= gDirectoryTreeView.rowCount)
    return;

  // Default action for double click is expand/collapse which ships with the tree.
  // For convenience, allow double-click to edit the properties of mailing
  // lists in directory tree.
  if (gDirTree && gDirTree.view.selection &&
      gDirTree.view.selection.count == 1 &&
      getSelectedDirectory().isMailList) {
    AbEditSelectedDirectory();
  }
}

function DirPaneSelectionChange()
{
  if (gDirectoryTreeView.selection &&
      gDirectoryTreeView.selection.count == 1) {
    ChangeDirectoryByURI(getSelectedDirectoryURI());
  }
}

function ChangeDirectoryByURI(uri)
{
  if (!uri)
    uri = kPersonalAddressbookURI;

  SetAbView(uri);

  // only select the first card if there is a first card
  if (gAbView && gAbView.getCardFromRow(0))
    SelectFirstCard();
  else
    // the selection changes if we were switching directories.
    ResultsPaneSelectionChanged()
}

function AbNewList()
{
  goNewListDialog(getSelectedDirectoryURI());
}

function goNewListDialog(selectedAB)
{
  window.openDialog("chrome://messenger/content/addressbook/abMailListDialog.xul",
                    "",
                    "chrome,modal,resizable,centerscreen",
                    {selectedAB:selectedAB});
}

function goEditListDialog(abCard, listURI)
{
  let params = {
    abCard: abCard,
    listURI: listURI,
    refresh: false, // This is an out param, true if OK in dialog is clicked.
  };

  window.openDialog("chrome://messenger/content/addressbook/abEditListDialog.xul",
                    "",
                    "chrome,modal,resizable,centerscreen",
                    params);

  if (params.refresh) {
    ChangeDirectoryByURI(listURI); // force refresh
  }
}

function goNewCardDialog(selectedAB)
{
  window.openDialog("chrome://messenger/content/addressbook/abNewCardDialog.xul",
                    "",
                    "chrome,modal,resizable=no,centerscreen",
                    {selectedAB:selectedAB});
}

function goEditCardDialog(abURI, card)
{
  window.openDialog("chrome://messenger/content/addressbook/abEditCardDialog.xul",
                    "",
                    "chrome,modal,resizable=no,centerscreen",
                    {abURI:abURI, card:card});
}

function setSortByMenuItemCheckState(id, value)
{
    var menuitem = document.getElementById(id);
    if (menuitem) {
      menuitem.setAttribute("checked", value);
    }
}

function InitViewSortByMenu()
{
    var sortColumn = kDefaultSortColumn;
    var sortDirection = kDefaultAscending;

    if (gAbView) {
      sortColumn = gAbView.sortColumn;
      sortDirection = gAbView.sortDirection;
    }

    // this approach is necessary to support generic columns that get overlayed.
    var elements = document.getElementsByAttribute("name","sortas");
    for (var i=0; i<elements.length; i++) {
      let cmd = elements[i].getAttribute("id");
      let columnForCmd = cmd.split("cmd_SortBy")[1];
      setSortByMenuItemCheckState(cmd, (sortColumn == columnForCmd));
    }

    setSortByMenuItemCheckState("sortAscending", (sortDirection == kDefaultAscending));
    setSortByMenuItemCheckState("sortDescending", (sortDirection == kDefaultDescending));
}

function GenerateAddressFromCard(card)
{
  if (!card)
    return "";

  var email;

  if (card.isMailList)
  {
    var directory = GetDirectoryFromURI(card.mailListURI);
    email = directory.description || card.displayName;
  }
  else
    email = card.primaryEmail;

  return MailServices.headerParser.makeMimeAddress(card.displayName, email);
}

function GetDirectoryFromURI(uri)
{
  return MailServices.ab.getDirectory(uri);
}

// returns null if abURI is not a mailing list URI
function GetParentDirectoryFromMailingListURI(abURI)
{
  var abURIArr = abURI.split("/");
  /*
   turn turn "moz-abmdbdirectory://abook.mab/MailList6"
   into ["moz-abmdbdirectory:","","abook.mab","MailList6"]
   then, turn ["moz-abmdbdirectory:","","abook.mab","MailList6"]
   into "moz-abmdbdirectory://abook.mab"
  */
  if (abURIArr.length == 4 && abURIArr[0] == "moz-abmdbdirectory:" && abURIArr[3] != "") {
    return abURIArr[0] + "/" + abURIArr[1] + "/" + abURIArr[2];
  }

  return null;
}

/**
 * Return true if the directory pane has focus, otherwise false.
 */
function DirPaneHasFocus()
{
  return (top.document.commandDispatcher.focusedElement == gDirTree);
}

/**
 * Get the selected directory object.
 *
 * @return The object of the currently selected directory
 */
function getSelectedDirectory()
{
  // Select Addresses Dialog
  if (abList)
    return MailServices.ab.getDirectory(abList.value);

  // Main Address Book
  if (gDirTree.currentIndex < 0)
    return null;
  return gDirectoryTreeView.getDirectoryAtIndex(gDirTree.currentIndex);
}

/**
 * Get the URI of the selected directory.
 *
 * @return The URI of the currently selected directory
 */
function getSelectedDirectoryURI()
{
  // Select Addresses Dialog
  if (abList)
    return abList.value;

  // Main Address Book
  if (gDirTree.currentIndex < 0)
    return null;
  return gDirectoryTreeView.getDirectoryAtIndex(gDirTree.currentIndex).URI;
}

/**
 * DEPRECATED legacy function wrapper for addon compatibility;
 * use getSelectedDirectoryURI() instead!
 * Return the URI of the selected directory.
 */
function GetSelectedDirectory()
{
  return getSelectedDirectoryURI();
}

/**
 * Returns an nsIFile of the directory in which contact photos are stored.
 * This will create the directory if it does not yet exist.
 */
function getPhotosDir() {
  var file = Services.dirsvc.get("ProfD", Components.interfaces.nsIFile);
  // Get the Photos directory
  file.append("Photos");
  if (!file.exists() || !file.isDirectory())
    file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt("0777", 8));
  return file;
}

/**
 * Returns a URI specifying the location of a photo based on its name.
 * If the name is blank, or if the photo with that name is not in the Photos
 * directory then the default photo URI is returned.
 *
 * @param aPhotoName The name of the photo from the Photos folder, if any.
 *
 * @return A URI pointing to a photo.
 */
function getPhotoURI(aPhotoName) {
  if (!aPhotoName)
    return defaultPhotoURI;
  var file = getPhotosDir();
  try {
    file.append(aPhotoName);
  }
  catch (e) {
    return defaultPhotoURI;
  }
  if (!file.exists())
    return defaultPhotoURI;
  return Services.io.newFileURI(file).spec;
}

/**
 * Copies the photo at the given URI in a folder named "Photos" in the current
 * profile folder.
 * The filename is randomly generated and is unique.
 * The URI is used to obtain a channel which is then opened synchronously and
 * this stream is written to the new file to store an offline, local copy of the
 * photo.
 *
 * @param aUri The URI of the photo.
 *
 * @return An nsIFile representation of the photo.
 */
function storePhoto(aUri) {
  if (!aUri)
    return false;

  // Get the photos directory and check that it exists
  var file = getPhotosDir();

  // Create a channel from the URI and open it as an input stream
  var channel = Services.io.newChannelFromURI2(Services.io.newURI(aUri, null, null),
                                         null,
                                         Services.scriptSecurityManager.getSystemPrincipal(),
                                         null,
                                         Components.interfaces.nsILoadInfo.SEC_NORMAL,
                                         Components.interfaces.nsIContentPolicy.TYPE_INTERNAL_IMAGE);

  var istream = channel.open();

  // Get the photo file
  file = makePhotoFile(file, findPhotoExt(channel));

  return IOUtils.saveStreamToFile(istream, file);
}

/**
 * Finds the file extension of the photo identified by the URI, if possible.
 * This function can be overridden (with a copy of the original) for URIs that
 * do not identify the extension or when the Content-Type response header is
 * either not set or isn't 'image/png', 'image/jpeg', or 'image/gif'.
 * The original function can be called if the URI does not match.
 *
 * @param aUri The URI of the photo.
 * @param aChannel The opened channel for the URI.
 *
 * @return The extension of the file, if any, including the period.
 */
function findPhotoExt(aChannel) {
  var mimeSvc = Components.classes["@mozilla.org/mime;1"]
                          .getService(Components.interfaces.nsIMIMEService);
  var ext = "";
  var uri = aChannel.URI;
  if (uri instanceof Components.interfaces.nsIURL)
    ext = uri.fileExtension;
  try {
    return mimeSvc.getPrimaryExtension(aChannel.contentType, ext);
  } catch (e) {}
  return ext;
}

/**
 * Generates a unique filename to be used for a local copy of a contact's photo.
 *
 * @param aPath      The path to the folder in which the photo will be saved.
 * @param aExtension The file extension of the photo.
 *
 * @return A unique filename in the given path.
 */
function makePhotoFile(aDir, aExtension) {
  var filename, newFile;
  // Find a random filename for the photo that doesn't exist yet
  do {
    filename = new String(Math.random()).replace("0.", "") + "." + aExtension;
    newFile = aDir.clone();
    newFile.append(filename);
  } while (newFile.exists());
  return newFile;
}

/**
 * Validates the given year and returns it, if it looks sane.
 * Returns kDefaultYear (a leap year), if no valid date is given.
 * This ensures that month/day calculations still work.
 */
function saneBirthYear(aYear) {
  return aYear && (aYear <= kMaxYear) && (aYear >= kMinYear) ? aYear : kDefaultYear;
}

/**
 * Returns the nearest leap year before aYear.
 */
function nearestLeap(aYear) {
  for (let year = aYear; year > 0; year--) {
    if (new Date(year, 1, 29).getMonth() == 1)
      return year;
  }
  return 2000;
}
