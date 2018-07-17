/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//NOTE: gAddressBookBundle must be defined and set or this Overlay won't work

var gProfileDirURL;

var gMapItURLFormat;

var gFileHandler = Services.io.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
var gPhotoDisplayHandlers = {};

var zListName;
var zPrimaryEmail;
var zSecondaryEmail;
var zScreenName;
var zNickname;
var zDisplayName;
var zWork;
var zHome;
var zFax;
var zCellular;
var zPager;
var zBirthday;
var zCustom1;
var zCustom2;
var zCustom3;
var zCustom4;

var cvData;

function OnLoadCardView()
{
  gMapItURLFormat = GetLocalizedStringPref("mail.addr_book.mapit_url.format");

  zPrimaryEmail = gAddressBookBundle.getString("propertyPrimaryEmail");
  zSecondaryEmail = gAddressBookBundle.getString("propertySecondaryEmail");
  zScreenName = gAddressBookBundle.getString("propertyScreenName");
  zNickname = gAddressBookBundle.getString("propertyNickname");
  zDisplayName = gAddressBookBundle.getString("propertyDisplayName");
  zListName = gAddressBookBundle.getString("propertyListName");
  zWork = gAddressBookBundle.getString("propertyWork");
  zHome = gAddressBookBundle.getString("propertyHome");
  zFax = gAddressBookBundle.getString("propertyFax");
  zCellular = gAddressBookBundle.getString("propertyCellular");
  zPager = gAddressBookBundle.getString("propertyPager");
  zBirthday = gAddressBookBundle.getString("propertyBirthday");
  zCustom1 = gAddressBookBundle.getString("propertyCustom1");
  zCustom2 = gAddressBookBundle.getString("propertyCustom2");
  zCustom3 = gAddressBookBundle.getString("propertyCustom3");
  zCustom4 = gAddressBookBundle.getString("propertyCustom4");

	var doc = document;

	/* data for address book, prefixes: "cvb" = card view box
										"cvh" = crad view header
										"cv"  = card view (normal fields) */
	cvData = new Object;

	// Card View Box
	cvData.CardViewBox		= doc.getElementById("CardViewInnerBox");
	// Title
	cvData.CardTitle		= doc.getElementById("CardTitle");
	// Name section
	cvData.cvbContact = doc.getElementById("cvbContact");
	cvData.cvhContact = doc.getElementById("cvhContact");
	cvData.cvNickname		= doc.getElementById("cvNickname");
	cvData.cvDisplayName	= doc.getElementById("cvDisplayName");
	cvData.cvEmail1Box		= doc.getElementById("cvEmail1Box");
	cvData.cvEmail1			= doc.getElementById("cvEmail1");
	cvData.cvScreennameBox		= doc.getElementById("cvScreennameBox");
	cvData.cvScreenname		= doc.getElementById("cvScreenname");
	cvData.cvBuddyIcon              = doc.getElementById("cvBuddyIcon");
	cvData.cvListNameBox		= doc.getElementById("cvListNameBox");
	cvData.cvListName               = doc.getElementById("cvListName");
	cvData.cvEmail2Box		= doc.getElementById("cvEmail2Box");
	cvData.cvEmail2			= doc.getElementById("cvEmail2");
	// Home section
	cvData.cvbHome			= doc.getElementById("cvbHome");
	cvData.cvhHome			= doc.getElementById("cvhHome");
	cvData.cvHomeAddress	= doc.getElementById("cvHomeAddress");
	cvData.cvHomeAddress2	= doc.getElementById("cvHomeAddress2");
	cvData.cvHomeCityStZip	= doc.getElementById("cvHomeCityStZip");
	cvData.cvHomeCountry	= doc.getElementById("cvHomeCountry");
  cvData.cvbHomeMapItBox  = doc.getElementById("cvbHomeMapItBox");
  cvData.cvHomeMapIt = doc.getElementById("cvHomeMapIt");
	cvData.cvHomeWebPageBox = doc.getElementById("cvHomeWebPageBox");
	cvData.cvHomeWebPage	= doc.getElementById("cvHomeWebPage");
	// Other section
	cvData.cvbOther			= doc.getElementById("cvbOther");
	cvData.cvBirthday   = doc.getElementById("cvBirthday");
	cvData.cvhOther			= doc.getElementById("cvhOther");
	cvData.cvCustom1		= doc.getElementById("cvCustom1");
	cvData.cvCustom2		= doc.getElementById("cvCustom2");
	cvData.cvCustom3		= doc.getElementById("cvCustom3");
	cvData.cvCustom4		= doc.getElementById("cvCustom4");
	cvData.cvNotes			= doc.getElementById("cvNotes");
  // Description section (mailing lists only)
  cvData.cvbDescription			= doc.getElementById("cvbDescription");
	cvData.cvhDescription			= doc.getElementById("cvhDescription");
  cvData.cvDescription			= doc.getElementById("cvDescription");
  // Addresses section (mailing lists only)
  cvData.cvbAddresses			= doc.getElementById("cvbAddresses");
	cvData.cvhAddresses			= doc.getElementById("cvhAddresses");
  cvData.cvAddresses			= doc.getElementById("cvAddresses");
	// Phone section
	cvData.cvbPhone			= doc.getElementById("cvbPhone");
	cvData.cvhPhone			= doc.getElementById("cvhPhone");
	cvData.cvPhWork			= doc.getElementById("cvPhWork");
	cvData.cvPhHome			= doc.getElementById("cvPhHome");
	cvData.cvPhFax			= doc.getElementById("cvPhFax");
	cvData.cvPhCellular		= doc.getElementById("cvPhCellular");
	cvData.cvPhPager		= doc.getElementById("cvPhPager");
	// Work section
	cvData.cvbWork			= doc.getElementById("cvbWork");
	cvData.cvhWork			= doc.getElementById("cvhWork");
	cvData.cvJobTitle		= doc.getElementById("cvJobTitle");
	cvData.cvDepartment		= doc.getElementById("cvDepartment");
	cvData.cvCompany		= doc.getElementById("cvCompany");
	cvData.cvWorkAddress	= doc.getElementById("cvWorkAddress");
	cvData.cvWorkAddress2	= doc.getElementById("cvWorkAddress2");
	cvData.cvWorkCityStZip	= doc.getElementById("cvWorkCityStZip");
	cvData.cvWorkCountry	= doc.getElementById("cvWorkCountry");
  cvData.cvbWorkMapItBox  = doc.getElementById("cvbWorkMapItBox");
  cvData.cvWorkMapIt = doc.getElementById("cvWorkMapIt");
	cvData.cvWorkWebPageBox = doc.getElementById("cvWorkWebPageBox");
	cvData.cvWorkWebPage	= doc.getElementById("cvWorkWebPage");
  cvData.cvbPhoto = doc.getElementById("cvbPhoto");
  cvData.cvPhoto  = doc.getElementById("cvPhoto");
}

