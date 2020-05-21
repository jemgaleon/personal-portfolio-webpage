(function() {
  // Instance DBGrid Obj
  const dbgrid = new DBGrid({
    wrapper: "#grdWorksheet",
    gridName: "WORKSHEET",
    additionalCriteria: "",
    allowSorting: true,
    allowPaging: true,
    pageSize: 5,
    pagerCount: 10,
    cancelSelectOnClick: false,
    width: 900,
    height: 300,
    dataKeyNames: ["EXAM_KEY,CASE_KEY,SECTION,PRIORITY"],
    columns: [
      { fieldHeader: "Exam Key", fieldName: "EXAM_KEY", fieldType: "number", fieldWidth: 0, hideField: true, dataKeyField: true },
      { fieldHeader: "Case Key", fieldName: "CASE_KEY", fieldType: "number", fieldWidth: 0, hideField: true, dataKeyField: true },
      { fieldHeader: "Section", fieldName: "SECTION", fieldType: "string", fieldWidth: 100, hideField: false, dataKeyField: true },
      { fieldHeader: "Priority", fieldName: "PRIORITY", fieldType: "string", fieldWidth: 100, hideField: false, dataKeyField: true },
      { fieldHeader: "Lab #", fieldName: "LAB_NUMBER", fieldType: "string", fieldWidth: 100, hideField: false, dataKeyField: false },
      { fieldHeader: "Date Assigned", fieldName: "DATE_ASSIGNED", fieldType: "date", fieldWidth: 100, hideField: false, dataKeyField: false },
      { fieldHeader: "Due Date", fieldName: "DUE_DATE", fieldType: "date", fieldWidth: 100, hideField: false, dataKeyField: false },
      { fieldHeader: "Status", fieldName: "STATUS", fieldType: "string", fieldWidth: 100, hideField: false, dataKeyField: false },
      { fieldHeader: "Complaint Number", fieldName: "COMPLAINT NUMBER", fieldWidth: 100,fieldType: "string", hideField: false, dataKeyField: false },
      { fieldHeader: "Items", fieldName: "ITEMS", fieldType: "string", fieldWidth: 100,hideField: false, dataKeyField: false }
    ],
    rowData: [
      [1,1,"FA","Normal","2009-0003","","","Ready For Review","2009-000-1234",""],
      [2,1,"CS","Normal","2009-0003","01/01/2020","01/01/2020","Draft Printed","2009-000-114","1,2"],
      [3,1,"CSAS","High","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"],
      [4,1,"CSAS","Normal","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"],
      [5,1,"BAC","Low","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"]
      // [6,1,"BIO","Normal","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"],
      // [7,1,"BAC","Normal","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"],
      // [8,1,"CSAS","Normal","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"],
      // [9,1,"FA","Normal","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"],
      // [10,1,"BIO","Normal","2009-0003","01/01/2020","","Approved","2009-000-1234","3,4,5"]
    ],
    totalRecords: 5,
    events: {
      rowCreated: function(sender, event) {
        //console.log(sender);
      },
      selectedIndexChanged: function(sender, event) {
        //console.log(sender);
        console.log(sender.dataset);
      },
      checkAll: function(sender, event) {
        //console.log(sender);
      },
      check: function(sender, event) {
        //console.log(this);
      },
      toggle: function(sender, row, contentRow, event) {
        const grid = this;

        //console.log("user toggle: " + sender.toggled);
        
        if(contentRow.rowCreated) {
          const td = document.createElement("td");
          const div = document.createElement("div");
          const dbgridChild = new DBGrid({
            gridName: "WORKSHEETS",
            cancelSelectOnClick: true,
            width: 300,
            height: 300,
            customFields: [
              { type: "checkbox" }
            ],
            columns: [
              { fieldHeader: "Section", fieldName: "SECTION", fieldType: "string", fieldWidth: 100, hideField: false, dataKeyField: true },
              { fieldHeader: "Description", fieldName: "DESCRIPTION", fieldType: "string", fieldWidth: 200, hideField: false, dataKeyField: true }
            ],
            rowData: [
              [ "FA", "FA-FA Blank Worksheet"],
              [ "FA", "FA-Microscopy Bullet Case Notes"],
              [ "FA", "FA-FA Blank Worksheet"],
              [ "FA", "FA-FA Blank Worksheet"]
            ]
          });

          dbgridChild.table.classList.add("tableception"); // header index issue fix
          div.appendChild(dbgridChild.table);
          div.classList.add("toggleWrapper");
          td.appendChild(div);
          td.setAttribute("colSpan", row.children.length - 1); // minus toggle count
          contentRow.appendChild(td);
        }
      }
    },
    customFields: [
      { type: "toggle", hideColumn: true, autoOpen: false }
    ]
  });
}());