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

    const NUM_SLOTS = 24;

    /*
     ** @Private - Initialise the tab
     */
    function onInit(tid, cel) {
        ['camp1', 'camp2'].forEach(id => {
            var div = document.getElementById(id);
            div.addEventListener('render', function(event) {
                updateCamp(this);
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
        if (action == 'visit_camp') {
            var div = document.getElementById('camp2');
            updateCamp(div, true);
            markToBeRendered(div);
        }
    }

    function markToBeRendered(div) {
        div = div.querySelector('div');
        div.setAttribute('lazy-render', '');
        lazyObserver.observe(div);
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {}

    let themeNames = {
        1: self.regionName(1),
        2: self.regionName(2),
        3: bgp.daGame.string('CT002'),
        4: bgp.daGame.string('CT011'),
        5: self.regionName(3),
        6: bgp.daGame.string('CT012'),
        7: bgp.daGame.string('CT013'),
        8: self.regionName(4),
        9: self.regionName(5),
        10: bgp.daGame.string('CT014'),
        12: bgp.daGame.string('CT016')
    };

    function getThemeName(id) {
        return id in themeNames ? themeNames[id] : 'THEME-' + id;
    }

    function updateCamp(div, flagHeaderOnly = false) {
        var info, camp, uid, pal, isPublic, campName;

        if (div.id == 'camp2') {
            info = bgp.lastVisitedCamp;
            camp = info && info.camp;
            uid = info && info.neigh_id;
            pal = uid ? bgp.daGame.getNeighbour(uid) : null;
            campName = (camp ? guiString('camp_player_name', [pal ? pal.name : '#' + uid]) : guiString('camp_no_player'));
            isPublic = uid == 1 || self.isDev();
        } else {
            info = bgp.daGame.daUser;
            camp = info.camp;
            pal = info.player;
            uid = pal.uid;
            ['region', 'windmill_limit', 'windmill_reg', 'stamina_reg', 'max_stamina'].forEach(key => camp[key] = info[key]);
            campName = guiString('camp_your_camp');
            isPublic = true;
        }

        function value(value) {
            return Dialog.escapeHtmlBr(typeof value == 'number' ? numberWithCommas(value, 0) : value);
        }

        var html = [];

        div.querySelector('img').setAttribute('src', (camp ? '/img/regions/' + camp.region : '/img/camp') + '.png');
        div.querySelector('span').textContent = campName;

        if (!flagHeaderOnly && camp) {
            var campResult = calculateCamp(camp, isPublic);

            html.push('<table class="camp_tables"><tr>');

            // table Player
            html.push('<td><table class="camp_data">');
            html.push('<thead><tr><th colspan="2">', value(guiString('camp_player')), '</th></tr></thead>');
            html.push('<tbody>');
            html.push('<tr><td>', value(guiString('Region')), '</td><td>', value(self.regionName(camp.region)), '</td></tr>');
            html.push('<tr><td>', value(guiString('Level')), '</td><td>', value(parseInt(pal.level)), '</td></tr>');
            html.push('<tr><td>', value(guiString('camp_theme')), '</td><td>', value(getThemeName(camp.skin)), '</td></tr>');
            html.push('</tbody>');
            html.push('</table></td>');

            if (isPublic) {
                var cap_total = parseInt(camp.max_stamina) || campResult.cap_tot,
                    reg_total = parseInt(camp.stamina_reg) || campResult.reg_tot,
                    fillTime = Math.ceil(cap_total / reg_total * 3600),
                    time = [];
                time.unshift(String(fillTime % 60).padStart(2, '0'));
                fillTime = Math.floor(fillTime / 60);
                time.unshift(String(fillTime % 60).padStart(2, '0'));
                time.unshift(Math.floor(fillTime / 60));

                // table Regeneration
                html.push('<td><table class="camp_data">');
                html.push('<thead><tr class="energy_capacity"><th></th><th><img src="/img/energy.png" title="', value(guiString('camp_regen')), '"></th><th><img src="/img/capacity.png" title="', value(guiString('camp_capacity')), '"></th></tr></thead>');
                html.push('<tbody>');
                html.push('<tr><td>Total</td><td>', value(reg_total), '</td><td>', value(cap_total), '</td></tr>');
                html.push('<tr><td>', value(guiString('camp_fill_time')), '</td><td colspan="2">', value(time.join(':')), '</td></tr>');
                html.push('<tr><td>', value(guiString('camp_min_value')), '</td><td>', value(campResult.reg_min), '</td><td>', value(campResult.cap_min), '</td></tr>');
                html.push('<tr><td>', value(guiString('camp_max_value')), '</td><td>', value(campResult.reg_max), '</td><td>', value(campResult.cap_max), '</td></tr>');
                html.push('</tbody>');
                html.push('</table></td>');
            }

            if (true) {
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
                // table Windmills
                html.push('<td><table class="camp_data">');
                html.push('<thead><tr><th colspan="2">', value(guiString('camp_windmills')), '</th></tr></thead>');
                html.push('<tbody>');
                html.push('<tr><td>', value(guiString('camp_windmill_num')), '</td><td>', value(wind_count + ' / ' + parseInt(camp.windmill_limit)), '</td></tr>');
                if (isPublic) {
                    html.push('<tr><td>', value(guiString('camp_windmill_regen')), '</td><td>', value(parseInt(camp.windmill_reg)), '</td></tr>');
                }
                html.push('</tbody>');
                if (wind_count) {
                    html.push('<tbody>');
                    html.push('<tr><td colspan="2">', value(guiString('camp_windmill_expiry', [unixDate(wind_expiry, 'full')])), '</td></tr>');
                    html.push('</tbody>');
                }
                html.push('</table></td>');
            }

            if (campResult.blocks[2].blocked || campResult.blocks[3].blocked || campResult.blocks[4].blocked) {
                var mat = {};
                Object.values(campResult.blocks).forEach(block => {
                    for (var i = NUM_SLOTS * 2 - block.blocked; i < NUM_SLOTS * 2; i++) {
                        let req = block.slots[i] && block.slots[i].req;
                        if (req) Object.keys(req).forEach(key => mat[key] = (mat[key] || 0) + parseInt(req[key]));
                    }
                });
                html.push('<td><table class="camp_data">');
                html.push('<thead><tr><th colspan="3">', value(guiString('camp_unlock_materials')), '</th></tr></thead>');
                sortMaterials(mat).forEach(item => {
                    html.push('<tr class="material"><td>', self.objectImage('material', item[0], 24), '</td><td>', value(self.materialName(item[0])), '</td><td>', value(item[1], 0), '</td></tr>');
                });
                html.push('<tbody>');
                html.push('</table></td>');
            }

            html.push('</tr></table>');
            html.push(campResult.html);
        }
        div.querySelector('div').innerHTML = html.join('');
    }

    function calculateCamp(camp, isPublic) {
        var lines_ids = camp.lines_ids.split(','),
            lines_blocked = camp.lines_blocked.split(','),
            buildings = bgp.daGame.daBuildings,
            html = [],
            lines = {},
            blocks = {},
            reg_min, reg_max, cap_min, cap_max, reg_tot, cap_top;

        // setup blocks
        [2, 3, 4].forEach(height => {
            blocks[height] = {
                blocked: 0,
                slots: []
            };
        });
        Object.values(bgp.daGame.daLines).forEach(line => {
            var height = parseInt(line.hei),
                order = parseInt(line.ord) + (height == 2 ? 3 : 0);
            if (height >= 2 && height <= 4 && order >= 1 && order <= NUM_SLOTS * 2)
                blocks[height].slots[order - 1] = line;
        });

        // setup lines
        [1, 2, 3, 5, 7, 9].forEach((lid, index) => {
            var height = Math.floor(index / 2) + 2,
                slots = [],
                emptySlot = {
                    kind: 'empty',
                    title: guiString('camp_slot_empty'),
                    width: 1,
                    height: height
                },
                blocked, i;
            i = lines_ids.indexOf(String(lid));
            blocked = i >= 0 ? parseInt(lines_blocked[i]) || 0 : NUM_SLOTS;
            for (i = 0; i < NUM_SLOTS; i++) slots[i] = emptySlot;
            if (blocked > 0) slots[index % 2 ? NUM_SLOTS - blocked : 0] = {
                kind: 'block',
                title: guiString('camp_slot_blocked'),
                width: blocked,
                height: height
            };
            lines[lid] = {
                lid: lid,
                height: height,
                slots: slots,
                blocked: blocked
            };
            blocks[height].blocked += blocked;
        });

        // position buildings
        var blds = camp.buildings;
        blds = blds ? (Array.isArray(blds) ? blds : [blds]) : [];
        blds.forEach(building => {
            var lid = parseInt(building.line_id),
                line = lines[lid];
            if (line) {
                var bid = parseInt(building.def_id),
                    slot = parseInt(building.slot),
                    building = buildings[bid];
                if (building) {
                    line.slots[slot] = {
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

        // render the camp and calculate some values
        reg_min = reg_max = cap_min = cap_max = reg_tot = cap_tot = 0;
        reg_tot += 60 + Math.min((camp.windmills && camp.windmills.length) || 0, camp.windmill_limit || 5) * (camp.windmill_reg || 5);
        cap_tot += 200;
        html.push('<div class="camp">');
        [1, 2, 3, 5, 7, 9].forEach((lid, index) => {
            var line = lines[lid],
                slots = line.slots;
            html.push('<div class="line" style="--lw:24;--lh:', line.height, '">');
            for (i = 0; i < NUM_SLOTS;) {
                var slot = slots[i],
                    title = slot.title,
                    width = slot.width,
                    kind = slot.kind,
                    colValues = '';
                while (kind == 'empty' && i + width < NUM_SLOTS && slots[i + width].kind == kind) width++;
                if (width > 1 && (kind == 'empty' || kind == 'block')) title += ' x ' + width;
                if (kind == 'block') {
                    var block = blocks[line.height].slots[NUM_SLOTS * 2 - blocks[line.height].blocked];
                    if (block) {
                        title += '\n' + guiString('camp_unlock_one', [block.exp]);
                        title += '\n' + guiString('camp_unlock_gem', [block.gem]);
                        if (block.req) {
                            title += '\n' + guiString('camp_unlock_mat');
                            Object.keys(block.req).forEach(key => {
                                title += '\n    ' + self.materialName(key) + ' × ' + numberWithCommas(block.req[key], 0);
                            });
                        }
                    }
                }
                if (kind == 'building') {
                    title += ' (' + width + '×' + slot.height + ')';
                    //title += '\nBID: ' + slot.bid;
                    var colValue = Math.floor((slot.regen || slot.capacity) / width);
                    if (slot.capacity > 0) {
                        if (isPublic) title += '\n' + guiString('camp_slot_capacity', [slot.capacity]);
                        kind += ' capacity';
                        if (cap_min == 0 || colValue < cap_min) cap_min = colValue;
                        if (cap_max == 0 || colValue > cap_max) cap_max = colValue;
                        cap_tot += slot.capacity;
                    }
                    if (slot.regen > 0) {
                        if (isPublic) title += '\n' + guiString('camp_slot_regen', [slot.regen]);
                        kind += ' regen';
                        if (reg_min == 0 || colValue < reg_min) reg_min = colValue;
                        if (reg_max == 0 || colValue > reg_max) reg_max = colValue;
                        reg_tot += slot.regen;
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
        return {
            html: html.join(''),
            blocks: blocks,
            reg_min: reg_min,
            reg_max: reg_max,
            cap_min: cap_min,
            cap_max: cap_max,
            reg_tot: reg_tot,
            cap_top: cap_top
        };
    }

    function sortMaterials(obj) {
        var matOrder = '1,7,22,32,8'.split(',');
        var mat = Object.keys(obj).map(key => [key, obj[key], matOrder.indexOf(key)]);
        mat.sort((a, b) => a[2] - b[2]);
        return mat;
    }

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/