// XXX todo
// some similar code (in spirit) already exists, see OnLoadEditList()
// perhaps we could combine and put in abCommon.js?
function GetAddressesFromURI(uri)
{
  var addresses = "";

  var editList = GetDirectoryFromURI(uri);
  var addressList = editList.addressLists;
  if (addressList) {
    var total = addressList.length;
    if (total > 0)
      addresses = addressList.queryElementAt(0, Components.interfaces.nsIAbCard).primaryEmail;
    for (var i = 1;  i < total; i++ ) {
      addresses += ", " + addressList.queryElementAt(i, Components.interfaces.nsIAbCard).primaryEmail;
    }
  }
  return addresses;
}

function DisplayCardViewPane(realCard)
{
  var generatedName = realCard.generateName(Services.prefs.getIntPref("mail.addr_book.lastnamefirst"));

  var data = top.cvData;
  var visible;

  var card = { getProperty : function (prop) {
                 return realCard.getProperty(prop, "");
               },
               primaryEmail : realCard.primaryEmail,
               displayName : realCard.displayName,
               isMailList : realCard.isMailList,
               mailListURI : realCard.mailListURI
  };

  // Contact photo
  displayPhoto(card, cvData.cvPhoto);

  var titleString;
  if (generatedName == "")
    titleString = card.primaryEmail;  // if no generatedName, use email
  else
    titleString = generatedName;

  // set fields in card view pane
  if (card.isMailList)
    cvSetNode(data.CardTitle, gAddressBookBundle.getFormattedString("viewListTitle", [generatedName]));
  else
    cvSetNode(data.CardTitle, titleString);

  // Contact section
  cvSetNodeWithLabel(data.cvNickname, zNickname, card.getProperty("NickName"));

  if (card.isMailList) {
    // email1, display name and screenname always hidden when a mailing list.
    cvSetVisible(data.cvDisplayName, false);
    cvSetVisible(data.cvEmail1Box, false);
    cvSetVisible(data.cvScreennameBox, false);

    visible = HandleLink(data.cvListName, zListName, card.displayName, data.cvListNameBox, "mailto:" + encodeURIComponent(GenerateAddressFromCard(card))) || visible;
  }
  else {
    // listname always hidden if not a mailing list
    cvSetVisible(data.cvListNameBox, false);

    cvSetNodeWithLabel(data.cvDisplayName, zDisplayName, card.displayName);

    visible = HandleLink(data.cvEmail1, zPrimaryEmail, card.primaryEmail, data.cvEmail1Box, "mailto:" + card.primaryEmail) || visible;
  }

  var goimURL = "aim:goim?screenname=" + card.getProperty("_AimScreenName");
  var hasScreenName = HandleLink(data.cvScreenname, zScreenName, card.getProperty("_AimScreenName"), data.cvScreennameBox, goimURL);

  visible = hasScreenName || visible;
  visible = HandleLink(data.cvEmail2, zSecondaryEmail, card.getProperty("SecondEmail"), data.cvEmail2Box, "mailto:" + card.getProperty("SecondEmail")) || visible;

  // Home section
  visible = cvSetNode(data.cvHomeAddress, card.getProperty("HomeAddress"));
  visible = cvSetNode(data.cvHomeAddress2, card.getProperty("HomeAddress2")) || visible;
  visible = cvSetCityStateZip(data.cvHomeCityStZip, card.getProperty("HomeCity"), card.getProperty("HomeState"), card.getProperty("HomeZipCode")) || visible;
  visible = cvSetNode(data.cvHomeCountry, card.getProperty("HomeCountry")) || visible;

  let mapURLList = data.cvHomeMapIt.firstChild;
  if (visible)
    mapURLList.initMapAddressFromCard(card, "Home");

  cvSetVisible(data.cvbHomeMapItBox, !!mapURLList.mapURL);

  visible = HandleLink(data.cvHomeWebPage, "", card.getProperty("WebPage2"), data.cvHomeWebPageBox, card.getProperty("WebPage2")) || visible;

	cvSetVisible(data.cvhHome, visible);
	cvSetVisible(data.cvbHome, visible);
  if (card.isMailList) {
    // Description section
	  visible = cvSetNode(data.cvDescription, card.getProperty("Notes"))
  	cvSetVisible(data.cvbDescription, visible);

    // Addresses section
	  visible = cvAddAddressNodes(data.cvAddresses, card.mailListURI);
  	cvSetVisible(data.cvbAddresses, visible);

    // Other section, not shown for mailing lists.
    cvSetVisible(data.cvbOther, false);
  }
  else {
	  // Other section
    /// setup the birthday information
    var day = card.getProperty("BirthDay", null);
    var month = card.getProperty("BirthMonth", null);
    var year = card.getProperty("BirthYear", null);
    var dateStr;
    if (day > 0 && day < 32 && month > 0 && month < 13) {
      var date;
      // if the year exists, just use Date.toLocaleString
      if (year) {
        // use UTC-based calculations to avoid off-by-one day
        // due to time zone/dst discontinuity
        date = new Date(Date.UTC(year, month - 1, day));
        date.setUTCFullYear(year); // to handle two-digit years properly
        dateStr = date.toLocaleDateString([], {timeZone: "UTC"});
      }
      // if the year doesn't exist, display Month DD (ex. January 1)
      else {
        date = new Date(saneBirthYear(year), month - 1, day);
        // toLocaleFormat() seems to have a different implementation than
        // toLocaleDateString() and returns correct results even when not
        // passing UTC times; besides, it would not support an options
        // parameter for {timeZone: "UTC"} anyway.
        dateStr = date.toLocaleFormat(gAddressBookBundle.getString("dateFormatMonthDay"));
      }
    }
    else if (year)
      dateStr = year;
    visible = cvSetNodeWithLabel(data.cvBirthday, zBirthday, dateStr);

	  visible = cvSetNodeWithLabel(data.cvCustom1, zCustom1, card.getProperty("Custom1")) || visible;
	  visible = cvSetNodeWithLabel(data.cvCustom2, zCustom2, card.getProperty("Custom2")) || visible;
	  visible = cvSetNodeWithLabel(data.cvCustom3, zCustom3, card.getProperty("Custom3")) || visible;
	  visible = cvSetNodeWithLabel(data.cvCustom4, zCustom4, card.getProperty("Custom4")) || visible;
	  visible = cvSetNode(data.cvNotes, card.getProperty("Notes")) || visible;
    visible = setBuddyIcon(card, data.cvBuddyIcon) || visible;

    cvSetVisible(data.cvhOther, visible);
    cvSetVisible(data.cvbOther, visible);

    // hide description section, not show for non-mailing lists
    cvSetVisible(data.cvbDescription, false);

    // hide addresses section, not show for non-mailing lists
    cvSetVisible(data.cvbAddresses, false);
  }

	// Phone section
	visible = cvSetNodeWithLabel(data.cvPhWork, zWork, card.getProperty("WorkPhone"));
	visible = cvSetNodeWithLabel(data.cvPhHome, zHome, card.getProperty("HomePhone")) || visible;
	visible = cvSetNodeWithLabel(data.cvPhFax, zFax, card.getProperty("FaxNumber")) || visible;
	visible = cvSetNodeWithLabel(data.cvPhCellular, zCellular, card.getProperty("CellularNumber")) || visible;
	visible = cvSetNodeWithLabel(data.cvPhPager, zPager, card.getProperty("PagerNumber")) || visible;
	cvSetVisible(data.cvhPhone, visible);
	cvSetVisible(data.cvbPhone, visible);
	// Work section
	visible = cvSetNode(data.cvJobTitle, card.getProperty("JobTitle"));
	visible = cvSetNode(data.cvDepartment, card.getProperty("Department")) || visible;
	visible = cvSetNode(data.cvCompany, card.getProperty("Company")) || visible;

        var addressVisible = cvSetNode(data.cvWorkAddress, card.getProperty("WorkAddress"));
	addressVisible = cvSetNode(data.cvWorkAddress2, card.getProperty("WorkAddress2")) || addressVisible;
	addressVisible = cvSetCityStateZip(data.cvWorkCityStZip, card.getProperty("WorkCity"), card.getProperty("WorkState"), card.getProperty("WorkZipCode")) || addressVisible;
	addressVisible = cvSetNode(data.cvWorkCountry, card.getProperty("WorkCountry")) || addressVisible;

  mapURLList = data.cvWorkMapIt.firstChild;
  if (addressVisible)
    mapURLList.initMapAddressFromCard(card, "Work");

  cvSetVisible(data.cvbWorkMapItBox, !!mapURLList.mapURL);

        visible = HandleLink(data.cvWorkWebPage, "", card.getProperty("WebPage1"), data.cvWorkWebPageBox, card.getProperty("WebPage1")) || addressVisible || visible;

	cvSetVisible(data.cvhWork, visible);
	cvSetVisible(data.cvbWork, visible);

	// make the card view box visible
	cvSetVisible(top.cvData.CardViewBox, true);
}

