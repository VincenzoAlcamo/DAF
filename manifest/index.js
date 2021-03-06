/*
 ** DA Friends - index.js
 */
var bgp = chrome.extension.getBackgroundPage();
var wikiLink = "https://wiki.diggysadventure.com";
var wikiVars = "/index.php?title=";
var eventToggle = new Event('toggle');
var eventDASync = new Event('daSync');

// Lazy load images using an IntersectionObserver
var lazyObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.intersectionRatio <= 0) return;
        var element = entry.target;
        lazyObserver.unobserve(element);
        if (element.hasAttribute('lazy-src')) {
            element.setAttribute('src', element.getAttribute('lazy-src'));
            element.removeAttribute('lazy-src');
        }
        if (element.hasAttribute('lazy-render')) {
            var event = new Event('render', {
                bubbles: true
            });
            element.dispatchEvent(event);
            element.removeAttribute('lazy-render');
        }
    });
});

// Add Property value as a Message Key in _locales/xx/messages.json
// So the user gets a nice description of the theme/alarm sound.
var pageThemes = {
    'default': 'cssDefault',
    'minty': 'cssMinty',
    'rose': 'cssRose',
    'midnight': 'cssMidnight'
};

/** Not used yet
var alarmSounds = {
    'rooster':  'sndRooster'
};
**/

/*
 ** On Page load Handler
 */
document.addEventListener('DOMContentLoaded', function() {
    // Make sure the background script has finished initialising
    // this happens on startup and after some updates/reloads
    if (!bgp.daGame || !bgp.listening)
        window.close();
    guiInit();
});

/*
 ** Initialize GUI
 */
function guiInit() {
    if (typeof guiInit.initialised !== 'undefined')
        return;
    guiInit.initialised = true;

    guiTheme();
    guiText_i18n();
    //document.getElementsByTagName('html')[0].setAttribute('lang', bgp.exPrefs.gameLang.toLowerCase());
    document.getElementById('extTitle').innerHTML = guiString('extTitle');
    document.getElementById('disclaimer').innerHTML = guiString('disclaimer');
    document.getElementById('gameURL').title = guiString('gameURL');
    document.getElementById('gameNews').style.display = 'none';
    document.getElementById('tabStatus').style.display = '';
    document.getElementById('statusAlert').className = 'download';
    document.getElementById('statusTitle').innerHTML = guiString('pleaseWait');
    document.getElementById('statusText').innerHTML = guiString('gameGetData');

    bgp.daGame.loadGameExtra().then(function(success) {
        //
        // Extension message handler
        //
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            var status = "ok",
                results = null;

            //if (bgp.exPrefs.debug) console.log("chrome.extension.onMessage", request);

            switch (request.cmd) {
                case 'exPrefs':
                    guiTabs.prefChanged(request.name, request.changes.newValue, request.changes.oldValue);
                    break;
                case 'gameSync':
                    guiTabs.action(request.action, request.data);
                    break;
                case 'friends-analyze':
                case 'rewards-update':
                    guiTabs.action(request.cmd);
                    break;
                case 'gameLoading':
                case 'dataLoading':
                case 'dataStart':
                    guiStatus(request.text, null, 'download');
                    break;

                case 'gameMaintenance':
                case 'userMaintenance':
                    guiStatus(request.text, 'Warning', 'warning');
                    guiTabs.refresh();
                    guiNews();
                    break;

                case 'dataSync':
                    guiTabs.resync();
                    break;

                case 'dataDone':
                    guiStatus('gameGetData', null, 'download');
                    bgp.daGame.loadGameExtra().then(function(success) {
                        if (success) {
                            guiStatus();
                        } else
                            guiStatus('gameError', 'Error', 'error');
                        guiTabs.refresh();
                    });
                    break;

                case 'dataError':
                    guiStatus(request.text, 'Error', 'error');
                    guiTabs.refresh();
                    break;

                default:
                    break;
            }

            sendResponse({
                status: status,
                result: results
            });
            return true; // MUST return true; here!
        });

        // Add Entry for each tab to be loaded
        //
        // Property value: true for production, false = tab
        // only loaded if running in development environment
        //
        guiTabs.initialise({
            Neighbours: true,
            Friendship: true,
            Children: true,
            Calculators: true,
            Options: true,
            Help: true
        }).then(function() {
            document.getElementById('gameURL').addEventListener('click', function(e) {
                e.preventDefault();
                bgp.daGame.reload();
                return false;
            });
            document.getElementById('topBtn').addEventListener('click', function(e) {
                // When the user clicks on the Top Button, scroll to the top of the document
                window.scrollBy(0, -window.scrollY);
            });
            guiWikiLinks();
        });
    });
}

