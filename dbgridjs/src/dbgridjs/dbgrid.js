(function () {
  // Constructor
  this.DBGrid = function (props) {
    const grid = this;
    // Define options defaults
    const defaults = {
      wrapper: "",
      gridName: "",
      additionalCriteria: "",
      dataKeyNames: "",
      hiddenFields: "", // hidden field name, dataKeyNames will no longer be hidden by default, can be a names or index in csv
      primaryKeyName: "", // first index of dataKeyNames
      cancelSelectOnClick: false,
      emptyDataText: "No records found.",
      description: "",
      panelName: "",
      width: 700,
      height: 350,
      allowSorting: true,
      allowPaging: true,
      pageSize: 10,
      pagerCount: 10,
      dateFormat: {
        localeMatcher: "best fit",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      },
      locales: "en-US",
      columns: [
        // Stucture:
        // { type: "checkbox", hideField: true, autoCheck: true },
        // { type: "toggle", hideField: true, autoOpen: true },
        // { fieldName: "FIELD_NAME", fieldHeader: "Prompt", fieldWidth: 0, displayOrder: 1, hideField: true, isDataKeyField: true },
        // { fieldName: "FIELD_NAME", fieldHeader: "Prompt", fieldWidth: 80, displayOrder: 2, hideField: false, isDataKeyField: false }
      ],
      rowData: [
        // Structure:
        // ["Value", "Value"],
        // ["Value", "Value"],
        // ["Value", "Value"]
      ],
      serviceURL: {
        columns: "",
        rowData: "",
        rowKeys: "",
      },
      assetsURL: {
        sortAsc: "./src/dbgridjs/assets/sort-asc.bmp",
        sortDesc: "./src/dbgridjs/assets/sort-desc.bmp",
        toggleCollapse: "./src/dbgridjs/assets/toggle-collapse.png",
        toggleExpand: "./src/dbgridjs/assets/toggle-expand.png",
        loader: "./src/dbgridjs/assets/loader.gif",
      },
      events: {},
    };

    // Create options by extending with the passed in arguments
    grid.options = extendDefaults(defaults, props);

    if (props && typeof props === "object") {
      grid.events = props.events;
    }

    // Create global element references
    grid.table = null;
    grid.wrapper = null;

    // Data-driven properties
    grid.columns = [];
    grid.rowData = [];
    grid.sortList = [];
    grid.totalRecords = 0;
    grid.selectedPageIndex = 0; // zero based index
    grid.selectedIndex = 0; // zero based index
    grid.initialization = true;

    // Initialization
    grid.init().create();
  };

  // Public Methods
  this.DBGrid.prototype = {
    init: function () {
      const grid = this;

      // Set init property
      grid.initialization = true;

      // Init primaryKeyName value
      if (grid.options.dataKeyNames.length && !grid.options.primaryKeyName) {
        grid.options.primaryKeyName = grid.options.dataKeyNames.split(",")[0];
      }

      // Init grid's container/wrapper
      grid.getWrapper();

      return grid;
    },
    create: function () {
      const grid = this;

      // Call event creating before creating the content
      grid.on.creating.call(grid);

      grid
        .removeTable()
        .createTable()
        .hideTable() // show table after hide loader
        .attachToWrapper()
        .createContent();

      //todo: move created event here if async/await
      // if (grid.initialization) {
      //   grid.success = true;
      //   grid.on.created.call(grid);
      // }

      return grid;
    },
    attachToWrapper: function () {
      const grid = this;

      grid.wrapper.appendChild(grid.table);

      return grid;
    },
    getWrapper: function () {
      const grid = this;
      let wrapper = null;

      if (typeof grid.options.wrapper === "string") {
        wrapper = document.querySelector(grid.options.wrapper);
      } else {
        wrapper = grid.options.wrapper;
      }

      grid.wrapper = wrapper;

      return grid;
    },
    setWrapper: function () {
      const grid = this;

      if (grid.wrapper) {
        grid.wrapper.style.width = grid.options.width + "px";
        grid.wrapper.style.maxHeight = grid.options.height + "px";
        grid.wrapper.style.overflow = "auto";

        // Todo: fix IE display: sticky alternative
        //if (grid.table.tBodies.length > 0) {
        //    grid.table.tBodies[0].style.maxHeight = grid.options.height + "px";
        //}

        grid.wrapper.classList.add("dbgridjs");
      }

      return grid;
    },
    createContent: function () {
      const grid = this;

      // DBGridConfig data
      if (grid.options.gridName) {
        grid.setWrapper().fetchColumns();
      }
      // Custom data
      else {
        grid.columns = grid.options.columns;
        grid.rowData = Array.from(grid.options.rowData);
        grid.totalRecords = grid.rowData.length;

        grid
          .removeTableHead()
          .removeTableBody()
          .removeTableFoot()
          .createTableHead()
          .createTableBody()
          .createTableFoot()
          .hideTableHead()
          .setWrapper();

        if (grid.rowData.length > 0) {
          grid.showTableHead();

          if (grid.options.allowPaging) {
            grid.updateTableBodyRows();
          }
        } else {
          grid.showCaption();
        }

        if (grid.initialization) {
          grid.success = true;
          grid.on.created.call(grid);
        }
      }

      return grid;
    },
    createTable: function () {
      const grid = this;
      const table = document.createElement("table");

      grid.table = table;

      return grid;
    },
    createTableCaption: function (captionText) {
      const grid = this;
      const caption = document.createElement("caption");
      captionText = captionText || grid.options.emptyDataText;

      caption.appendChild(document.createTextNode(captionText));
      grid.table.classList.add("empty");
      grid.table.caption = caption;

      return grid;
    },
    createTableHead: function () {
      const grid = this;

      grid.table.tHead = document.createElement("thead");
      const tr = grid.createTableHeadRow();

      // Events
      grid.on.columnCreated(tr);

      return grid;
    },
    createTableHeadRow: function () {
      const grid = this;
      const rowData = grid.columns.map(function (column) {
        let data = null;

        if (column.hasOwnProperty("type")) {
          data = {
            cellValue: column.type,
            type: "custom",
            hidden: column.hideField,
          };

          if (column.hasOwnProperty("autoOpen")) {
            data["autoOpen"] = column.autoOpen;
          }

          if (column.hasOwnProperty("autoCheck")) {
            data["autoCheck"] = column.autoCheck;
          }
        } else {
          data = {
            cellValue: column.fieldHeader,
            width: column.fieldWidth,
            hidden: column.hideField,
            sortName: column.fieldName,
          };
        }

        return data;
      }, []);
      const tr = grid.createTableRow({
        isColumn: true,
        rowData: rowData,
      });

      grid.table.tHead.appendChild(tr);

      return tr;
    },
    createTableBody: function () {
      const grid = this;

      grid.table.appendChild(document.createElement("tbody"));
      grid.createTableBodyRows();
      //Todo: fix IE display: sticky alternative
      //grid.setWrapper();

      return grid;
    },
    createTableBodyRows: function () {
      const grid = this;

      for (let i = 0; i < grid.rowData.length; i++) {
        const rowData = grid.rowData[i];

        grid.addRow(rowData, true);
      }

      return grid;
    },
    createTableFoot: function () {
      const grid = this;

      grid.table.tFoot = document.createElement("tfoot");

      if (grid.totalRecords) {
        const rowData = [
          {
            pageSize: grid.options.pageSize,
            pagerCount: grid.options.pagerCount,
            selectedPageIndex: grid.selectedPageIndex,
            totalRecords: grid.totalRecords,
          },
        ];
        const tr = grid.createTableRow({
          isFoot: true,
          rowData: rowData,
        });

        grid.table.tFoot.appendChild(tr);
      }

      return grid;
    },
    createTableRow: function (props) {
      const grid = this;
      const tr = document.createElement("tr");

      // Create row data
      for (let i = 0; i < props.rowData.length; i++) {
        let tableDataProps = {};

        // Create custom row data
        if (props.rowData[i].hasOwnProperty("type")) {
          // Checkbox
          if (props.rowData[i].cellValue === "checkbox") {
            tableDataProps = {
              cellType: "input|type=checkbox",
              isColumn: props.isColumn,
              hideField: props.rowData[i].hidden,
              autoCheck: props.rowData[i].autoCheck,
            };
          }
          // Toggle
          else if (props.rowData[i].cellValue === "toggle") {
            tableDataProps = {
              cellType: "img|type=toggle,alt=collapse",
              isColumn: props.isColumn,
              hideField: props.rowData[i].hidden,
              autoOpen: props.rowData[i].autoOpen,
            };
          }

          const td = grid.createCustomTableData(tableDataProps, tr);
          tr.appendChild(td);
        }
        // Create default row data
        else {
          const width = Number(props.rowData[i].width) + "px";

          if (!props.rowData[i].hidden) {
            // Table head
            if (props.isColumn) {
              tableDataProps = {
                cellValue: props.rowData[i].cellValue,
                sortName: props.rowData[i].sortName,
              };

              const th = grid.createTableHeadData(tableDataProps);
              th.style.width = width;
              tr.appendChild(th);
            }
            // Table foot
            else if (props.isFoot) {
              tableDataProps = {
                pageSize: props.rowData[i].pageSize,
                pagerCount: props.rowData[i].pagerCount,
                selectedPageIndex: props.rowData[i].selectedPageIndex,
                totalRecords: props.rowData[i].totalRecords,
              };

              const th = grid.createTableFootData(tableDataProps);
              tr.appendChild(th);
            }
            // Table body
            else if (props.isBody) {
              tableDataProps = {
                cellValue: props.rowData[i].cellValue,
              };

              const td = grid.createTableData(tableDataProps);
              td.style.width = width;

              tr.appendChild(td);
            }
          }
        }

        // Add data key to row
        if (props.isBody && props.rowData[i].dataKeyName) {
          const dataKeyName = props.rowData[i].dataKeyName;

          tr.dataset[dataKeyName.toUpperCase()] = props.rowData[i].cellValue;
        }
      }

      return tr;
    },
    createTableHeadData: function (props) {
      const grid = this;
      const th = document.createElement("th");
      let textNode = "";

      // Column with sorting
      if (grid.options.allowSorting) {
        const a = document.createElement("a");
        const imgSort = document.createElement("img");
        const spanOrder = document.createElement("span");

        // Add class
        a.classList.add("sortable");
        imgSort.classList.add("hidden");
        spanOrder.classList.add("hidden");

        // Add attribute
        a.sortName = props.sortName;
        a.sortDirection = "";

        imgSort.src = "#";
        imgSort.alt = "";

        // Add event
        a.addEventListener("click", grid.on.sort.bind(grid, a, imgSort));

        textNode = document.createTextNode(props.cellValue);
        a.appendChild(textNode);
        spanOrder.appendChild(document.createTextNode(""));
        th.appendChild(a);
        th.appendChild(imgSort);
        th.appendChild(spanOrder);
      } else {
        const span = document.createElement("span");

        textNode = document.createTextNode(props.cellValue);

        span.appendChild(textNode);
        span.classList.add("default");
        th.appendChild(span);
      }

      return th;
    },
    createTableData: function (props) {
      const grid = this;
      const td = document.createElement("td");
      const span = document.createElement("span");
      let textNode = "";

      textNode = document.createTextNode(props.cellValue);

      span.appendChild(textNode);
      span.classList.add("default");

      td.appendChild(span);

      return td;
    },
    createTableFootData: function (props) {
      const grid = this;
      const th = document.createElement("th");
      const pageGroup =
        Math.floor(props.selectedPageIndex / props.pagerCount) + 1;
      const totalPages = Math.ceil(props.totalRecords / props.pageSize);

      // Add previous paging
      if (pageGroup > 1) {
        const a = document.createElement("a");

        a.appendChild(document.createTextNode("..."));

        // Add attibute
        a.value = "previous";

        // Add event
        a.addEventListener("click", grid.on.pageIndexChange.bind(grid, a));

        th.appendChild(a);
      }

      // Add paging
      let startIndex = (pageGroup - 1) * props.pagerCount;
      let endIndex = Math.min(pageGroup * props.pagerCount, totalPages);

      for (let i = startIndex; i < endIndex; i++) {
        const a = document.createElement("a");

        // Add class
        if (props.selectedPageIndex === i) {
          // Todo: Move this pageIndexChange event
          a.classList.add("selected");
          a.setAttribute("disabled", true);
        }

        // Add event
        a.addEventListener("click", grid.on.pageIndexChange.bind(grid, a));

        a.appendChild(document.createTextNode(i + 1)); // diplay start at 1

        // Add attibute
        a.value = i;

        th.appendChild(a);
      }

      // Add next paging
      if (pageGroup < Math.ceil(totalPages / props.pagerCount)) {
        const a = document.createElement("a");

        a.appendChild(document.createTextNode("..."));

        // Add attibute
        a.value = "next";

        // Add event
        a.addEventListener("click", grid.on.pageIndexChange.bind(grid, a));

        th.appendChild(a);
      }

      // Add attribute
      th.setAttribute(
        "colspan",
        grid.table.tHead.querySelectorAll("th").length
      );

      return th;
    },
    createCustomTableData: function (props, tr) {
      const grid = this;
      const td = props.isColumn
        ? document.createElement("th")
        : document.createElement("td");

      if (props.cellType && props.cellType.indexOf("|") > -1) {
        const control = grid.createCustomControl.call(grid, props, tr, td);
        const span = document.createElement("span");

        span.appendChild(control);
        span.classList.add("default");

        td.appendChild(span);
      }

      return td;
    },
    createCustomControl: function (props, tr, td) {
      const grid = this;
      const element = props.cellType.split("|")[0];
      const attributes = String(props.cellType.split("|")[1]);
      const control = document.createElement(element);
      let elementType = "";

      // Set attributes dynamically
      attributes.split(",").forEach(function (attribute, index) {
        const attrName = attribute.split("=")[0];
        const attrValue = attribute.split("=")[1];

        control.setAttribute(attrName, attrValue);

        if (attrName == "type") {
          elementType = attrValue;
        }
      });

      // Checkbox
      if (elementType === "checkbox") {
        // Add class and event
        td.classList.add("icon-size");

        if (props.isColumn) {
          if (props.hideField) {
            control.classList.add("hidden");
          }

          control.classList.add("checkbox-all");
          control.addEventListener(
            "click",
            grid.on.checkAll.bind(grid, control)
          );
        } else {
          control.classList.add("checkbox");
          control.addEventListener(
            "click",
            grid.on.check.bind(grid, tr, control)
          );
        }
      }
      // Toggle
      else if (elementType === "toggle") {
        // Add attribute
        td.rowSpan = 2;

        // Add class
        td.classList.add("icon-size");
        td.classList.add("icon-toggle");

        control.toggled = false;
        control.src = grid.options.assetsURL.toggleExpand;

        // Add class and event
        if (props.isColumn) {
          if (props.hideField) {
            control.classList.add("hidden");
          }

          control.addEventListener(
            "click",
            grid.on.toggleAll.bind(grid, control)
          );
        } else {
          control.addEventListener(
            "click",
            grid.on.toggle.bind(grid, tr, control)
          );
        }
      }

      return control;
    },
    removeTable: function () {
      const grid = this;

      if (grid.wrapper.childNodes.length) {
        const table = grid.wrapper.querySelector("table");

        if (table) {
          grid.wrapper.removeChild(table);
        }
      }

      return grid;
    },
    removeTableCaption: function () {
      const grid = this;

      grid.table.caption = null;

      return grid;
    },
    removeTableHead: function () {
      const grid = this;

      if (grid.table.tHead) {
        if (grid.options.gridName) {
          grid.table.deleteTHead();
        }
      }

      return grid;
    },
    removeTableBody: function () {
      const grid = this;

      if (grid.table.tBodies.length) {
        //if (grid.options.gridName) {
        grid.table.removeChild(grid.table.tBodies[0]);
        //}
      }

      return grid;
    },
    removeTableFoot: function () {
      const grid = this;

      if (grid.table.tFoot) {
        grid.table.deleteTFoot();
      }

      return grid;
    },
    updateTableBodyRows: function () {
      const grid = this;
      const rows = Array.from(grid.table.tBodies[0].querySelectorAll("tr"));
      const rowIndex = grid.selectedIndex;
      const pageIndex = Math.floor(rowIndex / grid.options.pageSize);

      rows.forEach(function (row) {
        const included =
          Math.floor((row.rowIndex - 1) / grid.options.pageSize) === pageIndex;

        if (!included) {
          row.classList.add("hidden");
        } else {
          row.classList.remove("hidden");
        }
      });

      return grid;
    },
    showTable: function () {
      const grid = this;

      grid.table.classList.remove("hidden");

      return grid;
    },
    showCaption: function (caption) {
      const grid = this;

      grid.createTableCaption(caption).showTable().hideLoading();

      return grid;
    },
    showTableHead: function () {
      const grid = this;

      grid.table.tHead.classList.remove("hidden");

      return grid;
    },
    showTableFoot: function () {
      const grid = this;

      grid.table.tFoot.classList.remove("hidden");

      return grid;
    },
    showLoading: function () {
      const grid = this;
      const img = document.createElement("img");

      img.src = grid.options.assetsURL.loader;
      img.alt = "Loading...";
      img.classList.add("loader");

      grid.loader = img;
      grid.wrapper.appendChild(grid.loader);

      return grid;
    },
    hideTable: function () {
      const grid = this;

      grid.table.classList.add("hidden");

      return grid;
    },
    hideCaption: function () {
      const grid = this;

      grid.removeTableCaption();
      grid.table.classList.remove("empty");

      return grid;
    },
    hideTableHead: function () {
      const grid = this;

      grid.table.tHead.classList.add("hidden");

      return grid;
    },
    hideTableFoot: function () {
      const grid = this;

      grid.table.tFoot.classList.add("hidden");

      return grid;
    },
    hideLoading: function () {
      const grid = this;

      if (
        grid.wrapper.childNodes.length &&
        grid.wrapper.contains(grid.loader)
      ) {
        grid.wrapper.removeChild(grid.loader);
      }

      return grid;
    },
    addRow: function (cells, fromInternal) {
      const grid = this;
      const customFields = grid.column.getCustomFields.call(grid);
      const rowData = customFields.concat(cells).map(function (cell, index) {
        let data = null;

        if (cell.hasOwnProperty("type")) {
          data = {
            cellValue: cell.type,
            type: "custom",
            hidden: cell.hideField,
          };

          if (cell.hasOwnProperty("autoOpen")) {
            data["autoOpen"] = cell.autoOpen;
          }

          if (cell.hasOwnProperty("autoCheck")) {
            data["autoCheck"] = cell.autoCheck;
          }
        } else {
          data = {
            cellValue: cell,
            width: grid.columns[index].fieldWidth,
            hidden: grid.columns[index].hideField,
          };

          if (grid.columns[index].isDataKeyField) {
            data["dataKeyName"] = grid.columns[index].fieldName;
          }
        }

        return data;
      }, []);
      const tr = grid.createTableRow({
        isBody: true,
        rowData: rowData,
      });

      // Events
      if (!grid.options.cancelSelectOnClick) {
        tr.addEventListener(
          "click",
          grid.on.selectedIndexChange.bind(grid, tr)
        );
        tr.select = grid.on.selectedIndexChange.bind(grid, tr);
      }

      // Todo: find where to insert for sort, for now add at the bottom
      grid.table.tBodies[0].appendChild(tr);

      // Add to rowData for custom data
      if (!fromInternal) {
        grid.rowData.push(cells);
        grid.options.rowData.push(cells);
      }

      // Events
      grid.on.rowCreated.call(grid, tr);

      return tr;
    },
    fetchColumns: function () {
      const grid = this;
      const params = {
        gridName: grid.options.gridName,
        dataKeyNames: grid.options.dataKeyNames,
        hiddenFields: grid.options.hiddenFields,
        width: grid.options.width,
        height: grid.options.height,
        pageSize: grid.options.pageSize,
        allowPaging: grid.options.allowPaging,
      };

      grid.service.getColumns.call(grid, params);
    },
    fetchRowData: function () {
      const grid = this;
      const params = {
        gridName: grid.options.gridName,
        additionalCriteria: grid.options.additionalCriteria,
        sortList: grid.sortList.join(),
        selectedPageIndex: grid.options.allowPaging
          ? grid.selectedPageIndex
          : -1,
        pageSize: grid.options.pageSize,
      };

      grid.service.getRowData.call(grid, params);
    },
    on: {
      // Note: creating order of parameter: parent -> child, e.g. grid, tbody, row, td, self/sender
      creating: function () {
        const grid = this;

        // Do default behavior first
        grid.showLoading();

        // Call user-defined event
        if (grid.events && typeof grid.events.creating === "function") {
          grid.events.creating.call(grid);
        }
      },
      created: function () {
        const grid = this;

        // Do default behavior first
        grid.initialization = false;
        grid.showTable().hideLoading();

        // Select first
        if (grid.rowData.length > 0) {
          if (!grid.options.cancelSelectOnClick) {
            grid.row.selectByIndex.call(grid, 0);
          }

          if (grid.options.allowPaging) {
            grid.updateTableBodyRows();
          }
        }

        // Toggle all
        if (grid.column.hasCustomField.call(grid, "toggle")) {
          const customField = grid.column.getCustomField.call(grid, "toggle");

          if (!customField.hideField && customField.autoOpen) {
            const imgToggleAll = grid.table.tHead.querySelector(
              "th img[type='toggle']"
            );

            imgToggleAll.src = grid.options.assetsURL.toggleCollapse;
            imgToggleAll.toggled = true;
          }
        }

        // Checkbox All
        if (grid.column.hasCustomField.call(grid, "checkbox")) {
          const customField = grid.column.getCustomField.call(grid, "checkbox");

          // Check based on autoCheck
          if (!customField.hideField && customField.autoCheck) {
            const checkboxAll = grid.table.tHead.querySelector(
              "th input[type='checkbox']"
            );

            checkboxAll.checked = false;
            checkboxAll.click();
          }
        }

        // Call user-defined event
        if (grid.events && typeof grid.events.created === "function") {
          grid.events.created.call(grid);
        }
      },
      columnCreated: function (sender) {
        const grid = this;

        // Do default behavior first

        // Call user-defined event
        if (grid.events && typeof grid.events.columnCreated === "function") {
          grid.events.columnCreated.call(grid, sender);
        }
      },
      rowCreated: function (sender) {
        const grid = this;

        // Do default behavior first
        // If custom data
        if (!grid.options.gridName) {
          // Update total records
          grid.totalRecords = grid.rowData.length;

          // Update header
          grid.hideCaption().showTableHead();

          // Update selected index
          if (!grid.options.cancelSelectOnClick) {
            sender.select();
          }

          if (grid.options.allowPaging) {
            if (!grid.initialization) {
              const pageIndex = Math.floor(
                (sender.rowIndex - 1) / grid.options.pageSize
              );
              grid.pager.selectByIndex.call(grid, pageIndex);

              grid.updateTableBodyRows();
            }
          }
        }

        // Toggle: create tr.toggle-row here
        if (grid.column.hasCustomField.call(grid, "toggle")) {
          const trToggle = document.createElement("tr");
          const tdToggle = document.createElement("td");
          const colSpan = grid.columns.filter(function (column) {
            return !column.hideField;
          }, []).length;

          tdToggle.classList.add("toggle-content");
          tdToggle.setAttribute("colSpan", colSpan);

          trToggle.classList.add("toggle-row");
          trToggle.dataset[grid.options.primaryKeyName] =
            sender.dataset[grid.options.primaryKeyName];
          trToggle.appendChild(tdToggle);

          grid.table.tBodies[0].appendChild(trToggle);

          // Events
          grid.on.rowToggleCreated.call(grid, sender, trToggle);
        }

        // Checkbox
        if (grid.column.hasCustomField.call(grid, "checkbox")) {
          const customField = grid.column.getCustomField.call(grid, "checkbox");
          const checkboxAll = grid.table.tHead.querySelector(
            "th input[type=checkbox]"
          );
          const checkbox = sender.querySelector("td input[type=checkbox]");
          const selectedKeys = grid.row.getSelectedKeys.call(grid);

          // Check based on selectedKeys
          if (
            selectedKeys.length &&
            selectedKeys.indexOf(sender.dataset[grid.options.primaryKeyName]) >
              -1
          ) {
            checkbox.click();
            // Check based if cbAll is checked
          } else if (!customField.hideField && checkboxAll.checked) {
            checkbox.click();
          }
        }

        // Call user-defined event
        if (grid.events && typeof grid.events.rowCreated === "function") {
          grid.events.rowCreated.call(grid, sender);
        }
      },
      rowToggleCreated: function (parentRow, sender) {
        const grid = this;
        const customField = grid.column.getCustomField.call(grid, "toggle");

        // Do default behavior first
        if (customField.autoOpen) {
          const imgToggle = parentRow.querySelector("td img[type='toggle']");

          imgToggle.click();
        }

        // Call user-defined event
        if (grid.events && typeof grid.events.rowToggleCreated === "function") {
          grid.events.rowToggleCreated.call(grid, parentRow, sender);
        }
      },
      checkAll: function (sender, event) {
        const grid = this;

        // Do default behavior first
        if (grid.options.allowPaging) {
          // Manually check each checkbox
          const isChecked = sender.checked;

          if (isChecked) {
            if (grid.options.gridName) {
              const params = {
                gridName: grid.options.gridName,
                additionalCriteria: grid.options.additionalCriteria,
                primaryKeyName: grid.options.primaryKeyName,
              };

              // Call user-defined event on success of fetch
              grid.service.getRowKeys.call(grid, params);
            } else {
              const checkboxes = Array.from(
                grid.table.tBodies[0].querySelectorAll(
                  "td input[type=checkbox]"
                )
              );

              checkboxes.forEach(function (checkbox) {
                grid.on.check.call(grid, checkbox.parent("tr"), sender, event);
              });

              // Todo: cleanup
              // Call user-defined event
              if (grid.events && typeof grid.events.checkAll === "function") {
                grid.events.checkAll.call(grid, sender, event);
              }
            }
          } else {
            sender.dataset["SELECTED_KEYS"] = [];

            const checkboxes = Array.from(
              grid.table.tBodies[0].querySelectorAll("td input[type=checkbox]")
            );

            // Update checked attribute only
            checkboxes.forEach(function (checkbox) {
              checkbox.checked = false;
            });

            // Todo: cleanup
            // Call user-defined event
            if (grid.events && typeof grid.events.checkAll === "function") {
              grid.events.checkAll.call(grid, sender, event);
            }
          }
        }
        // Invoke checkbox click event
        else {
          const checkboxes = Array.from(
            grid.table.tBodies[0].querySelectorAll("td input[type=checkbox]")
          );

          checkboxes.forEach(function (checkbox) {
            grid.on.check.call(grid, checkbox.parent("tr"), sender, event);
          });

          // Todo: cleanup
          // Call user-defined event
          if (grid.events && typeof grid.events.checkAll === "function") {
            grid.events.checkAll.call(grid, sender, event);
          }
        }
      },
      check: function (row, sender, event) {
        const grid = this;

        // Do default behavior first
        // Verify if sender is checkboxAll or checkbox
        const isSenderCheckboxAll =
          sender.className.indexOf("checkbox-all") > -1;
        const checkboxAll = isSenderCheckboxAll
          ? sender
          : grid.table.tHead.querySelector("th input[type=checkbox]");
        const checkbox = isSenderCheckboxAll
          ? row.querySelector("td input[type=checkbox]")
          : sender;
        const selectedKeys = grid.row.getSelectedKeys.call(grid);
        const selectedKey = row.dataset[grid.options.primaryKeyName];

        if (isSenderCheckboxAll) {
          const isChecked = checkboxAll.checked;

          // Check/uncheck checkbox
          checkbox.checked = isChecked;
        } else {
          // Uncheck checkbox header
          if (!checkbox.checked) {
            checkboxAll.checked = false;
          }
          // Check checkbox header
          else if (!grid.options.allowPaging) {
            const checkboxes = Array.from(
              grid.table.tBodies[0].querySelectorAll("td input[type=checkbox]")
            );

            if (checkboxes.length === grid.rowData.length) {
              let hasUnchecked = false;

              checkboxes.forEach(function (checkbox) {
                if (!checkbox.checked) {
                  hasUnchecked = true;
                  return false;
                }
              });

              checkboxAll.checked = !hasUnchecked;
            }
          }
        }

        // Update selected keys
        if (!checkbox.checked) {
          // Remove from selectedKeys
          const indexSelectedKey = selectedKeys.indexOf(selectedKey);
          selectedKeys.splice(indexSelectedKey, 1);
        } else {
          // Add to selectedKeys
          if (selectedKeys.indexOf(selectedKey) === -1) {
            selectedKeys.push(selectedKey);
          }
        }

        checkboxAll.dataset["SELECTED_KEYS"] = selectedKeys;

        if (!isSenderCheckboxAll && grid.options.allowPaging) {
          checkboxAll.checked = grid.totalRecords === selectedKeys.length;
        }

        // Call user-defined event
        if (grid.events && typeof grid.events.check === "function") {
          grid.events.check.call(grid, checkboxAll, row, checkbox, event);
        }

        event.stopPropagation();
      },
      toggleAll: function (sender, event) {
        const grid = this;

        // Do default behavior first
        const imgToggles = Array.from(
          grid.table.tBodies[0].querySelectorAll("td img[type='toggle']")
        );

        sender.toggled = !sender.toggled;

        if (sender.toggled) {
          sender.src = grid.options.assetsURL.toggleCollapse;
        } else {
          sender.src = grid.options.assetsURL.toggleExpand;
        }

        imgToggles.forEach(function (imgToggle, index) {
          imgToggles.toggled = !imgToggles.toggled;
          imgToggle.click();
        });

        // Call user-defined event
        if (grid.events && typeof grid.events.toggleAll === "function") {
          grid.events.toggleAll.call(grid, sender, event);
        }

        event.stopPropagation();
      },
      toggle: function (row, sender, event) {
        const grid = this;

        // Do default behavior first
        sender.toggled = !sender.toggled;

        let tr = null;

        if (
          row.nextSibling &&
          row.nextSibling.classList.contains("toggle-row")
        ) {
          tr = row.nextSibling;
        }

        if (sender.toggled) {
          sender.src = grid.options.assetsURL.toggleCollapse;
          tr.classList.remove("hidden");
          sender.parentNode.parentNode.rowSpan = 2;
        } else {
          sender.src = grid.options.assetsURL.toggleExpand;
          tr.classList.add("hidden");
          sender.parentNode.parentNode.toggleAttribute("rowspan");
        }

        // Call user-defined event
        if (grid.events && typeof grid.events.toggle === "function") {
          grid.events.toggle.call(grid, row, tr, sender, event);
        }

        event.stopPropagation();
      },
      selectedIndexChange: function (sender, event) {
        const grid = this;

        // Before row select
        grid.on.selectedIndexChanging.call(grid, sender, event);

        // Update selected index
        grid.selectedIndex = sender.rowIndex - 1; // rowIndex is non-zero based index

        // Update selected row highlight
        const row = grid.table.tBodies[0].querySelector("tr.selected");

        if (row) {
          row.classList.remove("selected");
        }

        sender.classList.add("selected");

        // After row select
        grid.on.selectedIndexChanged.call(grid, sender, event);
      },
      selectedIndexChanging: function (sender, event) {
        const grid = this;

        // Do default behavior first

        // Call user-defined event
        if (
          grid.events &&
          typeof grid.events.selectedIndexChanging === "function"
        ) {
          grid.events.selectedIndexChanging.call(grid, sender, event);
        }
      },
      selectedIndexChanged: function (sender, event) {
        const grid = this;

        // Do default behavior first

        // Call user-defined event
        if (
          grid.events &&
          typeof grid.events.selectedIndexChanged === "function"
        ) {
          grid.events.selectedIndexChanged.call(grid, sender, event);
        }
      },
      pageIndexChange: function (sender, event) {
        const grid = this;

        if (sender.getAttribute("disabled")) {
          return false;
        }

        // Before paging
        grid.on.pageIndexChanging.call(grid, sender, event);

        // Update selected page index
        const selectedPagerValue = sender.value;
        let selectedPageIndex =
          typeof selectedPagerValue === "number"
            ? Number(selectedPagerValue)
            : grid.selectedPageIndex;
        const pageGroup =
          Math.floor(selectedPageIndex / grid.options.pagerCount) + 1;

        if (selectedPagerValue === "previous") {
          selectedPageIndex = (pageGroup - 2) * grid.options.pagerCount;
        } else if (selectedPagerValue === "next") {
          selectedPageIndex = pageGroup * grid.options.pagerCount;
        } else {
          selectedPageIndex = Number(selectedPagerValue);
        }

        grid.selectedPageIndex = selectedPageIndex;
        //sender.pageIndex = grid.selectedPageIndex; // not used

        // Upadate selected pager
        const selectedPager = grid.table.tFoot.querySelector("th a.selected");

        if (selectedPager) {
          selectedPager.classList.remove("selected");
          selectedPager.removeAttribute("disabled");
        }

        sender.classList.add("selected");
        sender.setAttribute("disabled", true);

        // Update rows
        if (grid.options.gridName) {
          if (!grid.options.cancelSelectOnClick) {
            grid.selectedIndex = 0; // always return to first
          }

          grid.fetchRowData();
        } else {
          if (!grid.options.cancelSelectOnClick) {
            let selectedIndex = 0;

            if (grid.selectedPageIndex > 0) {
              selectedIndex = grid.selectedPageIndex * grid.options.pageSize;
            }

            grid.row.selectByIndex.call(grid, selectedIndex);
          }

          // Show/hide rows
          grid.updateTableBodyRows().removeTableFoot().createTableFoot();
        }

        // After paging
        grid.on.pageIndexChanged.call(grid, sender, event);
      },
      pageIndexChanging: function (sender, event) {
        const grid = this;

        // Do default behavior first

        // Call user-defined event
        if (
          grid.events &&
          typeof grid.events.pageIndexChanging === "function"
        ) {
          grid.events.pageIndexChanging.call(grid, sender, event);
        }
      },
      pageIndexChanged: function (sender, event) {
        const grid = this;

        // Do default behavior first

        // Call user-defined event
        if (grid.events && typeof grid.events.pageIndexChanged === "function") {
          grid.events.pageIndexChanged.call(grid, sender, event);
        }
      },
      sort: function (sender, imgSort, event) {
        const grid = this;

        // Before sort
        grid.on.sorting.call(grid, sender, event);

        // Sort list and direction
        const sortName = sender.sortName;
        let sortDirection = sender.sortDirection;
        let sortClause = null;

        if (sortDirection === "") {
          // Update sort list
          sortDirection = "ASC";
          sortClause = sortName + " " + sortDirection;
          grid.sortList.push(sortClause);

          // Update sort image
          imgSort.classList.remove("hidden");
          imgSort.src = grid.options.assetsURL.sortAsc;
          imgSort.alt = "";
        } else if (sortDirection === "ASC") {
          // Update sort list
          let index = grid.sortList.indexOf(sortName + " " + sortDirection);

          sortDirection = "DESC";
          sortClause = sortName + " " + sortDirection;
          grid.sortList.splice(index, 1, sortClause);

          // Update sort image
          imgSort.classList.remove("hidden");
          imgSort.src = grid.options.assetsURL.sortDesc;
          imgSort.alt = "";
        } else if (sortDirection === "DESC") {
          // Update sort list
          let index = grid.sortList.indexOf(sortName + " " + sortDirection);

          sortDirection = "";
          grid.sortList.splice(index, 1);

          // Update sort image
          imgSort.classList.add("hidden");
          imgSort.src = "#";
          imgSort.alt = "";
        }

        // Update sort direction
        sender.sortDirection = sortDirection;

        // Update sort order text
        grid.column.updateSortOrderText.call(grid);

        // Update table
        if (grid.options.gridName) {
          grid.fetchRowData();
        } else {
          const sorted = grid.column.sort.call(
            grid,
            Array.from(grid.sortList),
            Array.from(grid.options.rowData)
          ); // use grid.options.rowData

          grid.rowData = sorted;
          grid.removeTableBody().createTableBody(); // todo: need a cleaner way to update body

          if (!grid.options.cancelSelectOnClick) {
            grid.row.selectByIndex.call(grid, 0);
          }

          if (grid.options.allowPaging) {
            grid.pager.selectByIndex.call(grid, 0);
            grid.updateTableBodyRows();
          }
        }

        // After sort
        grid.on.sorted.call(grid, sender, event);
      },
      sorting: function (sender, event) {
        const grid = this;

        // Do default behavior first

        // Call user-defined event
        if (grid.events && typeof grid.events.sorting === "function") {
          grid.events.sorting.call(grid, sender, event);
        }
      },
      sorted: function (sender, event) {
        const grid = this;

        // Do default behavior first

        // Call user-defined event
        if (grid.events && typeof grid.events.sorted === "function") {
          grid.events.sorted.call(grid, sender, event);
        }
      },
    },
    utility: {
      getServiceURL: function () {
        /// <summary>Gets the constructed web service URL.</summary>
        /// <returns type="Object">Returns an object containing the URL.</returns>

        const grid = this;
        const index = window.location.href.lastIndexOf("/"); // remove current page
        const root = window.location.href.substring(0, index);

        return {
          columns: root + grid.options.serviceURL.columns,
          rowData: root + grid.options.serviceURL.rowData,
          rowKeys: root + grid.options.serviceURL.rowKeys,
        };
      },
    },
    service: {
      getColumns: function (params) {
        /// <summary>Fetches the row columns from the web service.</summary>

        const grid = this;

        if (!grid.options.serviceURL.columns) {
          return;
        }

        // Todo: Use fetch, async/await instead
        $.ajax({
          url: grid.utility.getServiceURL.call(grid).columns,
          data: params,
          method: "POST",
          success: function (data) {
            const response = JSON.parse(data);

            if (response.success) {
              // Set option
              grid.options.description = response.option.description;
              grid.options.panelName = response.option.panelName;
              grid.options.width = response.option.gridWidth;
              grid.options.height = response.option.gridHeight;
              grid.options.pageSize = response.option.recordsPerPage;
              grid.options.allowPaging = !response.option.usesScrollbar;

              // Set columns
              grid.columns = grid.options.columns.concat(response.result);

              // Create table head
              grid.removeTableHead().createTableHead().setWrapper();

              // Fetch row data
              grid.fetchRowData();
            } else {
              // Create table caption "Something went wrong."
              grid.showCaption("Something went wrong.");
            }
          },
          error: function (error) {
            // Create table caption "Something went wrong."
            grid.showCaption("Something went wrong.");

            console.error(error);
          },
        });
      },
      getRowData: function (params) {
        /// <summary>Fetches the row data from the web service.</summary>

        const grid = this;

        if (!grid.options.serviceURL.rowData) {
          return;
        }

        // Todo: Use fetch, async/await instead
        $.ajax({
          url: grid.utility.getServiceURL.call(grid).rowData,
          data: params,
          method: "POST",
          success: function (data) {
            const response = JSON.parse(data);

            if (response.success) {
              grid.rowData = response.result;
              grid.totalRecords = response.total;

              if (grid.totalRecords === 0) {
                // Create table caption "No records found."
                grid.showCaption();
              } else {
                // Create table body and foot (pager)
                grid.removeTableBody().createTableBody();

                if (grid.options.allowPaging) {
                  grid.removeTableFoot().createTableFoot();
                }
              }
            } else {
              grid.showCaption("Something went wrong.");
            }

            if (grid.initialization) {
              grid.success = response.success;
              // Call this once, since no support yet for async/await.
              // Todo: Use async/await instead
              grid.on.created.call(grid);
            }
          },
          error: function (error) {
            // Create table caption "Something went wrong."
            grid.showCaption("Something went wrong.");

            console.error(error);
          },
        });
      },
      getRowKeys: function (params) {
        /// <summary>Fetches the row keys from the web service. Used this to get all keys if allowPaging is true.</summary>

        const grid = this;

        if (!grid.options.serviceURL.rowKeys) {
          return;
        }

        // Todo: Use fetch, async/await instead
        $.ajax({
          url: grid.utility.getServiceURL.call(grid).rowKeys,
          data: params,
          method: "POST",
          success: function (data) {
            const response = JSON.parse(data);

            if (response.success) {
              const checkboxAll = grid.table.tHead.querySelector(
                "th input[type=checkbox]"
              );
              const checkboxes = Array.from(
                grid.table.tBodies[0].querySelectorAll(
                  "td input[type=checkbox]"
                )
              );
              const selectedKeys = response.result;

              // Update checked attribute only
              checkboxes.forEach(function (checkbox) {
                checkbox.checked = true;
              });

              // Update selectedKeys
              checkboxAll.dataset["SELECTED_KEYS"] = selectedKeys;

              // Todo: cleanup
              // Call user-defined event
              if (grid.events && typeof grid.events.checkAll === "function") {
                grid.events.checkAll.call(grid, checkboxAll, null);
              }
            }
          },
          error: function (error) {
            console.error(error);
          },
        });
      },
    },
    row: {
      getData: function () {
        /// <summary>Gets the dataset `DATA`.</summary>
        /// <returns type="Object">Returns the dataset `DATA` in JSON format.</returns>

        const grid = this;
        const tr = grid.table.tHead.rows[0];
        const data = tr.dataset["DATA"] ? JSON.parse(tr.dataset["DATA"]) : [];

        return data;
      },
      getSelectedKeys: function () {
        /// <summary>Gets the selected dataset `SELECTED_KEYS`.</summary>
        /// <returns type="Array">Returns the dataset `SELECTED_KEYS` in JSON format.</returns>

        const grid = this;
        const checkboxAll = grid.table.tHead.querySelector(
          "th input[type=checkbox]"
        );
        const selectedKeys = checkboxAll.dataset["SELECTED_KEYS"]
          ? checkboxAll.dataset["SELECTED_KEYS"].split(",")
          : [];

        return selectedKeys;
      },
      getAllKeys: function () {
        /// <summary>Gets all the dataset `SELECTED_KEYS`.</summary>
        /// <returns type="Array">Returns the dataset `SELECTED_KEYS` in JSON format.</returns>

        const grid = this;
        if (grid.options.gridName) {
          return []; // call grid.service.getRowKeys
        } else {
          const rows = Array.from(grid.table.tBodies[0].rows);

          return rows.reduce(function (rowKeys, row) {
            rowKeys.push(row.dataset[grid.options.primaryKeyName]);

            return rowKeys;
          }, []);
        }
      },
      hasSelectedKeys: function () {
        /// <summary>Checks if there's a selected key based on dataset `SELECTED_KEYS`.</summary>
        /// <returns type="Boolean">Returns `true` if there's a selected key.</returns>

        const grid = this;
        const checkboxAll = grid.table.tHead.querySelector(
          "th input[type=checkbox]"
        );
        const selectedKeys = checkboxAll.dataset["SELECTED_KEYS"]
          ? checkboxAll.dataset["SELECTED_KEYS"].split(",")
          : [];

        return selectedKeys.length > 0;
      },
      getNodes: function () {
        const grid = this;
        const rows = grid.table.tBodies[0].querySelectorAll("tr");

        return rows;
      },
      select: function (row) {
        const grid = this;

        row.click();

        return grid;
      },
      selectByKey: function (key) {
        const grid = this;
        const rows = grid.row.getNodes.call(grid);

        rows.forEach(function (row) {
          const rowKey = row.dataset[grid.options.primaryKeyName];

          if (key === rowKey) {
            row.click();
            return false;
          }
        });

        return grid;
      },
      selectByIndex: function (index) {
        const grid = this;
        const rows = grid.row.getNodes.call(grid);

        rows[index].select();

        return grid;
      },
      parseValue: function (value, type) {
        /// <summary>Formats the data type. Note: parsing is done in web service row data.</summary>
        /// <returns type="Object">Returns the parsed data.</returns>

        let newValue = null;

        if (type === "date") {
          newValue =
            value !== "" ? new Date(value).toLocaleDateString() : value;
        } else if (type === "number") {
          newValue = Number(value);
        } else {
          newValue = value;
        }

        return newValue;
      },
    },
    column: {
      getFieldByName: function (fieldName) {
        const grid = this;
        return grid.columns
          .filter(function (column) {
            return !column.hasOwnProperty("type");
          })
          .find(function (column) {
            return column.fieldName === fieldName;
          });
      },
      getFieldByIndex: function (fieldIndex) {
        const grid = this;
        return grid.columns
          .filter(function (column) {
            return !column.hasOwnProperty("type");
          })
          .find(function (column, index) {
            return index === fieldIndex;
          });
      },
      hasCustomField: function (name) {
        /// <summary>Checks the custom field name object property.</summary>
        /// <returns type="Object">Returns true if custom field exists.</returns>

        const grid = this;
        const customFields = grid.columns.filter(function (column) {
          return column.hasOwnProperty("type");
        }, []);
        let hasCustomField = false;

        for (let i = 0; i < customFields.length; i++) {
          if (customFields[i].type == name) {
            hasCustomField = true;
            break;
          }
        }

        return hasCustomField;
      },
      getCustomFields: function () {
        /// <summary>Gets the custom field name object property.</summary>
        /// <returns type="Object">Returns the custom field.</returns>

        const grid = this;
        const customFields = grid.columns.filter(function (column) {
          return column.hasOwnProperty("type");
        });

        return customFields;
      },
      getCustomField: function (name) {
        /// <summary>Gets the custom field name object property.</summary>
        /// <returns type="Object">Returns the custom field.</returns>

        const grid = this;
        const customFields = grid.column.getCustomFields.call(grid);
        let customField = null;

        for (let i = 0; i < customFields.length; i++) {
          if (customFields[i].type == name) {
            customField = customFields[i];
            break;
          }
        }

        return customField;
      },
      getIndex: function (fieldName) {
        const grid = this;

        return grid.columns
          .filter(function (column) {
            return !column.hasOwnProperty("type");
          })
          .findIndex(function (column) {
            return fieldName === column.fieldName;
          });
      },
      sort: function (sortList, rowData) {
        const grid = this;
        const sorted = rowData;

        sortList.reverse().map(function (sort) {
          const fieldName = sort.split(" ")[0];
          const direction = sort.split(" ")[1];
          const index = grid.column.getIndex.call(grid, fieldName);
          const fieldType = grid.column.getFieldByIndex.call(grid, index)
            .fieldType;

          if (direction === "ASC") {
            sorted.sort(function (a, b) {
              if (fieldType === "string") {
                return a[index].localeCompare(b[index]);
              } else if (fieldType === "number") {
                return Number(a[index]) - Number(b[index]);
              } else if (fieldType === "date") {
                return new Date(a[index]) - new Date(b[index]);
              }
            });
          } else if (direction === "DESC") {
            sorted.sort(function (a, b) {
              if (fieldType === "string") {
                return b[index].localeCompare(a[index]);
              } else if (fieldType === "number") {
                return Number(b[index]) - Number(a[index]);
              } else if (fieldType === "date") {
                return new Date(b[index]) - new Date(a[index]);
              }
            });
          }
        });

        return sorted;
      },
      updateSortOrderText: function () {
        const grid = this;
        const columns = Array.from(grid.table.tHead.querySelectorAll("th a"));

        columns.map(function (column) {
          const spanOrder = column.parent("th").querySelector("span");
          const sortName = column.sortName;
          const sortIndex = grid.sortList.findIndex(function (clause) {
            const clauseName = clause.split(" ")[0];

            return clauseName === sortName;
          });

          if (sortIndex > -1) {
            spanOrder.classList.remove("hidden");
            spanOrder.textContent = sortIndex + 1;
          } else {
            spanOrder.classList.add("hidden");
            spanOrder.textContent = "";
          }
        });
      },
    },
    pager: {
      selectByIndex: function (index) {
        const grid = this;
        const pagers = grid.table.tFoot.querySelectorAll("th a");

        grid.selectedPageIndex = index;
        grid.removeTableFoot().createTableFoot();

        return grid;
      },
    },
  };

  // Private Methods
  function extendDefaults(source, properties) {
    /// <summary>Merges the object properties.</summary>
    /// <returns type="Boolean">Returns the object properties.</returns>

    for (let property in properties) {
      if (properties.hasOwnProperty(property) && property != "events") {
        // exclude events
        source[property] = properties[property];
      }
    }

    return source;
  }
})();
