/*
  SortTable DAF
*/

var sorttable = (function() {
    var escapeRE = function(s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        },
        locale = chrome.i18n.getUILanguage(),
        locale5RE = new RegExp(escapeRE((5).toLocaleString(locale).trim()), 'g'),
        localeDecimalRE = new RegExp(escapeRE((5.5).toLocaleString(locale).replace(locale5RE, '')), 'g'),
        localeThousandsRE = new RegExp(escapeRE((555555).toLocaleString(locale).replace(locale5RE, '')), 'g');
    var SortTable = {
        makeSortable: function(table) {
            if (table.getElementsByTagName('thead').length == 0) {
                // table doesn't have a tHead. Since it should have, create one and
                // put the first table row in it.
                var thead = document.createElement('thead');
                thead.appendChild(table.rows[0]);
                table.insertBefore(thead, table.firstChild);
            }
            if (table.tHead.rows.length != 1) return; // can't cope with two header rows
            SortTable.setSortHeader(table);
            Array.from(table.tHead.rows[0].cells).forEach(cell => {
                if (!cell.classList.contains('sorttable_nosort'))
                    cell.addEventListener('click', SortTable.clickHandler);
            });
        },
        setSortHeader: function(table, cellIndex, flagAscending) {
            // use cellIndex = -1 to remove style
            if (table.tHead.rows.length != 1) return; // can't cope with two header rows
            Array.from(table.tHead.rows[0].cells).forEach(cell => {
                var flagSort = !cell.classList.contains('sorttable_nosort');
                cell.classList.toggle('DAF-sort-ascending', cell.cellIndex === cellIndex && flagAscending);
                cell.classList.toggle('DAF-sort-descending', cell.cellIndex === cellIndex && !flagAscending);
                cell.classList.toggle('DAF-sort', flagSort && (cellIndex || 0) >= 0);
            });
        },
        clickHandler: function() {
            var cell = this;
            var table = cell.parentElement.parentElement.parentElement;
            if (table.classList.contains('sorttable_event')) {
                SortTable.setSortHeader(table, cell.cellIndex, !cell.classList.contains('DAF-sort-ascending'));
                table.dispatchEvent(new Event('sort'));
                return;
            }
            SortTable.sortTable(cell, !cell.classList.contains('DAF-sort-ascending'));
        },
        getSortInfo: function(table) {
            var cell = Array.from(table.tHead.rows[0].cells).find(cell => cell.classList.contains('DAF-sort-ascending') || cell.classList.contains('DAF-sort-descending'));
            var convert = SortTable.convert_alpha,
                sort = null;
            if (cell) {
                cell.classList.forEach(name => {
                    var suffix, i;
                    if (name.startsWith('sorttable_') && typeof SortTable['convert_' + (suffix = name.substr(10))] == 'function') {
                        convert = SortTable['convert_' + suffix];
                        sort = SortTable['sort_' + suffix];
                        if (!sort && (i = suffix.indexOf('_')) > 0) sort = SortTable['sort_' + suffix.substr(0, i)];
                    }
                });
            }
            sort = sort || SortTable.sort_alpha;
            return {
                cell: cell,
                cellIndex: cell ? cell.cellIndex : -1,
                convertFn: convert,
                sortFn: sort,
                ascending: cell ? !cell.classList.contains('DAF-sort-descending') : false
            };
        },
        applySort: function(table) {
            var info = SortTable.getSortInfo(table);
            if (info && info.cell) SortTable.sortTable(info.cell, info.ascending);
        },
        sortTable: function(cell, flagAscending = true) {
            var row = cell.parentElement,
                table = row.parentElement.parentElement,
                tbody = table.tBodies[0],
                sortCellIndex = cell.cellIndex,
                info = SortTable.getSortInfo(table),
                fixDescending = info.cellIndex != cell.cellIndex || info.ascending ? 1 : -1;
            if (cell.classList.contains('sorttable_nosort')) return;
            SortTable.setSortHeader(table, cell.cellIndex, flagAscending);
            info = SortTable.getSortInfo(table);
            var rows = Array.from(tbody.rows),
                convert = info.convertFn,
                sort = info.sortFn,
                arr;
            if (table.classList.contains('sorttable_rowspan')) {
                arr = [];
                for (var i = sortCellIndex - 1; i >= 0; i--) sortCellIndex += row.cells[i].colSpan - 1;
                for (var rowIndex = 0, numRows = rows.length; rowIndex < numRows;) {
                    var rowData = rows[rowIndex],
                        value = '',
                        rowSpan = 1,
                        cellIndex = 0;
                    Array.from(rowData.cells).forEach(cellData => {
                        if (cellData.rowSpan > rowSpan) rowSpan = cellData.rowSpan;
                        if (cellIndex == sortCellIndex) value = SortTable.getInnerText(cellData);
                        cellIndex += cellData.colSpan;
                    });
                    arr.push([convert(value), rows.slice(rowIndex, rowIndex + rowSpan), fixDescending * rowIndex]);
                    rowIndex += rowSpan;
                }
            } else {
                arr = rows.map(row => [convert(SortTable.getInnerText(row.cells[sortCellIndex])), row, fixDescending * row.rowIndex]);
            }
            arr.sort((a, b) => sort(a[0], b[0]) || (a[2] - b[2]));
            if (!flagAscending) arr.reverse();
            arr.forEach(a => {
                if (a[1] instanceof Array) a[1].forEach(el => tbody.appendChild(el));
                else tbody.appendChild(a[1]);
            });
        },
        convert_alpha: (value) => value.toLowerCase(),
        sort_alpha: (a, b) => a.localeCompare(b),
        convert_alpha_case: (value) => value,
        convert_numeric: (value) => parseFloat(value) || 0,
        sort_numeric: (a, b) => a - b,
        convert_numeric_locale: (value) => {
            value = value.replace(localeThousandsRE, '').replace(localeDecimalRE, '.');
            return parseFloat(value) || 0;
        },
        getInnerText: function(node) {
            // gets the text we want to use for sorting for a cell.
            // strips leading and trailing whitespace.
            // it also gets .value for <input> fields.
            if (!node) return '';
            if (node.hasAttribute("sorttable_customkey"))
                return node.getAttribute("sorttable_customkey");
            return getText(node);

            function getText(node) {
                if (node.getElementsByTagName('input').length == 0)
                    return node.innerText.trim();
                var text = [];
                for (var node = node.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType == 1) {
                        var value;
                        if (node.nodeName == 'INPUT') {
                            value = node.value;
                            if ((node.type == 'checkbox' || node.type == 'radio') && !node.checked) value = '';
                            if (typeof value != 'string') {
                                value = value === null || value === undefined ? '' : String(value);
                            }
                            value = value.trim();
                        } else {
                            value = getText(node);
                        }
                        text.push(value);
                    } else if (node.nodeType == 3) {
                        text.push(node.nodeValue.trim());
                    }
                }
                return text.join(' ');
            }
        }
    };
    return SortTable;
})();