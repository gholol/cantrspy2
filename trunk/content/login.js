var main = window.opener, statusText;

window.onload = function () {
	// Load localised strings
	localizer.update();
	statusText = document.createTextNode(localizer.getString("loginWindow", "statusInit"));
	statusContainer.appendChild(statusText);
	metaContainer.appendChild(document.createTextNode(main.settings.version));

	// Resize to fit content and centre in screen
	nativeWindow.stage.stageWidth = container.offsetWidth;
	nativeWindow.stage.stageHeight = container.offsetHeight;
	var boundary = air.Screen.mainScreen.bounds;
	nativeWindow.x = boundary.x + ((boundary.width - nativeWindow.width) / 2);
	nativeWindow.y = boundary.y + ((boundary.height - nativeWindow.height) / 2);

    // Initialise autoRun checkbox
    try {
        autoRun.checked = nativeApplication.startAtLogin;
        autoRun.onchange = function () {
            nativeApplication.startAtLogin = this.checked;
        };
    }
    catch (error) {
        autoRun.disabled = true;
    }

    // Obtain stored user credentials, if applicable
    // and initialise rememberDetails checkbox
    var credentials = air.EncryptedLocalStore.getItem("credentials");
    if (credentials !== null) {
        try {
            playerID.value = credentials.readUTF();
            password.value = credentials.readUTF();
            rememberDetails.checked = true;
        }
        catch (error) {
            // Data seems to have been corrupted
            air.EncryptedLocalStore.removeItem("credentials");
            playerID.value = "";
            password.value = "";
        }
    }
    rememberDetails.onchange = function () {
        if (!this.checked) {
            air.EncryptedLocalStore.removeItem("credentials");
        }
    }

    if (!playerID.value.length) { playerID.focus(); }
    else if (!password.value.length) { password.focus(); }

	mainForm.onsubmit = loginEvent;
	nativeWindow.activate();
}

// Handle submission of login form
function loginEvent () {
	if (playerID.value.length && password.value.length) {
        // Update visual state
		statusText.nodeValue = localizer.getString("loginWindow", "statusLoggingIn");
		disableForm();

        // Save credentials if user has opted to do so
        if (rememberDetails.checked) {
            var credentials = new air.ByteArray;
            credentials.writeUTF(playerID.value);
            credentials.writeUTF(password.value);
            air.EncryptedLocalStore.setItem("credentials", credentials);
        }

		// Transmit login information to main window
		main.credentials = {id: playerID.value, pw: password.value};
		nativeApplication.dispatchEvent(new air.Event("login"));
	}
	else {
        // Set focus to empty field
		if (!playerID.value.length) { playerID.focus(); }
		else { password.focus(); }
	}
    // Halt further processing of submit event
	return false;
}

// Handle successful login
function successfulLoginEvent () {
    // Close window
    nativeWindow.close();
}
nativeWindow.addEventListener("successfulLogin", successfulLoginEvent);

// Handle failed login
function badLoginEvent () {
	statusText.nodeValue = localizer.getString("loginWindow", "statusBadLogin");
	password.value = "";
	enableForm();
}
nativeWindow.addEventListener("badLogin", badLoginEvent);

// Utility Functions

function disableForm () {
	playerID.disabled = true;
	password.disabled = true;
	loginButton.disabled = true;
    rememberDetails.disabled = true;
	if ("blur" in document.activeElement) {	document.activeElement.blur(); }
}

function enableForm () {
	playerID.disabled = false;
	password.disabled = false;
	loginButton.disabled = false;
    rememberDetails.disabled = false;
	if (!playerID.value.length) { playerID.focus(); }
	else { password.focus(); }
}