function downloadData(data, fileName) {
    var a = document.createElement('a');
    a.style.display = 'none';
    document.body.appendChild(a);
    var payload = typeof data == 'string' ? data : JSON.stringify(data),
        blob = new Blob([payload], {
            type: "text/plain; charset=utf-8"
        }),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.parentNode.removeChild(a);
}

function guiInfo() {
    if ((bgp.daGame) && bgp.daGame.daUser) {
        document.getElementById('subTitle').innerHTML = guiString("subTitle", [
            localStorage.versionName,
            bgp.daGame.daUser.site,
            unixDate(bgp.daGame.daUser.time, true),
            bgp.daGame.daUser.access + '#' + bgp.daGame.player_id
        ]);
    }
}

/*
 ** Extra!, Extra!, Read All About It! :-)
 */
function guiNews(article = bgp.exPrefs.gameNews) {
    /*
    if (localStorage.installType != 'development')
        article = guiString('suspended');
    */
    if (article) {
        document.getElementById('newsFlash').innerHTML = article;
        document.getElementById('gameNews').style.display = '';
    } else
        document.getElementById('gameNews').style.display = 'none';
}

/*
 ** Master Tab Handler
 */
var guiTabs = (function() {
    // @Private
    var tabElement = '#tabs';
    var tabNavigationLinks = '.c-tabs-nav';
    var tabContentWrapper = '.c-tabs-wrapper';
    var tabContentContainers = '.c-tab';
    var tabWrapper;
    var tabOrder = [];
    var locked = false;
    var active;
    var handlers = {};

    // @Public - Tab Array
    var self = {
        tabs: {}
    };

    // @Public - Options Tab
    self.tabs.Options = {
        title: 'Options',
        image: 'options.png',
        order: 9900,
        html: true,
        onInit: tabOptionsInit,
        onUpdate: tabOptionsUpdate
    };

    /*
     ** @Public - Initialise Tabs
     */
    self.initialise = function(loadTabs = {}) {
        return Promise.all(Object.keys(loadTabs).reduce(function(tabs, key) {
            if ((loadTabs[key] === true) || localStorage.installType == 'development') {
                if (key != 'Options') {
                    tabs.push(new Promise((resolve, reject) => {
                        var script = document.createElement('script');
                        script.onerror = function() {
                            resolve({
                                key: key,
                                script: false,
                                html: null
                            });
                        };
                        script.onload = function() {
                            resolve(tabHTML(key));
                        };
                        script.type = "text/javascript";
                        script.src = "/manifest/tabs/" + key.toLowerCase() + ".js";
                        document.head.appendChild(script);
                        script = null;
                    }));
                } else
                    tabs.push(tabHTML(key));
            }
            return tabs;
        }, [])).then(function(loaded) {

            self.dialog = Dialog();
            self.wait = Dialog(Dialog.WAIT);
            self.toast = Dialog(Dialog.TOAST);

            // Sort what we loaded, so we display in a prefered order
            tabOrder = loaded.reduce(function(keep, tab, idx) {
                if (tab.script)
                    keep.push(tab.key);
                self.tabs[tab.key].html = tab.html;
                return keep;
            }, []).sort(function(a, b) {
                return self.tabs[a].order - self.tabs[b].order;
            });

            // Create HTML for each tab entry
            var nav, e = document.querySelector(tabElement);
            if (e) {
                nav = e.querySelectorAll(tabContentWrapper);

                if ((nav) && nav.length == 1) {
                    tabWrapper = nav[0];
                } else {
                    tabWrapper = document.createElement('div');
                    tabWrapper.className = 'c-tabs-wrapper';
                    e.appendChild(tabWrapper);
                }

                nav = e.querySelectorAll(tabNavigationLinks);
                if ((nav) && nav.length == 1) {
                    tabOrder.forEach(function(tab, idx) {
                        var id = self.tabs[tab].id = ('' + tab);
                        var a = document.createElement('a');
                        var span = document.createElement('span')

                        a.id = id;
                        a.className = 'c-tabs-nav__link';
                        a.setAttribute('href', '#');
                        a.addEventListener('click', tabClicked);

                        if (self.tabs[tab].image) {
                            var img = document.createElement('img')
                            a.appendChild(img);
                            img.setAttribute('src', '/img/' + self.tabs[tab].image);
                        }

                        a.appendChild(span);
                        span.innerHTML = guiString(self.tabs[tab].title);
                        nav[0].appendChild(a);
                        self.tabs[tab].nav = a;

                        var d1 = document.createElement('div');
                        var d2 = document.createElement('div');
                        d1.setAttribute('data-c-tab-id', id);
                        d1.className = 'c-tab';
                        d1.innerHTML = '<br />';
                        d1.appendChild(d2);
                        d2.setAttribute('data-c-tab-id', id);
                        d2.className = 'c-tab-content';
                        tabWrapper.appendChild(d1);
                        self.tabs[tab].container = d1;
                        self.tabs[tab].content = d2;

                        //console.log(tab, "HTML", self.tabs[tab].html);
                        if (typeof self.tabs[tab].html === 'string') {
                            d2.innerHTML = self.tabs[tab].html;
                        } else if ((self.tabs[tab].html !== null) && typeof self.tabs[tab].html === 'object') try {
                            d2.appendChild(self.tabs[tab].html);
                        } catch (e) {}

                        // Do any tab specific initialisation
                        self.tabs[tab].time = null;
                        if (self.tabs[tab].hasOwnProperty('onInit')) {
                            if (typeof self.tabs[tab].onInit === 'function')
                                self.tabs[tab].onInit(tab, d2);
                            delete self.tabs[tab].onInit;
                        }
                    });

                    // When the user scrolls down from the top of the document, show the button
                    window.onscroll = function() {
                        if (document.body.scrollTop > 180 || document.documentElement.scrollTop > 180) {
                            document.getElementById("topBtn").style.display = "block";
                        } else {
                            document.getElementById("topBtn").style.display = "none";
                        }
                    };

                    guiNews();
                    tabActive(bgp.exPrefs.tabIndex);
                }
            }

            // Were done initialising so leave the building
            delete self.initialise;
        }).catch(function(error) {
            console.error(error);
        });
    }

    /*
     ** @Public - collect lazy images
     */
    self.collectLazyImages = function(tab) {
        var tab = tab || self.tabs[active];
        if (tab) Array.from(tab.container.querySelectorAll('img[lazy-src],*[lazy-render]')).forEach(item => lazyObserver.observe(item));
    };

    /*
     ** @Private fetch Tabs HTML content
     */
    function tabHTML(key) {
        if (self.tabs[key].hasOwnProperty('html') === true) {
            if (self.tabs[key].html === true) {
                return http.get.html("/manifest/tabs/" + key.toLowerCase() + ".html")
                    .then(function(html) {
                        return {
                            key: key,
                            script: true,
                            html: html
                        };
                    }).catch(function(error) {
                        return {
                            key: key,
                            script: true,
                            html: null
                        };
                    });
            } else
                return {
                    key: key,
                    script: true,
                    html: self.tabs[key].html
                };
        }
        return {
            key: key,
            script: true,
            html: null
        };
    }

    /*
     ** @Public - Update links to open in a new tab
     */
    self.linkTabs = function(parent) {
        var links = parent.getElementsByTagName("a");

        for (var i = 0; i < links.length; i++) {
            (function() {
                var ln = links[i];
                var location = ln.href;
                ln.onclick = function() {
                    chrome.tabs.create({
                        active: true,
                        url: location
                    });
                    return false;
                };
            })();
        }
    }

    /*
     ** @Public - Update preference value
     */
    self.setPref = function(name, value) {
        save = {};
        save[name] = value;
        chrome.storage.sync.set(save);
        return value;
    }

    /*
     ** @Public - Hide ALL Tab Content
     */
    self.hideContent = function(state) {
        if (tabWrapper) tabWrapper.style.display = (state ? 'none' : 'block');
    }

    /*
     ** @Public - Lock Tabs
     */
    self.lock = function(state) {
        locked = (state ? true : false);
    }

    self.isLocked = function(state) {
        return state;
    }

    /*
     ** @Public - Update (Active) Tab
     */
    self.update = function() {
        tabUpdate(active, 'update');
    }

    self.active = function() {
        return active;
    }

    /*
     ** @Public - Action Tab
     */
    self.action = function(action, data) {
        // TODO: Change setTimeout to promise.all
        tabOrder.forEach(function(id, idx, ary) {
            if (self.tabs[id].hasOwnProperty('onAction')) {
                setTimeout(function() {
                    if (typeof self.tabs[id].onAction === 'function') try {
                        self.tabs[id].onAction(id, action, data);
                    } catch (e) {
                        console.error(e);
                    }
                }, 0);
            }
        });
    }

    /*
     ** @Public - Resync (Active) Tab
     */
    self.resync = function() {
        guiInfo();
        tabOrder.forEach(function(id, idx, ary) {
            if (self.tabs[id].hasOwnProperty('onResync')) {
                // TODO: Change setTimeout to promise.all
                setTimeout(function() {
                    if (typeof self.tabs[id].onResync === 'function') try {
                        self.tabs[id].onResync(id);
                    } catch (e) {
                        console.error(e);
                    }
                }, 0);
            }
        });
    }

    /*
     ** @Public - Refresh (Active) Tab
     */
    self.refresh = function(id = active) {
        if (id !== null) {
            if (self.tabs.hasOwnProperty(id)) {
                self.tabs[id].time = null;
            } else
                return;
        } else tabOrder.forEach(function(id, idx, ary) {
            self.tabs[id].time = null;
        });
        tabUpdate(id, 'update');
    }

    /*
     ** @Private tabClicked
     */
    function tabClicked(e) {
        var id = e.target.id;
        if (!id)
            id = e.target.parentElement.id;
        e.preventDefault();
        if ((!locked) && active != id) {
            id = tabActive(id);
            chrome.storage.sync.set({
                tabIndex: id
            });
        }
    }

    /*
     ** @Private tabActive
     */
    function tabActive(id) {
        if (!self.tabs.hasOwnProperty(id))
            id = tabOrder[0];
        if (self.tabs.hasOwnProperty(active)) {
            self.tabs[active].nav.classList.remove('is-active');
            self.tabs[active].container.classList.remove('is-active');
        }
        self.tabs[id].nav.classList.add('is-active');
        //    self.tabs[id].container.classList.add('is-active');

        if (active != id) {
            active = id;
            tabUpdate(id, 'active');
        }

        return active;
    }

    /*
     ** @Private tabUpdate
     */
    function tabUpdate(id, reason) {
        if (reason == 'active' && self.tabs[id].time != bgp.daGame.daUser.time)
            reason = 'update';
        guiInfo();
        switch (bgp.daGame.daUser.result) {
            case 'OK':
            case 'CACHED':
                if (bgp.daGame.schemaVersion != bgp.daGame.daUser.schemaVersion) {
                    guiStatus(guiString('reloadNeeded'), "Warning", 'warning');
                    self.lock(false);
                    bgp.daGame.guiReload = true;
                    if (active != 'Options' && active != 'Help')
                        return false;
                }
                break;
            case 'ERROR':
                guiStatus(guiString('gameError', [bgp.daGame.daUser.desc]), "Error", 'error');
                self.lock(false);
                if (active == 'Options' || active == 'Help')
                    break;
                return false;
            default:
            case 'EMPTY':
                guiStatus('noGameData', "Warning", 'warning');
                self.lock(false);
                if (active == 'Options' || active == 'Help')
                    break;
                return false;
        }

        let promise = new Promise((resolve, reject) => {
            if (reason != 'active') {
                guiStatus('dataProcessing', null, 'busy');
            }
            if ((reason != 'active') || self.tabs[id].time != bgp.daGame.daUser.time) {
                if ((self.tabs.hasOwnProperty(id)) && self.tabs[id].hasOwnProperty('onUpdate')) {
                    if (typeof self.tabs[id].onUpdate === 'function') try {
                        return resolve(self.tabs[id].onUpdate(id, reason));
                    } catch (e) {
                        console.error(e);
                        guiStatus(guiString('errorException', [e]), "Error", 'error');
                        return resolve(false);
                    }
                }
            }
            resolve(true);
        }).catch(function(error) {
            console.trace(error);
            if (typeof error !== 'string') {
                error = error.message;
            }
            guiStatus(error, "Error", 'error');
            self.lock(false);
            return false;
        }).then(function(ok) {
            if (ok) {
                document.getElementById('tabStatus').style.display = 'none';
                if (!self.tabs[id].time) {
                    guiCardToggle(self.tabs[id].content);
                    guiWikiLinks(self.tabs[id].content);
                    guiText_i18n(self.tabs[id].content);
                }
                self.tabs[id].time = bgp.daGame.daUser.time;
                if (id == active)
                    self.tabs[id].container.classList.add('is-active');
                self.hideContent(false);
            }
            self.lock(false);
            return ok;
        });

        return promise;
    }

    /*
     ** @Public - Track Pref Changes (from outside of the GUI as well)
     */
    self.prefChanged = function(name, newValue, oldValue) {
        switch (name) {
            case 'gameNews':
                guiNews();
                return;
            case 'cssTheme':
                guiTheme(newValue);
                return;
            case 'hideGiftTime':
                guiTabs.refresh('Neighbours')
                return;
            default:
                break;
        }

        var eid = document.getElementById(name);
        if (eid) {
            switch (eid.type.toLowerCase()) {
                case 'checkbox':
                    eid.checked = newValue;
                    break;
                case 'select':
                    // TODO
                    console.log(newValue, eid);
                    break;
            }
        }
    }
    /*
     ** @Private Initialise the options tab
     */
    function tabOptionsInit(id, cel) {
        var form = document.getElementById('optForm');
        var list, forInput, forType, callback, disable;

        document.getElementById('optDownload').addEventListener('click', function() {
            var data = {};
            Object.keys(bgp.daGame).forEach(key => {
                if (typeof bgp.daGame[key] != 'function') data[key] = bgp.daGame[key];
            });
            downloadData(data, 'DAF_gamedata.json');
        });

        document.getElementById('optDownloadMaterial').addEventListener('click', function() {
            var data = [],
                materials = bgp.daGame.daUser.materials;
            data.push('LEVEL\t' + bgp.daGame.daUser.level);
            data.push('REGION\t' + bgp.daGame.daUser.region);
            data.push('');
            data.push('MAT_ID\tMAT_NAME\tQTY');
            Object.keys(materials).forEach(key => {
                if (materials[key] > 0) data.push(key + '\t' + self.materialName(key) + '\t' + materials[key]);
            });
            data = data.join('\n');
            downloadData(data, 'DAF_materials.csv');
        });

        document.getElementById('optGeneral').innerHTML = guiString('General');

        list = form.getElementsByTagName("SPAN");
        for (var e = 0; e < list.length; e++) {
            list[e].innerHTML = guiString(list[e].id);
        }

        list = form.getElementsByTagName("LABEL");
        for (var e = 0; e < list.length; e++) {
            list[e].innerHTML = guiString(list[e].id);

            if (!(forInput = list[e].control))
                continue;
            if (!(forType = forInput.getAttribute("TYPE")))
                forType = forInput.nodeName;

            callback = '__' + forInput.id + '_' + forType;
            disable = true;

            if (bgp.exPrefs.hasOwnProperty(forInput.id)) {
                disable = false;
                if (typeof handlers[callback] === "function")
                    disable = handlers[callback].call(this, forInput, list[e]);

                if (!forInput.onchange) {
                    switch (forType.toLowerCase()) {
                        case 'select':
                            forInput.onchange = (e) => {
                                self.setPref(e.target.id, e.target.value);
                            }
                            break;
                        case 'checkbox':
                            forInput.checked = bgp.exPrefs[forInput.id];
                            forInput.onchange = (e) => {
                                self.setPref(e.target.id, e.target.checked);
                            };
                            break;
                        default:
                            disable = true;
                            break;
                    }
                }
            }

            if (!forInput.disabled)
                forInput.disabled = disable;
        }
    }

    /*
     ** @Private Update the options tab
     */
    function tabOptionsUpdate(id, reason) {
        return true;
    }

    function addOption(select, value, text, selectedValue) {
        var option = document.createElement("option");
        option.text = text;
        option.value = value;
        select.add(option);
        if (selectedValue == value) {
            select.selectedIndex = select.length - 1;
        }
    }

    /*
     ** @Private Handlers
     */
    handlers['__gameSite_SELECT'] = function(p) {
        function setAutoPortal(value) {
            document.getElementById('autoPortal').disabled = false; //((value == 'portal') ? false : true);
        }
        var selectedValue = bgp.exPrefs.gameSite;

        for (key in bgp.gameUrls) {
            addOption(p, key, guiString(key), selectedValue);
        }
        setAutoPortal(selectedValue);
        p.onchange = (e) => {
            setAutoPortal(e.target.value);
            self.setPref(e.target.id, e.target.value);
        }
        return false; // Not Disabled
    };

    handlers['__toolbarStyle_SELECT'] = function(p) {
        var selectedValue = parseInt(bgp.exPrefs.toolbarStyle) || 2;
        if (selectedValue < 1 || selectedValue > 4) selectedValue = 2;
        for (var key = 1; key <= 4; key++) {
            addOption(p, key, guiString('toolbarStyle_' + key), selectedValue);
        }
        return false; // Not Disabled
    };

    handlers['__gcTableSize_SELECT'] = function(p) {
        var selectedValue = String(bgp.exPrefs.gcTableSize);
        if (selectedValue != 'small' && selectedValue != 'large') selectedValue = 'large';
        addOption(p, 'small', guiString('gcTableSize_small'), selectedValue);
        addOption(p, 'large', guiString('gcTableSize_large'), selectedValue);
        return false; // Not Disabled
    };

    handlers['__cssTheme_SELECT'] = function(p) {
        for (key in pageThemes) {
            var e = document.createElement("option");
            e.text = guiString(pageThemes[key]);
            e.value = key;
            p.add(e);
            if (bgp.exPrefs.cssTheme == key)
                p.selectedIndex = p.length - 1;
        }
        return false; // Not Disabled
    };

    handlers['__linkGrabButton_SELECT'] = function(p) {
        var selectedValue = bgp.exPrefs.linkGrabButton;
        addOption(p, -1, guiString('linkGrabDisabled'), selectedValue);
        addOption(p, 0, guiString('leftButton'), selectedValue);
        addOption(p, 1, guiString('middleButton'), selectedValue);
        addOption(p, 2, guiString('rightButton'), selectedValue);
        return false; // Not Disabled
    };

    handlers['__linkGrabKey_SELECT'] = function(p) {
        var selectedValue = bgp.exPrefs.linkGrabKey;
        addOption(p, 0, guiString('modifierNone'), selectedValue);
        addOption(p, 16, guiString('modifierShift'), selectedValue);
        addOption(p, 17, guiString('modifierCtrl'), selectedValue);
        addOption(p, 18, guiString('modifierAlt'), selectedValue);
        for (var i = 65; i <= 90; i++) {
            addOption(p, i, String.fromCharCode(i), selectedValue);
        }
        p.value = selectedValue;
        return false; // Not Disabled
    };
    handlers['__linkGrabConvert_SELECT'] = function(p) {
        var selectedValue = bgp.exPrefs.linkGrabConvert;
        addOption(p, 0, guiString('linkGrabConvertNo'), selectedValue);
        addOption(p, 1, guiString('linkGrabConvertFacebook'), selectedValue);
        addOption(p, 2, guiString('linkGrabConvertPortal'), selectedValue);
        return false; // Not Disabled
    };

    handlers['__gameDebug_checkbox'] = __devOnly;
    handlers['__syncDebug_checkbox'] = __devOnly;
    handlers['__cacheFiles_checkbox'] = __devOnly;
    handlers['__debug_checkbox'] = __devOnly;

    function __devOnly(p, l, disable = false) {
        if (localStorage.installType != 'development') {
            p.style.display = 'none';
            l.style.display = 'none';
            return !disable;
        }
        return disable;
    }

    return self;
}());

