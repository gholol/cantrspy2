/* -- PHASE 1: APPLICATION INVOCATION -- */

var settings = {};

function invokeEvent (event) {
	// Retrieve arguments supplied to the application on first invocation only
	settings.debug = (event.arguments.indexOf("debug") >= 0);
	if (settings.debug) { air.trace("DEBUGGING MODE ENABLED"); }
	nativeApplication.removeEventListener(air.InvokeEvent.INVOKE, invokeEvent);

	appInit();
}
nativeApplication.addEventListener(air.InvokeEvent.INVOKE, invokeEvent);

/* -- PHASE 2: INITIALISATION -- */

var updater;

function appInit () {
	// Set up the initial application environment and define settings
	if (settings.debug) {
		settings.server = "localhost";
		settings.updateInterval = 10000;
	} else {
		settings.server = "cantr.net";
		settings.updateInterval = 90000;
	}
	settings.protocolVersion = "1.1.0.";
    settings.clickThreshold = 500;
    settings.showTicks = true;

	var node = new DOMParser().parseFromString(nativeApplication.applicationDescriptor, "text/xml");
	node = node.getElementsByTagName("application")[0].getElementsByTagName("version")[0];
	settings.version = node.textContent;
    
    // Initiate garbage collection process
    window.setInterval(method(air.System, air.System.gc), Math.floor(settings.updateInterval / 4));
    
    // Initialise update framework
    if (configurationManager.get("autoUpdate", true)) checkForUpdate(false);

	appStart();
}

function checkForUpdate (visible) {
    // Initialise updater object if it does not exist
    var creating = (updater === undefined);
    if (creating) {
        updater = new air.ApplicationUpdaterUI;
        if (settings.debug) updater.updateURL = "http://localhost/cs_update.xml";
        else updater.updateURL = "http://joo.freehostia.com/cantrspy?update=" + settings.version;
        updater.addEventListener("updateStatus", function (event) { nativeApplication.dispatchEvent(event); });
        updater.addEventListener("updateError", function (event) { nativeApplication.dispatchEvent(event); });
        updater.addEventListener(air.UpdateEvent.INITIALIZED, function (event) {
            event.target.removeEventListener(event.type, arguments.callee);
            updater.checkNow();
        });
    }
    
    // Set up user interface based on parameters
    updater.isCheckForUpdateVisible = false;
    updater.addEventListener(air.StatusUpdateEvent.UPDATE_STATUS, function (event) {
        updater.removeEventListener(event.type, arguments.callee);
        updater.isCheckForUpdateVisible = visible;
    });
    
    // Begin update sequence
    if (creating) updater.initialize();
    else if (!updater.hasEventListener(air.UpdateEvent.INITIALIZED)) {
        if (updater.isUpdateInProgress) updater.cancelUpdate();
        updater.checkNow();
    }
}
nativeApplication.addEventListener("checkForUpdate", function () { checkForUpdate(true); });

/* -- PHASE 3: USER AUTHENTICATION -- */

var credentials; // Holder for authentication data from login window

function appStart () {    
    // Look for previously saved credentials
    var data = air.EncryptedLocalStore.getItem("credentials");
    if (data !== null) {
        try {
            // Read values from retrieved data
            id = data.readUTF()
            pw = data.readUTF();

            // Initialise application icon to indicate application presence
            menuManager.appIcon.setMenu("locked");
            iconManager.setIcon("blank");
            iconManager.setTooltip(localizer.getString("trayTooltips", "connecting"));

            // Attempt to log in with credentials
            credentials = {id: id, pw: pw};
            loginEvent();

            return;
        }
        catch (error) {
            // Data seems to have been corrupted
            air.EncryptedLocalStore.removeItem("credentials");
        }
    }
    // Otherwiwse create the login window to request manual input
    windowManager.createWindow("login", "login.htm");
}

/* -- PHASE 4: SERVER FEEDBACK -- */

function loginEvent () {
	// The user's credentials have been successfully submitted
	// Set up status indicators and begin communicating with the server

	menuManager.appIcon.setMenu("main");

	// Initiate the routine which retrieves and processes updates from the server
	updateManager.initialise(credentials);
	requestManager.playerPage.initialise(credentials);
	delete credentials;
}
nativeApplication.addEventListener("login", loginEvent);

function showTicks () {
    if ("tickTimings" in windowManager) {
        windowManager.tickTimings.activate();
    } else {
        windowManager.createWindow("tickTimings", "ticks.htm");
    }
}
nativeApplication.addEventListener("showTicks", showTicks);

function showSettings () {
    if ("settings" in windowManager) {
        windowManager.settings.activate();
    } else {
        windowManager.createWindow("settings", "settings.htm");
    }
}
nativeApplication.addEventListener("showSettings", showSettings);

function logout () {
    nativeApplication.dispatchEvent(new air.Event("logout"));
    iconManager.setIcon(); menuManager.appIcon.setMenu();
    windowManager.createWindow("login", "login.htm");
}


/* -- FINAL PHASE: APPLICATION SHUTDOWN -- */

function appExit () {
	nativeApplication.exit();
}
nativeApplication.addEventListener("appExit", appExit);