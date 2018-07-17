/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* The prefs in this file are specific to the seamonkey (toolkit) browser.
 * Generic default prefs that would be useful to embedders belong in
 * modules/libpref/src/init/all.js
 */

/* filter substitution
 *
 * SYNTAX HINTS:
 *
 *  - Dashes are delimiters; use underscores instead.
 *  - The first character after a period must be alphabetic.
 *  - Computed values (e.g. 50 * 1024) don't work.
 */

pref("startup.homepage_override_url","chrome://navigator-region/locale/region.properties");
pref("general.skins.selectedSkin", "classic/1.0");

pref("browser.chromeURL","chrome://navigator/content/navigator.xul");
pref("browser.hiddenWindowChromeURL", "chrome://navigator/content/hiddenWindow.xul");

// prompt for Master Password on startup
pref("signon.startup.prompt",               true);

pref("general.startup.browser",             true);
pref("general.startup.mail",                false);
pref("general.startup.news",                false);
pref("general.startup.editor",              false);
pref("general.startup.compose",             false);
pref("general.startup.addressbook",         false);

pref("general.open_location.last_url",      "");
pref("general.open_location.last_window_choice", 0);
pref("browser.urlbar.historyEnabled",       true);

pref("general.smoothScroll", false);
pref("general.autoScroll", true);

pref("general.useragent.compatMode.firefox", true);

pref("general.useragent.complexOverride.moodle", false); // bug 797703; bug 815801

// 0 = blank, 1 = home (browser.startup.homepage), 2 = last visited page, 3 = resume previous browser session
pref("browser.startup.page",                1);
pref("browser.startup.homepage",	   "chrome://navigator-region/locale/region.properties");
pref("browser.startup.homepage.count", 1);

pref("browser.warnOnQuit", true);
pref("browser.warnOnRestart", true);

// disable this until it can be disabled on a per-docshell basis (see bug 319368)
pref("browser.send_pings", false);

pref("browser.chrome.site_icons", true);
pref("browser.chrome.favicons", true);

pref("browser.download.finished_download_sound", false);
pref("browser.download.finished_sound_url", "");
pref("browser.download.useDownloadDir", false);
pref("browser.download.folderList", 1);

pref("browser.download.manager.showAlertOnComplete", true);
pref("browser.download.manager.showAlertInterval", 2000);
pref("browser.download.manager.retention", 2);
pref("browser.download.manager.quitBehavior", 0);
pref("browser.download.manager.addToRecentDocs", true);
pref("browser.download.manager.scanWhenDone", true);
pref("browser.download.manager.resumeOnWakeDelay", 10000);
pref("browser.download.manager.flashCount", 2);
pref("browser.download.manager.showWhenStarting", true);
pref("browser.download.manager.focusWhenStarting", false);
pref("browser.download.manager.closeWhenDone", false);
pref("browser.download.progress.closeWhenDone", false);

// Number of milliseconds to wait for the http headers (and thus
// the Content-Disposition filename) before giving up and falling back to
// picking a filename without that info in hand so that the user sees some
// feedback from their action.
pref("browser.download.saveLinkAsFilenameTimeout", 4000);

// Output console.log/info/warn/error to the Error Console
pref("browser.dom.window.console.enabled", false);

// Use the findbar instead of the dialog box
pref("browser.findbar.enabled", true);

// Use doorhanger notifications instead of the notification bar
pref("browser.doorhanger.enabled", true);

// search engines URL
pref("browser.search.searchEnginesURL", "https://addons.mozilla.org/%LOCALE%/%APP%/search/?atype=4");

// pointer to the default engine name
pref("browser.search.defaultenginename", "chrome://communicator-region/locale/region.properties");

// Disable logging for the search service by default.
pref("browser.search.log", false);

// Ordering of Search Engines in the Engine list.
pref("browser.search.order.1", "chrome://communicator-region/locale/region.properties");
pref("browser.search.order.2", "chrome://communicator-region/locale/region.properties");
pref("browser.search.order.3", "chrome://communicator-region/locale/region.properties");

// Search (side)bar results always open in a new tab.
pref("browser.search.openintab", false);

// Invoking a search reveals the sidebar panel.
pref("browser.search.opensidebarsearchpanel", false);

// Open context search results in either a new window or tab.
pref("browser.search.opentabforcontextsearch", true);

// Send ping to the server to update.
pref("browser.search.update", true);

// Disable logging for the search service update system by default.
pref("browser.search.update.log", false);

// Check whether we need to perform engine updates every 6 hours
pref("browser.search.update.interval", 21600);

// enable search suggestions by default
pref("browser.search.suggest.enabled", true);

// Smart Browsing prefs
pref("keyword.enabled", true);
// Override the default keyword.URL. Empty value means
// "use the search service's default engine"
pref("keyword.URL", "");

pref("browser.urlbar.autocomplete.enabled", true);
pref("browser.urlbar.formatting.enabled", true);
pref("browser.urlbar.highlight.secure", true);
pref("browser.urlbar.clickSelectsAll", true);
// when clickSelectsAll=true, does it also apply when the click is past end of text?
pref("browser.urlbar.clickAtEndSelects", true);

pref("browser.urlbar.autoFill", false);
pref("browser.urlbar.showPopup", true);
pref("browser.urlbar.showSearch", true);
// 0: Match anywhere (e.g., middle of words)
// 1: Match on word boundaries and then try matching anywhere
// 2: Match only on word boundaries (e.g., after / or .)
// 3: Match at the beginning of the url or title
pref("browser.urlbar.matchBehavior", 1);

pref("browser.urlbar.suggest.history", true);
pref("browser.urlbar.suggest.bookmark", false);
// SeaMonkey doesn't support this.
pref("browser.urlbar.suggest.openpage", false);

pref("browser.urlbar.suggest.history.onlyTyped", false);

pref("browser.urlbar.filter.javascript", true);

// Size of "chunks" affects the number of places to process between each search
// timeout (ms). Too big and the UI will be unresponsive; too small and we'll
// be waiting on the timeout too often without many results.
pref("browser.urlbar.search.chunkSize", 1000);
pref("browser.urlbar.search.timeout", 100);

// The special characters below can be typed into the urlbar to either restrict
// the search to visited history, bookmarked, tagged pages; or force a match on
// just the title text or url.
pref("browser.urlbar.restrict.history", "^");
pref("browser.urlbar.restrict.bookmark", "*");
pref("browser.urlbar.restrict.tag", "+");
pref("browser.urlbar.restrict.openpage", "%");
pref("browser.urlbar.restrict.typed", "~");
pref("browser.urlbar.match.title", "#");
pref("browser.urlbar.match.url", "@");