/*
 ** Set theme
 */
function guiTheme(name = null) {
    if (name === null)
        name = bgp.exPrefs.cssTheme;
    if (!pageThemes.hasOwnProperty(name))
        name = 'default';

    var filename = "/manifest/css/themes/" + name + ".css";
    var className = 'themeStylesheet';
    var css = document.getElementById(className);

    if (!css) {
        css = document.createElement('link');
        css.id = className;
        css.setAttribute('rel', "stylesheet")
        css.setAttribute('type', "text/css")
        document.getElementsByTagName('head')[0].appendChild(css);
    }

    css.setAttribute('href', filename)

    return name;
}

/*
 ** Set status message
 */
function guiStatus(text = null, title = null, style = null, hideTabs = true) {
    if (text !== null) {
        if (title == null)
            title = 'pleaseWait';
        guiTabs.lock(true);
        document.getElementById('tabStatus').style.display = 'block';
        if (hideTabs)
            guiTabs.hideContent(true);
        document.getElementById('statusText').innerHTML = guiString(text);
        guiWikiLinks(document.getElementById('statusText'));
        if (title !== null)
            document.getElementById('statusTitle').innerHTML = guiString(title);
        if (style !== null)
            document.getElementById('statusAlert').className = style;
    } else {
        guiTabs.lock(false);
        guiTabs.hideContent(false);
        document.getElementById('tabStatus').style.display = 'none';
    }
}

