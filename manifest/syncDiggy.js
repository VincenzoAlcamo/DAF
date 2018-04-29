/*
 ** DA Friends - syncDiggy.js
 */
(function() {
    'use strict';

    // REMEMBER: define only the handlers that are effectively in use, so we don't parse the result unnecessarily
    var handlers = {},
        signalAction, signalTabId;

    // This function must be used in handler to send data to the GUI/Tabs
    const SIGNAL_GUI = 1,
        SIGNAL_TAB = 2;

    function signal(signalType, data) {
        var message = {
            cmd: 'gameSync',
            action: signalAction,
            data: data
        };
        if (signalType & SIGNAL_GUI) chrome.extension.sendMessage(message);
        if (signalType & SIGNAL_TAB) chrome.tabs.sendMessage(signalTabId, message);
    }

    var syncDiggy = function(__public) {
        /*********************************************************************
         ** @Public - Sync Data
         */
        __public.syncData = function(tabId, xml, syncData = null) {
            // Only sync on good game data (also means we ignore if cached data too)
            if (__public.daUser.result != "OK" || !(xml = parseXml(xml))) return;
            // we get only the task nodes
            var nodes = getXmlChildren(xml.documentElement, 'task'),
                taskResult = null,
                didSomething = false;
            signalTabId = tabId;

            // We could process the "global" and "un_gift" sections in a future release

            for (var taskIndex = 0, len = nodes.length; taskIndex < len; taskIndex++) {
                var task = nodes[taskIndex];
                signalAction = getXmlChildValue(task, 'action');
                var taskFunc = '__gameSync_' + signalAction,
                    fn = handlers[taskFunc];
                if (fn instanceof Function) {
                    if (!taskResult) {
                        taskResult = {
                            text: syncData,
                            isParsed: false,
                            xml: null,
                            taskName: '',
                            getTaskNode: function() {
                                if (!this.isParsed) {
                                    this.isParsed = true;
                                    this.xml = parseXml(this.text);
                                }
                                return getXmlChild(this.xml && this.xml.documentElement, this.taskName);
                            }
                        }
                    }
                    taskResult.taskName = 'task_' + taskIndex;
                    try {
                        // DO NOT STORE THE TASKRESULT OBJECT
                        if (fn.call(this, task, taskResult)) didSomething = true;
                    } catch (e) {
                        console.error(taskFunc + '() ' + e.message);
                    }
                }
            }
            if (didSomething) {
                badgeFlasher(__public.i18n('Sync'), 2, 250, 'green');
                badgeStatus();

                // Should get each handler to call this as and when required
                // but OK here for now

                // TODO: FIXME:
                //
                // Disabled for now as causing lag and the gifting data to error
                // Will need to look at how the data is set out, i.e. moving
                // the neighbours field out of daUser and/or maybe a seperate
                // entry for each neighbour so updates can be quick and small
                //
                //__public.cacheSync();
            }
        }

        /*
         ** visit_camp
         */
        handlers['__gameSync_visit_camp'] = function(task, taskResult) {
            if (taskResult) {
                // store reference to the result
                if (taskResult.isParsed) {
                    // parsed? we can get the node
                    lastVisitedCamp = {
                        xml: taskResult.getTaskNode()
                    };
                } else {
                    // not parsed? we avoid parsing and store the xml text and the node name
                    // parsing will be performed in camp.js
                    lastVisitedCamp = {
                        text: taskResult.text,
                        taskName: taskResult.taskName
                    };
                }
                if(!lastVisitedCamp.xml && !lastVisitedCamp.text) return;
                lastVisitedCamp.processed = false;
                lastVisitedCamp.neigh_id = getXmlChildValue(task, 'neigh_id');
                signal(SIGNAL_GUI);
            }
        };

        /*
         ** friend_child_charge
         */
        handlers['__gameSync_friend_child_charge'] = function(task, taskResult) {
            var uid = getXmlChildValue(task, 'neigh_id'),
                neighbour = __public.daUser.neighbours[uid];
            if (neighbour) {
                if (neighbour.spawned != '0') {
                    if (!neighbour.hasOwnProperty('gcCount')) neighbour.gcCount = parseInt(__public.daConfig.child_count);
                    if ((--neighbour.gcCount) <= 0) {
                        // Collected all of them!
                        neighbour.spawned = '0';
                        signal(SIGNAL_GUI + SIGNAL_TAB, {
                            uid: uid
                        });
                    }
                }
            } else {
                if (exPrefs.debug) console.log(signalAction, uid, "cannot find neighbour?");
            }
        }

        /*********************************************************************
         ** @Public Methods (and propertys)
         */
        return __public;
    }

    /*
     ** Attach to global namespace
     */
    window.syncDiggy = syncDiggy;
})();


