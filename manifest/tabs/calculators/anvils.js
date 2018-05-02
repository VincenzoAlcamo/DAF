/*
 ** DA Friends Calculator - anvils.js
 */
var guiTabs = (function(self) {
    var anvils, table, tbody, tgrid, tabID;
    var lokImg = '<img class="fb" src="/img/locked.png" width="16" height="16"/>';

    /*
     ** Define this Menu Item details
     */
    self.tabs.Calculators.menu.anvils = {
        title: 'Foundry',
        image: 'anvil.png',
        html: true,
        onInit: onInit,
        onUpdate: onUpdate,
    };

    /*
     ** @Private - Initialise the tab
     */
    function onInit(tid, cel) {
        anvils = 0;
        tabID = tid;
        table = document.getElementById("anTable");
        tbody = document.getElementById("antb1");
        tfoot = document.getElementById("antf1");
        guiText_i18n(table);

        var f = document.getElementsByName('aFilter');
        for (var i = 0; i < f.length; i++) {
            if (f[i].getAttribute('value') == bgp.exPrefs.aFilter) {
                f[i].setAttribute('checked', 'checked');
            } else
                f[i].removeAttribute('checked');

            f[i].addEventListener('click', function(e) {
                var aFilter = e.target.getAttribute('value');
                if ((!e.target.disabled) && bgp.exPrefs.aFilter != aFilter) {
                    bgp.exPrefs.aFilter = self.setPref('aFilter', aFilter);
                    self.update();
                }
            });
        }

        sorttable.makeSortable(table);
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        if (reason == 'active')
            return true;

        if ((!bgp.daGame.daUser) || !bgp.daGame.daProduce || !bgp.daGame.daUsables) {
            guiStatus('errorData', 'ERROR', 'error');
            return false;
        }

        //console.log(bgp.daGame.daProduce);
        //console.log(bgp.daGame.daUser.anvils);
        //console.log(bgp.daGame.daUser.alloys);

        tbody.innerHTML = '';

        if (bgp.daGame.daUser.anvils) {
            if ((anvils = bgp.daGame.daUser.anvils.length) > 1)
                document.getElementById("anvTimeHeader").innerHTML = Dialog.escapeHtmlBr(guiString("totalAnvTime", [anvils]));
        }

        var level = parseInt(bgp.daGame.daUser.level);
        var region = parseInt(bgp.daGame.daUser.region);

        Object.keys(bgp.daGame.daProduce).sort(function(a, b) {
            var o1 = bgp.daGame.daProduce[a];
            var o2 = bgp.daGame.daProduce[b];
            var u1 = 0,
                u2 = 0;

            if ((o1.eid - o2.eid) != 0)
                return o1.eid - o2.eid;

            if ((o1.rql - o2.rql) != 0)
                return o2.rql - o1.rql;

            if (bgp.daGame.daUsables.hasOwnProperty(o1.cgo.oid))
                u1 = bgp.daGame.daUsables[o1.cgo.oid].amt;

            if (bgp.daGame.daUsables.hasOwnProperty(o2.cgo.oid))
                u2 = bgp.daGame.daUsables[o2.cgo.oid].amt;

            return u2 - u1;
        }).forEach(function(did, i, a) {
            var o = bgp.daGame.daProduce[did];
            var ulk = bgp.daGame.daUser.alloys.indexOf(did) != -1;
            var show = true;

            if (!ulk)
                o.ulk = '0';    // Locked status seems to be messed up!

            if (o.rql > level || o.rid > region)
                show = false;

            if ((show) && bgp.exPrefs.aFilter != 'ALL') {
                if (o.ulk == '0') {
                    if (bgp.exPrefs.aFilter == 'PRD' && o.eid != 0)
                        show = false;
                    if (bgp.exPrefs.aFilter == 'PED' && o.eid == 0)
                        show = false;
                } else
                    show = false;
            }

            if (did != 0 && o.typ == 'alloy' && o.hde == 0 && show /*&& o.eid == 0*/ ) {
                var name = bgp.daGame.string(o.nid),
                    rspan = o.req.length,
                    anvTime = 0,
                    energy = 0,
                    gold = 0,
                    energyHour = 0,
                    anvImg = '',
                    html = [];
                
                console.log(did, name, rspan, ulk, o);

                if (bgp.daGame.daUsables.hasOwnProperty(o.cgo.oid)) {
                    if (o.eid != 0) {
                        anvImg = '<img src="/img/events.png" width="16" height="16" data-wiki-title="' +
                            self.eventName(o.eid) +
                            '"' + self.eventWiki(o.eid) +
                            '/>';
                    } else
                        anvImg = self.objectImage(o.cgo.typ, o.cgo.oid, 32);
                }
  
                html.push('<tr>');
                html.push('<td rowspan="', rspan, '">', anvImg, '</td>');
                html.push('<td rowspan="', rspan, '">', (o.ulk != '0' ? lokImg : ''), name, '</td>');
                html.push('<td rowspan="', rspan, '" sorttable_customkey="', o.rid, '">', self.regionImage(o.rid, true), '</td>');
                html.push('<td rowspan="', rspan, '">', numberWithCommas(o.rql), '</td>');
                html.push('<td rowspan="', rspan, '" sorttable_customkey="', o.drn, '">', self.duration(o.drn), '</td>');

                if (rspan > 0) {
                    ingredient(o.req[0].mid, o.req[0].amt, html);
                    var maxPossible = Math.floor(self.materialInventory(o.req[0].mid) / o.req[0].amt);

                    for (m = 1; m < rspan; m++) {
                        maxPossible = Math.min(
                            maxPossible,
                            Math.floor(self.materialInventory(o.req[m].mid) / o.req[m].amt)
                        );
                    }

                    anvTime = o.drn * Math.floor((maxPossible + anvils - 1) / anvils);

                    var avg = (intOrDefault(o.cgo.min) + intOrDefault(o.cgo.max)) / 2;

                    html.push('<td class="right" rowspan="', rspan, '">', numberWithCommas(Math.floor(avg * maxPossible)), '</td>');
                    html.push('<td class="right" rowspan="', rspan, '" sorttable_customkey="', anvTime, '">', self.duration(anvTime), '</td>');

                    if (bgp.exPrefs.aFilter != 'ALL' && !maxPossible)
                        show = false;

                } else {
                    html.push('<td>', '</td>');
                    html.push('<td>', '</td>');
                    html.push('<td>', '</td>');

                    html.push('<td>', '</td>');
                    html.push('<td>', '</td>');

                    if (bgp.exPrefs.aFilter != 'ALL')
                        show = false;
                }
                
                html.push('</tr>')

                for (m = 1; m < rspan; m++) {
                    html.push('<tr>');
                    ingredient(o.req[m].mid, o.req[m].amt, html);
                    html.push('</tr>');
                }

                if (show)
                    tbody.innerHTML += html.join('');
            }
        });
        return true;
    }
    
    function ingredient(mid, amt, html) {
        html.push('<td>', numberWithCommas(amt), '</td>');
        html.push('<td class="left">', self.materialName(mid), '</td>');
        html.push('<td class="right">', numberWithCommas(self.materialInventory(mid)), '</td>');
        return html;
    }

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/