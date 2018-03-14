/*
 ** DA Friends Calculator - camp.js
 */
var guiTabs = (function(self) {
    /*
     ** Define this Menu Item details
     */
    self.tabs.Calculators.menu.camp = {
        title: 'Camp',
        image: 'camp.png',
        html: true,
        onInit: onInit,
        onUpdate: onUpdate,
        onAction: onAction
    };

    var reg_min, reg_max, cap_min, cap_max;

    /*
     ** @Private - Initialise the tab
     */
    function onInit(tid, cel) {
        ['camp_self', 'camp_neighbor'].forEach(id => {
            var div = document.getElementById(id);
            div.addEventListener('render', function(event) {
                updateCamp(event.target);
            });
            markToBeRendered(div);
        })
    }

    const ONE_HOUR = 60 * 60,
        ONE_DAY = ONE_HOUR * 24,
        WINDMILL_EXPIRY_TIME = 7 * ONE_DAY;

    /*
     ** @Private - Sync Action
     */
    function onAction(id, action, data) {
        //console.log(id, "onAction", action, data);
        if (action == 'visit_camp') markToBeRendered(document.getElementById('camp_neighbor'));
    }

    function markToBeRendered(div) {
        div.setAttribute('lazy-render', '');
        lazyObserver.observe(div);
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {}

    function updateCamp(div, camp, uid, pal) {
        var info, camp, uid, pal, isPublic;

        if (div.id == 'camp_neighbor') {
            info = bgp.lastVisitedCamp;
            camp = info && info.camp;
            uid = info && info.neigh_id;
            pal = uid ? bgp.daGame.getNeighbour(uid) : null;
            isPublic = false;
        } else {
            info = bgp.daGame.daUser;
            camp = info.camp;
            pal = info.player;
            uid = pal.uid;
            ['region', 'windmill_limit', 'windmill_reg', 'stamina_reg', 'max_stamina'].forEach(key => camp[key] = info[key]);
            isPublic = true;
        }

        function getFirstByClassName(className) {
            return div.getElementsByClassName(className)[0];
        }

        getFirstByClassName('camp_rid').setAttribute('src', (camp ? '/img/regions/' + camp.region : '/img/camp') + '.png');
        getFirstByClassName('camp_name').textContent = (camp ? guiString('camp_player_name', [pal ? pal.name : '#' + uid]) : guiString('camp_no_player'));
        getFirstByClassName('camp_container').innerHTML = camp ? showCamp(camp, isPublic) : '';

        var table = getFirstByClassName('camp_tables'),
            tbody, row;
        table.innerHTML = '';

        if (camp) {
            row = table.insertRow();

            // table 1
            table = row.insertCell().appendChild(document.createElement('table'));
            tbody = table.appendChild(document.createElement('tbody'));
            addRowTextValue(tbody, guiString('camp_player_region'), self.regionName(camp.region));
            addRowTextValue(tbody, guiString('camp_player_level'), parseInt(pal.level));

            if (isPublic) {
                tbody = table.appendChild(document.createElement('tbody'));
                addRowTextValue(tbody, guiString('camp_regen_tot'), parseInt(camp.stamina_reg));
                addRowTextValue(tbody, guiString('camp_capacity_tot'), parseInt(camp.max_stamina));

                var fillTime = Math.ceil(parseInt(camp.max_stamina) / parseInt(camp.stamina_reg) * 3600);
                var time = [];
                time.unshift(String(fillTime % 60).padStart(2, '0'));
                fillTime = Math.floor(fillTime / 60);
                time.unshift(String(fillTime % 60).padStart(2, '0'));
                time.unshift(Math.floor(fillTime / 60));
                addRowTextValue(tbody, guiString('camp_fill_time'), time.join(':'), 'right');

                // table 2
                table = row.insertCell().appendChild(document.createElement('table'));
                tbody = table.appendChild(document.createElement('tbody'));
                addRowTextValue(tbody, guiString('camp_regen_min'), reg_min);
                addRowTextValue(tbody, guiString('camp_regen_max'), reg_max);
                addRowTextValue(tbody, guiString('camp_capacity_min'), cap_min);
                addRowTextValue(tbody, guiString('camp_capacity_max'), cap_max);
            }

            // table 3
            table = row.insertCell().appendChild(document.createElement('table'));
            tbody = table.appendChild(document.createElement('tbody'));

            var wind_count = 0,
                wind_expiry = Infinity;
            if (camp.windmills) {
                (Array.isArray(camp.windmills) ? camp.windmills : [camp.windmills]).forEach(windmill => {
                    var st = parseInt(windmill.activated),
                        et = st + WINDMILL_EXPIRY_TIME;
                    wind_count++;
                    wind_expiry = Math.min(et, wind_expiry);
                });
            }

            //addRowTextValue(tbody, guiString('camp_windmill_max'), parseInt(camp.windmill_limit));
            addRowTextValue(tbody, guiString('camp_windmill_num'), wind_count + ' / ' + parseInt(camp.windmill_limit), 'right');
            if (isPublic) {
                addRowTextValue(tbody, guiString('camp_windmill_regen'), parseInt(camp.windmill_reg));
            }

            if (wind_count) {
                tbody = table.appendChild(document.createElement('tbody'));
                addRowTextValue(tbody, guiString('camp_windmill_expiry', [unixDate(wind_expiry, 'full')]));
            }
        }

        return true;
    }

    function addRowTextValue(tbody, text, value, align) {
        var row = tbody.insertRow(),
            cell = row.insertCell();
        cell.innerHTML = Dialog.escapeHtmlBr(text);
        cell.style.textAlign = 'left';
        if (value === undefined) {
            cell.colSpan = 2;
            cell.style.textAlign = align || 'center';
        } else {
            cell = row.insertCell();
            cell.innerText = typeof value == 'number' ? numberWithCommas(value, 0) : value;
            cell.style.textAlign = align || (typeof value == 'number' ? 'right' : 'left');
        }
    }

    function showCamp(camp, isPublic) {
        const NUM_SLOTS = 24;
        var lines_ids = camp.lines_ids.split(','),
            lines_blocked = camp.lines_blocked.split(','),
            buildings = bgp.daGame.daBuildings,
            html = [];
        reg_min = reg_max = cap_min = cap_max = 0;
        html.push('<div class="camp">');
        [1, 2, 3, 5, 7, 9].forEach((lid, index) => {
            line_height = Math.floor(index / 2) + 2;
            var slots = [],
                emptySlot = {
                    kind: 'empty',
                    title: 'Empty slot',
                    width: 1,
                    height: line_height
                },
                blocked, i;
            i = lines_ids.indexOf(String(lid));
            blocked = i >= 0 ? parseInt(lines_blocked[i]) || 0 : NUM_SLOTS;
            for (i = 0; i < NUM_SLOTS; i++) slots[i] = emptySlot;
            if (blocked > 0) slots[index % 2 ? NUM_SLOTS - blocked : 0] = {
                kind: 'block',
                title: 'Blocked space',
                width: blocked,
                height: line_height
            };
            var blds = camp.buildings;
            blds = blds ? (Array.isArray(blds) ? blds : [blds]) : [];
            blds.forEach(building => {
                if (parseInt(building.line_id) == lid) {
                    var bid = parseInt(building.def_id),
                        slot = parseInt(building.slot),
                        building = buildings[bid];
                    if (building) {
                        slots[slot] = {
                            kind: 'building',
                            bid: bid,
                            capacity: parseInt(building.cap) || 0,
                            regen: parseInt(building.reg) || 0,
                            width: parseInt(building.wid) || 1,
                            height: parseInt(building.hei) || 1,
                            rid: parseInt(building.rid) || 0,
                            title: bgp.daGame.string(building.nid)
                        }
                    }
                }
            });

            html.push('<div class="line" style="--lw:24;--lh:', line_height, '">');
            for (i = 0; i < NUM_SLOTS;) {
                var slot = slots[i],
                    title = slot.title,
                    width = slot.width,
                    kind = slot.kind,
                    colValues = '';
                while (kind == 'empty' && i + width < NUM_SLOTS && slots[i + width].kind == kind) width++;
                if (width > 1 && (kind == 'empty' || kind == 'block')) title += ' x ' + width;
                if (kind == 'building') {
                    title += ' (' + width + 'x' + slot.height + ')';
                    //title += '\nBID: ' + slot.bid;
                    var colValue = Math.floor((slot.regen || slot.capacity) / width);
                    if (slot.capacity > 0) {
                        if (isPublic) title += '\n' + guiString('camp_slot_capacity', [slot.capacity]);
                        kind += ' capacity';
                        if (cap_min == 0 || colValue < cap_min) cap_min = colValue;
                        if (cap_max == 0 || colValue > cap_max) cap_max = colValue;
                    }
                    if (slot.regen > 0) {
                        if (isPublic) title += '\n' + guiString('camp_slot_regen', [slot.regen]);
                        kind += ' regen';
                        if (reg_min == 0 || colValue < reg_min) reg_min = colValue;
                        if (reg_max == 0 || colValue > reg_max) reg_max = colValue;
                    }
                    if (slot.rid > 0) {
                        title += '\n' + guiString('camp_slot_region', [self.regionName(slot.rid)]);
                        kind += ' reg' + slot.rid;
                    }
                    colValues = isPublic ? ('<div class="value">' + colValue + '</div>').repeat(width) : '';
                }
                html.push('<div class="item ', kind, '" style="--w:', width, ';--h:', slot.height, '" title="', Dialog.escapeHtml(title) + '">', colValues, '</div>');
                i += width;
            }
            html.push('</div>');
        });
        html.push('</div>');
        return html.join('');
    }

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/