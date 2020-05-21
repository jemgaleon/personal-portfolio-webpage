# GridView Javascript Plugin

A JavaScript implementation of the .NET GridView control.

Usage:

```javascript
// for client-side data rendering
const dbgrid = new DBGrid({
  wrapper: "#grdClient",
  dataKeyNames: "ID",
  hiddenFields: "ID",
  allowPaging: true,
  pagerCount: 5,
  pageSize: 5,
  columns: [
    { type: "checkbox", hideColumn: false, autoCheck: false },
    {
      fieldName: "ID",
      fieldHeader: "Key",
      fieldType: "number",
      fieldWidth: 100,
      displayOrder: 1,
      hideField: true,
      isDataKeyField: true,
    },
    {
      fieldName: "SEQUENCE",
      fieldHeader: "Sequence",
      fieldType: "number",
      fieldWidth: 90,
      displayOrder: 2,
      hideField: false,
      isDataKeyField: false,
    },
    {
      fieldName: "ITEM_DESC",
      fieldHeader: "Description",
      fieldType: "string",
      fieldWidth: 120,
      displayOrder: 3,
      hideField: false,
      isDataKeyField: false,
    },
  ],
  rowData: [
    [1, 1, "Item A"],
    [2, 2, "Item B"],
    [3, 3, "Item C"],
    [4, 4, "Item D"],
    [5, 5, "Item E"],
    [6, 5, "Item E"],
  ],
  events: {
    columnCreated: function (sender) {
      // handle column created event here
    },
    checkAll: function (sender, event) {
      // handle check all event here
    },
    check: function (checkboxAll, row, sender, event) {
      // handle check event here
    },
    toggle: function (row, contentRow, sender, event) {
      // handle toggle row event here
    },
    selectedIndexChanged: function (row, event) {
      // handle row click event here
    },
  },
});
```
