/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function DeleteAllFromTree
    (tree, view, table, deletedTable, removeButton, removeAllButton) {

  // remove all items from table and place in deleted table
  for (var i=0; i<table.length; i++) {
    deletedTable[deletedTable.length] = table[i];
  }
  table.length = 0;

  // redisplay
  var oldCount = view.rowCount;
  view.rowCount = 0;
  tree.treeBoxObject.rowCountChanged(0, -oldCount);


  // disable buttons
  document.getElementById(removeButton).setAttribute("disabled", "true")
  document.getElementById(removeAllButton).setAttribute("disabled","true");
}

function DeleteSelectedItemFromTree
    (tree, view, table, deletedTable, removeButton, removeAllButton) {

  // Turn off tree selection notifications during the deletion
  tree.view.selection.selectEventsSuppressed = true;

  // remove selected items from list (by setting them to null) and place in deleted list
  var selections = GetTreeSelections(tree);
  for (var s=selections.length-1; s>= 0; s--) {
    var i = selections[s];
    deletedTable[deletedTable.length] = table[i];
    table[i] = null;
  }

  // collapse list by removing all the null entries
  for (var j=0; j<table.length; j++) {
    if (table[j] == null) {
      var k = j;
      while ((k < table.length) && (table[k] == null)) {
        k++;
      }
      table.splice(j, k-j);
      view.rowCount -= k - j;
      tree.treeBoxObject.rowCountChanged(j, j - k);
    }
  }

  // update selection and/or buttons
  if (table.length) {

    // update selection
    var nextSelection = (selections[0] < table.length) ? selections[0] : table.length-1;
    tree.view.selection.select(nextSelection);
    tree.treeBoxObject.ensureRowIsVisible(nextSelection);

  } else {

    // disable buttons
    document.getElementById(removeButton).setAttribute("disabled", "true")
    document.getElementById(removeAllButton).setAttribute("disabled","true");

  }

  tree.view.selection.selectEventsSuppressed = false;
}

function GetTreeSelections(tree) {
  var selections = [];
  var select = tree.view.selection;
  if (select) {
    var count = select.getRangeCount();
    var min = new Object();
    var max = new Object();
    for (var i=0; i<count; i++) {
      select.getRangeAt(i, min, max);
      for (var k=min.value; k<=max.value; k++) {
        if (k != -1) {
          selections[selections.length] = k;
        }
      }
    }
  }
  return selections;
}

function SortTree(tree, view, table, column, lastSortColumn, lastSortAscending, updateSelection) {

  // remember which item was selected so we can restore it after the sort
  var selections = GetTreeSelections(tree);
  var selectedNumber = selections.length ? table[selections[0]].id : -1;

  // determine if sort is to be ascending or descending
  var ascending = (column == lastSortColumn) ? !lastSortAscending : true;

  // do the sort or re-sort
  // this is a temporary hack for 1.7, we should implement
  // display and sort variables here for trees in general
  var compareFunc;
  if (column == "expires") {
    compareFunc = function compare(first, second) {
      if (first.expiresSortValue > second.expiresSortValue)
        return 1;
      else if (first.expiresSortValue < second.expiresSortValue)
        return -1;
      else
        return 0;
    }
  } else {
    compareFunc = function compare(first, second) {
      return first[column].toLowerCase().localeCompare(second[column].toLowerCase());
    }
  }
  table.sort(compareFunc);
  if (!ascending)
    table.reverse();

  // restore the selection
  var selectedRow = -1;
  if (selectedNumber>=0 && updateSelection) {
    for (var s=0; s<table.length; s++) {
      if (table[s].id == selectedNumber) {
        // update selection
        // note: we need to deselect before reselecting in order to trigger ...Selected()
        tree.view.selection.select(-1);
        tree.view.selection.select(s);
        selectedRow = s;
        break;
      }
    }
  }

  // display the results
  tree.treeBoxObject.invalidate();
  if (selectedRow >= 0) {
    tree.treeBoxObject.ensureRowIsVisible(selectedRow)
  }

  return ascending;
}

