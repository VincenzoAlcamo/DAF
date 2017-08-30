/*
 ** DA Friends - calculator.js
 */
var guiTabs = (function(self) {
    var tabID, active, menu = {
        kitchen: true,
        crowns: true,
        g_ring: true,
        r_ring: false,
        repeat: false,
        
        // Do NOT release, developers only
        emines: null,
        god_children: null
    };

    /*
     ** Define this tab's details
     */
    self.tabs.Calculators = {
        title: 'Calculators',
        image: 'calculator.png',
        order: 9000,
        html: true,
        onInit: onInit,
        onAction: onAction,
        onUpdate: onUpdate,
        menu: {}
    };

    /*
     ** Preferred Object Order
     */
    let objOrder = ['system', 'material', 'usable', 'artifact', 'token'];

    /*
     ** Image Maps
     */
    let sysImg = {
        1: 'materials/bonus_xp.png',
        2: 'materials/bonus_energy.png'
    };

    let tokImg = {
        32: 'materials/g_ring.png',
        1642: 'materials/r_ring.png'
    };

    // Display Order
    let matImg = {
        197: '/saph.png',
        143: '/topaz.png',
        92: '/ruby.png',
        47: '/amy.png',
        2: '/gems.png',
        1: '/coins.png',
        93: '/jadeite.png',
        148: '/orich.png',
        96: '/d_ingot.png',
        0: '.png'
    };

    /*
     ** @Private - Initialise the tab
     */
    function onInit(id, cel) {
        tabID = id;
        return Promise.all(Object.keys(menu).reduce(function(items, key) {
            let show = menu[key];
            if (!show && localStorage.installType == 'development') {
                show = true;
                if (show === null && !self.isDev())
                    show = false;
            }

            if (show === true) {
                items.push(new Promise((resolve, reject) => {
                    let script = document.createElement('script');
                    script.onerror = function() {
                        resolve({
                            key: key,
                            script: false,
                            html: null
                        });
                    };
                    script.onload = function() {
                        resolve(menuHTML(key));
                    };
                    script.type = "text/javascript";
                    script.src = "/manifest/tabs/calculators/" + key.toLowerCase() + ".js";
                    document.head.appendChild(script);
                    script = null;
                }));
            }

            return items;
        }, [])).then(function(loaded) {
            let menu = document.getElementById('calc-menu');
            let card = document.getElementById('calc-menu-card');

            loaded.forEach(function(item, idx) {
                if (typeof self.tabs.Calculators.menu[item.key] === 'object') {
                    let id = 'calc-item-' + item.key;
                    let li = document.createElement('li');
                    let a = document.createElement('a');
                    let span = document.createElement('span');
                    let div = document.createElement('div');

                    a.id = id;
                    a.setAttribute('href', '#');
                    a.addEventListener('click', menuClicked);

                    if (self.tabs.Calculators.menu[item.key].image) {
                        let img = document.createElement('img');
                        a.appendChild(img);
                        img.setAttribute('src', '/img/' + self.tabs.Calculators.menu[item.key].image);
                    }
                    a.appendChild(span);
                    span.innerHTML = guiString(self.tabs.Calculators.menu[item.key].title);
                    li.appendChild(a);
                    menu.appendChild(li);
                    self.tabs.Calculators.menu[item.key].nav = a;

                    div.className = 'v-menu-content';
                    div.setAttribute('data-v-menu-id', id);
                    card.appendChild(div);
                    self.tabs.Calculators.menu[item.key].html = div;

                    if (typeof item.html === 'string') {
                        div.innerHTML = item.html;
                    } else if ((item.html !== null) && typeof item.html === 'object') try {
                        div.appendChild(item.html);
                    } catch (e) {}

                    // Do any tab specific initialisation
                    if (self.tabs.Calculators.menu[item.key].hasOwnProperty('onInit')) {
                        if (typeof self.tabs.Calculators.menu[item.key].onInit === 'function')
                            self.tabs.Calculators.menu[item.key].onInit(item.key, div);
                        delete self.tabs.Calculators.menu[item.key].onInit;
                    }

                } else
                    delete self.tabs.Calculators.menu[item.key];
            });

            guiText_i18n(card);
            menuActive(bgp.exPrefs.calcMenu);

        }).catch(function(error) {
            console.error(error);
        });
    }

    /*
     ** @Private fetch Menu Item HTML content
     */
    function menuHTML(key) {
        if (self.tabs.Calculators.menu.hasOwnProperty(key) === true) {
            if (self.tabs.Calculators.menu[key].hasOwnProperty('html') === true) {
                if (self.tabs.Calculators.menu[key].html === true) {
                    return http.get.html("/manifest/tabs/calculators/" + key.toLowerCase() + ".html")
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
                        html: self.tabs.Calculators.menu[key].html
                    };
            }
        }
        return {
            key: key,
            script: true,
            html: null
        };
    }

    /*
     ** @Private - Menu Item Clicked
     */
    function menuClicked(e) {
        let id = e.target.id;
        if (!id)
            id = e.target.parentElement.id;
        e.preventDefault();

        // calc-item-
        id = id.slice(10);

        if ((!self.isLocked()) && active != id) {
            id = menuActive(id);
            chrome.storage.sync.set({
                calcMenu: id
            });
        }
    }

    /*
     ** @Private - menuActive
     */
    function menuActive(id) {
        let devMsg = document.getElementById('calcDevOnly');

        if (!self.tabs.Calculators.menu.hasOwnProperty(id)) {
            id = Object.keys(self.tabs.Calculators.menu)[0];
        }

        if (self.tabs.Calculators.menu.hasOwnProperty(active)) {
            self.tabs.Calculators.menu[active].nav.classList.remove('active');
            self.tabs.Calculators.menu[active].html.style.display = 'none';
            devMsg.style.display = 'none';
        }
        self.tabs.Calculators.menu[id].nav.classList.add('active');
        self.tabs.Calculators.menu[id].html.style.display = 'block';
        if ((localStorage.installType == 'development') && !menu[id]) {
            devMsg.innerText = guiString(menu[id] === null ? 'devOnly' : 'tstOnly');
            devMsg.style.display = 'block';
        }

        if (active != id) {
            self.tabs[tabID].content = self.tabs.Calculators.menu[id].html;
            self.tabs[tabID].time = null;
            active = id;
            if (self.active() == tabID)
                self.update();
        }

        return active;
    }

    /*
     ** @Private - Sync Action
     */
    function onAction(id, action, data) {
        if (self.tabs.Calculators.menu.hasOwnProperty(active)) {
            if (self.tabs.Calculators.menu[active].hasOwnProperty('onAction')) {
                self.tabs.Calculators.menu[active].onAction(active, action, data);
            }
        }
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        if (reason == 'active')
            return true;

        if ((!bgp.daGame.daUser) || !bgp.daGame.daUser.player || !bgp.daGame.daLevels || !bgp.daGame.daMaterials) {
            guiStatus('errorData', 'ERROR', 'error');
            return false;
        }

        if (self.tabs.Calculators.menu.hasOwnProperty(active)) {
            document.getElementById('calcAlert').style.display = 'none';
            self.tabs.Calculators.menu[active].html.style.display = 'block';
            if (self.tabs.Calculators.menu[active].hasOwnProperty('onUpdate')) {
                try {
                    let promise = self.tabs.Calculators.menu[active].onUpdate(active, reason);

                    if (typeof promise !== 'undefined') {
                        if ((promise !== 'undefined') && !!promise.then && typeof promise.then === 'function') {
                            let ok = promise.then(function(status) {
                                return status;
                            }).catch(function(error) {
                                self.calcError(error);
                            });
                            return true;
                        }
                        return promise;
                    }
                } catch (error) {
                    self.calcError(error);
                }
            }
        }

        return true;
    }

    /*
     ** @Public - Show Error
     */
    self.calcError = function(error) {
        console.error(error);
        if (typeof error !== 'string') {
            error = error.message;
        }
        self.tabs.Calculators.menu[active].html.style.display = 'none';
        document.getElementById('calcText').innerHTML = error;
        document.getElementById('calcAlert').style.display = 'block';
    }

    /*
     ** @Public - Get Region Name (if any)
     */
    self.regionName = function(rid, events = false) {
        nids = {
            1: 'MAP005', // EGYPT
            2: 'MAP006', // SCANDINAVIA
            3: 'MAP018', // CHINA
            4: 'MAP021', // ATLANTIS
            5: 'MAP038' // GREECE
        };

        if (rid == 0) {
            if (events)
                return guiString('Events');
        } else if (nids.hasOwnProperty(rid))
            return bgp.daGame.string(nids[rid]);
        return null;
    }

    /*
     ** @Public - Get Region Image (if any)
     */
    self.regionImage = function(rid, forceEgypt = false, size = 16) {
        if (rid == 0 && forceEgypt)
            rid = 1;

        if (rid >= 0 && rid <= bgp.daGame.maxRegions()) {
            let name = self.regionName(rid, !forceEgypt);

            return '<img src="/img/regions/' +
                rid + '.png" width="' + size + '" height="' + size + '"' +
                (name ? ' title="' + name + '"' : '') + '/>';
        }
        return '<img src="/img/blank.gif" title="' + rid + '"/>';
    }

    /*
     ** @Public - Get Object Display Order
     */
    self.objectOrder = function() {
        return objOrder;
    }

    /*
     ** @Public - Get Object Rank
     */
    self.objectRank = function(typ, oid, ord = 0) {
        if (typ == 'material') {
            let rank = Object.keys(matImg).indexOf(oid);

            if (rank !== -1) {
                //console.log(oid, rank, 0 - rank);
                return 0 - rank;
            }
        }

        return ord;
    }

    /*
     ** @Public - Get Object Name
     */
    self.objectName = function(type, oid) {
        switch (type) {
            case 'artifact':
                return self.artifactName(oid);
            case 'token':
                return self.tokenName(oid);
            case 'usable':
                return self.usablesName(oid);
            case 'material':
                return self.materialName(oid);
            case 'system':
                if (oid == 1)
                    return bgp.daGame.i18n('bonusXP').replace(/[\n\r]/g, ' ');
                if (oid == 2)
                    return bgp.daGame.i18n('bonusEnergy').replace(/[\n\r]/g, ' ');
                break;
        }
        return '?' + type + '-' + oid + '?';
    }

    /*
     ** @Public - Get Object Image
     */
    self.objectImage = function(type, oid, size = 16) {
        let img = null;

        switch (type) {
            case 'artifact':
                img = 'chest.png';
                break;
            case 'usable':
                img = 'usable.png';
                break;
            case 'token':
                img = 'token.png';
                if (tokImg.hasOwnProperty(oid))
                    img = tokImg[oid];
                break;
            case 'system':
                img = sysImg[oid];
                break;
            case 'material':
                if (bgp.daGame.daMaterials[oid].eid != 0)
                    oid = 0;
                img = matImg[oid];
                if ((img) && img !== 'undefined') {
                    img = 'materials' + img;
                }
                break;
        }

        if ((img) && img !== 'undefined') {
            let name = (oid != 0 ? self.objectName(type, oid) : null);
            return '<img src="/img/' + img + '" width="' + size + '" height="' + size + '"' +
                (name ? ' title="' + name + '"' : '') + '/>';
        }

        return '<img src="/img/blank.gif" />';
    }

    /*
     ** @Public - Get Artifact Name
     */
    self.artifactName = function(aid) {
        if ((bgp.daGame.daUser) && bgp.daGame.daArtifacts) {
            if (bgp.daGame.daArtifacts.hasOwnProperty(aid)) {
                if (bgp.daGame.daArtifacts[aid].nid === null) {

                } else
                    return bgp.daGame.string(bgp.daGame.daArtifacts[aid].nid);
            }
        }
        return 'artifact-' + aid;
    }

    /*
     ** @Public - Get Token Name
     */
    self.tokenName = function(tid) {
        if ((bgp.daGame.daUser) && bgp.daGame.daTokens) {
            if (bgp.daGame.daTokens.hasOwnProperty(tid)) {
                let nid = bgp.daGame.daTokens[tid].nid;
                if (nid === null || nid == 'vstup') {
                    return null;
                } else
                    return bgp.daGame.string(nid);
            }
        }
        return 'token-' + tid;
    }

    /*
     ** @Public - Get Usable Name
     */
    self.usablesName = function(uid) {
        if ((bgp.daGame.daUser) && bgp.daGame.daUsables) {
            if (bgp.daGame.daUsables.hasOwnProperty(uid)) {
                if (bgp.daGame.daUsables[uid].nid === null) {

                } else
                    return bgp.daGame.string(bgp.daGame.daUsables[uid].nid);
            }
        }
        return 'usable-' + uid;
    }

    /*
     ** @Public - Get Material Name
     */
    self.materialName = function(mid) {
        if ((bgp.daGame.daUser) && bgp.daGame.daMaterials) {
            if (bgp.daGame.daMaterials.hasOwnProperty(mid))
                if (bgp.daGame.daMaterials[mid].nid == null) {

                } else
                    return bgp.daGame.string(bgp.daGame.daMaterials[mid].nid);
        }
        return 'material-' + mid;
    }

    /*
     ** @Public - Check Game Material Inventory
     */
    self.materialInventory = function(mid) {
        if ((bgp.daGame.daUser) && bgp.daGame.daUser.hasOwnProperty('materials')) {
            if (bgp.daGame.daUser.materials.hasOwnProperty(mid))
                return parseInt(bgp.daGame.daUser.materials[mid]);
        }
        return 0;
    }

    self.duration = function(drn) {
        var mm = Math.floor((drn / 60) % 60);
        var hh = Math.floor((drn / (60 * 60)) % 24);
        var dd = Math.floor(drn / (60 * 60 * 24));

        var timeString = ((dd) ? dd + 'd:' : '') +
            (hh < 10 ? '0' : '') + parseInt(hh) + 'h:' +
            (mm < 10 ? '0' : '') + parseInt(mm) + 'm';

        return timeString;
    }

    self.isDev = function() {
        let uids = [3951243, 11530133, 8700592, 58335];
        if ((bgp.daGame.daUser) && bgp.daGame.daUser.hasOwnProperty('player'))
            return (!!uids.indexOf(bgp.daGame.daUser.player.uid) !== -1)

        return false;
    }

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/
