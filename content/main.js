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

function appInit () {
	// Set up the initial application environment and define settings
	if (settings.debug) {
		settings.server = "localhost";
		settings.updateInterval = 10000;
	} else {
		settings.server = "cantr.net";
		settings.updateInterval = 90000;
	}
	settings.protocolVersion = "1.0.1.";
    settings.clickThreshold = 500;
    settings.rsaPublicKey = new jCryptionKeyPair(
        "10001",
        "87b9bbe6272a7faeb0fa7f2d32c5299e7639edeffc679d6edf3538d43db1641f449ff5ce6076be1fe968d212fee81168a45d44a68670b1912de49cac3fa4db51db479d6abe3c8f25625b13dd2c0421a8ba935e9469583fe0d1c0c1bda42432632202d8b1ab127690cab409872f0a662e6b793b7d1e3ccafcb0ca829a5f12b72b",
        "131"
    );

	var node = new DOMParser().parseFromString(nativeApplication.applicationDescriptor, "text/xml");
	node = node.getElementsByTagName("application")[0].getElementsByTagName("version")[0];
	settings.version = node.textContent;

	appStart();
}

var credentials; // Holder for authentication data from login window

/* -- PHASE 3: USER AUTHENTICATION -- */

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

function logout () {
    nativeApplication.dispatchEvent(new air.Event("logout"));
    iconManager.setIcon(); menuManager.appIcon.setMenu();
    windowManager.createWindow("login", "login.htm");
}

nativeApplication.addEventListener("login", loginEvent);

/* -- FINAL PHASE: APPLICATION SHUTDOWN -- */

function appExit () {
	nativeApplication.exit();
}