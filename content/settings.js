var main = window.opener;

window.onload = function () {
	// Load localised strings.
	localizer.update();

	// Resize to fit content and centre in screen.
	nativeWindow.stage.stageWidth = container.offsetWidth;
	nativeWindow.stage.stageHeight = container.offsetHeight;
	nativeWindow.x = mainScreen.bounds.x + ((mainScreen.bounds.width - nativeWindow.width) / 2);
	nativeWindow.y = mainScreen.bounds.y + ((mainScreen.bounds.height - nativeWindow.height) / 2);

    // Bind autoRun
    try {
        autoRun.checked = nativeApplication.startAtLogin;
        autoRun.onchange = function () { nativeApplication.startAtLogin = this.checked; };
    } catch (error) { autoRun.disabled = true; }
    
    // Bind autoUpdate
    autoUpdate.checked = main.configurationManager.get("autoUpdate", true);
    autoUpdate.onchange = function () { main.configurationManager.set("autoUpdate", this.checked) };
    
    // Bind checkNow
    function stopOnClose () { main.updater.cancelUpdate(); }
    
    checkNow.onclick = function (event) {
        this.disabled = true;
        updateIndicator.style.visibility = "visible";
        nativeWindow.addEventListener("closeWindow", stopOnClose, false, 1);
        nativeApplication.dispatchEvent(new air.Event("checkForUpdate"));
    };

    function updateStop () {
        checkNow.disabled = false;
        updateIndicator.style.visibility = "hidden";
        nativeWindow.removeEventListener("closeWindow", stopOnClose)
    }
    nativeApplication.addEventListener("updateStatus", updateStop);
    nativeApplication.addEventListener("updateError", updateStop);
    
    // Bind showTicks
    showTicks.checked = main.configurationManager.get("showTicks", false);
    showTicks.onchange = function () {
        main.configurationManager.set("showTicks", this.checked)
        main.menuManager.appIcon.refresh();
    };
    
    // Bind iconStyle
    window["iconStyle_" + main.configurationManager.get("iconStyle", "circle")].click();
    iconStyle_circle.onchange = iconStyle_square.onchange = function () {
        if (this.checked) {
            main.configurationManager.set("iconStyle", this.value);
            main.iconManager.refresh();
        }
    };
    
    // Bind closeButton
    closeButton.onclick = function () { nativeWindow.dispatchEvent(new air.Event("closeWindow")); };
    
    // Show window
	nativeWindow.activate();
}