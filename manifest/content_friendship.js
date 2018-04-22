var wait = Dialog(Dialog.WAIT),
    dialog = Dialog(),
    retries = 5;

function collect() {
    var container = document.getElementById('pagelet_timeline_medley_friends');
    if (container) {
        if (mode == 1) collectStandard();
        if (mode == 2) collectAlternate();
    } else if (retries > 0) {
        retries--;
        setTimeout(collect, 2000);
    } else {
        alert('Something went wrong!');
    }
}

function sendFriends(friends) {
    document.title = chrome.i18n.getMessage('CollectStat', [friends.length]);
    wait.setText(document.title);
    chrome.runtime.sendMessage({
        cmd: 'friends-captured',
        data: friends,
        mode: mode
    });
}

function collectStandard() {
    var handler = null,
        friends = [],
        countStop = 0,
        hash = {},
        ulInactiveParent = null,
        ulInactive = null,
        liInactive = [];

    handler = setInterval(capture, 500);

    function getId(d) {
        var i = d.indexOf('?id=');
        if (i < 0) return null;
        d = d.substr(i + 4);
        i = d.indexOf('&');
        return i > 0 ? d.substr(0, i) : d;
    }

    function capture() {
        var container = document.getElementById('pagelet_timeline_medley_friends');
        var ul = container && container.getElementsByClassName('uiList')[0];
        if (ul) {
            countStop = 0;
            Array.from(ul.getElementsByTagName('li')).forEach(li => {
                Array.from(li.getElementsByTagName('a')).forEach(item => {
                    if (item.innerText == '') return;
                    var id, d, uri, i;
                    if ((d = item.getAttribute('data-hovercard')) && d.indexOf('user.php?id=') >= 0 && (id = getId(d))) {
                        uri = item.href;
                        if ((i = uri.indexOf('?'))) uri = uri.substr(0, i);
                        friends.push({
                            fb_id: id,
                            name: item.innerText,
                            uri: uri
                        });
                    } else if ((d = item.getAttribute('ajaxify')) && d.indexOf('/inactive/') >= 0 && (id = getId(d))) {
                        friends.push({
                            fb_id: id,
                            name: item.innerText,
                            disabled: true
                        });
                        if (!ulInactive) {
                            ulInactiveParent = ul.parentNode;
                            ulInactive = ul;
                        }
                        liInactive.push(li);
                    }
                });
            });
            ul.parentNode.removeChild(ul);
            document.title = chrome.i18n.getMessage('CollectStat', [friends.length]);
            wait.setText(document.title);
        } else {
            countStop++;
            // if the connection is slow, we may want to try a bit more
            if (countStop > 20) {
                clearInterval(handler);
                sendFriends(friends);
                if (ulInactive) {
                    ulInactive.innerHTML = '';
                    liInactive.forEach(li => ulInactive.appendChild(li));
                    ulInactiveParent.appendChild(ulInactive);
                    ulInactive.scrollIntoView();
                    wait.hide();
                    return dialog.show({
                        text: chrome.i18n.getMessage('DisabledAccountsDetected'),
                        style: [Dialog.OK]
                    });
                }
                return window.close();
            }
        }
        document.body.scrollIntoView(true);
        document.getElementById('pagelet_dock').scrollIntoView();
    }
}

