/*
 ** DA Friends - children.js
 */
var guiTabs = (function(self) {
    var tabID, info, opts, stats, grid;

    /*
     ** @Private - Initialise the tab
     */
    function onInit(id, cel) {
        tabID = id;
        info = document.getElementById("gcInfo");
        opts = document.getElementById("gcOpts");
        stats = document.getElementById("gcStats");
        grid = document.getElementById("gcGrid");
        opts.innerHTML = guiString('godsChildren');
    }

    /*
     ** @Private - Sync Action
     */
    function onAction(id, action, data) {
        //console.log(id, "onAction", action, data);
        if (action == 'friend_child_charge') {
            var el = document.getElementById('gc-' + data.uid);
            if (el) {
                el.parentNode.removeChild(el);
                if (grid.childNodes.length == 0)
                    grid.style.display = 'none';
                var neighbours = Object.keys(bgp.daGame.daUser.neighbours).length;
                opts.innerHTML = guiString('godsChildren') +
                    " " +
                    numberWithCommas(grid.childNodes.length) +
                    " / " +
                    numberWithCommas(self.childrenMax(neighbours - 1) + 1);
            }
        }
    }

    /*
     ** @Private - Update the tab
     */
    function onUpdate(id, reason) {
        if (reason == 'active')
            return true;

        var neighbours = Object.keys(bgp.daGame.daUser.neighbours).length;
        var counter = 0;
        grid.innerHTML = '';

        Object.keys(bgp.daGame.daUser.neighbours).sort(function(a, b) {
            if (bgp.daGame.daUser.neighbours[a].uid == 1)
                return 9999;
            if (bgp.daGame.daUser.neighbours[b].uid == 1)
                return -9999;

            return bgp.daGame.daUser.neighbours[a].level - bgp.daGame.daUser.neighbours[b].level;
        }).forEach(function(uid) {
            var pal = bgp.daGame.daUser.neighbours[uid];
            var fid = pal.fb_id;
            var fullName, player = pal.name;
            var show = parseInt(pal.spawned) === 1 ? true : false;

            if (show) {
                counter = counter + 1;

                var html = '',
                    img;

                if (!player && !pal.surname)
                    player = 'Player ' + uid;
                fullName = player + ((!pal.surname) ? '' : ' ' + pal.surname);

                if (uid > 1) {
                    html += '<a class="gallery" href="https://www.facebook.com/' + fid + '"';
                    html += ' title="' + fullName + '"';
                } else
                    html += '<div class="gallery"';
                html += ' id="gc-' + pal.uid + '"';
                html += ' style="background-image: url(' + pal.pic_square + ');">';
                html += '<span class="level">' + pal.level + '</span>';
                html += '<span class="name">' + player + '</span>';
                html += (uid > 1) ? '</a>' : '</div>';

                grid.innerHTML += html;
            }
        });

        grid.style.display = (counter == 0) ? 'none' : '';
        self.linkTabs(grid);

        var realNeighbours = neighbours - 1;

        stats.innerHTML = guiString("inStatCount", [numberWithCommas(neighbours)]) +
            " - " +
            self.childrenStats(realNeighbours);

        opts.innerHTML = guiString('godsChildren') +
            " " +
            numberWithCommas(counter) +
            " / " +
            numberWithCommas(self.childrenMax(realNeighbours) + 1);

        return true;
    }

    /*
     ** @Public - (getGC) realNeighbours = # of neighbours excluding Mr. Bill
     */
    self.childrenMax = function(realNeighbours) {
        var max = Math.floor(Math.sqrt(realNeighbours)) + 3;
        return max > realNeighbours ? realNeighbours : max;
    }

    /*
     ** @Public - (nextGC)
     */
    self.childrenNext = function(realNeighbours) {
        if (realNeighbours < 5) return 1;
        var next = Math.floor(Math.sqrt(realNeighbours)) + 1;
        var goal = next * next;
        // Facebook hard limit of 5000 friends
        return goal > 5000 ? 0 : goal - realNeighbours;
    }

    /*
     ** @Public - Children stats string
     */
    self.childrenStats = function(realNeighbours) {
        var next = self.childrenNext(realNeighbours);
        var nextInfo;

        switch (next) {
            case 0:
                nextInfo = guiString('GCnext0');
                break;
            case 1:
                nextInfo = guiString('GCnext1');
                break;
            default:
                nextInfo = guiString('GCnext', [next]);
                break;
        }
        return nextInfo;
    }

    /*
     ** Define this tab's details
     */
    self.tabs.Children = {
        title: 'godsChildren',
        image: 'gc.png',
        order: 5,
        html: true,
        onInit: onInit,
        onAction: onAction,
        onUpdate: onUpdate
    };

    return self;
}(guiTabs || {}));
/*
 ** End
 *******************************************************************************/