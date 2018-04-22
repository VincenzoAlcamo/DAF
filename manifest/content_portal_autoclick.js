// we try several times (popup has not finished initializing)
let clicked = false,
    timeout = 0,
    count = 10;

function autoClick() {
    Array.from(document.getElementsByClassName('layerConfirm')).forEach(element => {
        if (element.name == '__CONFIRM__') {
            clicked = true;
            element.click();
            // just in case the popup has not been closed
            setTimeout(autoClick, 2000);
            setTimeout(autoClick, 5000);
        }
    });
    timeout += 200;
    if (!clicked && --count > 0) setTimeout(autoClick, timeout);
}
autoClick();