pref("browser.history.last_page_visited", "about:blank");
pref("browser.history.grouping", "day");
pref("browser.sessionhistory.max_entries", 50);

// Whether history is enabled or not.
pref("places.history.enabled", true);

// the (maximum) number of the recent visits to sample
// when calculating frecency
pref("places.frecency.numVisits", 10);

// buckets (in days) for frecency calculation
pref("places.frecency.firstBucketCutoff", 4);
pref("places.frecency.secondBucketCutoff", 14);
pref("places.frecency.thirdBucketCutoff", 31);
pref("places.frecency.fourthBucketCutoff", 90);

// weights for buckets for frecency calculations
pref("places.frecency.firstBucketWeight", 100);
pref("places.frecency.secondBucketWeight", 70);
pref("places.frecency.thirdBucketWeight", 50);
pref("places.frecency.fourthBucketWeight", 30);
pref("places.frecency.defaultBucketWeight", 10);

// bonus (in percent) for visit transition types for frecency calculations
pref("places.frecency.embedVisitBonus", 0);
pref("places.frecency.framedLinkVisitBonus", 0);
pref("places.frecency.linkVisitBonus", 100);
pref("places.frecency.typedVisitBonus", 2000);
pref("places.frecency.bookmarkVisitBonus", 75);
pref("places.frecency.downloadVisitBonus", 0);
pref("places.frecency.permRedirectVisitBonus", 0);
pref("places.frecency.tempRedirectVisitBonus", 0);
pref("places.frecency.defaultVisitBonus", 0);

// bonus (in percent) for place types for frecency calculations
pref("places.frecency.unvisitedBookmarkBonus", 140);
pref("places.frecency.unvisitedTypedBonus", 200);

// By default, do not export HTML at shutdown.
// If true, at shutdown the bookmarks in your menu and toolbar will
// be exported as HTML to the bookmarks.html file.
pref("browser.bookmarks.autoExportHTML", false);

// The maximum number of daily bookmark backups to
// keep in {PROFILEDIR}/bookmarkbackups. Special values:
// -1: unlimited
//  0: no backups created (and deletes all existing backups)
pref("browser.bookmarks.max_backups", 10);

// Don't try to alter this pref. It will be reset the next time you use the
// bookmarking dialog.
pref("browser.bookmarks.editDialog.firstEditField", "namePicker");

// Tabbed browser
pref("browser.tabs.loadDivertedInBackground", false);
pref("browser.tabs.loadInBackground", true);
pref("browser.tabs.opentabfor.doubleclick", false);
pref("browser.tabs.opentabfor.middleclick", true);
pref("browser.tabs.opentabfor.urlbar", true);
pref("browser.tabs.tooltippreview.enable", true);
pref("browser.tabs.tooltippreview.width", 300);
pref("browser.tabs.autoHide", true);
pref("browser.tabs.forceHide", false);
pref("browser.tabs.closeWindowWithLastTab", true);
pref("browser.tabs.warnOnClose", true);
pref("browser.tabs.warnOnCloseOther", true);
pref("browser.tabs.warnOnOpen", true);
pref("browser.tabs.maxOpenBeforeWarn", 15);
pref("browser.tabs.insertRelatedAfterCurrent", true);
// 0 = append, 1 = replace
pref("browser.tabs.loadGroup", 1);

// how many browsers can be saved in the DOM (by the tabbed browser)
pref("browser.tabs.max_tabs_undo", 3);
// should popups by saved in the DOM (by the tabbed browser)
pref("browser.tabs.cache_popups", false);

// tab width and clipping
pref("browser.tabs.tabMinWidth", 100);
pref("browser.tabs.tabMaxWidth", 250);
pref("browser.tabs.tabClipWidth", 140);

// Where to show tab close buttons:
// 0  on active tab only
// 1  on all tabs until tabClipWidth is reached, then active tab only
// 2  no close buttons at all
// 3  at the end of the tabstrip
pref("browser.tabs.closeButtons", 3);

// Mouse wheel action when over the tab bar:
// false  The mouse wheel scrolls the whole tab bar like Firefox (default).
// true   The mouse wheel advances the selected tab.
pref("browser.tabs.mouseScrollAdvancesTab", false);

// lets new tab/window load something different than first window
// -1 - use navigator startup preference
//  0 - loads blank page
//  1 - loads home page
//  2 - loads last page visited
pref("browser.tabs.loadOnNewTab", 0);
pref("browser.windows.loadOnNewWindow", 1);

// external link handling in tabbed browsers. values from nsIBrowserDOMWindow.
// 0=default window, 1=current window/tab, 2=new window, 3=new tab in most recent window
pref("browser.link.open_external", 3);
// internal links handling in tabbed browsers. see .open_external for values.
pref("browser.link.open_newwindow", 3);

// 0: no restrictions - divert everything
// 1: don't divert window.open at all
// 2: don't divert window.open with features
pref("browser.link.open_newwindow.restriction", 2);

// Translation service
pref("browser.translation.service", "chrome://navigator-region/locale/region.properties");
pref("browser.translation.serviceDomain", "chrome://navigator-region/locale/region.properties");
pref("browser.validate.html.service", "chrome://navigator-region/locale/region.properties");

// 0 goes back
// 1 act like pgup
// 2 and other values, nothing
pref("browser.backspace_action", 0);

// Controls behavior of the "Add Exception" dialog launched from SSL error pages:
// 0 - don't pre-populate anything.
// 1 - pre-populate site URL, but don't fetch certificate.
// 2 - pre-populate site URL and pre-fetch certificate.
pref("browser.ssl_override_behavior", 2);

// if true, use full page zoom instead of text zoom
pref("browser.zoom.full", true);

// Whether or not to save and restore zoom levels on a per-site basis.
pref("browser.zoom.siteSpecific", true);

// Whether or not to update background tabs to the current zoom level
// once they come to the foreground (i.e. get activated).
pref("browser.zoom.updateBackgroundTabs", true);

// Zoom levels for View > Zoom and Ctrl +/- keyboard shortcuts
pref("toolkit.zoomManager.zoomValues", "0.2,0.3,0.5,0.67,0.8,0.9,1,1.1,1.2,1.33,1.5,1.7,2,2.4,3,4,5,6,7,8");

pref("javascript.options.showInConsole",    true);

