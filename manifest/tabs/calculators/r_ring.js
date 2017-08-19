/*
 ** DA Friends Calculator = g_ring.js
 */
var guiTabs = (function(self) {
    var mines = [880, 1717, 1718];
    /*
     ** Define this Menu Item details
     */
    self.tabs.Calculators.menu.r_ring = {
        title: 'redRings',
        image: 'materials/r_ring.png',
        html: true,
        onInit: onInit,
        onUpdate: onUpdate,
    };

    /*
     ** @Private - Initialise the tab
     */
    function onInit(id, cel) {
        console.log(bgp.daGame);
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        var tab = self.tabs.Calculators.menu.r_ring.html;
        var region = parseInt(bgp.daGame.daUser.region);
        var level = parseInt(bgp.daGame.daUser.level);
        
        tab.innerHTML = '';

        for (var m = 0; m < mines.length; m++) {
            var mine = bgp.daGame.mineDetails(mines[m]);
            var rows = 0;
            var html = [];

            console.log(mine);
            
            if ((mine === null) || mine.region_id > region)
                continue;

            html.push('<div class="card clicker">', '<h1>');
            html.push(self.regionImage(mine.region_id, false, 32));
            html.push('<span>', mine.name, '</span>', '<img src="" />');
            html.push('</h1>', '<div id="rring', m, '">');
            html.push('<table id="rringt', m, '" class="rings">');
            html.push('<thead>', '<tr>');
            html.push('<td>', '<img src="/img/chest.png"/>', '</td>');
            html.push('<td>', guiString('Loot'), '</td>');
            html.push('<td>', guiString('Min'), '</td>');
            html.push('<td>', guiString('Max'), '</td>');
            html.push('<td>', guiString('Avg'), '</td>');
            html.push('</tr>', '</thead>');
            
            Object.keys(mine.floors).forEach(function(fid) {
                if (mine.floors[fid].hasOwnProperty('loot')) {
                    html.push('<tbody id="rringtb', m, '-', fid, '">');
                    Object.keys(mine.floors[fid].loot).forEach(function(lid) {
                        var loot = mine.floors[fid].loot[lid];
                        var coef = parseFloat(loot.cof);
                        var min = coef != 0.0 ? Math.floor(loot.min * (level * coef)) : parseInt(loot.min);
                        var max = coef != 0.0 ? Math.floor(loot.max * (level * coef)) : parseInt(loot.max);
                        var avg = Math.floor((min + max) / 2);

                        html.push('<tr>');
                        html.push('<td>', loot.aid, '</td>');
                        html.push('<td>', self.objectName(loot.typ, loot.oid), '</td>');
                        html.push('<td>', numberWithCommas(min), '</td>');
                        html.push('<td>', numberWithCommas(max), '</td>');
                        html.push('<td>', numberWithCommas(avg), '</td>');
                        html.push('</tr>');
                        rows += 1;
                    });
                    html.push('</tbody>');
                }
            });

            if (rows) {
                html.push('</table>', '<br />');
                html.push('</div>', '</div>');
                tab.innerHTML += html.join('');
            }
        }

        if (tab.innerHTML) {
            guiCardToggle(tab);
        } else
            tab.innerHTML = '<h1>' + guiString('ringsNotQualified', [guiString('redRings')]) + '</h1>';

        return true;
    }

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/