function setBuddyIcon(card, buddyIcon)
{
  try {
    var myScreenName = Services.prefs.getCharPref("aim.session.screenname");
    if (myScreenName && card.primaryEmail) {
      if (!gProfileDirURL) {
        // lazily create these file urls, and keep them around
        gProfileDirURL = Services.io.newFileURI(GetSpecialDirectory("ProfD"));
      }

      // if we did have a buddy icon on disk for this screenname, this would be the file url spec for it
      var iconURLStr = gProfileDirURL.spec + "/NIM/" + myScreenName + "/picture/" + card.getProperty("_AimScreenName") + ".gif";

      // check if the file exists
      var file = gFileHandler.getFileFromURLSpec(iconURLStr);

      // check if the file exists
      // is this a perf hit?  (how expensive is stat()?)
      if (file.exists()) {
        buddyIcon.setAttribute("src", iconURLStr);
        return true;
      }
    }
  }
  catch (ex) {
    // can get here if no screenname
  }

  buddyIcon.setAttribute("src", "");
  return false;
}

function ClearCardViewPane()
{
	cvSetVisible(top.cvData.CardViewBox, false);
}

function cvSetNodeWithLabel(node, label, text)
{
  if (text) {
    if (label)
      return cvSetNode(node, label + ": " + text);
    else
      return cvSetNode(node, text);
  }
  else
    return cvSetNode(node, "");
}

