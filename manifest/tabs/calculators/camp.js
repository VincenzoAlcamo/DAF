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

    var reg_tot, reg_min, reg_max, cap_tot, cap_min, cap_max;

    /*
     ** @Private - Initialise the tab
     */
    function onInit(tid, cel) {
        document.getElementById('camp_card').addEventListener('render', function(event) {
            onUpdate();
        });
    }

    const ONE_HOUR = 60 * 60,
        ONE_DAY = ONE_HOUR * 24,
        WINDMILL_EXPIRY_TIME = 7 * ONE_DAY;

    /*
     ** @Private - Sync Action
     */
    function onAction(id, action, data) {
        //console.log(id, "onAction", action, data);
        if (action == 'visit_camp') {
            var div = document.getElementById('camp_card');
            div.setAttribute('lazy-render', '');
            lazyObserver.observe(div);
        }
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        var camp = bgp.lastVisitedCamp && bgp.lastVisitedCamp.camp,
            uid = bgp.lastVisitedCamp && bgp.lastVisitedCamp.neigh_id,
            pal = uid ? bgp.daGame.daUser.neighbours[uid] : null;
        document.getElementById('camp_rid').setAttribute('src', (camp ? '/img/regions/' + camp.region : '/img/camp') + '.png');
        document.getElementById('camp_name').textContent = (camp ? guiString('camp_player_name', [pal ? pal.name : '#' + uid]) : guiString('camp_no_player'));
        document.getElementById('camp_visited').innerHTML = camp ? showCamp(camp) : '';
        var tbody, row, cell;
        tbody = document.getElementById('camp_player');
        tbody.innerHTML = '';
        if (camp) {
            addRowTextValue(tbody, guiString('camp_player_region'), self.regionName(camp.region));
            addRowTextValue(tbody, guiString('camp_player_level'), parseInt(pal.level));
        }
        tbody = document.getElementById('camp_data');
        tbody.innerHTML = '';
        if (camp) {
            addRowTextValue(tbody, guiString('camp_regen_tot'), parseInt(camp.stamina_reg));
            addRowTextValue(tbody, guiString('camp_capacity_tot'), parseInt(camp.max_stamina));
            addRowTextValue(tbody, guiString('camp_regen_min'), reg_min);
            addRowTextValue(tbody, guiString('camp_regen_max'), reg_max);
        }

        var wind_count = 0,
            wind_expiry = Infinity;
        tbody = document.getElementById('camp_windmills');
        tbody.innerHTML = '';
        if (camp) {
            if (camp.windmills) {
                (Array.isArray(camp.windmills) ? camp.windmills : [camp.windmills]).forEach(windmill => {
                    var st = parseInt(windmill.activated),
                        et = st + WINDMILL_EXPIRY_TIME;
                    wind_count++;
                    wind_expiry = Math.min(et, wind_expiry);
                });
            }
            addRowTextValue(tbody, guiString('camp_windmill_max'), parseInt(camp.windmill_limit));
            addRowTextValue(tbody, guiString('camp_windmill_regen'), parseInt(camp.windmill_reg));
            addRowTextValue(tbody, guiString('camp_windmill_num'), wind_count);
        }
        tbody = document.getElementById('camp_windmills2');
        tbody.innerHTML = '';
        if (wind_count)
            addRowTextValue(tbody, guiString('camp_windmill_expiry', [unixDate(wind_expiry, 'full')]));
        return true;
    }

    function addRowTextValue(tbody, text, value) {
        var row = tbody.insertRow(),
            cell = row.insertCell();
        cell.innerHTML = Dialog.escapeHtmlBr(text);
        cell.style.textAlign = 'left';
        if (value === undefined) {
            cell.colSpan = 2;
            cell.style.textAlign = 'center';
        } else {
            cell = row.insertCell();
            cell.innerText = typeof value == 'number' ? numberWithCommas(value, 0) : value;
            cell.style.textAlign = typeof value == 'number' ? 'right' : 'left';
        }
    }

    function showCamp(camp) {
        const NUM_SLOTS = 24;
        var lines_ids = camp.lines_ids.split(','),
            lines_blocked = camp.lines_blocked.split(','),
            buildings = bgp.daGame.daBuildings,
            html = [];
        reg_tot = reg_min = reg_max = cap_tot = cap_min = cap_max = 0;
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
                            capacity: parseInt(building.cap) || 0,
                            regen: parseInt(building.reg) || 0,
                            width: parseInt(building.wid) || 1,
                            height: parseInt(building.hei) || 1,
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
                    var colValue = Math.floor((slot.regen || slot.capacity) / width);
                    if (slot.capacity > 0) {
                        title += '\n' + guiString('camp_slot_capacity', [slot.capacity]);
                        kind += ' capacity';
                        cap_tot += slot.capacity;
                        if (cap_min == 0 || colValue < cap_min) cap_min = colValue;
                        if (cap_max == 0 || colValue > cap_max) cap_max = colValue;
                    }
                    if (slot.regen > 0) {
                        title += '\n' + guiString('camp_slot_regen', [slot.regen]);
                        kind += ' regen';
                        reg_tot += slot.regen;
                        if (reg_min == 0 || colValue < reg_min) reg_min = colValue;
                        if (reg_max == 0 || colValue > reg_max) reg_max = colValue;
                    }
                    colValues = ('<div class="value">' + colValue + '</div>').repeat(width);
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