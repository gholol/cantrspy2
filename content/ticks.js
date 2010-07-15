var main = window.opener;

window.onload = function () {
    // Initialise window position and size
	nativeWindow.stage.stageWidth = 450;
	nativeWindow.stage.stageHeight = 300;
    nativeWindow.x = main.configurationManager.get("tickTimings.windowLeft")
        || mainScreen.bounds.left + ((mainScreen.bounds.width - nativeWindow.stage.stageWidth) / 2);
    nativeWindow.y = main.configurationManager.get("tickTimings.windowTop")
        || mainScreen.bounds.top + ((mainScreen.bounds.height - nativeWindow.stage.stageHeight) / 2);
    
    // Show window
    nativeWindow.activate();
    
    // Initialise loading of ticks page
    window.location = "http://joo.freehostia.com/cantr/ticks/small.php";
};

nativeWindow.addEventListener(air.Event.CLOSING, function () {
    main.configurationManager.set("tickTimings.windowLeft", nativeWindow.x, true);
    main.configurationManager.set("tickTimings.windowTop", nativeWindow.y, true);
});