/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim:set ts=2 sw=2 sts=2 et: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Tests that requesting clear history at shutdown will really clear history.
 */

const URIS = [
  "http://a.example1.com/"
, "http://b.example1.com/"
, "http://b.example2.com/"
, "http://c.example3.com/"
];

const TOPIC_CONNECTION_CLOSED = "places-connection-closed";

var EXPECTED_NOTIFICATIONS = [
  "places-shutdown"
, "places-will-close-connection"
, "places-expiration-finished"
, "places-connection-closed"
];

const UNEXPECTED_NOTIFICATIONS = [
  "xpcom-shutdown"
];

const URL = "ftp://localhost/clearHistoryOnShutdown/";

var notificationIndex = 0;

var notificationsObserver = {
  observe: function observe(aSubject, aTopic, aData) {
    print("Received notification: " + aTopic);

    // Note that some of these notifications could arrive multiple times, for
    // example in case of sync, we allow that.
    if (EXPECTED_NOTIFICATIONS[notificationIndex] != aTopic)
      notificationIndex++;
    do_check_eq(EXPECTED_NOTIFICATIONS[notificationIndex], aTopic);

    if (aTopic != TOPIC_CONNECTION_CLOSED)
      return;

    getDistinctNotifications().forEach(
      topic => Services.obs.removeObserver(notificationsObserver, topic)
    );

    print("Looking for uncleared stuff.");

    let stmt = DBConn().createStatement(
      "SELECT id FROM moz_places WHERE url = :page_url "
    );

    try {
      URIS.forEach(function(aUrl) {
        stmt.params.page_url = aUrl;
        do_check_false(stmt.executeStep());
        stmt.reset();
      });
    } finally {
      stmt.finalize();
    }

    // Check cache.
    checkCache(URL);
  }
}

var timeInMicroseconds = Date.now() * 1000;

function run_test() {
  run_next_test();
}

add_task(function test_execute() {
  do_test_pending();

  print("Initialize suiteglue before Places");
  // Avoid default bookmarks import.
  Cc["@mozilla.org/suite/suiteglue;1"].getService(Ci.nsIObserver)
    .observe(null, "initial-migration", null);

  Services.prefs.setBoolPref("privacy.item.history", true);
  Services.prefs.setBoolPref("privacy.item.urlbar", true);
  Services.prefs.setBoolPref("privacy.item.formdata", true);
  Services.prefs.setBoolPref("privacy.item.passwords", true);
  Services.prefs.setBoolPref("privacy.item.downloads", true);
  Services.prefs.setBoolPref("privacy.item.cookies", true);
  Services.prefs.setBoolPref("privacy.item.cache", true);
  Services.prefs.setBoolPref("privacy.item.sessions", true);
  Services.prefs.setBoolPref("privacy.item.offlineApps", true);

  Services.prefs.setBoolPref("privacy.sanitize.sanitizeOnShutdown", true);
  // Unlike Firefox, SeaMonkey still supports the confirmation dialog
  // which is called from Sanitizer's init method checkSettings().
  Services.prefs.setBoolPref("privacy.sanitize.promptOnSanitize", false);

  print("Add visits.");
  for (let aUrl of URIS) {
    yield promiseAddVisits({uri: uri(aUrl), visitDate: timeInMicroseconds++,
                            transition: PlacesUtils.history.TRANSITION_TYPED})
  }
  print("Add cache.");
  storeCache(URL, "testData");
});

function run_test_continue()
{
  print("Simulate and wait shutdown.");
  getDistinctNotifications().forEach(
    topic =>
      Services.obs.addObserver(notificationsObserver, topic, false)
  );

  // Simulate an exit so that Sanitizer's init method checkSettings() is called.
  print("Simulate 'quit-application-granted' too for SeaMonkey.");
  Services.obs.notifyObservers(null, "quit-application-granted", null);

  shutdownPlaces();

  // Shutdown the download manager.
  Services.obs.notifyObservers(null, "quit-application", null);
}

function getDistinctNotifications() {
  let ar = EXPECTED_NOTIFICATIONS.concat(UNEXPECTED_NOTIFICATIONS);
  return [...new Set(ar)];
}

function storeCache(aURL, aContent) {
  let cache = Cc["@mozilla.org/network/cache-service;1"].
              getService(Ci.nsICacheService);
  let session = cache.createSession("FTP", Ci.nsICache.STORE_ANYWHERE,
                                    Ci.nsICache.STREAM_BASED);


  var storeCacheListener = {
    onCacheEntryAvailable: function (entry, access, status) {
      do_check_eq(status, Cr.NS_OK);

      entry.setMetaDataElement("servertype", "0");
      var os = entry.openOutputStream(0);

      var written = os.write(aContent, aContent.length);
      if (written != aContent.length) {
        do_throw("os.write has not written all data!\n" +
                 "  Expected: " + written  + "\n" +
                 "  Actual: " + aContent.length + "\n");
      }
      os.close();
      entry.close();
      do_execute_soon(run_test_continue);
    }
  };

  session.asyncOpenCacheEntry(aURL,
                              Ci.nsICache.ACCESS_READ_WRITE,
                              storeCacheListener);
}

function checkCache(aURL) {
  let cache = Cc["@mozilla.org/network/cache-service;1"].
              getService(Ci.nsICacheService);
  let session = cache.createSession("FTP", Ci.nsICache.STORE_ANYWHERE,
                                    Ci.nsICache.STREAM_BASED);

  var checkCacheListener = {
    onCacheEntryAvailable: function (entry, access, status) {
      do_check_eq(status, Cr.NS_ERROR_CACHE_KEY_NOT_FOUND);
      do_test_finished();
    }
  };

  session.asyncOpenCacheEntry(aURL,
                              Ci.nsICache.ACCESS_READ,
                              checkCacheListener);
}
