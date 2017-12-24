/*
 ** DA Friends Calculator = rewards.js
 */
var guiTabs = (function(self) {
    const SECONDS_IN_A_DAY = 86400;

    var rlTable = null,
        numTotal = 0,
        numToCollect = 0,
        checkTimeHandler = 0,
        flagFirst = true,
        clearRowHandler = 0;

    /*
     ** Define this Menu Item details
     */
    var me = self.tabs.Calculators.menu.reward_links = {
        title: 'rewardLinks',
        image: 'materials/gems.png',
        html: true,
        clicked: {},
        onInit: onInit,
        onUpdate: onUpdate,
        onAction: onAction
    };

    /*
     ** @Private - Initialise the tab
     */
    function onInit(id, cel) {
        document.getElementById('rlAddLinks').addEventListener('click', onclickAddLinks);
        document.getElementById('rlRemoveLinks').addEventListener('click', onclickRemoveLinks);
        document.getElementById('rlRemoveSelected').addEventListener('click', onclickRemoveSelected);

        rlTable = document.getElementById("rlTable");
        sorttable.makeSortable(rlTable);
        rlTable.addEventListener('click', onclickTable, true)
    }

    /*
     ** @Private - Sync Action
     */
    function onAction(id, action, data) {
        //console.log(id, "onAction", action, data);
        if (action == 'rewards-update') {
            updateTable();
        }
    }

    function onclickTable(event) {
        var target = event.target;
        if (!target) return true;

        var reasons = [];

        function pushReason(title, text) {
            reasons.push({
                title: title,
                text: text
            });
        }

        function showNextReason() {
            var reason = reasons.shift();
            if (!reason) {
                target.setAttribute('clickanyway', '1');
                target.click();
                return;
            }
            self.dialog.show({
                title: reason.title,
                text: reason.text + '\n\n' + guiString('rlCollectAnyway'),
                defaultButton: Dialog.CANCEL,
                style: [Dialog.CRITICAL, Dialog.CONFIRM, Dialog.CANCEL]
            }, function(method, params) {
                if (method == Dialog.CONFIRM) showNextReason();
            });
        }

        if (target.tagName == 'INPUT') {
            target.parentNode.parentNode.classList.toggle('selected', target.checked);
        } else if (target.classList.contains('rlLink')) {
            var row = target.parentNode.parentNode,
                rewardId = row.id.substr(3),
                reward = bgp.daGame.getReward(rewardId),
                now = getUnixTime(),
                countClicked;
            if (reward) {
                if (event.target.getAttribute('clickanyway') == '1') {
                    event.target.removeAttribute('clickanyway');
                } else {
                    if (reward.cmt == -2 || reward.cmt > 0) {
                        pushReason(guiString('rlCollected'), guiString('rlInfoCollected'));
                    } else if (reward.cmt == -3) {
                        pushReason(guiString('rlMaxReached'), guiString('rlInfoMaxReached', [bgp.daGame.REWARDLINKS_DAILY_LIMIT]));
                    } else if (reward.cmt == -1) {
                        pushReason(guiString('rlExpired'), guiString('rlInfoExpired', [bgp.daGame.REWARDLINKS_VALIDITY_DAYS]));
                    } else if (reward.cmt == -4) {
                        pushReason(guiString('rlNoSelf'), guiString('rlInfoNoSelf'));
                    } else if (reward.cmt == -5) {
                        pushReason(guiString('rlBroken'), guiString('rlInfoBroken'));
                    }
                    if (bgp.daGame.rewardLinksData.next > now) {
                        pushReason(guiString('rlMaxReached'), guiString('rlAllCollected') + '\n' + guiString('rlNextTime', [unixDate(bgp.daGame.rewardLinksData.next, true)]));
                    }
                    if (bgp.daGame.compareRewardId(reward.id, bgp.daGame.rewardLinksData.expired || '') <= 0) {
                        pushReason(guiString('rlProbablyExpired'), guiString('rlInfoProbablyExpired'));
                    }
                    if ((countClicked = Object.keys(me.clicked).length) > 0 && countClicked + bgp.daGame.rewardLinksData.count >= bgp.daGame.REWARDLINKS_DAILY_LIMIT) {
                        pushReason(guiString('rlMaxReached'), guiString('rlInfoMayExceedLimit'));
                    }
                    if (reasons.length) {
                        event.preventDefault();
                        showNextReason();
                        return false;
                    }
                }
                row.setAttribute('status', '1');
                row.removeAttribute('rldate');
                me.clicked[reward.id] = now;
            }
        }
        return true;
    }

    function onclickAddLinks() {
        self.dialog.show({
            title: guiString('rlAddLinks'),
            html: Dialog.escapeHtmlBr(guiString('rlPasteAdd', [guiString('Confirm')])) + '<br/><textarea cols="60" rows="8" name="links"></textarea>',
            defaultButton: 'links',
            style: [Dialog.CONFIRM, Dialog.CANCEL]
        }, function(method, params) {
            if (method == Dialog.CONFIRM) {
                var arr = getLinkData(params.links),
                    numTotal = arr.length,
                    numAdded = numTotal && bgp.daGame.addRewardLinks(arr);
                if (numAdded == 0)
                    self.toast.show({
                        text: guiString('noLinksAdded')
                    });
            }
        });
    }

    function getRowId(reward) {
        return 'rl-' + reward.id;
    }

    function onclickRemoveLinks() {
        var html = [],
            days = parseInt(bgp.exPrefs.rewardsRemoveDays) || 0,
            title = guiString('rlRemoveLinks');
        if (days <= 0 || days > bgp.daGame.REWARDLINKS_REMOVE_DAYS - 1) days = bgp.daGame.REWARDLINKS_REMOVE_DAYS;
        html.push('<select name="days">');
        for (var i = 0; i <= bgp.daGame.REWARDLINKS_REMOVE_DAYS - 1; i++)
            html.push('<option value="', i, '"', i == days ? ' selected' : '', '>', i, '</option>');
        html.push('</select>');
        html = Dialog.escapeHtmlBr(guiString('rlRemoveLinksDays', [bgp.daGame.REWARDLINKS_REMOVE_DAYS])).replace('#DAYS#', html.join(''));
        self.dialog.show({
            title: title,
            html: html,
            style: [Dialog.CONFIRM, Dialog.CANCEL]
        }, function(method, params) {
            if (method != Dialog.CONFIRM) return;
            var days = parseInt(params.days);
            if (days >= 0) {
                self.setPref('rewardsRemoveDays', days);
                var rewards = Object.values(bgp.daGame.getRewards()),
                    now = getUnixTime(),
                    expiryThreshold = now - bgp.daGame.REWARDLINKS_VALIDITY_DAYS * SECONDS_IN_A_DAY,
                    checkThreshold = now - days * SECONDS_IN_A_DAY;
                rewards = rewards.filter(reward => reward.adt <= checkThreshold && (reward.adt <= expiryThreshold || (reward.cmt || 0) != 0));
                removeLinks(title, rewards);
            }
        });
    }

    function onclickRemoveSelected() {
        var rewards = Object.values(bgp.daGame.getRewards());
        rewards = rewards.filter(reward => {
            var row = document.getElementById(getRowId(reward)),
                cell = row && row.cells[0],
                input = cell && cell.firstChild;
            return input && input.checked ? true : false;
        });
        removeLinks(guiString('rlRemoveSelected'), rewards);
    }

    function removeLinks(title, rewards) {
        if (rewards.length == 0) {
            self.dialog.show({
                title: title,
                text: guiString('rlRemoveNone'),
                style: [Dialog.OK]
            });
        } else {
            self.dialog.show({
                title: title,
                text: guiString('rlRemoveConfirm', [rewards.length]),
                style: [Dialog.CONFIRM, Dialog.CANCEL]
            }, function(method) {
                if (method != Dialog.CONFIRM) return;
                bgp.daGame.removeReward(rewards, updateTable);
            });
        }
    }

    function getFBFriendAvatarUrl(fb_id) {
        return 'https://graph.facebook.com/v2.8/' + fb_id + '/picture';
    }

    let materialImageCache = {};
    bgp.daGame.materialImageCache = materialImageCache;

    function materialHTML(materialId) {
        if (!(materialId in materialImageCache)) {
            var image = '<img src="/img/q-hard.png" width="32" height="32"/>',
                text;
            if (materialId > 0) {
                image = guiTabs.objectImage('material', materialId, 32)
                if (materialId == 1) image = image.replace('coins', 'coin');
                text = guiTabs.materialName(materialId);
            } else if (materialId == -1) text = guiString('rlExpired');
            else if (materialId == -2) text = guiString('rlCollected');
            else if (materialId == -3) text = guiString('rlMaxReached');
            else if (materialId == -4) text = guiString('rlNoSelf');
            else if (materialId == -5) text = guiString('rlBroken');
            else if (materialId == -6) text = guiString('rlProbablyExpired');
            materialImageCache[materialId] = text ? image + ' ' + Dialog.escapeHtmlBr(text) : '';
        }
        return materialImageCache[materialId];
    }

    function updateTable() {
        var rewards = bgp.daGame.getRewards(),
            tbody = rlTable.getElementsByTagName("tbody")[0],
            rows = Array.from(tbody.rows),
            now = getUnixTime(),
            expiryThreshold = now - bgp.daGame.REWARDLINKS_VALIDITY_DAYS * SECONDS_IN_A_DAY,
            newLinkThreshold = now - 2,
            dataToSet = [],
            countAdded = 0,
            countUpdated = 0,
            rewardLinksRecent = bgp.daGame.rewardLinksRecent,
            expiredId = bgp.daGame.rewardLinksData.expired || '';

        numTotal = numToCollect = 0;
        rows.forEach(row => {
            var id = row.id.substr(3);
            if (!(id in rewards)) row.parentNode.removeChild(row);
        });
        Object.values(rewards).forEach(reward => {
            numTotal++;
            var id = getRowId(reward),
                materialId = reward.cmt || 0,
                row = document.getElementById(id),
                flagNew = false,
                flagUpdated = reward.id in rewardLinksRecent,
                cell;
            if (reward.id in rewardLinksRecent) {
                delete me.clicked[reward.id];
                delete rewardLinksRecent[reward.id];
            }
            if (materialId == 0 && reward.adt <= expiryThreshold) {
                reward.cmt = materialId = -1;
                dataToSet.push(reward);
            }
            if (!row) {
                row = tbody.insertRow();
                row.id = id;
                row.insertCell();
                row.insertCell();
                row.insertCell();
                row.insertCell();
                row.insertCell();
                row.insertCell();
                cell = row.cells[0];
                cell.innerHTML = '<input type="checkbox">';
                cell = row.cells[1];
                cell.innerHTML = '<a class="rlLink" target="_blank" href="' + getLink(reward, bgp.exPrefs.linkGrabConvert) + '">' + reward.id + '</a>';
                cell = row.cells[2];
                cell.textContent = unixDate(reward.adt, true);
                cell.setAttribute('sorttable_customkey', reward.adt);
                flagNew = true;
            }
            cell = row.cells[3];
            if (reward.cdt && cell.getAttribute('sorttable_customkey') != reward.cdt) {
                cell.setAttribute('sorttable_customkey', reward.cdt);
                cell.textContent = unixDate(reward.cdt, true);
                flagUpdated = true;
            }
            cell = row.cells[4];
            if (materialId && cell.getAttribute('materialid') != materialId) {
                cell.setAttribute('materialid', materialId);
                cell.classList.toggle('rlAlert', materialId < 0);
                cell.innerHTML = materialHTML(materialId);
                if (materialId < 0) cell.setAttribute('sorttable_customkey', 'ZZZ' + materialId);
                else cell.removeAttribute('sorttable_customkey');
                flagUpdated = true;
            } else if (!cell.hasAttribute('materialid') && !cell.classList.contains('rlAlert') && bgp.daGame.compareRewardId(reward.id, expiredId) <= 0) {
                cell.classList.add('rlAlert');
                cell.innerHTML = materialHTML(-6);
            }
            cell = row.cells[5];
            if (reward.cid && cell.getAttribute('cid') != reward.cid) {
                cell.setAttribute('cid', reward.cid);
                cell.innerHTML = '<a class="rlUser" target="_blank" href="https://www.facebook.com/' + reward.cid + '"><img class="rlUser" src="' + getFBFriendAvatarUrl(reward.cid) + '"/>' + reward.cnm + '</a>';
                flagUpdated = true;
            }
            if (!materialId && !reward.cdt) numToCollect++;
            if (!flagFirst && (flagNew || flagUpdated)) {
                row.setAttribute('status', flagNew ? '2' : '3');
                row.setAttribute('rldate', now);
                if (flagNew) countAdded++;
                else countUpdated++;
                if (reward.cmt) row.classList.add('rlCollected');
            }
        });
        flagFirst = false;
        if (dataToSet) bgp.daGame.setReward(dataToSet);
        sorttable.applySort(rlTable);
        showStats();
        // clear rows background color after some time
        var text = [];
        if (countAdded) text.push(guiString('rlLinksAdded', [countAdded]));
        if (countUpdated) text.push(guiString('rlLinksUpdated', [countUpdated]));
        if (text.length) {
            clearRowIndicator();
            self.toast.show({
                text: text.join('\n')
            });
        }
    }

    function clearRowIndicator() {
        var tbody = rlTable.getElementsByTagName("tbody")[0],
            rows = Array.from(tbody.rows).filter(row => row.hasAttribute('rldate')),
            threshold = getUnixTime() - 10,
            others = rows.filter(row => {
                if (parseInt(row.getAttribute('rldate')) > threshold) return true;
                row.removeAttribute('rldate');
                row.removeAttribute('status');
            });
        if (clearRowHandler) {
            clearTimeout(clearRowHandler);
            clearRowHandler = 0;
        }
        if (others.length) clearRowHandler = setTimeout(clearRowIndicator, 1000);
    }

    function showStats() {
        var element = document.getElementById('rlStatus'),
            now = getUnixTime(),
            next = bgp.daGame.rewardLinksData.next,
            flagNext = next > now,
            textNext, text;
        if (flagNext) {
            text = guiString('rlAllCollected') + ' ';
        } else {
            text = guiString('rlCountRemaining', [100 - bgp.daGame.rewardLinksData.count]);
            next = bgp.daGame.rewardLinksData.first;
            if (next) next += bgp.daGame.REWARDLINKS_REFRESH_HOURS * 3600;
        }
        textNext = next > now ? guiString('rlNextTime', [unixDate(next, true)]) + '\n' : '';
        element.textContent = text + (flagNext ? textNext : '');
        element.classList.toggle('wait', flagNext);
        document.getElementById('rlStats').innerHTML = Dialog.escapeHtmlBr((flagNext ? '' : textNext) + guiString('rlStats', [numToCollect, numTotal]));
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        updateTable();
        return true;
    }

    /* BEGIN - LINK HELPER FUNCTIONS */
    var reLink1 = /https?:\/\/l\.facebook\.com\/l.php\?u=([^&\s]+)(&|\s|$)/g;
    var reLink2 = /https?:\/\/diggysadventure\.com\/miner\/wallpost_link.php\S+[\?&]url=([^&\s]+)(&|\s|$)/g;
    var reFacebook = /https?:\/\/apps\.facebook\.com\/diggysadventure\/wallpost\.php\?wp_id=(\d+)&fb_type=(standard|portal)&wp_sig=([0-9a-z]+)/g;
    var rePortal = /https?:\/\/portal\.pixelfederation\.com\/(([^\/]+\/)?gift|wallpost)\/diggysadventure\?params=(([0-9a-zA-Z\-_]|%2B|%2F)+(%3D){0,2})/g;

    function getLinkData(href) {
        var result = [],
            hash = {},
            match, data;

        function getObj(id, typ, sig) {
            if (id in hash) return null;
            hash[id] = true;
            return {
                id: id,
                typ: typ,
                sig: sig
            };
        }
        href = href.replace(reLink1, (a, b) => ' ' + decodeURIComponent(b) + ' ');
        href = href.replace(reLink2, (a, b) => ' ' + decodeURIComponent(b) + ' ');
        if (href.indexOf('://apps.facebook.com/') > 0) {
            reFacebook.lastIndex = 0;
            while ((match = reFacebook.exec(href))) {
                data = getObj(match[1], match[2], match[3]);
                if (data) result.push(data);
            }
        }
        if (href.indexOf('://portal.pixelfederation.com/') > 0) {
            rePortal.lastIndex = 0;
            while ((match = rePortal.exec(href))) {
                try {
                    var params = decodeURIComponent(match[3]).replace(/\-/g, '+').replace(/_/g, '/'),
                        payload = atob(params),
                        json = JSON.parse(payload);
                    if (json.wp_id && json.fb_type && json.wp_sig) {
                        data = getObj(json.wp_id, json.fb_type, json.wp_sig);
                        if (data) result.push(data);
                    }
                } catch (e) {}
            }
        }
        return result;
    }

    function getLink(data, convert = 0) {
        if ((data.typ == 'portal' && convert == 0) || convert == 2) {
            var json = JSON.stringify({
                action: 'wallpost',
                wp_id: data.id,
                fb_type: data.typ,
                wp_sig: data.sig
            });
            return 'https://portal.pixelfederation.com/wallpost/diggysadventure?params=' + encodeURIComponent(btoa(json));
        }
        return 'https://apps.facebook.com/diggysadventure/wallpost.php?wp_id=' + encodeURIComponent(data.id) + '&fb_type=' + encodeURIComponent(data.typ) + '&wp_sig=' + encodeURIComponent(data.sig);
    }
    /* END - LINK HELPER FUNCTIONS */

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/