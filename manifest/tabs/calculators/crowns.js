/*
 ** DA Friends Calculator - crowns.js
 */
var guiTabs = (function(self) {
    // Pillars
    const NEW_METHOD = true;
    console.log("NEW_METHOD", NEW_METHOD);
    var daCrowns = [{
        // Greece
        decoration_id: 904,
        name: "Octopus",
        name_loc: "DENA539",
        xp: 2500000,
        sell_price: 16000,
        material_id: 196,
        material_cost: 500,
        cart_id: 0,
        level: 200,
        region: 5
    },
    {
        decoration_id: 903,
        name: "Lemon",
        name_loc: "DENA538",
        xp: 4150000,
        sell_price: 26000,
        material_id: 195,
        material_cost: 2500,
        cart_id: 0,
        level: 200,
        region: 5
    },
    {
        decoration_id: 902,
        name: "Olives",
        name_loc: "DENA537",
        xp: 3750000,
        sell_price: 23000,
        material_id: 194,
        material_cost: 5000,
        cart_id: 0,
        level: 200,
        region: 5
    },
    {
        decoration_id: 901,
        name: "Sapphire",
        name_loc: "DENA536",
        xp: 63000000,
        sell_price: 394000,
        material_id: 197,
        material_cost: 350,
        cart_id: 0,
        level: 200,
        region: 5
    },
    {
        decoration_id: 900,
        name: "Adamantine Steel",
        name_loc: "DENA535",
        xp: 55000000,
        sell_price: 313000,
        material_id: 199,
        material_cost: 1000,
        cart_id: 0,
        level: 200,
        region: 5
    },
    {
        decoration_id: 899,
        name: "Adamantine Ore",
        name_loc: "DENA534",
        xp: 10300000,
        sell_price: 64000,
        material_id: 198,
        material_cost: 2000,
        cart_id: 0,
        level: 200,
        region: 5
    },
    {
        decoration_id: 898,
        name: "Cedar Wood",
        name_loc: "DENA533",
        xp: 11400000,
        sell_price: 71000,
        material_id: 193,
        material_cost: 4000,
        cart_id: 0,
        level: 200,
        region: 5
    },

    // Atlantis
    {
        decoration_id: 897,
        name: "Seaweed",
        name_loc: "DENA532",
        xp: 6000000,
        sell_price: 40000,
        material_id: 144,
        material_cost: 5000,
        cart_id: 0,
        level: 175,
        region: 4
    },
    {
        decoration_id: 896,
        name: "Lobster",
        name_loc: "DENA531",
        xp: 7000000,
        sell_price: 46000,
        material_id: 146,
        material_cost: 2500,
        cart_id: 0,
        level: 175,
        region: 4
    },
    {
        decoration_id: 895,
        name: "Marble",
        name_loc: "DENA530",
        xp: 7200000,
        sell_price: 48000,
        material_id: 145,
        material_cost: 4000,
        cart_id: 0,
        level: 175,
        region: 4
    },
    {
        decoration_id: 894,
        name: "Volcanic Ore",
        name_loc: "DENA529",
        xp: 7000000,
        sell_price: 46000,
        material_id: 147,
        material_cost: 2000,
        cart_id: 0,
        level: 175,
        region: 4
    },
    {
        decoration_id: 893,
        name: "Orichalcum",
        name_loc: "DENA528",
        xp: 25000000,
        sell_price: 166000,
        material_id: 148,
        material_cost: 1000,
        cart_id: 0,
        level: 175,
        region: 4
    },
    {
        decoration_id: 892,
        name: "Black Pearl",
        name_loc: "DENA527",
        xp: 42000000,
        sell_price: 278000,
        material_id: 149,
        material_cost: 350,
        cart_id: 0,
        level: 175,
        region: 4
    },
    {
        decoration_id: 891,
        name: "Topaz",
        name_loc: "DENA526",
        xp: 52500000,
        sell_price: 348000,
        material_id: 143,
        material_cost: 350,
        cart_id: 0,
        level: 175,
        region: 4
    },

    // China
    {
        decoration_id: 890,
        name: "Rice",
        name_loc: "DENA525",
        xp: 400000,
        sell_price: 2900,
        material_id: 91,
        material_cost: 5000,
        cart_id: 0,
        level: 150,
        region: 3
    },
    {
        decoration_id: 889,
        name: "Shitake",
        name_loc: "DENA524",
        xp: 1250000,
        sell_price: 8900,
        material_id: 97,
        material_cost: 2500,
        cart_id: 0,
        level: 150,
        region: 3
    },
    {
        decoration_id: 888,
        name: "Eel",
        name_loc: "DENA523",
        xp: 800000,
        sell_price: 5700,
        material_id: 98,
        material_cost: 500,
        cart_id: 0,
        level: 150,
        region: 3
    },
    {
        decoration_id: 887,
        name: "Bamboo",
        name_loc: "DENA522",
        xp: 2720000,
        sell_price: 19000,
        material_id: 94,
        material_cost: 4000,
        cart_id: 0,
        level: 150,
        region: 3
    },
    {
        decoration_id: 886,
        name: "Shale",
        name_loc: "DENA521",
        xp: 2840000,
        sell_price: 20000,
        material_id: 99,
        material_cost: 4000,
        cart_id: 0,
        level: 150,
        region: 3
    },
    {
        decoration_id: 885,
        name: "Scrap Metal",
        name_loc: "DENA520",
        xp: 4200000,
        sell_price: 30000,
        material_id: 95,
        material_cost: 2000,
        cart_id: 0,
        level: 150,
        region: 3
    },
    {
        decoration_id: 884,
        name: "Dragon Ingot",
        name_loc: "DENA519",
        xp: 16500000,
        sell_price: 118000,
        material_id: 96,
        material_cost: 1000,
        cart_id: 0,
        level: 150,
        region: 3
    },
    {
        decoration_id: 883,
        name: "Ruby",
        name_loc: "DENA518",
        xp: 35000000,
        sell_price: 250000,
        material_id: 92,
        material_cost: 350,
        cart_id: 0,
        level: 150,
        region: 3
    },

    // Scandi
    {
        decoration_id: 882,
        name: "Amethyst",
        name_loc: "DENA517",
        xp: 14000000,
        sell_price: 113000,
        material_id: 47,
        material_cost: 350,
        cart_id: 0,
        level: 125,
        region: 2
    },
    {
        decoration_id: 881,
        name: "Dill",
        name_loc: "DENA516",
        xp: 850000,
        sell_price: 6900,
        material_id: 181,
        material_cost: 5000,
        cart_id: 0,
        level: 125,
        region: 2
    },
    {
        decoration_id: 880,
        name: "Cod",
        name_loc: "DENA515",
        xp: 450000,
        sell_price: 3600,
        material_id: 182,
        material_cost: 500,
        cart_id: 0,
        level: 125,
        region: 2
    },

    // Egypt
    {
        decoration_id: 879,
        name: "Iron Ore",
        name_loc: "DENA514",
        xp: 380000,
        sell_price: 3800,
        material_id: 33,
        material_cost: 2000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 878,
        name: "Iron",
        name_loc: "DENA513",
        xp: 1450000,
        sell_price: 15000,
        material_id: 8,
        material_cost: 1000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 877,
        name: "Bronze",
        name_loc: "DENA512",
        xp: 1000000,
        sell_price: 10000,
        material_id: 32,
        material_cost: 1000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 876,
        name: "Tin",
        name_loc: "DENA511",
        xp: 300000,
        sell_price: 3000,
        material_id: 6,
        material_cost: 2000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 875,
        name: "Copper",
        name_loc: "DENA510",
        xp: 120000,
        sell_price: 1200,
        material_id: 3,
        material_cost: 2000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 874,
        name: "Mushroom",
        name_loc: "DENA509",
        xp: 150000,
        sell_price: 1500,
        material_id: 19,
        material_cost: 5000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 873,
        name: "Berry",
        name_loc: "DENA508",
        xp: 100000,
        sell_price: 1000,
        material_id: 29,
        material_cost: 5000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 872,
        name: "Wood",
        name_loc: "DENA507",
        xp: 120000,
        sell_price: 1200,
        material_id: 7,
        material_cost: 4000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 871,
        name: "Fish",
        name_loc: "DENA506",
        xp: 130000,
        sell_price: 1300,
        material_id: 35,
        material_cost: 500,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 870,
        name: "Apples",
        name_loc: "DENA505",
        xp: 100000,
        sell_price: 1000,
        material_id: 20,
        material_cost: 5000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 869,
        name: "Root",
        name_loc: "DENA504",
        xp: 150000,
        sell_price: 1500,
        material_id: 11,
        material_cost: 2500,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 868,
        name: "Stone",
        name_loc: "DENA503",
        xp: 200000,
        sell_price: 2000,
        material_id: 22,
        material_cost: 4000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 867,
        name: "Coin",
        name_loc: "DENA502",
        xp: 1000000,
        sell_price: 10000,
        material_id: 1,
        material_cost: 1000000,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 866,
        name: "Herb",
        name_loc: "DENA501",
        xp: 150000,
        sell_price: 1500,
        material_id: 21,
        material_cost: 2500,
        cart_id: 0,
        level: 100,
        region: 1
    },
    {
        decoration_id: 865,
        name: "Coal",
        name_loc: "DENA500",
        xp: 300000,
        sell_price: 3000,
        material_id: 9,
        material_cost: 4000,
        cart_id: 0,
        level: 100,
        region: 1
    }];

    if (NEW_METHOD) {
        daCrowns = getCrowns();

        function getCrowns() {
            var crowns = [];
            // Get all the id of the pillar decorations
            var ids = {};
            for (var i = 865; i <= 904; i++) ids[i] = true;
            var decorations = bgp.daGame.daDecorations;
            Object.values(bgp.daGame.daSales)
                .filter(sale => sale.type == 'decoration' && sale.oid in ids && sale.hdn != 1)
                .forEach(sale => {
                    var decoration = decorations[sale.oid];
                    var req = Object.entries(sale.req)[0];
                    if (decoration && req)
                        crowns.push({
                            decoration_id: sale.oid,
                            name_loc: decoration.nid,
                            xp: sale.exp,
                            sell_price: parseInt(decoration.spr),
                            material_id: parseInt(req[0]),
                            material_cost: req[1],
                            level: sale.rqlvl,
                            skin: sale.rqskn
                        });
                });
            return crowns;
        }
    }

    var ccTable, tbody, tgrid, tabID, cappd;

    /*
     ** @Private - Initialise the tab
     */
    function onInit(id) {
        tabID = id;
        ccTable = document.getElementById("ccTable");
        tbody = document.getElementById("cctb1");
        tgrid = document.getElementById("cctb2");
        igrid = document.getElementById("crownGrid");
        cappd = document.getElementById("capCrowns");

        ccTable.addEventListener('click', function(e) {
            var did = e.target && parseInt(e.target.getAttribute('did'));
            if (did) toggleIgnore(did);
        });

        guiText_i18n(ccTable);

        if (igrid) {
            igrid.checked = bgp.exPrefs.crownGrid;
            igrid.addEventListener('change', function(e) {
                if (e.target.checked != bgp.exPrefs.crownGrid) {
                    bgp.exPrefs.crownGrid = self.setPref("crownGrid", e.target.checked);
                    self.update();
                }
            });
        }

        if (cappd) {
            cappd.checked = bgp.exPrefs.capCrowns;
            cappd.addEventListener('change', function(e) {
                if (e.target.checked != bgp.exPrefs.capCrowns) {
                    bgp.exPrefs.capCrowns = self.setPref("capCrowns", e.target.checked);
                    self.update();
                }
            });
        }

        Array.from(document.getElementsByName('cFilter')).forEach(input => {
            input.checked = input.value == bgp.exPrefs.cFilter;
            input.addEventListener('click', function(e) {
                var cFilter = e.target.getAttribute('value');
                if ((!e.target.disabled) && bgp.exPrefs.cFilter != cFilter) {
                    filterCrowns(cFilter, ccTable);
                }
            });
        })

        sorttable.makeSortable(ccTable);
    }

    function toggleIgnore(did) {
        did = String(did);
        var input = ccTable.querySelector('input[id="' + did + '"]');
        if (!input) return;
        var cell = input.parentNode,
            row = cell.parentNode,
            el = (row.classList.contains('grid') ? cell : row),
            ignoredCrowns = String(bgp.exPrefs.ignoredCrowns).split(','),
            i = ignoredCrowns.indexOf(did),
            crown = daCrowns.find(item => item.decoration_id == did);
        cell.querySelector('input[type=checkbox]').checked = i >= 0;
        ignoredCrowns = ignoredCrowns.filter(id => id != did && id != '');
        if (i >= 0) {
            // found -> remove
            el.classList.remove('ignored');
            crown.use = crown.qty || 0;
        } else {
            // not found -> add
            ignoredCrowns.push(did);
            el.classList.add('ignored');
            crown.use = 0;
        }
        bgp.exPrefs.ignoredCrowns = self.setPref('ignoredCrowns', ignoredCrowns.join(','));
        input.value = crown.use;
        input.dispatchEvent(new InputEvent('input'));
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        if (reason == 'active')
            return true;

        if ((!bgp.daGame.daUser) || !bgp.daGame.daUser.player || !bgp.daGame.daLevels) {
            guiStatus('errorData', 'ERROR', 'error');
            return false;
        }

        var mgc = 9,
            cx = 0,
            ry = null;
        var tot_crowns = 0;
        var tot_coin = 0;
        var tot_xp = 0;
        var tot_use = 0;
        var exp = parseInt(bgp.daGame.daUser.exp);
        var region = intOrDefault(bgp.daGame.daUser.region, 1);
        var level = intOrDefault(bgp.daGame.daUser.level, 1);

        // Get skins available to player
        var skins = {};
        (bgp.daGame.daUser.skins || '').split(',').forEach(id => skins[id] = true);

        function isAvailable(crown) {
            if (NEW_METHOD) return level >= crown.level && (crown.skin === undefined || crown.skin in skins);
            else return level >= parseInt(crown.level) && region >= parseInt(crown.region);
        }

        tgrid.innerHTML = '';
        tbody.innerHTML = '';

        document.getElementById("ccTotals").style.display = bgp.exPrefs.crownGrid ? 'none' : '';
        document.getElementById("ccFilter").style.display = bgp.exPrefs.crownGrid ? 'none' : '';
        Array.from(ccTable.tFoot.rows).forEach(row => {
            row.cells[0].colSpan = bgp.exPrefs.crownGrid ? 5 : 8;
        });
        Array.from(ccTable.tHead.rows[0].cells).forEach(cell => {
            if (cell.cellIndex == 0) cell.colSpan = bgp.exPrefs.crownGrid ? mgc : 1;
            else cell.style.display = bgp.exPrefs.crownGrid ? 'none' : '';
        });

        //level = 151;  /** For Theme Testing Etc. **/

        var ignoredCrowns = String(bgp.exPrefs.ignoredCrowns).split(',').map(item => parseInt(item));

        Object.keys(daCrowns).sort(function(a, b) {
            var s = daCrowns[a].level - daCrowns[b].level;
            if (s != 0)
                return s;
            s = daCrowns[a].xp - daCrowns[b].xp;
            return s;
        }).forEach(function(k, i, a) {
            var name = bgp.daGame.string(daCrowns[k].name_loc);
            if (name == daCrowns[k].name_loc)
                name = daCrowns[k].name;
            var did = daCrowns[k].decoration_id;
            var price = parseInt(daCrowns[k].sell_price);
            var mat = parseInt(daCrowns[k].material_cost);
            var xp = parseInt(daCrowns[k].xp);
            var isIgnored = ignoredCrowns.indexOf(did) >= 0;
            var inv, qty, nxt, pxp, coins;
            var parentInput;

            daCrowns[k].inv = inv = self.materialInventory(daCrowns[k].material_id);
            daCrowns[k].qty = qty = Math.floor(inv / mat);

            use = isIgnored ? 0 : qty;
            if ((self.tabs['Calculators'].time) && daCrowns[k].hasOwnProperty('use')) {
                use = Math.min(daCrowns[k].use, bgp.exPrefs.capCrowns ? qty : 999);
            }
            daCrowns[k].use = use;
            daCrowns[k].inv = nxt = ((inv - (mat * use)) / mat) * 100;
            daCrowns[k].pxp = pxp = xp * use;
            daCrowns[k].coins = coins = price * use;

            // Grid
            parentInput = null;
            if (bgp.exPrefs.crownGrid) {
                if (isAvailable(daCrowns[k])) {
                    if ((!ry) || cx == mgc) {
                        ry = tgrid.insertRow();
                        ry.classList.add('grid');
                        cx = 0;
                    }
                    var cell = ry.insertCell();
                    if (isIgnored) cell.classList.add('ignored');
                    var e = document.createElement("INPUT");
                    appendCrownImage(cell, did, name);
                    parentInput = cell;

                    cx++;
                    tot_xp = tot_xp + pxp;
                    tot_use = tot_use + use;
                    tot_coin = tot_coin + coins;
                    tot_crowns = tot_crowns + qty;
                }
            } else {
                var row = tbody.insertRow();
                if (isIgnored) row.classList.add('ignored');
                var cell0 = row.insertCell();
                var cell1 = row.insertCell();
                var cell2 = row.insertCell();
                var cell3 = row.insertCell();
                var cell4 = row.insertCell();
                var cell5 = row.insertCell();
                var cell6 = row.insertCell();
                var cell7 = row.insertCell();
                var cell8 = row.insertCell();
                var cell9 = row.insertCell();
                var cell10 = row.insertCell();
                var cell11 = row.insertCell();

                if (qty == 0)
                    row.classList.add('no-crowns');

                appendCrownImage(cell0, did, name);
                cell1.innerText = name;
                cell2.innerText = daCrowns[k].level;
                cell3.innerText = numberWithCommas(mat);
                cell4.innerText = numberWithCommas(xp);
                cell5.innerText = numberWithCommas(price);
                cell6.innerText = numberWithCommas(inv);
                cell7.innerText = numberWithCommas(nxt, 2) + '%';
                cell8.innerText = numberWithCommas(qty);
                cell8.setAttribute('sorttable_customkey', numberWithCommas(qty + nxt / 100));

                if (isAvailable(daCrowns[k])) {
                    parentInput = cell9;
                    cell10.innerText = numberWithCommas(pxp);
                    cell11.innerText = numberWithCommas(coins);

                    tot_xp = tot_xp + pxp;
                    tot_coin = tot_coin + coins;
                    tot_use = tot_use + use;
                    tot_crowns = tot_crowns + qty;
                } else {
                    row.classList.add('high-level');
                    cell9.innerText = 0;
                    cell10.innerText = '-';
                    cell11.innerText = '-';
                }
            }
            if (parentInput) {
                var input = document.createElement("INPUT");
                input.setAttribute("type", "number");
                input.id = did;
                input.name = k;
                input.title = name + ' (' + qty + ')';
                input.defaultValue = qty;
                input.value = use;
                input.step = 1;
                input.min = 0;
                input.max = 999;
                input.oninput = onInput;
                parentInput.appendChild(input);
                var input = document.createElement("INPUT");
                input.setAttribute("type", "checkbox");
                input.setAttribute('did', did);
                input.title = guiString('ignoreCrown');
                input.checked = !isIgnored;
                parentInput.appendChild(input);
            }
        });

        predictCrowns(tot_crowns, tot_use, tot_xp, tot_coin, true);

        if (bgp.exPrefs.crownGrid) {
            while ((ry) && cx < mgc) {
                var cell0 = ry.insertCell();
                cx++;
            }
        } else {
            filterCrowns(bgp.exPrefs.cFilter, ccTable);
            sorttable.applySort(ccTable);
        }

        return true;
    }

    function appendCrownImage(parent, did, name) {
        var img = document.createElement('img');
        // This will set a default image if the specified image was not found
        img.addEventListener('error', () => img.src = '/img/pillars.png', false);
        img.title = name + '\n' + guiString('ignoreCrown');
        img.style.cursor = 'pointer';
        img.setAttribute('did', did);
        img.src = '/img/pillars/' + +did + ".png";
        parent.appendChild(img);
    }

    function onInput() {
        var input = this,
            use = input.valueAsNumber || 0,
            key = input.name,
            crown = daCrowns[key];
        input.max = (bgp.exPrefs.capCrowns) ? crown.qty : 999;
        use = Math.min(Math.max(use, input.min), input.max);
        input.value = crown.use = use;
        crown.pxp = parseInt(crown.xp) * use;
        crown.coins = parseInt(crown.sell_price) * use;
        var cell = input.parentNode;
        if (!cell.parentNode.classList.contains('grid')) {
            cell = cell.nextSibling;
            cell.innerText = numberWithCommas(crown.pxp);
            cell = cell.nextSibling;
            cell.innerText = numberWithCommas(crown.coins);
        }
        updateCrowns();
    };

    /*
     ** @Private - Filter Crowns
     */
    function filterCrowns(cFilter, table) {
        table.querySelectorAll('tr.no-crowns').forEach(function(e) {
            e.style.display = (cFilter == 'QTY') ? 'none' : '';
        });

        table.querySelectorAll('tr.high-level').forEach(function(e) {
            e.style.display = (cFilter == 'QTY') ? 'none' : '';
        });

        self.setPref("cFilter", cFilter);
    }

    /*
     ** @Private - Update Crowns
     */
    function updateCrowns() {
        var tot_crowns = 0,
            tot_use = 0,
            tot_xp = 0,
            tot_coin = 0;

        daCrowns.forEach(function(crown) {
            tot_crowns += parseInt(crown.qty);
            tot_use += parseInt(crown.use);
            tot_xp += parseInt(crown.pxp);
            tot_coin += parseInt(crown.coins);
        });

        predictCrowns(tot_crowns, tot_use, tot_xp, tot_coin);
    }

    /*
     ** @Private - Update Crown Predictions
     */
    function predictCrowns(tot_crowns, tot_use, tot_xp, tot_coin, stats = false) {
        var exp = parseInt(bgp.daGame.daUser.exp);
        var level = parseInt(bgp.daGame.daUser.level);

        document.getElementById("tot_use").innerText = numberWithCommas(tot_use);
        document.getElementById("tot_exp").innerText = numberWithCommas(tot_xp);
        document.getElementById("tot_coin").innerText = numberWithCommas(tot_coin);
        document.getElementById("tot_crowns").innerText = numberWithCommas(tot_crowns);

        var next_level = level;
        var next_exp = (exp + tot_xp);
        var boost = 0,
            pNext = 0,
            done = false,
            max;

        Object.keys(bgp.daGame.daLevels).sort(function(a, b) {
            return bgp.daGame.daLevels[a].level - bgp.daGame.daLevels[b].level;
        }).forEach(function(v, l, a) {
            if (l >= level) {
                var x = parseInt(bgp.daGame.daLevels[l].xp);

                if (next_level + 1 < a.length) {
                    if (!done) {
                        if (next_exp >= x) {
                            next_exp -= x;
                            next_level += 1;
                            boost += parseInt(bgp.daGame.daLevels[next_level].boost);
                        }

                        if (next_exp < x) {
                            var px = ((next_exp / x) * 100);
                            pNext = px;
                            max = a.length - 1;
                            done = true;
                        }
                    }
                } else
                    max = a.length - 1;
            }
        });

        document.getElementById("next_level").innerText = done ? next_level : guiString('Maximum');
        document.getElementById("next_exp").innerText = numberWithCommas(next_exp);
        document.getElementById("next_exp2").innerText = done ? numberWithCommas(bgp.daGame.daLevels[next_level].xp) : '';
        document.getElementById("next_level%").innerText = done ? numberWithCommas(pNext, 2) + '%' : '';
        document.getElementById("next_level%2").innerText = done ? next_level + 1 : '';
        document.getElementById("boost").innerText = numberWithCommas(boost);

        if (stats) {
            document.getElementById("exp").innerText = numberWithCommas(exp);
            document.getElementById("exp2").innerText = numberWithCommas(bgp.daGame.daLevels[level].xp);
            document.getElementById("level").innerText = level;
            document.getElementById("level2").innerText = next_level;
            document.getElementById("next_level2").innerText = max;
            console.log(tot_crowns, tot_xp, tot_coin, boost);
            document.getElementById("ccStats").innerText = guiString('ccStats', [
                numberWithCommas(tot_crowns),
                numberWithCommas(tot_xp),
                numberWithCommas(tot_coin),
                numberWithCommas(boost)
            ]);
        }
    }

    /*
     ** Define this tab's details
     */
    self.tabs.Calculators.menu.crowns = {
        title: 'Pillars',
        image: 'pillars.png',
        html: true,
        onInit: onInit,
        onUpdate: onUpdate
    };
    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/