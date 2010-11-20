var main = window.opener;

// Exit the application when this window is closed by the user
nativeWindow.addEventListener(air.Event.CLOSING, function (event) {
    event.target.removeEventListener(event.type, arguments.callee);
    event.stopPropagation();
    nativeApplication.dispatchEvent(new air.Event("appExit"));
}, false, 1);

function updateLocale () {
    // Update localised strings.
	localizer.update(document);
    
    // Resize to fit content.
	nativeWindow.stage.stageWidth = container.offsetWidth;
	nativeWindow.stage.stageHeight = container.offsetHeight;
};
nativeApplication.addEventListener("localeChanged", updateLocale);

nativeWindow.addEventListener("closeWindow", function (event) {
    event.target.removeEventListener(event.type, arguments.callee);
    nativeApplication.removeEventListener("localeChanged", updateLocale);
}, false, 1);

window.onload = function () {
	// Load localised strings
    statusContainer.setAttribute("local_innerHTML", "loginWindow.statusInit");
    updateLocale();
    
	metaContainer.textContent = main.settings.version;

	// Centre window in screen.
	nativeWindow.x = mainScreen.bounds.x + ((mainScreen.bounds.width - nativeWindow.width) / 2);
	nativeWindow.y = mainScreen.bounds.y + ((mainScreen.bounds.height - nativeWindow.height) / 2);

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
        if (!this.checked) air.EncryptedLocalStore.removeItem("credentials");
    };

    // Initialise form elements
    if (!playerID.value.length) { playerID.focus(); }
    else if (!password.value.length) { password.focus(); }

	mainForm.onsubmit = loginEvent;
    
    settings.onclick = function () {
        nativeApplication.dispatchEvent(new air.Event("showSettings"));
    };

    // Show window
	nativeWindow.activate();
};

// Handle submission of login form
function loginEvent () {
	if (playerID.value.length && password.value.length) {
        // Update visual state
		statusContainer.setAttribute("local_innerHTML", "loginWindow.statusLoggingIn");
        localizer.update(statusContainer.parentNode);
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
nativeWindow.addEventListener("successfulLogin", function () {
    nativeWindow.dispatchEvent(new air.Event("closeWindow"));
});

// Handle failed login
nativeWindow.addEventListener("badLogin", function () {
	statusContainer.setAttribute("local_innerHTML", "loginWindow.statusBadLogin");
    localizer.update(statusContainer.parentNode);
	password.value = "";
	enableForm();
});

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