/**

function gameSync()
{
    //if (exPrefs.debug) console.log("gameSync", sniffData.requestForm);
    flashBadge("Sync", 2, 50);
    statusSniffing();

    for (key in sniffData.requestForm.task) {
        var action = sniffData.requestForm.task[key].action;
        var time = sniffData.requestForm.task[key].time;

        switch(action)
        {
            case 'enter_mine':              // loc_id
            case 'change_level':            // exit_id, direction
                syncLocation(sniffData.requestForm.task[key]);
                break;

            case 'leave_mine':              // loc_id, cur_row, cur_column, level
            case 'mine':                    // stamina, row, column, cur_row, cur_column

            case 'unload_anvil_alloy':      // anvil_id
            case 'start_anvil_alloy':       // anvil_id, alloy_id
            case 'unload_pot_recipe':       // pot_id
            case 'start_pot_recipe':        // pot_id, pot_recipe_id
            case 'prod_unload_caravan':     // caravan_id, debug_timer, unique_id
            case 'prod_send_caravan':       // caravan_id, dest_id
            case 'use_beacon':              // row, column, cur_row, cur_column
            case 'talk_to_npc':             // npc_id
            case 'accept_quest':            // quest_id
            case 'complete_quest_step':     // quest_id, step_id
            case 'send_gift':               // neighbour_id (CSV List of ID's), gift_id
            case 'accept_gift':             // gift_id (CSV List of ID's)
            case 'camp_switch':             // No fields
            case 'visit_camp':              // neigh_id
            case 'place_windmill':          // neigh_id, pos_x, def_id, line_id
            case 'friend_child_charge':     // neigh_id, def_id
            case 'place_building':          // building_id, line_id, slot
            case 'remove_building':         // building_id
            case 'sale':
            case 'track_loading':
            default:
                if (exPrefs.debug) console.log(key, time, action, sniffData.requestForm.task[key]);
                break;
        }
    }

    if (exTab)
        chrome.tabs.sendMessage(exTab, { cmd: "gameSync", data: sniffData.requestForm });
}

function syncLocation(task = null)
{
    var loc = {
        id:     0,
        lvl:    1,
        prog:   0,
        lock:   0,
        reset:  0,
        cmpl:   0,
        crtd:   0
    };

    if (!daData.loc_prog.hasOwnProperty(daData.loc_id)) {
        if (exPrefs.debug) console.log("Current Location, No Progress Found!", daData.loc_id);
        loc.id = daData.loc_id;
        daData.loc_prog[daData.loc_id] = loc;
    }else
        loc = daData.loc_prog[daData.loc_id];

    if (task) {
        if (task.action == 'enter_mine') {
            if (exPrefs.debug) console.log("Current Location: ", daData.loc_id, " Floor: ", daData.loc_floor, loc);
            if (!daData.loc_prog.hasOwnProperty(task.loc_id)) {
                if (exPrefs.debug) console.log("New Location, No Progress Found!", task.loc_id);
            }else {
                loc = daData.loc_prog[task.loc_id];
                daData.loc_level = loc.lvl;
            }
            daData.loc_id = task.loc_id;
        }else if(task.action == 'change_level') {
            if (task.direction == 'up')     daData.loc_floor = (daData.loc_floor - 1);
            if (task.direction == 'down')   daData.loc_floor = (daData.loc_floor + 1);
        }
        if (exPrefs.debug) console.log("Location: ", daData.loc_id, " Floor: ", daData.loc_floor, task, loc);
        return;
    }
    if (exPrefs.debug) console.log("Location: ", daData.loc_id, " Floor: ", daData.loc_floor, loc);
}

**/

/*
 ** END
 *******************************************************************************/