pref("suite.manager.addons.openAsDialog", false);
pref("suite.manager.dataman.openAsDialog", true);

pref("offline.startup_state",            0);
pref("offline.send.unsent_messages",            0);
pref("offline.download.download_messages",  0);

// allow offline web apps to store data but ask for permission by default
pref("offline-apps.allow_by_default", false);
pref("browser.offline-apps.notify", true);

pref("browser.formfill.expire_days",        180);

// Handle mail/news URLs internally by default...
pref("network.protocol-handler.external.mailto", false); // for mail
pref("network.protocol-handler.external.news", false);   // for news
pref("network.protocol-handler.external.snews", false);  // for secure news
pref("network.protocol-handler.external.nntp", false);   // also news

// ...but still show the dialog at least the first time if switched to external
pref("network.protocol-handler.warn-external.mailto", true);
pref("network.protocol-handler.warn-external.news", true);
pref("network.protocol-handler.warn-external.snews", true);
pref("network.protocol-handler.warn-external.nntp", true);

// bug 1005566 - Disable seer until properly supported
// bug 1021370 - Rename Seer to Predictor
pref("network.predictor.enabled", false);

pref("mail.biff.show_new_alert",     true);

// default calendar integration
pref("mail.calendar-integration.opt-out", false);

pref("mailnews.ui.deleteMarksRead", true);

// The maximum amount of decoded image data we'll willingly keep around (we
// might keep around more than this, but we'll try to get down to this value).
// (This is intentionally on the high side; see bugs 746055 and 768015.)
pref("image.mem.max_decoded_image_kb", 256000);

pref("spellchecker.dictionaries.download.url", "chrome://branding/locale/brand.properties");

// this will automatically enable inline spellchecking (if it is available) for
// editable elements in HTML
// 0 = spellcheck nothing
// 1 = check multi-line controls [default]
// 2 = check multi/single line controls
pref("layout.spellcheckDefault", 1);

// Blocks auto refresh if true
pref("accessibility.blockautorefresh", false);

// special TypeAheadFind settings

// Use the findbar for type ahead find, instead of the XPFE implementation
pref("accessibility.typeaheadfind.usefindbar", true);
pref("accessibility.typeaheadfind.flashBar", 0);
#ifndef XP_UNIX
pref("accessibility.typeaheadfind.soundURL", "default");
#endif

#ifdef XP_WIN
pref("browser.preferences.instantApply", false);
#else
pref("browser.preferences.instantApply", true);
#endif
#ifdef XP_MACOSX
pref("browser.preferences.animateFadeIn", true);
#else
pref("browser.preferences.animateFadeIn", false);
#endif

pref("browser.download.show_plugins_in_list", true);
pref("browser.download.hide_plugins_without_extensions", true);

