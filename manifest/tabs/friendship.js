/*
 ** DA Friends - friendship.js
 */
var guiTabs = (function(self) {
    var tabID, ifTable, matchingUid, searchTerm;
    var firstTimeManualHelp = true,
        numFriends = 0,
        numDisabled = 0,
        numNeighbours = 0,
        numMatched = 0,
        numMatchedImage = 0,
        numMatchedManually = 0,
        numIgnored = 0,
        numAnalyzed = 0,
        numToAnalyze = 0;

    var buttonUnlink = '<button class="action unlink" title="' + Dialog.escapeHtml(guiString('ActionUnlink')) + '"></button>',
        buttonIgnore = '<button class="action ignore" title="' + Dialog.escapeHtml(guiString('ActionIgnore')) + '"></button>',
        buttonRegard = '<button class="action regard" title="' + Dialog.escapeHtml(guiString('ActionRegard')) + '"></button>',
        buttonManual = '<button class="action manual" title="' + Dialog.escapeHtml(guiString('ActionManual')) + '"></button>';

    /*
     ** Define this tab's details
     */
    var thisTab = {
        title: 'Friendship',
        image: 'friends.png',
        order: 4,
        html: true,
        onInit: onInit,
        onUpdate: onUpdate,
        onAction: onAction
    };
    self.tabs.Friendship = thisTab;

    /*
     ** @Private - Initialise the tab
     */
    function onInit(id, cel) {
        // Do any one time initialisation stuff in here
        tabID = id;

        document.getElementById('ifCollect').addEventListener('click', showCollectDialog);

        ifTable = document.getElementById('ifTable');
        guiText_i18n(ifTable);
        var tbody = ifTable.getElementsByTagName("tbody")[0];
        tbody.addEventListener('click', tableClick);
        tbody.addEventListener('render', function(event) {
            updateRow(event.target);
        });
        ifTable.addEventListener('sort', updateTable);
        sorttable.makeSortable(ifTable);
        sorttable.setSortHeader(ifTable, 1, true);

        document.getElementById('fMatchPlayer').addEventListener('click', cancelMatch);

        var searchInput = document.getElementById('fSearch'),
            searchHandler = 0;
        searchInput.addEventListener('input', function() {
            var value = searchInput.value.toUpperCase();
            if (value != searchTerm) {
                searchTerm = value;
                if (searchHandler) clearTimeout(searchHandler);
                searchHandler = setTimeout(updateTable, 500);
            }
        });

        var select = document.getElementById('fFilter');
        var filters = 'ADMGHIFUNS'.split('');
        filters.forEach(char => {
            var option = document.createElement('option');
            option.value = char;
            select.appendChild(option);
        });
        var filter = bgp.exPrefs.fFilter;
        if (filters.indexOf(filter) < 0) filter = filters[0];
        select.value = filter;
        select.addEventListener('change', function(e) {
            var filter = document.getElementById('fFilter').value;
            bgp.exPrefs.fFilter = filter;
            //filterTable();
            updateTable();
        });
    }

    /*
     ** @Private - Sync Action
     */
    function onAction(id, action, data) {
        //console.log(id, "onAction", action, data);
        if (action == 'friends-analyze') {
            matchStoreAndUpdate();
        }
    }

    function storeFriends(flagStoreNeighbours) {
        bgp.daGame.setFriends();
        // store neighbours
        if (flagStoreNeighbours) bgp.daGame.cacheSync();
    }

    function getRemoveGhosts() {
        return parseInt(bgp.exPrefs.removeGhosts) || 0;
    }

    function showCollectDialog() {
        var ghost = getRemoveGhosts();

        function msg(id) {
            return Dialog.escapeHtmlBr(guiString(id));
        }

        function addAlternateSettings(method) {
            var extra = '';
            if (method == 'alternate') {
                extra += '<br>' + guiString('fCollectGhostDelete') + ' <select name="ghost">';
                for (var i = 0; i <= 2; i++)
                    extra += '<option value="' + i + '"' + (i == ghost ? ' selected' : '') + '>' + guiString('fCollectGhost' + i) + '</option>';
                extra += '</select>';
            }
            return extra;
        }

        function getMessageId(method) {
            return 'fCollect' + method.charAt(0).toUpperCase() + method.substr(1);
        }

        function button(method) {
            var msgId = getMessageId(method);
            return '<tr><td><button value="' + method + '">' + msg(msgId) + '</button></td><td>' + msg(msgId + 'Info') + addAlternateSettings(method) + '</td></tr>';
        }

        function setNewGhost(params) {
            var newGhost = parseInt(params.ghost) || 0;
            if (ghost != newGhost) {
                self.setPref('removeGhosts', newGhost);
                ghost = newGhost;
            }
        }

        var friends = Object.values(bgp.daGame.getFriends());
        numFriends = friends.length;
        var buttons = [button('standard'), button('alternate'), numFriends > 0 ? button('match') : ''];
        self.dialog.show({
            title: guiString('fCollect'),
            html: msg('fCollectPreamble') + '<table style="margin-top:16px">' + buttons.join('') + '</table>',
            style: ['standard', 'alternate', 'match', Dialog.CANCEL]
        }, function(method, params) {
            setNewGhost(params);
            if (method == 'standard' || method == 'alternate' || method == 'match') {
                self.dialog.show({
                    title: guiString('fCollect'),
                    html: msg(getMessageId(method) + 'Info') + addAlternateSettings(method) + '<br><br>' + msg('ConfirmWarning'),
                    style: [Dialog.CRITICAL, Dialog.CONFIRM, Dialog.CANCEL]
                }, function(confirmation, params) {
                    if (method == 'alternate') setNewGhost(params);
                    if (confirmation != Dialog.CONFIRM) return;
                    if (method == 'standard') collectFriends(false);
                    else if (method == 'alternate') collectFriends(true);
                    else if (method == 'match') matchStoreAndUpdate();
                });
            }
        });
    }

    function collectFriends(flagAlternate) {
        var width = 1000,
            height = 500;
        chrome.windows.create({
            width: width,
            height: height,
            left: Math.floor((screen.availWidth - width) / 2),
            top: Math.floor((screen.availHeight - height) / 2),
            type: 'popup',
            url: 'https://www.facebook.com/profile.php?sk=friends'
        }, function(w) {
            var tabId = w.tabs[0].id;
            bgp.excludeFromInjection(tabId);
            chromeMultiInject(tabId, {
                file: [
                    '/manifest/dialog.js',
                    'code:mode=' + (flagAlternate ? 2 : 1) + ';ghost=' + getRemoveGhosts() + ';',
                    '/manifest/content_friendship.js'
                ],
                runAt: 'document_end',
                allFrames: false,
                frameId: 0
            });
        });
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        // We ignore an activated tab condition.
        if (reason == 'active')
            return true;

        // Called everytime the page is/needs updating
        updateTable();
        if (numFriends == 0) setTimeout(showCollectDialog, 500);
        return true;
    }

    function tableClick(event) {
        var row = event.target;
        while (true) {
            if (!row || row.tagName == 'TABLE') return;
            if (row.tagName == 'TR') break;
            row = row.parentNode;
        }
        var el = event.target,
            id = row.id,
            fb_id = id.startsWith('fb-') ? id.substr(3) : null,
            uid = id.startsWith('nb-') ? id.substr(3) : null,
            friend = fb_id && bgp.daGame.getFriend(fb_id),
            pal = uid && getNeighbour(uid),
            flagModified = false,
            i, row2;

        if (el.tagName == 'TD' && el.cellIndex == 2 && ifTable.classList.contains('f-matching') && matchingUid && friend && friend.score <= 0) {
            // MANUAL MATCH
            pal = getNeighbour(matchingUid);
            row2 = document.getElementById('nb-' + pal.uid);
            if (row2) row2.parentNode.removeChild(row2);
            matchFriendBase(friend, pal, 99);
            flagModified = true;
            cancelMatch();
        } else if (el.tagName != 'BUTTON' || !el.classList.contains('action')) {
            return;
        } else if (el.classList.contains('unlink') && friend && friend.score > 0 && friend.uid) {
            // UNLINK
            uid = friend.uid;
            pal = getNeighbour(uid);
            numMatched--;
            delete friend.uid;
            delete friend.score;
            flagModified = true;
            if (isRowVisible(null, pal)) {
                row2 = row.parentNode.appendChild(document.createElement('tr'));
                row2.id = 'nb-' + uid;
                updateRow(row2);
            }
            pal = null;
        } else if (friend && (el.classList.contains('ignore') || el.classList.contains('regard'))) {
            // IGNORE or REGARD
            var flag = el.classList.contains('ignore');
            delete friend.uid;
            delete friend.score;
            if (flag) friend.score = -1;
            flagModified = true;
            if (flag) numIgnored++;
            else numIgnored--;
        } else if (el.classList.contains('manual') && pal) {
            if (matchingUid == pal.uid) {
                cancelMatch();
            } else {
                var div = document.getElementById('fMatchPlayer');
                div.getElementsByClassName('DAF-gc-level')[0].innerText = pal.level;
                div.getElementsByClassName('DAF-gc-avatar')[0].src = pal.pic_square;
                div.getElementsByClassName('DAF-gc-name')[0].innerText = getPlayerNameFull(pal);
                div.style.display = 'block';
                ifTable.classList.add('f-matching');
                matchingUid = pal.uid;
                if (firstTimeManualHelp) {
                    firstTimeManualHelp = false;
                    self.dialog.show({
                        text: guiString('ManualMatchHelp'),
                        style: [Dialog.OK]
                    });
                }
            }
        }
        if (flagModified) {
            if (isRowVisible(friend, pal)) updateRow(row);
            else row.parentNode.removeChild(row);
            bgp.daGame.setFriend(friend)
            showStats();
        }
    }

    function cancelMatch() {
        matchingUid = null;
        document.getElementById('fMatchPlayer').style.display = 'none';
        ifTable.classList.remove('f-matching');
    }

    function getNeighboursAsNotMatched() {
        var neighbours = bgp.daGame.daUser.neighbours;
        var notmatched = Object.assign({}, neighbours);
        delete notmatched[0];
        delete notmatched[1];
        return notmatched;
    }

    function getNeighbour(uid) {
        return bgp.daGame.daUser.neighbours[uid];
    }

    function isRowVisible(friend, pal) {
        if (searchTerm) {
            var term = (friend ? friend.name : '') + '\t' + (pal ? getPlayerNameFull(pal) : '');
            if (term.toUpperCase().indexOf(searchTerm) < 0) return false;
        }
        switch (bgp.exPrefs.fFilter) {
            case 'A':
                return true;
            case 'D':
                return friend && friend.disabled;
            case 'M':
                return friend && pal;
            case 'G':
                return friend && pal && friend.score == 95;
            case 'H':
                return friend && pal && friend.score == 99;
            case 'I':
                return friend && friend.score == -1;
            case 'F':
                return friend && friend.score == 0;
            case 'U':
                return friend && !pal;
            case 'N':
                return pal && !friend;
            case 'S':
                return friend ? friend.score == 0 : pal;
            default:
                return false;
        }
    }

    function updateTable() {
        var friends = Object.values(bgp.daGame.getFriends()),
            notmatched = getNeighboursAsNotMatched(),
            filter = bgp.exPrefs.fFilter,
            sortInfo = sorttable.getSortInfo(ifTable),
            sortKey = sortInfo.cell && sortInfo.cell.getAttribute('sortkey'),
            convert = sortInfo.convertFn,
            sort = sortInfo.sortFn,
            isAscending = sortInfo.ascending,
            arr = [];
        numFriends = friends.length;
        numNeighbours = Object.keys(notmatched).length;
        numMatched = numMatchedImage = numMatchedManually = numDisabled = numIgnored = 0;
        var firstAlpha = isAscending ? '0' : '1',
            lastAlpha = isAscending ? '1' : '0',
            lastDate = isAscending ? 9e9 : 0;
        var getSortValue =
            sortKey == 'fname' ? (friend, pal) => (friend ? firstAlpha + friend.name : lastAlpha) :
            sortKey == 'fdate' ? (friend, pal) => (friend ? friend.adt || lastDate : lastDate) :
            sortKey == 'fscore' ? (friend, pal) => (friend ? (friend.score > 0 || !isAscending ? friend.score : 101 - friend.score) : (isAscending ? 103 : -2)) :
            sortKey == 'nname' ? (friend, pal) => (pal ? firstAlpha + getPlayerNameFull(pal) : lastAlpha) :
            sortKey == 'nlevel' ? (friend, pal) => (pal ? pal.level : (sortInfo.ascending ? 9999 : -1)) :
            sortKey == 'ndate' ? (friend, pal) => (pal ? getPlayerCreated(pal) : lastDate) :
            (friend, pal) => '';
        friends.forEach(friend => {
            var pal = friend.score > 0 && notmatched[friend.uid];
            if (friend.disabled) numDisabled++;
            if (pal) {
                delete notmatched[friend.uid];
                numMatched++;
                if (friend.score == 95) numMatchedImage++;
                if (friend.score == 99) numMatchedManually++;
            } else {
                if (friend.score == -1) numIgnored++;
                else friend.score = 0;
            }
            if (isRowVisible(friend, pal))
                arr.push([convert(getSortValue(friend, pal)), '<tr id="fb-' + friend.fb_id + '" lazy-render height="61"></tr>']);
        });
        Object.keys(notmatched).forEach(uid => {
            var pal = notmatched[uid];
            if (isRowVisible(null, pal))
                arr.push([convert(getSortValue(null, pal)), '<tr id="nb-' + uid + '" lazy-render height="61"></tr>']);
        });

        if (sortKey) {
            arr.sort((a, b) => sort(a[0], b[0]));
            if (!sortInfo.ascending) arr.reverse();
        }
        var html = arr.map(item => item[1]).join('');

        var tbody = ifTable.getElementsByTagName("tbody")[0];
        tbody.innerHTML = html;
        self.collectLazyImages();
        showStats();
    }

    function updateRow(row) {
        var id = row.id.substr(3),
            isFriend = row.id.startsWith('fb-'),
            fb_id = isFriend && id,
            friend = isFriend && bgp.daGame.getFriend(fb_id),
            uid = isFriend ? friend.score > 0 && friend.uid : id,
            pal = uid && getNeighbour(uid),
            today = getUnixTime(),
            html = [],
            created;
        created = friend && friend.adt;
        if (friend) {
            var a = getFBFriendAnchor(fb_id);
            html.push('<td>', a, '<img height="50" width="50" src="', getFBFriendAvatarUrl(fb_id), '"/></a></td>');
            html.push('<td>', a, friend.name, '</a></td>');
            html.push('<td>', created ? unixDate(created, false, false) + '<br>' + unixDaysAgo(created, today, 0) : '', '</td>');
            if (pal) {
                html.push('<td>', friend.score, '</td>');
                html.push('<td>', buttonUnlink, '</td>');
            } else {
                html.push('<td></td><td>', friend.score == -1 ? buttonRegard : buttonIgnore, '</td>');
            }
        } else {
            html.push('<td></td><td></td><td></td><td></td><td>', buttonManual, ' </td>');
        }
        created = pal && getPlayerCreated(pal);
        if (pal) {
            a = getFBFriendAnchor(pal.fb_id);
            html.push('<td>', a, '<img height="50" width="50" src="' + pal.pic_square + '"/></a></td>');
            html.push('<td>', a, getPlayerNameFull(pal), '</a></td>');
            html.push('<td>', pal.level, '</td>');
        } else {
            html.push('<td></td><td></td><td></td>');
        }
        html.push('<td>', created ? unixDate(created, false, false) + '<br>' + unixDaysAgo(created, today, 0) : '', '</td>');
        row.innerHTML = html.join('');
        var isIgnored = friend ? friend.score == -1 : false,
            isDisabled = friend ? !!friend.disabled : false,
            isNotMatched = friend && !pal ? !isIgnored : false;
        row.classList.toggle('f-disabled', isDisabled);
        row.classList.toggle('f-ignored', isIgnored);
        row.classList.toggle('f-notmatched', isNotMatched);
    }

    function getFBFriendAvatarUrl(fb_id) {
        return 'https://graph.facebook.com/v2.8/' + fb_id + '/picture';
    }

    function getFBFriendAnchor(fb_id) {
        return '<a target="_blank" href="https://www.facebook.com/' + fb_id + '">';
    }

    function showStats() {
        var html = [];
        if (bgp.daGame.friendsCollectDate > 0) {
            html.push(guiString('FriendUpdateInfo', [numberWithCommas(numFriends), numberWithCommas(numNeighbours), unixDate(bgp.daGame.friendsCollectDate, 'full')]));
        }
        if (numToAnalyze == numAnalyzed || numToAnalyze == 0) {
            self.wait.hide();
        } else {
            var num = Math.min(numAnalyzed > 0 ? numAnalyzed + 1 : 0, numToAnalyze),
                analyzingText = guiString('AnalyzingMatches', [Math.floor(num / numToAnalyze * 100), num, numToAnalyze]);
            self.wait.setText(analyzingText);
            if (html.length) html.push('<br>');
            html.push(analyzingText);
        }
        document.getElementById('ifStats').innerHTML = html.join('');

        var params = {
            'fFilterA': [numberWithCommas(numFriends), numberWithCommas(numNeighbours)],
            'fFilterD': [numberWithCommas(numDisabled)],
            'fFilterM': [numberWithCommas(numMatched)],
            'fFilterG': [numberWithCommas(numMatchedImage)],
            'fFilterH': [numberWithCommas(numMatchedManually)],
            'fFilterI': [numberWithCommas(numIgnored)],
            'fFilterF': [numberWithCommas(numFriends - numMatched - numIgnored)],
            'fFilterU': [numberWithCommas(numFriends - numMatched)],
            'fFilterN': [numberWithCommas(numNeighbours - numMatched)],
            'fFilterS': [numberWithCommas(numNeighbours - numMatched + numFriends - numMatched - numIgnored)]
        };
        Array.from(document.getElementById('fFilter').getElementsByTagName('option')).forEach(option => {
            var msgId = 'fFilter' + option.value;
            option.innerText = guiString(msgId, params[msgId]);
        });
    }

    function matchFriendBase(friend, pal, score) {
        if (!friend || !pal) return false;
        friend.uid = pal.uid;
        friend.score = score;
        pal.isFriend = true;
        pal.realFBid = friend.fb_id;
        if (!pal.timeVerified)
            pal.timeVerified = getUnixTime();
        var fullName = getPlayerNameFull(pal);
        if (fullName == friend.name) delete pal.realFBname;
        else pal.realFBname = friend.name;
        numMatched++;
        if (score == 95) numMatchedImage++;
        if (score == 99) numMatchedManually++;
        return true;
    }

    function matchStoreAndUpdate() {
        var rest, notmatched, images, friendData, neighbourData, canvas;
        var hashById = {},
            hashByName = {};

        cancelMatch();

        var friends = Object.values(bgp.daGame.getFriends());
        numFriends = friends.length;
        if (numFriends == 0) return;

        notmatched = getNeighboursAsNotMatched();
        numNeighbours = Object.keys(notmatched).length;

        numMatched = numMatchedImage = numMatchedManually = numToAnalyze = numAnalyzed = numIgnored = 0;

        // we reset the isFriend flag
        Object.keys(notmatched).forEach(uid => {
            notmatched[uid].isFriend = false;
        });

        // we reset the association on friends
        friends.forEach(friend => {
            // we keep those who match by id or image, and clear the others
            if (friend.uid && friend.uid in notmatched && friend.score >= 95) {
                matchFriend(friend, notmatched[friend.uid], friend.score);
            } else if (friend.score == -1) {
                numIgnored++;
            } else {
                delete friend.uid;
                delete friend.score;
            }
        });

        rest = friends;
        rest = rest.filter(friend => !friend.score);

        // sort friends, disabled last
        rest.sort((a, b) => (a.disabled ? 1 : 0) - (b.disabled ? 1 : 0));

        matchRest(false);

        // Collect images to match
        images = [];
        rest.forEach(friend => {
            if (!friend.disabled) addImage('f' + friend.fb_id, getFBFriendAvatarUrl(friend.fb_id))
        });
        var numFriendsToAnalyze = images.length;
        Object.values(notmatched).forEach(pal => addImage('n' + pal.uid, pal.pic_square));
        var numNeighboursToAnalyze = images.length - numFriendsToAnalyze;
        // If there is at least one person in each group
        if (numFriendsToAnalyze > 0 && numNeighboursToAnalyze > 0) {
            friendData = [];
            neighbourData = [];
            canvas = document.createElement('canvas');
            // Start num parallel tasks to load images
            var num = 2;
            num = Math.min(images.length, num);
            while ((num--) > 0) collectNext(createImage());
        } else {
            numToAnalyze = numAnalyzed = 0;
            storeFriends(true);
            updateTable();

            // Signal Neighbours Tab to Refresh its display
            self.tabs['Neighbours'].time = null;
        }

        function matchFriend(friend, pal, score) {
            if (matchFriendBase(friend, pal, score)) {
                delete hashById[pal.fb_id];
                delete hashById[pal.portal_fb_id];
                delete hashByName[getPlayerNameFull(pal)];
                delete notmatched[pal.uid];
            }
        }

        function matchRest() {
            // prepare match
            // set the hashes
            hashById = {}, hashByName = {};
            Object.keys(notmatched).forEach(uid => {
                var pal = notmatched[uid],
                    key;
                // if the same key is already used, we set it to null to force an image comparison
                // store by fb_id
                key = pal.fb_id;
                hashById[key] = key in hashById ? null : pal;
                // store by portal_fb_id
                if (key != pal.portal_fb_id && (key = pal.portal_fb_id)) hashById[key] = key in hashById ? null : pal;
                // store by full name
                key = getPlayerNameFull(pal);
                hashByName[key] = key in hashByName ? null : pal;
            });

            // Match by FB id
            rest.forEach(friend => matchFriend(friend, hashById[friend.fb_id], 100));
            rest = rest.filter(friend => !friend.score);

            // prepare friends
            var hash = {},
                col = rest;
            rest.forEach(friend => {
                var names = friend.name.split(' ');
                friend.names = names;
                friend.skip = false;
                if (names.length > 1) {
                    var first = names[0],
                        last = names[names.length - 1],
                        key1 = first + '\t' + last,
                        key2 = last + '\t' + first;
                    if (key1 in hash || key2 in hash) {
                        hash[key1].skip = true;
                        friend.skip = true;
                    } else {
                        hash[key1] = hash[key2] = friend;
                    }
                }
            });

            var skipped = rest.filter(friend => friend.skip);
            if (bgp.exPrefs.debug) console.log("Skipped", skipped);
            rest = rest.filter(friend => !friend.skip);

            // Match functions [score, fn] in order of score descending
            var matchFunctions = [
                // Match by full name
                [90, friend => hashByName[friend.name]],
                // Match by first name + last name
                [80, friend => {
                    var names = friend.names;
                    return names.length > 1 ? hashByName[names[0] + ' ' + names[names.length - 1]] : null;
                }],
                // Match by last name + first name
                [70, friend => {
                    var names = friend.names;
                    return names.length > 1 ? hashByName[names[names.length - 1] + ' ' + names[0]] : null;
                }],
                // Chinese characters
                [60, friend => {
                    var names = friend.names,
                        ch = names[0],
                        pal = null;
                    if (names.length == 1 && ch.charCodeAt(0) >= 19968) {
                        // Match by second character (as first name) + first character (as last name)
                        pal = hashByName[ch.substr(1) + ' ' + ch.substr(0, 1)];
                        // If there are at least 4 characters
                        if (!pal && ch.length >= 4) {
                            // Match by 3rd-to-end characters (as first name) + 1st two characters (as last name)
                            pal = hashByName[ch.substr(2) + ' ' + ch.substr(0, 2)];
                        }
                    }
                    return pal;
                }]
            ];
            // try to match, one method at a time
            for (var i = 0, len = matchFunctions.length; i < len; i++) {
                var fn = matchFunctions[i][1],
                    score = matchFunctions[i][0];
                rest.forEach(friend => matchFriend(friend, fn(friend), score));
                rest = rest.filter(friend => !friend.score);
            }

            rest = rest.concat(skipped);

            // cleanup
            col.forEach(friend => {
                delete friend.names;
                delete friend.skip;
            });
        }

        function addImage(id, url) {
            numToAnalyze++;
            images.push([id, url]);
        }

        function collectNext(img) {
            var a = images.pop();
            if (a) {
                img.id = a[0];
                img.src = a[1];
            }
        }

        function createImage() {
            var img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = imageOnLoad;
            img.onerror = imageOnLoad;
            return img;
        }


        function imageOnLoad() {
            // this is the image used by FB when a profile has no picture
            const FB_ANON_MALE_IMG = 'data:image/webp;base64,UklGRrIAAABXRUJQVlA4IKYAAACQBwCdASoyADIAPm0qkUWkIqGYDf2AQAbEtIBp7Ay0G/WSUM7JlLizCyxMfDWO4GTZsZ3rW/OD7o4ZrD5+BT08hIdEQYAA/voQZ4IvItpppdVXQWuubgHZ7Hz5ClT98CfXGkCeTZrhstMPkFiBPgl23Ssn29LDaI8GTQEsEUH2eeI8S7rLcNeX3hT74sAvZ2QAc9yDKh3vCDZXO6AcSFxINezC50AA';
            const FB_ANON_FEMALE_IMG = 'data:image/webp;base64,UklGRr4AAABXRUJQVlA4ILIAAABwBwCdASoyADIAPm0sk0WkIqGYDP0AQAbEtIBpOAqR8vvvO+zCp3M5F/ypDPVcAFo8VaiTamuvfoNQ/F5jaFiClqnYAAD++hBpI/d9yd90D8hRGlQZaLknz1bhjUBHwA03kCUnr+UZrKEK7H/RvtF2vwwgGNTfo5enYKkJ23075Nyi25PsFHIttUiGOfXnjtuOyT6lisDClpVR4YKW7iP+LCUUBF1yzvTUONcxCYqsEAAA';
            numAnalyzed++;
            showStats();
            var img = this;
            if (img.complete && img.naturalHeight > 0) {
                // get picture as base64 string
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var dataURL = canvas.toDataURL('image/webp');
                if (dataURL != FB_ANON_MALE_IMG && dataURL != FB_ANON_FEMALE_IMG) {
                    var isFriend = img.id.charAt(0) == 'f',
                        id = img.id.substr(1),
                        data = [id, dataURL];
                    if (isFriend) friendData.push(data);
                    else neighbourData.push(data);
                }
            }
            if (numToAnalyze && numAnalyzed == numToAnalyze) {
                // all images are loaded
                numToAnalyze = numAnalyzed = 0;
                matchByImage();
                // then try to match by name (again)
                matchRest();
                storeFriends(true);
                updateTable();

                // Signal Neighbours Tab to Refresh its display
                self.tabs['Neighbours'].time = null;
            }
            collectNext(img);
        }

        function matchByImage() {
            for (var i = 0, len = friendData.length; i < len; i++) {
                var data = friendData[i],
                    fb_id = data[0],
                    dataURL = data[1],
                    friendsMatched = friendData.filter(data => data[1] == dataURL),
                    neighbourMatched = neighbourData.filter(data => data[1] == dataURL);
                // Image should be unique
                if (friendsMatched.length == 1 && neighbourMatched.length == 1) {
                    var friend = friends.find(friend => friend.fb_id == fb_id),
                        uid = neighbourMatched[0][0],
                        pal = notmatched[uid];
                    matchFriend(friend, pal, 95);
                }
            }
            rest = rest.filter(friend => !friend.uid);
        }
    }

    function getPlayerName(pal) {
        return pal.name || 'Player ' + pal.uid;
    }

    function getPlayerCreated(pal) {
        try {
            return bgp.daGame.daUser.derived.neighbours[pal.uid].present[0].first;
        } catch (e) {
            return pal.timeCreated;
        }
    }

    function getPlayerNameFull(pal) {
        var name = getPlayerName(pal);
        return pal.surname ? name + ' ' + pal.surname : name;
    }

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/