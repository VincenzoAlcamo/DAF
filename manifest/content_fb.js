/*
 ** DA Friends - content_fb.js
 */
(function() {
    DAF.initialize({
        linkGrabButton: 2,
        linkGrabKey: 0,
        linkGrabSort: true,
        linkGrabReverse: false,
        linkGrabConvert: 0
    }, initialize);

    const LEFT_BUTTON = 0,
        KEY_ESC = 27,
        KEY_C = 67,
        KEY_I = 73,
        KEY_R = 82,
        KEY_S = 83,
        OS_WIN = 1,
        OS_LINUX = 0;

    const os = ((navigator.appVersion.indexOf('Win') == -1) ? OS_LINUX : OS_WIN);

    var box = null,
        flagBox = false,
        flagActive = false,
        stopMenu = false,
        keyPressed = 0,
        mouseButton = -1,
        countLabel = null,
        scrollHandle = 0,
        injectCSS = true,
        links = [],
        linkCount, oldLabel, mouseX, mouseY, startX, startY, autoOpenElement, autoOpenCount, flagLinks;

    function addListeners(obj, args) {
        [].slice.call(arguments, 1).forEach(fn => obj.addEventListener(fn.name, fn, true));
    }

    function addPassiveListeners(obj, args) {
        [].slice.call(arguments, 1).forEach(fn => obj.addEventListener(fn.name, fn, {
            passive: true,
            capture: true
        }));
    }

    function removeListeners(obj, args) {
        [].slice.call(arguments, 1).forEach(fn => obj.removeEventListener(fn.name, fn, true));
    }

    function initialize() {
        addListeners(window, mousedown, keydown, keyup, blur, contextmenu);
        DAF.removeLater(() => {
            stop();
            removeListeners(window, mousedown, keydown, keyup, blur, contextmenu);
        });
    }

    function allowSelection() {
        return mouseButton == DAF.getValue('linkGrabButton') && keyPressed == DAF.getValue('linkGrabKey');
    }

    function setPosition(el, x, y, width, height) {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        if (width !== undefined) {
            el.style.width = width + 'px';
            el.style.height = height + 'px';
        }
    }

    function mousedown(event) {
        var key = keyPressed;
        // stop will reset keyPressed
        stop();
        keyPressed = key;

        mouseButton = event.button

        // turn on menu for windows
        if (os === OS_WIN) stopMenu = false

        if (!allowSelection()) return;

        flagActive = true;

        // don't prevent for windows right click as it breaks spell checker
        // do prevent for left as otherwise the page becomes highlighted
        if (os == OS_LINUX || (os == OS_WIN && mouseButton == LEFT_BUTTON)) preventEscalation(event)

        // create the box
        if (box == null) {
            box = DAF.removeLater(createElement('span', {
                className: 'DAF-selector',
                style: {
                    visibility: 'hidden'
                }
            }, document.body));

            countLabel = DAF.removeLater(createElement('span', {
                className: 'DAF-counter',
                style: {
                    visibility: 'hidden'
                }
            }, document.body));
        }

        // update position
        startX = event.pageX, startY = event.pageY;
        mouseX = event.clientX, mouseY = event.clientY;
        updateBox();

        // setup mouse move and mouse up
        addListeners(window, mousemove, mouseup, mouseout);
        addPassiveListeners(window, mousewheel);

        if (injectCSS) {
            injectCSS = false;
            DAF.injectStyle(chrome.extension.getURL('manifest/css/content_fb.css'));
        }
    }


    function mousemove(event) {
        preventEscalation(event)
        if (flagBox || allowSelection()) {
            mouseX = event.clientX, mouseY = event.clientY;

            var el = document.elementsFromPoint(mouseX, mouseY).find(el => el !== box && el !== countLabel);
            if (!el || !el.className.match(/\b(UFIPagerLink|fss|see_more_link_inner|UFIReplySocialSentenceLinkText)\b/)) el = null;
            if (autoOpenElement !== el) {
                if (autoOpenElement && autoOpenCount <= 0) {
                    flagLinks = true;
                    linkCount = 0;
                }
                autoOpenCount = 5;
            }
            autoOpenElement = el;

            updateBox();
            detect();
        }
    }

    function updateBox() {
        var x = mouseX + window.scrollX,
            y = mouseY + window.scrollY,
            width = Math.max(document.documentElement['clientWidth'], document.body['scrollWidth'], document.documentElement['scrollWidth'], document.body['offsetWidth'], document.documentElement['offsetWidth']),
            height = Math.max(document.documentElement['clientHeight'], document.body['scrollHeight'], document.documentElement['scrollHeight'], document.body['offsetHeight'], document.documentElement['offsetHeight']);
        x = Math.min(x, width - 7);
        y = Math.min(y, height - 7);

        box.x1 = Math.min(startX, x);
        box.x2 = Math.max(startX, x);
        box.y1 = Math.min(startY, y);
        box.y2 = Math.max(startY, y);
        setPosition(box, box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

        var cx = x;
        if (y <= startY) cx -= Math.floor(countLabel.offsetWidth / 2);
        else if (x <= startX) cx -= countLabel.offsetWidth;
        setPosition(countLabel, cx, y - countLabel.offsetHeight);
    }

    function mousewheel(event) {
        if (flagBox || allowSelection()) {
            mouseX = event.clientX, mouseY = event.clientY;
            updateBox();
            detect();
        }
    }

    function mouseout(event) {
        mousemove(event)
    }

    function preventEscalation(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function mouseup(event) {
        preventEscalation(event)
        if (!flagBox) stop();
    }

    function start() {
        flagLinks = false;

        // stop user from selecting text/elements
        document.body.style.userSelect = 'none';
        // turn on the box
        box.style.visibility = countLabel.style.visibility = 'visible';
        flagBox = true

        links = document.links;
        linkCount = links.length;
        var offsetLeft = window.scrollX,
            offsetTop = window.scrollY;
        links = Array.from(links).filter(a => {
            if (a.href.indexOf('diggysadventure') < 0) return false;

            var rect = a.getBoundingClientRect();
            if (rect.height > 0) {
                var left = offsetLeft + rect.left,
                    top = offsetTop + rect.top,
                    daf = {
                        x1: Math.floor(left),
                        y1: Math.floor(top),
                        x2: Math.floor(left + rect.width),
                        y2: Math.floor(top + rect.height),
                        box: a.daf && a.daf.box
                    };
                a.daf = daf;
                if (daf.box) setPosition(daf.box, daf.x1, daf.y1 - 1, daf.x2 - daf.x1 + 2, daf.y2 - daf.y1 + 2);
                return true;
            }

            return false;
        });

        // turn off menu for windows so mouse up doesn't trigger context menu
        if (os == OS_WIN) stopMenu = true
    }

    function stop() {
        if (flagActive) removeListeners(window, mousemove, mouseup, mousewheel, mouseout);
        flagActive = false;

        if (scrollHandle) clearInterval(scrollHandle);
        scrollHandle = 0;

        document.body.style.userSelect = '';
        if (flagBox) box.style.visibility = countLabel.style.visibility = 'hidden';
        flagBox = false;

        // remove the link boxes
        Array.from(document.links).forEach(a => {
            if (a && a.daf) {
                removeNode(a.daf.box);
                delete a.daf;
            }
        });
        links = [];

        flagLinks = false;
        mouseButton = -1;
        keyPressed = 0;
    }

    function scroll() {
        var y = mouseY,
            win_height = window.innerHeight;

        function scrollPage(speed, direction) {
            var value = (speed < 2 ? 60 : (speed < 10 ? 30 : 10)) * direction;
            window.scrollBy(0, value);
            updateBox();
            detect();
        }
        if (y > win_height - 20) scrollPage(win_height - y, 1);
        else if (window.scrollY > 0 && y < 20) scrollPage(y, -1);
        else if (autoOpenElement && (autoOpenCount--) == 0) {
            try {
                autoOpenElement.click();
                flagLinks = true;
            } catch (e) {}
        }
    }

    function detect() {
        if (!flagBox) {
            if (box.x2 - box.x1 < 5 && box.y2 - box.y1 < 5) return;
            flagLinks = true;
        }
        if (flagLinks || linkCount != document.links.length) start();

        if (!scrollHandle) scrollHandle = setInterval(scroll, 100);

        var count = 0,
            total = 0,
            hash = {};
        links.forEach(a => {
            var daf = a.daf;
            daf.selected = false;
            if (daf.y1 <= box.y2 && daf.y2 >= box.y1 && daf.x1 <= box.x2 && daf.x2 >= box.x1) {
                if (!('data' in daf)) daf.data = getLinkData(a.href);
                if (daf.data) {
                    daf.selected = true;
                    if (daf.box == null) {
                        daf.box = daf.box || createElement('span', {
                            textContent: daf.data.id,
                            className: 'DAF-box'
                        }, document.body);
                        setPosition(daf.box, daf.x1, daf.y1 - 1, daf.x2 - daf.x1 + 2, daf.y2 - daf.y1 + 2);
                    }
                    daf.box.style.visibility = 'visible';
                    total++;
                    if (!(daf.data.id in hash)) {
                        hash[daf.data.id] = true;
                        count++;
                    }
                }
            }
            if (daf.box) daf.box.style.visibility = daf.selected ? 'visible' : 'hidden';
        });

        function addFn(keyCode, messageId) {
            return '\n' + guiString('linksKey', [keyCode == KEY_ESC ? 'ESC' : String.fromCharCode(keyCode), guiString(messageId)]);
        }

        var text = guiString('linksSelected', [count, total]);
        if (count > 0) text += addFn(KEY_C, 'linksFnCopy');
        if (count > 0) text += addFn(KEY_S, 'linksFnSend');
        text += addFn(KEY_I, 'linksFnShowId');
        text += addFn(KEY_R, 'linksFnRefresh');
        text += addFn(KEY_ESC, 'linksFnCancel');
        if (text != oldLabel) countLabel.innerText = oldLabel = text;
    }

    var fnHandlers = {};
    fnHandlers[KEY_ESC] = (event) => {
        stop();
    };
    fnHandlers[KEY_R] = (event) => {
        start();
        detect();
    };
    fnHandlers[KEY_I] = (event) => {
        document.body.classList.toggle('DAF-show-id');
    };
    fnHandlers[KEY_C] = (event) => {
        var values = collectLinks();
        stop();
        var text = values.join('\n') + '\n';
        chrome.runtime.sendMessage({
            cmd: 'copyToClipboard',
            text: text
        }, function() {
            Dialog(Dialog.TOAST).show({
                text: guiString('linksCopied', [values.length])
            });
        });
    };
    fnHandlers[KEY_S] = (event) => {
        var values = collectData(true);
        stop();
        chrome.runtime.sendMessage({
            cmd: 'addRewardLinks',
            values: values
        }, (response) => {
            if (response.status == 'ok') {
                Dialog(Dialog.TOAST).show({
                    text: guiString(response.result ? 'linksAdded' : 'noLinksAdded', [response.result, values.length])
                });
            }
        });
    };

    function keydown(event) {
        keyPressed = event.keyCode;
        if (os == OS_LINUX && keyPressed == DAF.getValue('linkGrabKey')) stopMenu = true;
        if (!flagActive) return;
        if (keyPressed in fnHandlers) {
            event.keyCode = 0;
            preventEscalation(event);
            fnHandlers[keyPressed](event);
        }
    }

    function blur(event) {
        remove_key();
    }

    function keyup(event) {
        remove_key();
    }

    function remove_key() {
        // turn menu on for linux
        if (os == OS_LINUX) stopMenu = false;
        keyPressed = 0;
    }

    function contextmenu(event) {
        if (stopMenu) event.preventDefault();
        stopMenu = false;
    }

    var reLink1 = /https?:\/\/l\.facebook\.com\/l.php\?u=([^&\s]+)(&|\s|$)/g;
    var reLink2 = /https?:\/\/diggysadventure\.com\/miner\/wallpost_link.php\S+[\?&]url=([^&\s]+)(&|\s|$)/g;
    var reFacebook = /https?:\/\/apps\.facebook\.com\/diggysadventure\/wallpost\.php\?wp_id=(\d+)&fb_type=(standard|portal)&wp_sig=([0-9a-z]+)/g;
    var rePortal = /https?:\/\/portal\.pixelfederation\.com\/(([^\/]+\/)?gift|wallpost)\/diggysadventure\?params=(([0-9a-zA-Z\-_]|%2B|%2F)+(%3D){0,2})/g;

    function getLinkData(href) {
        function getObj(id, typ, sig) {
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
            var match = reFacebook.exec(href);
            if (match) return getObj(match[1], match[2], match[3]);
        }
        if (href.indexOf('://portal.pixelfederation.com/') > 0) {
            rePortal.lastIndex = 0;
            var match = rePortal.exec(href);
            if (match) {
                try {
                    var params = decodeURIComponent(match[3]).replace(/\-/g, '+').replace(/_/g, '/'),
                        payload = atob(params),
                        json = JSON.parse(payload);
                    if (json.wp_id && json.fb_type && json.wp_sig) return getObj(json.wp_id, json.fb_type, json.wp_sig);
                } catch (e) {}
            }
        }
        return null;
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

    function collectData(flagGetUserData) {
        var values = [],
            hash = {},
            reCid = /hovercard(\/user)?\.php\?id=(\d+)/;

        function findActor(parent, className, data) {
            var actor = parent.getElementsByClassName(className)[0] || Array.from(parent.querySelectorAll('[data-hovercard]')).filter(el => el.textContent != '')[0];
            if (!actor) return false;
            var hovercard = actor.getAttribute('data-hovercard');
            if (!hovercard) return false;
            var match = hovercard.match(reCid);
            if (!match) return false;
            data.cid = match[2];
            for (var node = actor.firstChild; node; node = node.nextSibling) {
                if (node.nodeType == Node.TEXT_NODE && node.textContent.trim() != "") {
                    data.cnm = node.textContent;
                    break;
                }
            }
            return true;
        }
        links.forEach(a => {
            var data = a.daf && a.daf.selected && a.daf.data;
            if (data && !(data.id in hash)) {
                if (flagGetUserData) {
                    var parent = a.parentNode;
                    for (var depth = 12; parent && depth > 0; depth--) {
                        if (parent.classList.contains('UFICommentActorAndBody') && findActor(parent, 'UFICommentActorName', data)) break;
                        if (parent.classList.contains('userContentWrapper') && findActor(parent, 'profileLink', data)) break;
                        parent = parent.parentNode;
                    }
                }
                hash[data.id] = true;
                values.push(data);
            }
        });
        return values;
    }

    function collectLinks() {
        var values = collectData(),
            convert = DAF.getValue('linkGrabConvert');
        if (convert != 1 && convert != 2) convert = 0;
        values = values.map(data => getLink(data, convert));
        if (DAF.getValue('linkGrabSort')) values.sort();
        if (DAF.getValue('linkGrabReverse')) values.reverse();
        return values;
    }
})();
/*
 ** END
 *******************************************************************************/