function cvSetCityStateZip(node, city, state, zip)
{
  let text = "";

  if (city && state && zip)
    text = gAddressBookBundle.getFormattedString("cityAndStateAndZip",
                                                 [city, state, zip]);
  else if (city && state && !zip)
    text = gAddressBookBundle.getFormattedString("cityAndStateNoZip",
                                                 [city, state]);
  else if (zip && ((!city && state) || (city && !state)))
    text = gAddressBookBundle.getFormattedString("cityOrStateAndZip",
                                                 [city + state, zip]);
  else {
    // Only one of the strings is non-empty so contatenating them produces that string.
    text = city + state + zip;
  }

  return cvSetNode(node, text);
}

function cvSetNode(node, text)
{
	if ( node )
	{
		if ( !node.hasChildNodes() )
		{
			var textNode = document.createTextNode(text);
			node.appendChild(textNode);
		}
		else if ( node.childNodes.length == 1 )
			node.childNodes[0].nodeValue = text;

		var visible;

		if ( text )
			visible = true;
		else
			visible = false;

		cvSetVisible(node, visible);
	}

	return visible;
}

function cvAddAddressNodes(node, uri)
{
  var visible = false;

  if (node) {
    var editList = GetDirectoryFromURI(uri);
    var addressList = editList.addressLists;

    if (addressList) {
      var total = addressList.length;
      if (total > 0) {
        while (node.hasChildNodes()) {
          node.lastChild.remove();
        }
        for (i = 0;  i < total; i++ ) {
      	   var descNode = document.createElement("description");
          var card = addressList.queryElementAt(i, Components.interfaces.nsIAbCard);

          descNode.setAttribute("class", "CardViewLink");
          node.appendChild(descNode);

          var linkNode = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
          linkNode.setAttribute("id", "addr#" + i);
          linkNode.setAttribute("href", "mailto:" + card.primaryEmail);
          descNode.appendChild(linkNode);

          var textNode = document.createTextNode(card.displayName + " <" + card.primaryEmail + ">");
          linkNode.appendChild(textNode);
        }
        visible = true;
      }
    }
    cvSetVisible(node, visible);
  }
  return visible;
}

