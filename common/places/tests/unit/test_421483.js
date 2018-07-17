/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim:set ts=2 sw=2 sts=2 et: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Get bookmarks service
try {
  var bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].
              getService(Ci.nsINavBookmarksService);
} catch(ex) {
  do_throw("Could not get Bookmarks service\n");
}

// Get annotation service
try {
  var annosvc = Cc["@mozilla.org/browser/annotation-service;1"].
                getService(Ci.nsIAnnotationService);
} catch(ex) {
  do_throw("Could not get Annotation service\n");
}

// Get browser glue
try {
  var gluesvc = Cc["@mozilla.org/suite/suiteglue;1"].
                getService(Ci.nsISuiteGlue);
  // Avoid default bookmarks import.
  gluesvc.QueryInterface(Ci.nsIObserver).observe(null, "initial-migration", null);
} catch(ex) {
  do_throw("Could not get SuiteGlue service\n");
}

const SMART_BOOKMARKS_ANNO = "Places/SmartBookmark";
const SMART_BOOKMARKS_PREF = "browser.places.smartBookmarksVersion";

// main
function run_test() {
  // TEST 1: smart bookmarks disabled
  Services.prefs.setIntPref("browser.places.smartBookmarksVersion", -1);
  gluesvc.ensurePlacesDefaultQueriesInitialized();
  var smartBookmarkItemIds = annosvc.getItemsWithAnnotation(SMART_BOOKMARKS_ANNO);
  do_check_eq(smartBookmarkItemIds.length, 0);
  // check that pref has not been bumped up
  do_check_eq(Services.prefs.getIntPref("browser.places.smartBookmarksVersion"), -1);

  // TEST 2: create smart bookmarks
  Services.prefs.setIntPref("browser.places.smartBookmarksVersion", 0);
  gluesvc.ensurePlacesDefaultQueriesInitialized();
  smartBookmarkItemIds = annosvc.getItemsWithAnnotation(SMART_BOOKMARKS_ANNO);
  do_check_neq(smartBookmarkItemIds.length, 0);
  // check that pref has been bumped up
  do_check_true(Services.prefs.getIntPref("browser.places.smartBookmarksVersion") > 0);

  var smartBookmarksCount = smartBookmarkItemIds.length;

  // TEST 3: smart bookmarks restore
  // remove one smart bookmark and restore
  bmsvc.removeItem(smartBookmarkItemIds[0]);
  Services.prefs.setIntPref("browser.places.smartBookmarksVersion", 0);
  gluesvc.ensurePlacesDefaultQueriesInitialized();
  smartBookmarkItemIds = annosvc.getItemsWithAnnotation(SMART_BOOKMARKS_ANNO);
  do_check_eq(smartBookmarkItemIds.length, smartBookmarksCount);
  // check that pref has been bumped up
  do_check_true(Services.prefs.getIntPref("browser.places.smartBookmarksVersion") > 0);

  // TEST 4: move a smart bookmark, change its title, then restore
  // smart bookmark should be restored in place
  var parent = bmsvc.getFolderIdForItem(smartBookmarkItemIds[0]);
  var oldTitle = bmsvc.getItemTitle(smartBookmarkItemIds[0]);
  // create a subfolder and move inside it
  var newParent = bmsvc.createFolder(parent, "test", bmsvc.DEFAULT_INDEX);
  bmsvc.moveItem(smartBookmarkItemIds[0], newParent, bmsvc.DEFAULT_INDEX);
  // change title
  bmsvc.setItemTitle(smartBookmarkItemIds[0], "new title");
  // restore
  Services.prefs.setIntPref("browser.places.smartBookmarksVersion", 0);
  gluesvc.ensurePlacesDefaultQueriesInitialized();
  smartBookmarkItemIds = annosvc.getItemsWithAnnotation(SMART_BOOKMARKS_ANNO);
  do_check_eq(smartBookmarkItemIds.length, smartBookmarksCount);
  do_check_eq(bmsvc.getFolderIdForItem(smartBookmarkItemIds[0]), newParent);
  do_check_eq(bmsvc.getItemTitle(smartBookmarkItemIds[0]), oldTitle);
  // check that pref has been bumped up
  do_check_true(Services.prefs.getIntPref("browser.places.smartBookmarksVersion") > 0);
}
