/* -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource:///modules/ABQueryUtils.jsm");

var addressbook = 0;
var composeWindow = 0;
var msgCompFields = 0;
var editCardCallback = 0;

var gSearchInput;
var gSearchTimer = null;
var gQueryURIFormat = null;

// localization strings
var prefixTo;
var prefixCc;
var prefixBcc;

var gToButton;
var gCcButton;
var gBccButton;

var gActivatedButton;

var gDragService = Components.classes["@mozilla.org/widget/dragservice;1"]
                             .getService(Components.interfaces.nsIDragService);

var gSelectAddressesAbViewListener = {
	onSelectionChanged: function() {
    ResultsPaneSelectionChanged();
  },
  onCountChanged: function(total) {
    // do nothing
  }
};

function GetAbViewListener()
{
  return gSelectAddressesAbViewListener;
}

function OnLoadSelectAddress()
{
  InitCommonJS();

  prefixTo = gAddressBookBundle.getString("prefixTo") + ": ";
  prefixCc = gAddressBookBundle.getString("prefixCc") + ": ";
  prefixBcc = gAddressBookBundle.getString("prefixBcc") + ": ";

  UpgradeAddressBookResultsPaneUI("mailnews.ui.select_addresses_results.version");

  var toAddress="", ccAddress="", bccAddress="";

  // look in arguments[0] for parameters
  if (window.arguments && window.arguments[0])
  {
    // keep parameters in global for later
    if ( window.arguments[0].composeWindow )
      top.composeWindow = window.arguments[0].composeWindow;
    if ( window.arguments[0].msgCompFields )
      top.msgCompFields = window.arguments[0].msgCompFields;
    if ( window.arguments[0].toAddress )
      toAddress = window.arguments[0].toAddress;
    if ( window.arguments[0].ccAddress )
      ccAddress = window.arguments[0].ccAddress;
    if ( window.arguments[0].bccAddress )
      bccAddress = window.arguments[0].bccAddress;

    // put the addresses into the bucket
    AddAddressFromComposeWindow(toAddress, prefixTo);
    AddAddressFromComposeWindow(ccAddress, prefixCc);
    AddAddressFromComposeWindow(bccAddress, prefixBcc);
  }

  gSearchInput = document.getElementById("searchInput");

  // Reselect the persisted address book if possible, if not just select the
  // first in the list.
  var temp = abList.value;
  abList.selectedItem = null;
  abList.value = temp;
  if (!abList.selectedItem)
    abList.selectedIndex = 0;

  ChangeDirectoryByURI(abList.value);

  DialogBucketPaneSelectionChanged();

  var workPhoneCol = document.getElementById("WorkPhone");
  workPhoneCol.setAttribute("hidden", "true");

  var companyCol = document.getElementById("Company");
  companyCol.setAttribute("hidden", "true");

  gToButton = document.getElementById("toButton");
  gCcButton = document.getElementById("ccButton");
  gBccButton = document.getElementById("bccButton");

  gAbResultsTree.focus();

  gActivatedButton = gToButton;

  document.documentElement.addEventListener("keypress", OnReturnHit, true);
}

function OnUnloadSelectAddress()
{
  CloseAbView();
}

function AddAddressFromComposeWindow(addresses, prefix)
{
  if ( addresses )
  {
    var emails = {};
    var names = {};
    var fullNames = {};
    var numAddresses = MailServices.headerParser.parseHeadersWithArray(addresses, emails, names, fullNames);

    for ( var index = 0; index < numAddresses; index++ )
    {
      AddAddressIntoBucket(prefix, fullNames.value[index], emails.value[index]);
    }
  }
}

function SelectAddressOKButton()
{
  // Empty email checks are now done in AddAddressIntoBucket below.
  var body = document.getElementById('bucketBody');
  var item, row, cell, prefix, address, email;
  var toAddress="", ccAddress="", bccAddress="", emptyEmail="";

  for ( var index = 0; index < body.childNodes.length; index++ )
  {
    item = body.childNodes[index];
    if ( item.childNodes && item.childNodes.length )
    {
      row = item.childNodes[0];
      if (  row.childNodes &&  row.childNodes.length )
      {
        cell = row.childNodes[0];
        prefix = cell.getAttribute('prefix');
        address = cell.getAttribute('address');
        email = cell.getAttribute('email');
        if ( prefix )
        {
          switch ( prefix )
          {
            case prefixTo:
              if ( toAddress )
                toAddress += ", ";
              toAddress += address;
              break;
            case prefixCc:
              if ( ccAddress )
                ccAddress += ", ";
              ccAddress += address;
              break;
            case prefixBcc:
              if ( bccAddress )
                bccAddress += ", ";
              bccAddress += address;
              break;
          }
        }
      }
    }
  }
  // reset the UI in compose window
  msgCompFields.to = toAddress;
  msgCompFields.cc = ccAddress;
  msgCompFields.bcc = bccAddress;
  top.composeWindow.CompFields2Recipients(top.msgCompFields);

  return true;
}

function SelectAddressToButton()
{
  AddSelectedAddressesIntoBucket(prefixTo);
  gActivatedButton = gToButton;
}

function SelectAddressCcButton()
{
  AddSelectedAddressesIntoBucket(prefixCc);
  gActivatedButton = gCcButton;
}

function SelectAddressBccButton()
{
  AddSelectedAddressesIntoBucket(prefixBcc);
  gActivatedButton = gBccButton;
}

function AddSelectedAddressesIntoBucket(prefix)
{
  var cards = GetSelectedAbCards();
  var count = cards.length;

  for (var i = 0; i < count; i++) {
    AddCardIntoBucket(prefix, cards[i]);
  }
}

function AddCardIntoBucket(prefix, card)
{
  var address = GenerateAddressFromCard(card);
  if (card.isMailList) {
    AddAddressIntoBucket(prefix, address, card.displayName);
    }
  else {
    AddAddressIntoBucket(prefix, address, card.primaryEmail);
  }
}

function AddAddressIntoBucket(prefix, address, email)
{
  if (!email)
  {
    Services.prompt.alert(window,
                          gAddressBookBundle.getString("emptyEmailAddCardTitle"),
                          gAddressBookBundle.getString("emptyEmailAddCard"));
  }
  else
  {
    var body = document.getElementById("bucketBody");

    var item = document.createElement('treeitem');
    var row = document.createElement('treerow');
    var cell = document.createElement('treecell');
    cell.setAttribute('label', prefix + address);
    cell.setAttribute('prefix', prefix);
    cell.setAttribute('address', address);
    cell.setAttribute('email', email);

    row.appendChild(cell);
    item.appendChild(row);
    body.appendChild(item);
  }
}

function RemoveSelectedFromBucket()
{
  var bucketTree = document.getElementById("addressBucket");
  if ( bucketTree )
  {
    var body = document.getElementById("bucketBody");
    var selection = bucketTree.view.selection;
    var rangeCount = selection.getRangeCount();

    for (var i = rangeCount-1; i >= 0; --i)
    {
      var start = {}, end = {};
      selection.getRangeAt(i,start,end);
      for (var j = end.value; j >= start.value; --j)
      {
        bucketTree.contentView.getItemAtIndex(j).remove();
      }
    }
  }
}

/* Function: ResultsPaneSelectionChanged()
 * Callers : OnLoadSelectAddress(), abCommon.js:ResultsPaneSelectionChanged()
 * -------------------------------------------------------------------------
 * This function is used to grab the selection state of the results tree to maintain
 * the appropriate enabled/disabled states of the "Edit", "To:", "CC:", and "Bcc:" buttons.
 * If an entry is selected in the results Tree, then the "disabled" attribute is removed.
 * Otherwise, if nothing is selected, "disabled" is set to true.
 */

