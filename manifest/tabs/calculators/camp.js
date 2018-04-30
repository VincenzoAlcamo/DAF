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
            div = div.querySelector('div');
            div.addEventListener('mouseover', onmousemove);
            div.addEventListener('mouseout', onmousemove);
            div.addEventListener('mouseleave', onmousemove);
        })

        // For now hide the neighbour card, as feature is not live
        // Need to consider implications of this feature a bit more
        if (!self.isDev()) {
            var div = document.getElementById('camp2');
            div.style.display = 'none';
        }
    }

    function onmousemove(event) {
        var el = event.target,
            isOut = event.type == 'mouseout' || event.type == 'mouseleave',
            bid = 0;
        while (!el.classList.contains('card')) {
            if (el.hasAttribute('bid')) bid = el.getAttribute('bid');
            el = el.parentNode;
        }
        el.querySelectorAll('.item.building').forEach(el => {
            el.classList.toggle('selected', el.getAttribute('bid') === bid);
        })
    }

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

    function getConfigValue(name, defaultValue) {
        var result = NaN;
        try {
            result = parseInt(bgp.daGame.daConfig[name]);
        } catch (e) {
            result = NaN;
        }
        return isNaN(result) ? defaultValue : result;
    }

    function updateCamp(div, flagHeaderOnly = false) {
        var info, camp, uid, pal, isPlayer, isPublic, campName, started;

        isPlayer = div.id == 'camp1';
        if (isPlayer) {
            info = bgp.daGame.daUser;
            camp = info.camp;
            pal = info.player;
            uid = pal.uid;
            ['region', 'windmill_limit', 'windmill_reg', 'stamina_reg', 'max_stamina'].forEach(key => camp[key] = info[key]);
            campName = guiString('camp_your_camp');
            isPublic = true;
            started = new Date(bgp.exPrefs.gameDate);
        } else {
            info = bgp.lastVisitedCamp;
            // not yet processed and we need the full data?
            if (info && info.processed === false && !flagHeaderOnly) {
                let node;
                if (info.xml) node = info.xml;
                else {
                    let xml = parseXml(info.text);
                    node = getXmlChild(xml && xml.documentElement, info.taskName);
                }
                info = bgp.lastVisitedCamp = XML2jsobj(node);
                info.processed = true;
            }
            camp = info && info.camp;
            uid = info && info.neigh_id;
            pal = uid ? bgp.daGame.getNeighbour(uid) : null;
            campName = (uid ? guiString('camp_player_name', [pal ? pal.name : '#' + uid]) : guiString('camp_no_player'));
            isPublic = uid == 1 || self.isDev();
        }

        div.querySelector('img').setAttribute('src', (camp ? '/img/regions/' + camp.region : '/img/camp') + '.png');
        div.querySelector('span').textContent = campName;
        div.querySelector('div').innerHTML = '';
        if (flagHeaderOnly || !camp) return;

        function value(value) {
            return Dialog.escapeHtmlBr(typeof value == 'number' ? numberWithCommas(value, 0) : value);
        }

        var windmillExpiryTime = getConfigValue('windmill_lifespan', 7 * 86400),
            campResult = calculateCamp(camp, isPublic, true),
            camps = [campResult],
            html = [];

        if (isPlayer) {
            var campResult2 = calculateCamp(camp, isPublic, false);
            if(campResult2.reg_base != campResult2.reg_tot || campResult2.cap_base != campResult2.cap_tot) {
                camps.push(campResult2);
                if(campResult2.reg_tot > campResult.reg_tot) camps.reverse();
            }
        }

        html.push('<table class="camp_tables"><tr>');

        // table Player
        html.push('<td><table class="camp_data">');
        html.push('<thead><tr><th colspan="2">', value(guiString('camp_player')), '</th></tr></thead>');
        html.push('<tbody>');
        html.push('<tr><td>', value(guiString('Region')), '</td><td>', value(self.regionName(camp.region)), '</td></tr>');
        html.push('<tr><td>', value(guiString('Level')), '</td><td>', value(parseInt(pal.level)), '</td></tr>');
        html.push('<tr><td>', value(guiString('camp_theme')), '</td><td>', value(getThemeName(camp.skin)), '</td></tr>');
        html.push('</tbody>');
        if (started && !isNaN(started.getFullYear())) {
            html.push('<tbody>');
            html.push('<tr><td colspan="2">', value(guiString('camp_start_date', [unixDate(started / 1000, true)])), '</td></tr>');
            html.push('</tbody>');
        }
        html.push('</table></td>');

        if (isPublic) {
            camps.forEach(function(campResult, index) {
                var cap_total = campResult.cap_tot,
                    reg_total = campResult.reg_tot,
                    fillTime = Math.ceil(cap_total / reg_total * 3600),
                    time;
                if (fillTime) {
                    time = [];
                    time.unshift(String(fillTime % 60).padStart(2, '0'));
                    fillTime = Math.floor(fillTime / 60);
                    time.unshift(String(fillTime % 60).padStart(2, '0'));
                    time.unshift(Math.floor(fillTime / 60));
                }

                // table Regeneration
                html.push('<td><table class="camp_data">');
                var caption = camps.length == 1 ? '' : guiString(index == 0 ? 'camp_day_mode' : 'camp_night_mode');
                html.push('<thead><tr class="energy_capacity"><th>', caption, '</th><th><img src="/img/energy.png" title="', value(guiString('camp_regen')), '"></th><th><img src="/img/capacity.png" title="', value(guiString('camp_capacity')), '"></th></tr></thead>');
                html.push('<tbody>');
                html.push('<tr><td>', value(guiString('Total')), '</td><td>', value(reg_total || ''), '</td><td>', value(cap_total || ''), '</td></tr>');
                html.push('<tr><td>', value(guiString('camp_min_value')), '</td><td>', value(campResult.reg_min), '</td><td>', value(campResult.cap_min), '</td></tr>');
                html.push('<tr><td>', value(guiString('camp_max_value')), '</td><td>', value(campResult.reg_max), '</td><td>', value(campResult.cap_max), '</td></tr>');
                html.push('</tbody>');
                if (time) {
                    html.push('<tbody>');
                    html.push('<tr><td>', value(guiString('camp_fill_time')), '</td><td colspan="2">', value(time.join(':')), '</td></tr>');
                    html.push('</tbody>');
                }
                html.push('</table></td>');
            });
        }

        if (true) {
            var wind_count = 0,
                wind_expiry = Infinity;
            if (camp.windmills) {
                (Array.isArray(camp.windmills) ? camp.windmills : [camp.windmills]).forEach(windmill => {
                    var st = parseInt(windmill.activated),
                        et = st + windmillExpiryTime;
                    wind_count++;
                    wind_expiry = Math.min(et, wind_expiry);
                });
            }
            // table Windmills
            html.push('<td><table class="camp_data">');
            html.push('<thead><tr><th colspan="2">', value(guiString('camp_windmills')), '</th></tr></thead>');
            html.push('<tbody>');
            html.push('<tr><td>', value(guiString('camp_windmill_num')), '</td><td>', value(wind_count + ' / ' + parseInt(camp.windmill_limit)), '</td></tr>');
            if (isPublic && camp.windmill_reg) {
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

        camps.forEach(function(campResult, index) {
            if (camps.length > 1)
                html.push('<table class="camp_caption"><thead><tr><th>', guiString(index == 0 ? 'camp_day_mode' : 'camp_night_mode'), '</th></tr></thead></table>');
            html.push(campResult.html);
        });

        div.querySelector('div').innerHTML = html.join('');
    }

    function calculateCamp(camp, isPublic, current = true) {
        var lines_ids = camp.lines_ids.split(','),
            lines_blocked = camp.lines_blocked.split(','),
            buildings = bgp.daGame.daBuildings,
            html = [],
            lines = {},
            blocks = {},
            reg_min, reg_max, cap_min, cap_max, reg_tot, cap_tot, reg_base, cap_base;

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

        reg_base = getConfigValue('stamina_reg', 60) + Math.min((camp.windmills && camp.windmills.length) || 0, camp.windmill_limit || 5) * (parseInt(camp.windmill_reg) || 5);
        cap_base = getConfigValue('starting_stamina', 200);

        // position buildings
        reg_min = reg_max = cap_min = cap_max = reg_tot = cap_tot = 0;
        reg_tot += reg_base;
        cap_tot += cap_base;

        var blds = current ? camp.buildings : camp.inactive_b;
        blds = blds ? (Array.isArray(blds) ? blds : [blds]) : [];
        blds.forEach(building => {
            var lid = parseInt(building.line_id),
                line = lines[lid];
            if (line) {
                var bid = parseInt(building.def_id),
                    slot = parseInt(building.slot),
                    building = buildings[bid];
                if (building) {
                    var regen = parseInt(building.reg) || 0,
                        capacity = parseInt(building.cap) || 0,
                        width = parseInt(building.wid) || 1,
                        value = Math.floor((regen || capacity) / width);
                    if (capacity > 0) {
                        if (cap_min == 0 || value < cap_min) cap_min = value;
                        if (cap_max == 0 || value > cap_max) cap_max = value;
                        cap_tot += capacity;
                    }
                    if (regen > 0) {
                        if (reg_min == 0 || value < reg_min) reg_min = value;
                        if (reg_max == 0 || value > reg_max) reg_max = value;
                        reg_tot += regen;
                    }
                    line.slots[slot] = {
                        kind: 'building',
                        bid: bid,
                        capacity: parseInt(building.cap) || 0,
                        regen: parseInt(building.reg) || 0,
                        value: value,
                        width: parseInt(building.wid) || 1,
                        height: parseInt(building.hei) || 1,
                        rid: parseInt(building.rid) || 0,
                        title: bgp.daGame.string(building.nid)
                    }
                }
            }
        });

        // render the camp and calculate some values
        var reg_range = reg_max - reg_min,
            cap_range = cap_max - cap_min,
            opacity_min = 0.4,
            opacity_range = 1 - opacity_min;
        html.push('<div class="camp">');

        function getStrength(value, min, range) {
            return range ? (value - min) / range * opacity_range + opacity_min : 1;
        }
        [1, 2, 3, 5, 7, 9].forEach((lid, index) => {
            var line = lines[lid],
                slots = line.slots;
            html.push('<div class="line" style="--lw:24;--lh:', line.height, '">');
            for (i = 0; i < NUM_SLOTS;) {
                var slot = slots[i],
                    title = slot.title,
                    width = slot.width,
                    kind = slot.kind,
                    colValues = '',
                    strength = 0,
                    bid = 0;
                while (kind == 'empty' && i + width < NUM_SLOTS && slots[i + width].kind == kind) width++;
                if (width > 1 && (kind == 'empty' || kind == 'block')) title += ' x ' + width;
                if (kind == 'block') {
                    var block = blocks[line.height].slots[NUM_SLOTS * 2 - blocks[line.height].blocked];
                    if (block) {
                        title += '\n' + guiString('camp_unlock_one', [block.exp]);
                        title += '\n' + guiString('camp_unlock_cost', [block.gem]);
                        Object.keys(block.req).forEach(key => {
                            title += '\n    ' + self.materialName(key) + ' \xd7 ' + numberWithCommas(block.req[key], 0);
                        });
                    }
                }
                if (kind == 'building') {
                    title += ' (' + width + '\xd7' + slot.height + ')';
                    bid = slot.bid;
                    if (slot.capacity > 0) {
                        kind += ' capacity';
                        if (isPublic) title += '\n' + guiString('camp_slot_capacity', [slot.capacity]);
                        strength = getStrength(slot.value, cap_min, cap_range);
                    }
                    if (slot.regen > 0) {
                        kind += ' regen';
                        if (isPublic) title += '\n' + guiString('camp_slot_regen', [slot.regen]);
                        strength = getStrength(slot.value, reg_min, reg_range);
                    }
                    if (slot.rid > 0) {
                        kind += ' reg' + slot.rid;
                        title += '\n' + guiString('camp_slot_region', [self.regionName(slot.rid)]);
                    }
                    colValues = isPublic ? ('<div class="value">' + slot.value + '</div>').repeat(width) : '';
                    strength = Math.round(strength * 1000) / 1000;
                }
                html.push('<div class="item ', kind, '" style="--w:', width, ';--h:', slot.height, ';--v:', strength, '" title="', Dialog.escapeHtml(title), bid ? '" bid="' + bid : '', '">', colValues, '</div>');
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
            reb_base: reg_base,
            cap_base: cap_base,
            reg_tot: reg_tot,
            cap_tot: cap_tot
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