function cvSetVisible(node, visible)
{
	if ( visible )
		node.removeAttribute("collapsed");
	else
		node.setAttribute("collapsed", "true");
}

function HandleLink(node, label, value, box, link)
{
  var visible = cvSetNodeWithLabel(node, label, value);
  if (visible)
    node.setAttribute('href', link);
  cvSetVisible(box, visible);

  return visible;
}

function openLink(aEvent)
{
  openAsExternal(aEvent.target.getAttribute("href"));
  // return false, so we don't load the href in the addressbook window
  return false;
}

function openLinkWithUrl(aUrl)
{
  if (aUrl)
    openAsExternal(aUrl);
  // return false, so we don't load the href in the addressbook window
  return false;
}

/* Display the contact photo from the nsIAbCard in the IMG element.
 * If the photo cannot be displayed, show the generic contact
 * photo.
 */
function displayPhoto(aCard, aImg)
{
  var type = aCard.getProperty("PhotoType", "");
  if (!gPhotoDisplayHandlers[type] ||
      !gPhotoDisplayHandlers[type](aCard, aImg))
    gPhotoDisplayHandlers["generic"](aCard, aImg);
}

/* In order to display the contact photos in the card view, there
 * must be a registered photo display handler for the card photo
 * type.  The generic, file, and web photo types are handled
 * by default.
 *
 * A photo display handler is a function that behaves as follows:
 *
 * function(aCard, aImg):
 *    The function is responsible for determining how to retrieve
 *    the photo from nsIAbCard aCard, and for displaying it in img
 *    img element aImg.  Returns true if successful.  If it returns
 *    false, the generic photo display handler will be called.
 *
 * The following display handlers are for the generic, file and
 * web photo types.
 */

var gGenericPhotoDisplayHandler = function(aCard, aImg)
{
  aImg.setAttribute("src", defaultPhotoURI);
  return true;
};

var gPhotoNameDisplayHandler = function(aCard, aImg)
{
  var photoSrc = getPhotoURI(aCard.getProperty("PhotoName"));
  aImg.setAttribute("src", photoSrc);
  return true;
};

/* In order for a photo display handler to be registered for
 * a particular photo type, it must be registered here.
 */
function registerPhotoDisplayHandler(aType, aPhotoDisplayHandler)
{
  if (!gPhotoDisplayHandlers[aType])
    gPhotoDisplayHandlers[aType] = aPhotoDisplayHandler;
}

registerPhotoDisplayHandler("generic", gGenericPhotoDisplayHandler);
// File and Web are treated the same, and therefore use the
// same handler.
registerPhotoDisplayHandler("file", gPhotoNameDisplayHandler);
registerPhotoDisplayHandler("web", gPhotoNameDisplayHandler);