function ResultsPaneSelectionChanged()
{;
  var editButton = document.getElementById("edit");
  var toButton = document.getElementById("toButton");
  var ccButton = document.getElementById("ccButton");
  var bccButton = document.getElementById("bccButton");

  var numSelected = GetNumSelectedCards();
  if (numSelected > 0)
  {
    if (numSelected == 1)
    editButton.removeAttribute("disabled");
    else
      editButton.setAttribute("disabled", "true");

    toButton.removeAttribute("disabled");
    ccButton.removeAttribute("disabled");
    bccButton.removeAttribute("disabled");
  }
  else
  {
    editButton.setAttribute("disabled", "true");
    toButton.setAttribute("disabled", "true");
    ccButton.setAttribute("disabled", "true");
    bccButton.setAttribute("disabled", "true");
  }
}

/* Function: DialogBucketPaneSelectionChanged()
 * Callers : OnLoadSelectAddress(), abSelectAddressesDialog.xul:id="addressBucket"
 * -------------------------------------------------------------------------------
 * This function is used to grab the selection state of the bucket tree to maintain
 * the appropriate enabled/disabled states of the "Remove" button.
 * If an entry is selected in the bucket Tree, then the "disabled" attribute is removed.
 * Otherwise, if nothing is selected, "disabled" is set to true.
 */

function DialogBucketPaneSelectionChanged()
{
  var bucketTree = document.getElementById("addressBucket");
  var removeButton = document.getElementById("remove");

  removeButton.disabled = bucketTree.view.selection.count == 0;
}

function AbResultsPaneDoubleClick(card)
{
  AddCardIntoBucket(prefixTo, card);
}

function OnClickedCard(card)
{
  // in the select address dialog, do nothing on click
}

function UpdateCardView()
{
  // in the select address dialog, do nothing
}

function DropRecipient(address)
{
  AddAddressIntoBucket(prefixTo, address, address);
}

function OnReturnHit(event)
{
  if (event.keyCode == 13) {
    var focusedElement = document.commandDispatcher.focusedElement;
    if (focusedElement && (focusedElement.id == "addressBucket"))
      return;
    event.stopPropagation();
    if (focusedElement && (focusedElement.id == "abResultsTree"))
      gActivatedButton.doCommand();
  }
}


function onEnterInSearchBar()
{
  var selectedNode = abList.selectedItem;

  if (!selectedNode)
    return;

  if (!gQueryURIFormat) {
    // Get model query from pref, without preceding "?", so we need to add it again
    gQueryURIFormat = "?" + getModelQuery("mail.addr_book.quicksearchquery.format");
  }

  var searchURI = selectedNode.value;

  if (gSearchInput.value != "") {
    searchURI += gQueryURIFormat.replace(/@V/g, encodeABTermValue(gSearchInput.value));
  }

  SetAbView(searchURI);

  SelectFirstCard();
}

function DirPaneSelectionChangeMenulist()
{
  if (abList && abList.selectedItem) {
    if (gSearchInput.value && (gSearchInput.value != ""))
      onEnterInSearchBar();
    else
      ChangeDirectoryByURI(abList.value);
  }
}