/*
 ** Get a GUI string
 */
function guiString(message, subs = null) {
    return bgp.daGame.i18n(message, subs);
}

/*
 ** Set Card Toggles
 */
function guiCardToggle(parent = document) {
    parent.querySelectorAll('.clicker > h1:first-child').forEach(function(e) {
        var img = onToggle(e, false);
        if (img) {
            img.onclick = (e) => {
                onToggle(e.target.parentElement, true);
                return false;
            };
        }
        e.onclick = (e) => {
            onToggle(e.target, true);
            return false;
        };
    });
}

function onToggle(e, toggle = true) {
    var div = e.parentElement.querySelector('.clicker > div:nth-child(2)');
    var img = e.querySelector('img:nth-child(3)');

    if (div) {
        var pk = 'toggle_' + div.id;

        if ((!toggle && div.id) && bgp.exPrefs.hasOwnProperty(pk))
            div.style.display = bgp.exPrefs[pk];

        if (div.style.display == ((toggle) ? 'none' : '')) {
            e.classList.toggle('clicker-hide', true);
            e.classList.toggle('clicker-show', false);
            if (img) {
                img.src = '/img/card-hide.png';
                img.title = guiString('clickShrink');
            }
            if (toggle)
                div.style.display = '';
        } else {
            e.classList.toggle('clicker-hide', false);
            e.classList.toggle('clicker-show', true);
            if (img) {
                img.src = '/img/card-show.png';
                img.title = guiString('clickExpand');
            }
            if (toggle)
                div.style.display = 'none';
        }

        guiTabs.setPref(pk, div.style.display);
        div.dispatchEvent(eventToggle);
    }

    return img;
}

