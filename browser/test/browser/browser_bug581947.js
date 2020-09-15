function check(aElementName, aBarred, aType) {
  let doc = gBrowser.contentDocument;
  let tooltip = document.getElementById("aHTMLTooltip");
  let content = doc.getElementById('content');

  let e = doc.createElement(aElementName);
  content.appendChild(e);

  if (aType) {
    e.type = aType;
  }

  ok(!FillInHTMLTooltip(e),
     "No tooltip should be shown when the element is valid");

  e.setCustomValidity('foo');
  if (aBarred) {
    ok(!FillInHTMLTooltip(e),
       "No tooltip should be shown when the element is barred from constraint validation");
  } else {
    ok(FillInHTMLTooltip(e),
       e.tagName + " " +"A tooltip should be shown when the element isn't valid");
  }

  e.setAttribute('title', '');
  ok (!FillInHTMLTooltip(e),
      "No tooltip should be shown if the title attribute is set");

  e.removeAttribute('title');
  content.setAttribute('novalidate', '');
  ok (!FillInHTMLTooltip(e),
      "No tooltip should be shown if the novalidate attribute is set on the form owner");
  content.removeAttribute('novalidate');

  e.remove();
}

function todo_check(aElementName, aBarred) {
  let doc = gBrowser.contentDocument;
  let tooltip = document.getElementById("aHTMLTooltip");
  let content = doc.getElementById('content');

  let e = doc.createElement(aElementName);
  content.appendChild(e);

  let caught = false;
  try {
    e.setCustomValidity('foo');
  } catch (e) {
    caught = true;
  }

  todo(!caught, "setCustomValidity should exist for " + aElementName);

  e.remove();
}

function test() {
  waitForExplicitFinish();
  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function loadListener() {
    gBrowser.selectedBrowser.removeEventListener("load", loadListener, true);

    let testData = [
    /* element name, barred */
      [ 'input',    false,  null],
      [ 'textarea', false,  null],
      [ 'button',   true,  'button'],
      [ 'button',   false, 'submit'],
      [ 'select',   false,  null],
      [ 'output',   true,   null],
      [ 'fieldset', true,   null],
      [ 'object',   true,   null]
    ];

    for (let data of testData) {
      check(data[0], data[1], data[2]);
    }

    let todo_testData = [
      [ 'keygen', 'false' ]
    ];

    for (let data of todo_testData) {
      todo_check(data[0], data[1]);
    }

    gBrowser.removeCurrentTab();
    finish();
  }, true);

  content.location =
    "data:text/html,<!DOCTYPE html><html><body><form id='content'></form></body></html>";
}