// initial web feed readers list - add enough entries for locales to add theirs
pref("browser.contentHandlers.types.0.title", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.0.uri", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.0.type", "application/vnd.mozilla.maybe.feed");
pref("browser.contentHandlers.types.1.title", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.1.uri", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.1.type", "application/vnd.mozilla.maybe.feed");
pref("browser.contentHandlers.types.2.title", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.2.uri", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.2.type", "application/vnd.mozilla.maybe.feed");
pref("browser.contentHandlers.types.3.title", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.3.uri", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.3.type", "application/vnd.mozilla.maybe.feed");
pref("browser.contentHandlers.types.4.title", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.4.uri", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.4.type", "application/vnd.mozilla.maybe.feed");
pref("browser.contentHandlers.types.5.title", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.5.uri", "chrome://navigator-region/locale/region.properties");
pref("browser.contentHandlers.types.5.type", "application/vnd.mozilla.maybe.feed");

pref("browser.feeds.handler", "ask");
pref("browser.videoFeeds.handler", "ask");
pref("browser.audioFeeds.handler", "ask");

// Overriding defaults defined in all.js (no UI yet covering these cases)
pref("browser.safebrowsing.downloads.remote.block_potentially_unwanted", false);
pref("browser.safebrowsing.downloads.remote.block_uncommon", false);

// Overriding defaults defined in all.js (use full version 2.x, bypassing bug 1077874)
pref("browser.safebrowsing.provider.google.updateURL", "https://safebrowsing.google.com/safebrowsing/downloads?client=SAFEBROWSING_ID&appver=%VERSION%&pver=2.2&key=%GOOGLE_API_KEY%");
pref("browser.safebrowsing.provider.google.gethashURL", "https://safebrowsing.google.com/safebrowsing/gethash?client=SAFEBROWSING_ID&appver=%VERSION%&pver=2.2");
pref("browser.safebrowsing.provider.mozilla.updateURL", "https://shavar.services.mozilla.com/downloads?client=SAFEBROWSING_ID&appver=%VERSION%&pver=2.2");
pref("browser.safebrowsing.provider.mozilla.gethashURL", "https://shavar.services.mozilla.com/gethash?client=SAFEBROWSING_ID&appver=%VERSION%&pver=2.2");

//Theoretically the "client ID" sent in updates should be appinfo.name but
//anything except "Firefox" or "navclient-auto-ffox" will cause safebrowsing
//updates to fail. So we pretend to be Firefox here.
pref("browser.safebrowsing.id", "navclient-auto-ffox");

// Those are only used in our utilityOverlay.js (see bug 1270168)
pref("browser.safebrowsing.warning.infoURL", "https://www.mozilla.org/%LOCALE%/firefox/phishing-protection/");
pref("browser.safebrowsing.controlledAccess.infoURL", "https://support.mozilla.org/kb/controlledaccess/");

pref("browser.sessionstore.resume_from_crash", true);
pref("browser.sessionstore.resume_session_once", false);

// minimal interval between two save operations in milliseconds
pref("browser.sessionstore.interval", 15000);
// maximum amount of POSTDATA to be saved in bytes per history entry (-1 = all of it)
// (NB: POSTDATA will be saved either entirely or not at all)
pref("browser.sessionstore.postdata", 0);
// on which sites to save text data, POSTDATA and cookies
// 0 = everywhere, 1 = unencrypted sites, 2 = nowhere
pref("browser.sessionstore.privacy_level", 0);
// the same as browser.sessionstore.privacy_level, but for saving deferred session data
pref("browser.sessionstore.privacy_level_deferred", 2);
// number of crashes that can occur before the about:sessionrestore page is displayed
// (this pref has no effect if more than 6 hours have passed since the last crash)
pref("browser.sessionstore.max_resumed_crashes", 1);
// how many tabs can be reopened (per window)
pref("browser.sessionstore.max_tabs_undo", 10);
// how many windows can be reopened (per session) - on non-OS X platforms this
// pref may be ignored when dealing with pop-up windows to ensure proper startup
pref("browser.sessionstore.max_windows_undo", 3);
// The number of tabs that can restore concurrently:
// < 0 = All tabs can restore at the same time
//   0 = Only the selected tab in each window will load.
//   N = N tabs should restore at the same time
pref("browser.sessionstore.max_concurrent_tabs", 3);

pref("shell.checkDefaultClient", true);
// We want to check if we are the default client for browser and mail. See
// suite/shell/public/nsIShellService.idl for the possible constants you can use
pref("shell.checkDefaultApps", 3);

pref("app.releaseNotesURL", "chrome://branding/locale/brand.properties");
pref("app.vendorURL", "chrome://branding/locale/brand.properties");

// Base URL for web-based support pages.
pref("app.support.baseURL", "http://www.seamonkey-project.org/doc/");

// App-specific update preferences

// Whether or not app updates are enabled
pref("app.update.enabled", true);

// This preference allows automatic download and install to take place.
pref("app.update.auto", true);

// If set to true, the Update Service will present no UI for any event.
pref("app.update.silent", false);

// Update service URL:
pref("app.update.url", "https://aus2-community.mozilla.org/update/3/%PRODUCT%/%VERSION%/%BUILD_ID%/%BUILD_TARGET%/%LOCALE%/%CHANNEL%/%OS_VERSION%/%SYSTEM_CAPABILITIES%/%DISTRIBUTION%/%DISTRIBUTION_VERSION%/update.xml");
// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "http://www.seamonkey-project.org/");
// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard.
pref("app.update.url.details", "chrome://communicator-region/locale/region.properties");

// User-settable override to app.update.url for testing purposes.
//pref("app.update.url.override", "");

// Enables some extra Application Update Logging (can reduce performance)
pref("app.update.log", false);

// The number of general background check failures to allow before notifying the
// user of the failure. User initiated update checks always notify the user of
// the failure.
pref("app.update.backgroundMaxErrors", 10);

// When |app.update.cert.requireBuiltIn| is true or not specified the
// final certificate and all certificates the connection is redirected to before
// the final certificate for the url specified in the |app.update.url|
// preference must be built-in.
pref("app.update.cert.requireBuiltIn", true);

// When |app.update.cert.checkAttributes| is true or not specified the
// certificate attributes specified in the |app.update.certs.| preference branch
// are checked against the certificate for the url specified by the
// |app.update.url| preference.
pref("app.update.cert.checkAttributes", true);

// The number of certificate attribute check failures to allow for background
// update checks before notifying the user of the failure. User initiated update
// checks always notify the user of the certificate attribute check failure.
pref("app.update.cert.maxErrors", 5);

// The |app.update.certs.| preference branch contains branches that are
// sequentially numbered starting at 1 that contain attribute name / value
// pairs for the certificate used by the server that hosts the update xml file
// as specified in the |app.update.url| preference. When these preferences are
// present the following conditions apply for a successful update check:
// 1. the uri scheme must be https
// 2. the preference name must exist as an attribute name on the certificate and
//    the value for the name must be the same as the value for the attribute
//    name on the certificate.
// If these conditions aren't met it will be treated the same as when there is
// no update available. This validation will not be performed when using the
// |app.update.url.override| preference for update checking.
pref("app.update.certs.1.issuerName", "CN=DigiCert SHA2 Secure Server CA,O=DigiCert Inc,C=US");
pref("app.update.certs.1.commonName", "aus2-community.mozilla.org");
pref("app.update.certs.2.issuerName", "CN=Thawte SSL CA,O=\"Thawte, Inc.\",C=US");
pref("app.update.certs.2.commonName", "aus2-community.mozilla.org");

// Interval: Time between checks for a new version (in seconds)
//           default=1 day
pref("app.update.interval", 86400);
// The minimum delay in seconds for the timer to fire.
// default=2 minutes
pref("app.update.timerMinimumDelay", 120);
#ifdef RELEASE_OR_BETA
// Give the user x seconds to react before showing the big UI. default=8 days
pref("app.update.promptWaitTime", 691200);
#else
// For nightly and aurora builds, before showing the big UI, default=12 hrs
pref("app.update.promptWaitTime", 43200);
#endif
// Show the Update Checking/Ready UI when the user was idle for x seconds
pref("app.update.idletime", 60);

// Extension preferences

// Enables some extra Extension System Logging (can reduce performance)
pref("extensions.logging.enabled", false);

// Disables strict compatibility, making addons compatible-by-default.
pref("extensions.strictCompatibility", false);

// Specifies a minimum maxVersion an addon needs to say it's compatible with
// for it to be compatible by default.
pref("extensions.minCompatibleAppVersion", "2.1");


// Update preferences for installed Extensions and Themes.
// Symmetric (can be overridden by individual extensions),
// e.g.
//  extensions.{GUID}.update.enabled
//  extensions.{GUID}.update.url
//  extensions.{GUID}.update.interval
//  extensions.{GUID}.update.autoUpdateDefault
//  .. etc ..
//
pref("extensions.update.enabled", true);
pref("extensions.update.url", "https://versioncheck.addons.mozilla.org/update/VersionCheck.php?reqVersion=%REQ_VERSION%&id=%ITEM_ID%&version=%ITEM_VERSION%&maxAppVersion=%ITEM_MAXAPPVERSION%&status=%ITEM_STATUS%&appID=%APP_ID%&appVersion=%APP_VERSION%&appOS=%APP_OS%&appABI=%APP_ABI%&locale=%APP_LOCALE%&currentAppVersion=%CURRENT_APP_VERSION%&updateType=%UPDATE_TYPE%&compatMode=%COMPATIBILITY_MODE%");
pref("extensions.update.interval", 86400);         // Check daily for updates to add-ons
pref("extensions.update.autoUpdateDefault", true); // Download and install automatically

// Disable add-ons installed into the shared user and shared system areas by
// default. This does not include the application directory. See the SCOPE
// constants in AddonManager.jsm for values to use here.
pref("extensions.autoDisableScopes", 15);

// Preferences for AMO integration
pref("extensions.getAddons.cache.enabled", true);  // also toggles personalized recommendations
pref("extensions.getAddons.maxResults", 15);
pref("extensions.getAddons.get.url", "https://services.addons.mozilla.org/%LOCALE%/%APP%/api/%API_VERSION%/search/guid:%IDS%?src=seamonkey&appOS=%OS%&appVersion=%VERSION%");
pref("extensions.getAddons.getWithPerformance.url", "https://services.addons.mozilla.org/%LOCALE%/%APP%/api/%API_VERSION%/search/guid:%IDS%?src=seamonkey&appOS=%OS%&appVersion=%VERSION%&tMain=%TIME_MAIN%&tFirstPaint=%TIME_FIRST_PAINT%&tSessionRestored=%TIME_SESSION_RESTORED%");
pref("extensions.getAddons.link.url", "https://addons.mozilla.org/%LOCALE%/%APP%/");
pref("extensions.getAddons.recommended.url", "https://services.addons.mozilla.org/%LOCALE%/%APP%/api/%API_VERSION%/list/recommended/all/%MAX_RESULTS%/%OS%/%VERSION%?src=seamonkey");
pref("extensions.getAddons.search.browseURL", "https://addons.mozilla.org/%LOCALE%/%APP%/search?q=%TERMS%");
pref("extensions.getAddons.search.url", "https://services.addons.mozilla.org/%LOCALE%/%APP%/api/%API_VERSION%/search/%TERMS%/all/%MAX_RESULTS%/%OS%/%VERSION%/%COMPATIBILITY_MODE%?src=seamonkey");
pref("extensions.webservice.discoverURL", "https://services.addons.mozilla.org/%LOCALE%/%APP%/discovery/pane/%VERSION%/%OS%");

// getMoreThemes is used by our UI under our switch theme menu
pref("extensions.getMoreThemesURL", "chrome://branding/locale/brand.properties");
pref("extensions.getPersonasURL", "chrome://branding/locale/brand.properties");
pref("extensions.dss.enabled", false);          // Dynamic Skin Switching
pref("extensions.dss.switchPending", false);    // Non-dynamic switch pending after next
                                                // restart.

pref("extensions.{972ce4c6-7e08-4474-a285-3208198ce6fd}.name", "chrome://navigator/locale/navigator.properties");
pref("extensions.{972ce4c6-7e08-4474-a285-3208198ce6fd}.description", "chrome://navigator/locale/navigator.properties");

pref("extensions.modern@themes.mozilla.org.name", "chrome://navigator/locale/navigator.properties");
pref("extensions.modern@themes.mozilla.org.description", "chrome://navigator/locale/navigator.properties");

pref("xpinstall.enabled", true);
pref("xpinstall.signatures.required", false);
// Built-in default permissions.
pref("permissions.manager.defaultsUrl", "resource:///defaults/permissions");

pref("lightweightThemes.update.enabled", true);

// Customizable toolbar stuff
pref("custtoolbar.personal_toolbar_folder", "");
// Use a popup window for the customize toolbar UI
pref("toolbar.customization.usesheet", false);

// Show the toolbar and menu grippies.
pref("browser.toolbars.grippyhidden", false);

#ifdef XP_WIN
pref("browser.taskbar.lists.enabled", true);
pref("browser.taskbar.lists.frequent.enabled", true);
pref("browser.taskbar.lists.recent.enabled", false);
pref("browser.taskbar.lists.maxListItemCount", 7);
pref("browser.taskbar.lists.tasks.enabled", true);
pref("browser.taskbar.lists.refreshInSeconds", 120);
pref("browser.taskbar.previews.enable", true);
pref("browser.taskbar.previews.max", 20);
pref("browser.taskbar.previews.cachetime", 5);
#endif

pref("sidebar.customize.all_panels.url", "http://sidebar-rdf.netscape.com/%LOCALE%/sidebar-rdf/%SIDEBAR_VERSION%/all-panels.rdf");
pref("sidebar.customize.directory.url", "https://edmullen.net/mozilla/moz_sidebar.php");
pref("sidebar.customize.more_panels.url", "https://edmullen.net/mozilla/moz_sidebar.php");
pref("sidebar.num_tabs_in_view", 8);

pref("browser.throbber.url","chrome://navigator-region/locale/region.properties");

// pref to control the alert notification
pref("alerts.slideIncrement", 1);
pref("alerts.slideIncrementTime", 10);
pref("alerts.totalOpenTime", 10000);

// 0 opens the download manager
// 1 opens a progress dialog
// 2 and other values, no download manager, no progress dialog.
pref("browser.download.manager.behavior", 0);

pref("privacy.popups.sound_enabled",              false);
pref("privacy.popups.sound_type",                 1);
pref("privacy.popups.sound_url",                  "");
pref("privacy.popups.statusbar_icon_enabled",     true);
pref("privacy.popups.prefill_whitelist",          false);
pref("privacy.popups.remove_blacklist",           true);
pref("privacy.popups.showBrowserMessage",         true);

// sanitize (clear private data) options
pref("privacy.item.history",     true);
pref("privacy.item.urlbar",      true);
pref("privacy.item.formdata",    true);
pref("privacy.item.passwords",   false);
pref("privacy.item.downloads",   true);
pref("privacy.item.cookies",     false);
pref("privacy.item.cache",       true);
pref("privacy.item.sessions",    true);
pref("privacy.item.offlineApps", false);

pref("privacy.sanitize.sanitizeOnShutdown", false);
pref("privacy.sanitize.promptOnSanitize", true);

pref("privacy.warn_tracking_content", true);

// Show XUL error pages instead of alerts for errors
pref("browser.xul.error_pages.enabled", true);
pref("browser.xul.error_pages.expert_bad_cert", false);

// Setting this pref to |true| forces BiDi UI menu items and keyboard shortcuts
// to be exposed. By default, only expose it for bidi-associated system locales.
pref("bidi.browser.ui", false);

// block popup windows
pref("dom.disable_open_during_load",   true);
// prevent JS from moving/resizing existing windows
pref("dom.disable_window_move_resize", true);
// prevent JS from raising or lowering windows
pref("dom.disable_window_flip",        true);
// prevent JS from disabling or replacing context menus
pref("dom.event.contextmenu.enabled",  true);

pref("dom.identity.enabled", false);

#ifdef XP_MACOSX
// On mac, the default pref is per-architecture
pref("dom.ipc.plugins.enabled.i386", true);
pref("dom.ipc.plugins.enabled.x86_64", true);

// This pref governs whether we attempt to work around problems caused by
// plugins using OS calls to manipulate the cursor while running out-of-
// process.  These workarounds all involve intercepting (hooking) certain
// OS calls in the plugin process, then arranging to make certain OS calls
// in the browser process.  Eventually plugins will be required to use the
// NPAPI to manipulate the cursor, and these workarounds will be removed.
// See bug 621117.
pref("dom.ipc.plugins.nativeCursorSupport", true);
#else
pref("dom.ipc.plugins.enabled", true);
#endif

// plugin finder service url
pref("pfs.datasource.url", "https://pfs.mozilla.org/plugins/PluginFinderService.php?mimetype=%PLUGIN_MIMETYPE%&appID=%APP_ID%&appVersion=%APP_VERSION%&clientOS=%CLIENT_OS%&chromeLocale=%CHROME_LOCALE%");
pref("plugins.update.url", "https://www.mozilla.org/%LOCALE%/plugincheck/");
pref("plugins.update.notifyUser", false);
pref("plugins.hide_infobar_for_outdated_plugin", false);
pref("plugins.hide_infobar_for_carbon_failure_plugin", false);
pref("plugins.hide_infobar_for_missing_plugin", false);
pref("plugins.click_to_play", true);
pref("plugin.disable", false);

// Digital Rights Management, Encrypted Media Extensions
pref("media.eme.enabled", false);
 
// Turn off WebRTC by default (bug 1419507)
pref("media.navigator.enabled", false);
pref("media.peerconnection.enabled", false);

#ifndef XP_MACOSX
// Restore the spinner that was removed in bug 481359
pref("ui.use_activity_cursor", true);
#endif

#ifdef XP_MACOSX
// Use a sheet instead of a popup window for the customize toolbar UI
pref("toolbar.customization.usesheet", true);
#endif

#ifndef XP_MACOSX
#ifdef XP_UNIX
// For the download dialog
pref("browser.download.progressDnldDialog.enable_launch_reveal_buttons", false);

// Mouse wheel action when over the tab bar:
// false  The mouse wheel scrolls the whole tab bar like Firefox.
// true   The mouse wheel advances the selected tab.
pref("browser.tabs.mouseScrollAdvancesTab", true);

pref("browser.urlbar.clickSelectsAll", false);

// 0 goes back
// 1 act like pgup
// 2 and other values, nothing
pref("browser.backspace_action", 2);

pref("general.autoScroll", false);

pref("layout.word_select.stop_at_punctuation", false);
#endif
#endif

// The breakpad report server to link to in about:crashes
pref("breakpad.reportURL", "http://crash-stats.mozilla.com/report/index/");

// Name of alternate about: page for certificate errors (when undefined, defaults to about:neterror)
pref("security.alternate_certificate_error_page", "certerror");
pref("security.warn_entering_secure", false);
pref("security.warn_leaving_secure", false);
pref("security.warn_submit_insecure", false);
pref("security.warn_viewing_mixed", false);
pref("security.warn_mixed_active_content", true);
pref("security.warn_mixed_display_content", true);
// Block insecure active content on https pages
pref("security.mixed_content.block_active_content", true);
// Turn on the CSP 1.0 parser for Content Security Policy headers
pref("security.csp.speccompliant", true);

pref("geo.wifi.uri", "https://www.googleapis.com/geolocation/v1/geolocate?key=%GOOGLE_API_KEY%");

// Some of these prefs are specified even though they may be redundant; they are given
// here for clarity and end-user experiments with platform-provided geolocation.
#ifdef XP_MACOSX
pref("geo.provider.use_corelocation", false);
#endif
#ifdef XP_WIN
pref("geo.provider.ms-windows-location", false);
#endif
#ifdef MOZ_WIDGET_GTK
pref("geo.provider.use_gpsd", false);
#endif

// FAQ URLs
pref("browser.geolocation.warning.infoURL", "http://www.seamonkey-project.org/doc/2.0/geolocation");

pref("browser.rights.version", 1);
pref("browser.rights.1.shown", false);

#ifdef DEBUG
// Don't show the about:rights notification in debug builds.
pref("browser.rights.override", true);
#elifndef OFFICIAL_BUILD
// Don't show the about:rights notification in non-official builds.
pref("browser.rights.override", true);
#endif

// The sync engines to use.
pref("services.sync.registerEngines", "Bookmarks,Form,History,Password,Prefs,Tab,Addons");
// Preferences to be synced by default
pref("services.sync.prefs.sync.accessibility.blockautorefresh", true);
pref("services.sync.prefs.sync.accessibility.browsewithcaret", true);
pref("services.sync.prefs.sync.accessibility.typeaheadfind.autostart", true);
pref("services.sync.prefs.sync.accessibility.typeaheadfind.linksonly", true);
pref("services.sync.prefs.sync.accessibility.typeaheadfind.usefindbar", true);
pref("services.sync.prefs.sync.addons.ignoreUserEnabledChanges", true);
// The addons prefs related to repository verification are intentionally
// not synced for security reasons. If a system is compromised, a user
// could weaken the pref locally, install an add-on from an untrusted
// source, and this would propagate automatically to other,
// uncompromised Sync-connected devices.
pref("services.sync.prefs.sync.browser.download.manager.behavior", true);
pref("services.sync.prefs.sync.browser.download.manager.closeWhenDone", true);
pref("services.sync.prefs.sync.browser.download.manager.retention", true);
pref("services.sync.prefs.sync.browser.download.manager.showWhenStarting", true);
pref("services.sync.prefs.sync.browser.download.manager.scanWhenDone", true);
pref("services.sync.prefs.sync.browser.formfill.enable", true);
pref("services.sync.prefs.sync.browser.link.open_external", true);
pref("services.sync.prefs.sync.browser.link.open_newwindow", true);
pref("services.sync.prefs.sync.browser.offline-apps.notify", true);
pref("services.sync.prefs.sync.browser.safebrowsing.malware.enabled", true);
pref("services.sync.prefs.sync.browser.safebrowsing.phishing.enabled", true);
pref("services.sync.prefs.sync.browser.search.update", true);
pref("services.sync.prefs.sync.browser.sessionstore.max_concurrent_tabs", true);
pref("services.sync.prefs.sync.browser.startup.homepage", true);
pref("services.sync.prefs.sync.browser.startup.page", true);
pref("services.sync.prefs.sync.browser.tabs.autoHide", true);
pref("services.sync.prefs.sync.browser.tabs.closeButtons", true);
pref("services.sync.prefs.sync.browser.tabs.loadInBackground", true);
pref("services.sync.prefs.sync.browser.tabs.warnOnClose", true);
pref("services.sync.prefs.sync.browser.tabs.warnOnCloseOther", true);
pref("services.sync.prefs.sync.browser.tabs.warnOnOpen", true);
pref("services.sync.prefs.sync.browser.urlbar.autocomplete.enabled", true);
pref("services.sync.prefs.sync.browser.urlbar.autoFill", true);
pref("services.sync.prefs.sync.browser.urlbar.suggest.history", true);
pref("services.sync.prefs.sync.browser.urlbar.suggest.bookmark", true);
pref("services.sync.prefs.sync.browser.urlbar.suggest.history.onlyTyped", true);
pref("services.sync.prefs.sync.dom.disable_open_during_load", true);
pref("services.sync.prefs.sync.dom.disable_window_flip", true);
pref("services.sync.prefs.sync.dom.disable_window_move_resize", true);
pref("services.sync.prefs.sync.dom.disable_window_open_feature.status", true);
pref("services.sync.prefs.sync.dom.disable_window_status_change", true);
pref("services.sync.prefs.sync.dom.event.contextmenu.enabled", true);
pref("services.sync.prefs.sync.extensions.update.enabled", true);
pref("services.sync.prefs.sync.general.smoothScroll", true);
pref("services.sync.prefs.sync.intl.accept_languages", true);
pref("services.sync.prefs.sync.javascript.enabled", true);
pref("services.sync.prefs.sync.layout.spellcheckDefault", true);
pref("services.sync.prefs.sync.lightweightThemes.isThemeSelected", true);
pref("services.sync.prefs.sync.lightweightThemes.usedThemes", true);
pref("services.sync.prefs.sync.mailnews.confirm.moveFoldersToTrash", true);
pref("services.sync.prefs.sync.mailnews.customDBHeaders", true);
pref("services.sync.prefs.sync.mailnews.customHeaders", true);
pref("services.sync.prefs.sync.mailnews.display.date_senders_timezone", true);
pref("services.sync.prefs.sync.mailnews.display.disable_format_flowed_support", true);
pref("services.sync.prefs.sync.mailnews.display.disallow_mime_handlers", true);
pref("services.sync.prefs.sync.mailnews.display.html_as", true);
pref("services.sync.prefs.sync.mailnews.display.html_sanitizer.allowed_tags", true);
pref("services.sync.prefs.sync.mailnews.display.prefer_plaintext", true);
pref("services.sync.prefs.sync.mailnews.display.show_all_body_parts_menu", true);
pref("services.sync.prefs.sync.mailnews.emptyTrash.dontAskAgain", true);
pref("services.sync.prefs.sync.mailnews.filters.confirm_delete", true);
pref("services.sync.prefs.sync.mailnews.forward_header_originalmessage", true);
pref("services.sync.prefs.sync.mailnews.headers.extraExpandedHeaders", true);
pref("services.sync.prefs.sync.mailnews.headers.showMessageId", true);
pref("services.sync.prefs.sync.mailnews.headers.showOrganization", true);
pref("services.sync.prefs.sync.mailnews.headers.showReferences", true);
pref("services.sync.prefs.sync.mailnews.headers.showSender", true);
pref("services.sync.prefs.sync.mailnews.headers.showUserAgent", true);
pref("services.sync.prefs.sync.mailnews.localizedRe", true);
pref("services.sync.prefs.sync.mailnews.mark_message_read.auto", true);
pref("services.sync.prefs.sync.mailnews.mark_message_read.delay", true);
pref("services.sync.prefs.sync.mailnews.mark_message_read.delay.interval", true);
pref("services.sync.prefs.sync.mailnews.messageid.openInNewWindow", true);
pref("services.sync.prefs.sync.mailnews.message_display.allow_plugins", true);
pref("services.sync.prefs.sync.mailnews.message_display.disable_remote_image", true);
pref("services.sync.prefs.sync.mailnews.nav_crosses_folders", true);
pref("services.sync.prefs.sync.mailnews.offline_sync_mail", true);
pref("services.sync.prefs.sync.mailnews.offline_sync_news", true);
pref("services.sync.prefs.sync.mailnews.offline_sync_send_unsent", true);
pref("services.sync.prefs.sync.mailnews.offline_sync_work_offline", true);
pref("services.sync.prefs.sync.mailnews.remember_selected_message", true);
pref("services.sync.prefs.sync.mailnews.reply_header_authorwrotesingle", true);
pref("services.sync.prefs.sync.mailnews.reply_header_ondateauthorwrote", true);
pref("services.sync.prefs.sync.mailnews.reply_header_authorwroteondate", true);
pref("services.sync.prefs.sync.mailnews.reply_header_locale", true);
pref("services.sync.prefs.sync.mailnews.reply_header_originalmessage", true);
pref("services.sync.prefs.sync.mailnews.reply_header_type", true);
pref("services.sync.prefs.sync.mailnews.scroll_to_new_message", true);
pref("services.sync.prefs.sync.mailnews.sendInBackground", true);
pref("services.sync.prefs.sync.mailnews.send_default_charset", true);
pref("services.sync.prefs.sync.mailnews.send_plaintext_flowed", true);
pref("services.sync.prefs.sync.mailnews.show_send_progress", true);
pref("services.sync.prefs.sync.mailnews.start_page.enabled", true);
pref("services.sync.prefs.sync.mailnews.thread_pane_column_unthreads", true);
pref("services.sync.prefs.sync.mailnews.ui.deleteMarksRead", true);
pref("services.sync.prefs.sync.mailnews.ui.junk.manualMarkAsJunkMarksRead", true);
pref("services.sync.prefs.sync.mailnews.view_default_charset", true);
pref("services.sync.prefs.sync.mailnews.wraplength", true);
pref("services.sync.prefs.sync.network.cookie.cookieBehavior", true);
pref("services.sync.prefs.sync.network.cookie.lifetimePolicy", true);
pref("services.sync.prefs.sync.offline-apps.allow_by_default", true);
pref("services.sync.prefs.sync.permissions.default.image", true);
pref("services.sync.prefs.sync.privacy.donottrackheader.enabled", true);
pref("services.sync.prefs.sync.privacy.item.cache", true);
pref("services.sync.prefs.sync.privacy.item.cookies", true);
pref("services.sync.prefs.sync.privacy.item.downloads", true);
pref("services.sync.prefs.sync.privacy.item.formdata", true);
pref("services.sync.prefs.sync.privacy.item.history", true);
pref("services.sync.prefs.sync.privacy.item.offlineApps", true);
pref("services.sync.prefs.sync.privacy.item.passwords", true);
pref("services.sync.prefs.sync.privacy.item.sessions", true);
pref("services.sync.prefs.sync.privacy.item.urlbar", true);
pref("services.sync.prefs.sync.privacy.sanitize.promptOnSanitize", true);
pref("services.sync.prefs.sync.privacy.sanitize.sanitizeOnShutdown", true);
pref("services.sync.prefs.sync.privacy.trackingprotection.enabled", true);
pref("services.sync.prefs.sync.privacy.warn_tracking_content", true);
pref("services.sync.prefs.sync.security.OCSP.enabled", true);
pref("services.sync.prefs.sync.security.OCSP.require", true);
pref("services.sync.prefs.sync.security.default_personal_cert", true);
pref("services.sync.prefs.sync.security.mixed_content.block_active_content", true);
pref("services.sync.prefs.sync.security.mixed_content.block_display_content", true);
pref("services.sync.prefs.sync.security.tls.version.min", true);
pref("services.sync.prefs.sync.security.tls.version.max", true);
pref("services.sync.prefs.sync.security.warn_entering_secure", true);
pref("services.sync.prefs.sync.security.warn_leaving_secure", true);
pref("services.sync.prefs.sync.security.warn_mixed_active_content", true);
pref("services.sync.prefs.sync.security.warn_mixed_display_content", true);
pref("services.sync.prefs.sync.security.warn_submit_insecure", true);
pref("services.sync.prefs.sync.security.warn_viewing_mixed", true);
pref("services.sync.prefs.sync.signon.rememberSignons", true);
pref("services.sync.prefs.sync.spellchecker.dictionary", true);
pref("services.sync.prefs.sync.xpinstall.whitelist.required", true);

// Enable the DOM fullscreen API.
pref("full-screen-api.enabled", true);

// Most DevTools prefs are set from the shared file
// devtools/client/preferences/devtools.js, but this one is currently set
// per-app or per-channel.
// Number of usages of the web console or scratchpad. If this is less than 5,
// then pasting code into the web console or scratchpad is disabled
pref("devtools.selfxss.count", 5);

// Enable general plugin loading.
pref("plugin.load_flash_only", false);

#if defined(XP_WIN) && defined(MOZ_SANDBOX)
// When this pref is true the Windows process sandbox will set up dummy
// interceptions and log to the browser console when calls fail in the sandboxed
// process and also if they are subsequently allowed by the broker process.
// This will require a restart.
pref("security.sandbox.windows.log", false);

// Controls whether and how the Windows NPAPI plugin process is sandboxed.
// To get a different setting for a particular plugin replace "default", with
// the plugin's nice file name, see: nsPluginTag::GetNiceFileName.
// On windows these levels are:
// 0 - no sandbox
// 1 - sandbox with USER_NON_ADMIN access token level
// 2 - a more strict sandbox, which might cause functionality issues. This now
//     includes running at low integrity.
// 3 - the strongest settings we seem to be able to use without breaking
//     everything, but will probably cause some functionality restrictions
pref("dom.ipc.plugins.sandbox-level.default", 0);
#if defined(_AMD64_)
// The lines in PluginModuleParent.cpp should be changed in line with this.
pref("dom.ipc.plugins.sandbox-level.flash", 2);
#else
pref("dom.ipc.plugins.sandbox-level.flash", 0);
#endif

#if defined(MOZ_CONTENT_SANDBOX)
// This controls the strength of the Windows content process sandbox for testing
// purposes. This will require a restart.
// On windows these levels are:
// See - security/sandbox/win/src/sandboxbroker/sandboxBroker.cpp
// SetSecurityLevelForContentProcess() for what the different settings mean.
#if defined(NIGHTLY_BUILD)
pref("security.sandbox.content.level", 2);
#else
pref("security.sandbox.content.level", 1);
#endif

#if defined(MOZ_STACKWALKING)
// This controls the depth of stack trace that is logged when Windows sandbox
// logging is turned on.  This is only currently available for the content
// process because the only other sandbox (for GMP) has too strict a policy to
// allow stack tracing.  This does not require a restart to take effect.
pref("security.sandbox.windows.log.stackTraceDepth", 0);
#endif
#endif
#endif

#if defined(XP_MACOSX) && defined(MOZ_SANDBOX) && defined(MOZ_CONTENT_SANDBOX)
// This pref is discussed in bug 1083344, the naming is inspired from its
// Windows counterpart, but on Mac it's an integer which means:
// 0 -> "no sandbox"
// 1 -> "preliminary content sandboxing enabled: write access to
//       home directory is prevented"
// 2 -> "preliminary content sandboxing enabled with profile protection:
//       write access to home directory is prevented, read and write access
//       to ~/Library and profile directories are prevented (excluding
//       $PROFILE/{extensions,weave})"
// This setting is read when the content process is started. On Mac the content
// process is killed when all windows are closed, so a change will take effect
// when the 1st window is opened.
#if defined(NIGHTLY_BUILD)
pref("security.sandbox.content.level", 2);
#else
pref("security.sandbox.content.level", 1);
#endif
#endif

#if defined(XP_LINUX) && defined(MOZ_SANDBOX) && defined(MOZ_CONTENT_SANDBOX)
// This pref is introduced as part of bug 742434, the naming is inspired from
// its Windows/Mac counterpart, but on Linux it's an integer which means:
// 0 -> "no sandbox"
// 1 -> "content sandbox using seccomp-bpf when available"
// 2 -> "seccomp-bpf + file broker"
// Content sandboxing on Linux is currently in the stage of
// 'just getting it enabled', which includes a very permissive whitelist. We
// enable seccomp-bpf on nightly to see if everything is running, or if we need
// to whitelist more system calls.
//
// So the purpose of this setting is to allow nightly users to disable the
// sandbox while we fix their problems. This way, they won't have to wait for
// another nightly release which disables seccomp-bpf again.
//
// This setting may not be required anymore once we decide to permanently
// enable the content sandbox.
pref("security.sandbox.content.level", 2);
#endif

#if defined(XP_MACOSX) || defined(XP_WIN)
#if defined(MOZ_SANDBOX) && defined(MOZ_CONTENT_SANDBOX)
// ID (a UUID when set by gecko) that is used to form the name of a
// sandbox-writable temporary directory to be used by content processes
// when a temporary writable file is required in a level 1 sandbox.
pref("security.sandbox.content.tempDirSuffix", "");
#endif
#endif

// Url shown when you type moz://a
pref("toolkit.mozprotocol.url", "http://www.seamonkey-project.org/");