/*
 ** Set GUI Text
 */
function guiText_i18n(parent = document) {
    parent.querySelectorAll("[data-i18n-title]").forEach(function(e) {
        var string = e.getAttribute('data-i18n-title');
        e.removeAttribute('data-i18n-title');
        e.title = bgp.daGame.i18n(string);
    });
    parent.querySelectorAll("[data-i18n-text]").forEach(function(e) {
        var string = e.getAttribute('data-i18n-text');
        e.removeAttribute('data-i18n-text');
        e.innerHTML = Dialog.escapeHtmlBr(bgp.daGame.i18n(string));
    });
    parent.querySelectorAll("[data-game-text]").forEach(function(e) {
        var string = e.getAttribute('data-game-text');
        e.removeAttribute('data-game-text');
        e.innerHTML = Dialog.escapeHtmlBr(bgp.daGame.string(string));
    });
}

/*
 ** Set Wiki Links
 */
function guiWikiLinks(parent = document) {
    parent.querySelectorAll('[data-wiki-page]').forEach(function(el) {
        var title = el.getAttribute('data-wiki-title') || 'clickWiki';
        el.removeAttribute('data-wiki-title');

        var wikiPage = el.getAttribute('data-wiki-page');
        el.removeAttribute('data-wiki-page');
        var wikiUrl;
        if (wikiPage.indexOf('http') == 0)
            wikiUrl = wikiPage;
        else
            wikiUrl = bgp.wikiLink + ((wikiPage) ? bgp.wikiVars + wikiPage : '/');

        el.title = bgp.daGame.i18n(title);
        el.classList.add('wiki-hover');

        el.onclick = function(e) {
            chrome.tabs.query({}, function(tabs) {
                var wUrl = urlObject({
                    'url': bgp.wikiLink
                });
                var wkTab = 0;

                tabs.forEach(function(tab) {
                    var tUrl = urlObject({
                        'url': tab.url
                    });
                    if ((!wkTab) && (tUrl.host == wUrl.host || tab.url == wikiUrl)) {
                        chrome.windows.update(tab.windowId, {
                            focused: true,
                            drawAttention: true
                        });
                        wkTab = tab.id;
                    }
                });

                if (!wkTab) {
                    var maxWidth = Math.round(((window.screen.availWidth * 72) / 100));
                    var maxHeight = Math.round(((window.screen.availHeight * 80) / 100));
                    var top = Math.round((window.screen.availHeight - maxHeight) / 2);
                    var left = Math.round((window.screen.availWidth - maxWidth) / 2);

                    chrome.windows.create({
                        url: wikiUrl,
                        left: left,
                        top: top,
                        width: maxWidth,
                        height: maxHeight,
                        focused: true,
                        type: 'popup'
                    }, function(w) {});
                } else {
                    chrome.tabs.update(wkTab, {
                        url: wikiUrl,
                        active: true
                    });
                }
            });

            return false;
        };
    });
}
/*
 ** END
 *******************************************************************************/