function collectAlternate() {
    var fb_dtsg, fb_id, req, ghosts,
        toRemove, numToRemove, numProcessed, numRemoved,
        removingMessage, removedMessage;

    wait.show().setText(chrome.i18n.getMessage('CollectAlternateWait'));

    try {
        fb_dtsg = document.getElementsByName('fb_dtsg')[0].value;
        fb_id = document.cookie.match(/c_user=(\d+)/)[1];
        var url = 'https://www.facebook.com/chat/user_info_all/?viewer=' + fb_id + '&cb=' + Date.now() + '&__user=' + fb_id + '&__a=1&__dyn=&__req=3m&fb_dtsg=' + fb_dtsg + '&ttstamp=&__rev=';
        req = new XMLHttpRequest();
        req.addEventListener('load', transferComplete, false);
        req.addEventListener('error', (evt) => {
            transferError('The operation failed!');
        }, false);
        req.addEventListener('abort', (evt) => {
            transferError('The operation was canceled!');
        }, false);
        req.open('POST', url, true);
        req.send();
    } catch (e) {
        transferError(e.message);
    }

    function transferError(message) {
        wait.setText(message);
    }

    function transferComplete(evt) {
        try {
            var s = req.responseText,
                i = s.indexOf('{'),
                json = s.substr(i),
                data = JSON.parse(json),
                payload = data.payload,
                keys = Object.keys(payload),
                friends = [];
            ghosts = [];
            keys.forEach(key => {
                var item = payload[key];
                if (typeof item.id == 'string') {
                    if (item.is_friend === true) {
                        var friend = {
                            fb_id: item.id,
                            name: item.name,
                            uri: item.uri
                        };
                        friends.push(friend);
                    }
                } else if (item.id === 0) {
                    ghosts.push([key, null]);
                }
            });
            sendFriends(friends);
            continueOperation();
        } catch (e) {
            transferError(e.message);
        }
    }

    function continueOperation() {
        if (ghosts.length > 0 && ghost != 1) {
            wait.hide();
            if (ghost == 2) startRemoving(ghosts, 'GhostFriendRemoving', null);
            else dialog.show({
                text: chrome.i18n.getMessage('GhostFriendsDetected', [ghosts.length]),
                style: [Dialog.OK, Dialog.CANCEL]
            }, function(method) {
                if (method != Dialog.OK) {
                    ghosts = [];
                    return continueOperation();
                }
                startRemoving(ghosts, 'GhostFriendRemoving', 'GhostFriendRemoved');
            });
            return;
        }
        window.close();
    }

    function startRemoving(array, msgRemoving, msgRemoved) {
        removingMessage = msgRemoving;
        removedMessage = msgRemoved;
        // take a copy and clear the original array
        toRemove = Array.from(array);
        array.length = 0;
        console.log(toRemove);
        numToRemove = toRemove.length;
        numProcessed = numRemoved = 0;
        removeOne();
    }

    function removeOne() {
        var item = toRemove.pop(),
            id = item && item[0],
            name = item && item[1];
        if (item) {
            numProcessed++;
            wait.setText(chrome.i18n.getMessage(removingMessage, [numProcessed, numToRemove]));
            if (!name) remove();
            else dialog.show({
                html: chrome.i18n.getMessage('AskRemoveAccount') + '<br><br><img src="https://graph.facebook.com/v2.8/' + id + '/picture" width="50" height="50" valign="middle" style="margin-right:20px"> ' + (name || id),
                style: [Dialog.YES, Dialog.NO, Dialog.CANCEL]
            }, function(method) {
                if (method != Dialog.YES) {
                    if (method != Dialog.NO) toRemove.length = 0;
                    return removeOne();
                }
                remove();
            });
        } else {
            wait.hide();
            if (removedMessage)
                dialog.show({
                    text: chrome.i18n.getMessage(removedMessage, [numRemoved]),
                    style: [Dialog.OK]
                }, continueOperation);
            else continueOperation();
        }

        function remove() {
            var url = 'https://www.facebook.com/ajax/profile/removefriendconfirm.php?dpr=1';
            url += '&uid=' + id + '&unref=bd_friends_tab&floc=friends_tab&nctr[_mod]=pagelet_timeline_app_collection_' + fb_id + '%3A2356318349%3A2&__user=' + fb_id + '&__a=1&__dyn=&__req=1b&__be=0&__pc=PHASED%3ADEFAULT&fb_dtsg=' + fb_dtsg + '&ttstamp=&__rev=';
            var req = new XMLHttpRequest();
            req.addEventListener('load', transferComplete, false);
            req.addEventListener('error', transferFailed, false);
            req.addEventListener('abort', transferFailed, false);
            req.open('POST', url, true);
            req.send();
        }

        function transferFailed() {
            console.log('Failed: ', id, name, req.responseText);
            removeOne();
        }

        function transferComplete() {
            console.log('Complete: ', id, name, req.responseText);
            if (req.responseText.indexOf('errorSummary') < 0) numRemoved++;
            removeOne();
        }
    }
}

collect();