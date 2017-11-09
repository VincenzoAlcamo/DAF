var reFacebook = /https?:\/\/diggysadventure\.com\/miner\/wallpost.php\?wp_id=(\d+)&fb_type=(standard|portal)&wp_sig=([0-9a-z]+)/g,
    rePortal = /https?:\/\/portal\.pixelfederation\.com\/_da\/miner\/wallpost.php\?.+&wp_id=(\d+)&fb_type=(standard|portal)&wp_sig=([0-9a-z]+)/g,
    reMaterial = /material_([0-9]+)\.png/,
    reFriend = /https?:\/\/graph\.facebook\.com(\/v[^\/]+)?\/(\d+)\/picture/,
    reExpired = /expired/,
    reAuto = /auto-ricompensa/,
    reBroken = /something went wrong/,
    reWait = /\s(\d?\d)h\s(\d?\d)m/,
    data = null,
    match, div, el;

function getObj(id, typ, sig) {
    return {
        id: id,
        typ: typ,
        sig: sig
    };
}

// Facebook reward link
if (!data) {
    match = reFacebook.exec(location.href);
    data = match ? getObj(match[1], match[2], match[3]) : null;
}

// Portal reward link
if (!data) {
    match = rePortal.exec(location.href);
    data = match ? getObj(match[1], match[2], match[3]) : null;
}

if (data) {
    data.cdt = Math.floor(Date.now() / 1000);

    // Material id
    div = document.getElementsByClassName('reward')[0];
    match = div && reMaterial.exec(div.style.backgroundImage);
    if (match) data.cmt = parseInt(match[1]) || 0;

    div = document.getElementsByClassName("wp_avatar")[0];
    // Facebook id
    el = div && div.getElementsByTagName('img')[0];
    match = el && reFriend.exec(el.src);
    if (match) data.cid = match[2];
    // Facebook name
    el = div && div.getElementsByTagName('p')[0];
    if (el) data.cnm = el.textContent;


    div = document.getElementsByClassName("da-receiving-text")[0];
    if (div) {
        var text = div.textContent;
        if ((match = reWait.exec(text))) {
            // All links collected, retry in xxh yym
            data.cmt = -3;
            data.next = data.cdt + (parseInt(match[1]) * 60 + parseInt(match[2])) * 60;
        } else if (text.match(reExpired)) {
            // This link can't be clicked - its time has expired.
            data.cmt = -1;
        } else if (text.match(reAuto)) {
            //Nessuna ricompensa. Niente auto-ricompensa.
            data.cmt = -4;
        } else if (text.match(reBroken)) {
            //Error! Diggy had broken his shovel and something went wrong!
            data.cmt = -5;
        } else {
            // Already collected
            data.cmt = -2;
        }
    }

    chrome.runtime.sendMessage({
        cmd: 'addRewardLinks',
        values: data
    });
}