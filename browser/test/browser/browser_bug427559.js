/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Test bug 427559 to make sure focused elements that are no longer on the page
 * will have focus transferred to the window when changing tabs back to that
 * tab with the now-gone element.
 */

// Default focus on a button and have it kill itself on blur
var testPage = 'data:text/html,<body><button onblur="this.remove();"><script>document.body.firstChild.focus();</script></body>';

function test() {
  waitForExplicitFinish();

  gBrowser.selectedTab = gBrowser.addTab();

  gBrowser.selectedBrowser.addEventListener("load", function loadListener() {
    gBrowser.selectedBrowser.removeEventListener("load", loadListener, true);
    executeSoon(function () {

      // The test page loaded, so open an empty tab, select it, then restore
      // the test tab. This causes the test page's focused element to be removed
      // from its document.
      gBrowser.selectedTab = gBrowser.addTab();
      gBrowser.removeCurrentTab();

      // Make sure focus is given to the window because the element is now gone.
      is(document.commandDispatcher.focusedWindow, window.content,
         "content window is focused");

      gBrowser.removeCurrentTab();
      finish();
    });
  }, true);

  content.location = testPage;
}
