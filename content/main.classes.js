/* Object windowManager
 *   DOMWindow createWindow(String url, Number width, Number height)
 */
var windowManager = {
	createWindow: function (name, url) {
		// Creates a standard window with the given dimensions and initiates loading of the given URL.
		// Returns the created DOMWindow object.
		var options = new air.NativeWindowInitOptions();
		options.maximizable = false;
		options.minimizable = true;
		options.resizable = false;
		var loader = air.HTMLLoader.createRootWindow(false, options, false);

		loader.window.opener = window;
		function windowClosingEvent (event) { windowManager.windowClosingEvent(event); }
		loader.window.nativeWindow.addEventListener(air.Event.CLOSING, windowClosingEvent);
		loader.load(new air.URLRequest(url));

		this[name] = loader.window;
		function windowCloseEvent (event) { windowManager.windowCloseEvent(event); }
		loader.window.nativeWindow.addEventListener(air.Event.CLOSE, windowCloseEvent);

		return loader.window;
	},

	windowClosingEvent: function (event) {
		// Exits the application if the user closes a created window.
		appExit();
	},

	windowCloseEvent: function (event) {
		// Removes a reference to a window if it has been closed
		for (var name in this) {
			if ("nativeWindow" in this[name]) {
				if (this[name].nativeWindow === event.target) { delete this[name]; }
			}
		}
	}

};

/* Object updateManager
 *   void initialise(Object credentials)
 *   void userUpdate()
 */
var updateManager = {

	initialise: function (aCredentials) {
		// Activates the continous routine of requesting updates from the server
		// and indicating changes in the current status to the user
		var req = new air.URLRequest();
		req.url = "http://" + settings.server + "/app.getevents2.php";
		var vars = new air.URLVariables();
			vars.id = aCredentials.id;
			vars.pass = hex_md5(aCredentials.pw);
			vars.ver = settings.protocolVersion;
		req.data = vars;
		req.method = air.URLRequestMethod.POST;
		req.cacheResponse = false; req.useCache = false;
		this.updateRequest = req;

		// Set to destroy on logout
		var logoutEvent = function () {
			updateManager.destroy();
			nativeApplication.removeEventListener("logout", arguments.callee);
		};
		nativeApplication.addEventListener("logout", logoutEvent);

		this.interval = window.setInterval(function () { updateManager.update(); }, settings.updateInterval);
		this.update();
	},
    
    userUpdate: function () {
        if (this.status == "idle") {
            // Reset timer
            window.clearInterval(this.interval);
            this.interval = window.setInterval(function () { updateManager.update(); }, settings.updateInterval);
            
            // Indicate activity to user
            iconManager.setIcon("blank");
            iconManager.setTooltip(localizer.getString("trayTooltips", "connecting"));
            
            // Invoke update
            this.update();
        }
    },

	destroy: function () {
		window.clearInterval(this.interval);
		delete this.interval;
		delete this.updateRequest;
        delete this.status;
	},

	update: function () {
		// Begin a new update request
		var loader = new air.URLLoader();
		loader.dataFormat = air.URLLoaderDataFormat.TEXT;

		function updateEvent (event) { updateManager.updateEvent(event); }
		loader.addEventListener(air.Event.COMPLETE, updateEvent);
		loader.addEventListener(air.IOErrorEvent.IO_ERROR, updateEvent);
		loader.addEventListener(air.SecurityErrorEvent.SECURITY_ERROR, updateEvent);

		loader.load(this.updateRequest);
		this.updateLoader = loader;
        
        this.status = "updating";
        menuManager.appIcon.disable("updateNow");
	},

	updateEvent: function (event) {
		// Handle an event from the HTTPLoader
		switch (event.type) {

			case air.Event.COMPLETE:
				// The network operation completed successfully.
				var data = updateManager.updateLoader.data;
				if (data.substr(0, 7) == "OK LIST") {
					// The authentication was successful
					var list = data.substr(8);
					if (list.length) {
						// One or more character names were returned
						iconManager.initialise();
						var names = list.split("\n");
						if (names.length in iconManager.icons) {
							iconManager.setIcon(names.length);
						} else {
							iconManager.setIcon("alert");
						}
						var primary = names.join(", ");
						var secondary = localizer.getString("trayTooltips", "numChars", [names.length]);
						iconManager.setTooltip(primary, secondary);
					} else {
						// No character names were returned
						iconManager.setIcon("idle");
						iconManager.setTooltip(localizer.getString("trayTooltips", "noChars"));
					}
				} else if ((data == "BAD LOGIN") || (data == "ERROR Hacking attempt")) {
					// The login details were incorrect
					if ("login" in windowManager) {
						windowManager.login.nativeWindow.dispatchEvent(new air.Event("badLogin"));
						this.destroy();
					} else {
						iconManager.setIcon("error");
						iconManager.setTooltip(localizer.getString("trayTooltips", "errorAuth"));
					}
					var badLogin = true;
				} else if (data.substr(0, 5) == "ERROR") {
					// The server returned an error message
					iconManager.setIcon("error");
					iconManager.setTooltip(localizer.getString("trayTooltips", "error", [data.substr(6)]));
				} else {
					// The response could not be interpreted
					iconManager.setIcon("error");
					iconManager.setTooltip(localizer.getString("trayTooltips", "errorParse"));
				}

				break;

			case air.IOErrorEvent.IO_ERROR: case air.SecurityErrorEvent.SECURITY_ERROR:
				// A transmission error occured.
                var message;
                switch (event.errorID) {
                    case 2032: message = localizer.getString("trayTooltips", "errorConnect"); break;
                    default: message = event.text;
                }
				iconManager.setIcon("error");
				iconManager.setTooltip(message);
                air.trace(event);
		}

        // Manage the opened login window
        if (("login" in windowManager) && !badLogin) {
            windowManager.login.nativeWindow.dispatchEvent(new air.Event("successfulLogin"));
        }
        
        this.status = "idle";
        menuManager.appIcon.enable("updateNow");
	}

};

/* Object menuManager
 */
var menuManager = {
	appIcon: {
		setMenu: function (context) {
			var menu = new air.NativeMenu();
			function iconMenuSelectEvent (event) { menuManager.appIcon.iconMenuSelectEvent(event); }
			menu.addEventListener(air.Event.SELECT, iconMenuSelectEvent);

			var i;
			switch (context) {
				case "main":
                    // Open player page
					i = new air.NativeMenuItem(localizer.getString("trayMenu", "openPlayerPage"));
					i.name = "openPlayerPage";
					menu.addItem(i);
                    
                    // Update now
                    i = new air.NativeMenuItem(localizer.getString("trayMenu", "updateNow"));
                    i.name = "updateNow";
                    menu.addItem(i);

                    // Logout
					i = new air.NativeMenuItem(localizer.getString("trayMenu", "logout"));
					i.name = "logout";
					menu.addItem(i);

					if (air.NativeApplication.supportsSystemTrayIcon) {
                        // divider
						i = new air.NativeMenuItem("", true);
						menu.addItem(i);
					}

                case "locked":
                    if (air.NativeApplication.supportsSystemTrayIcon) {
                        // Exit
						i = new air.NativeMenuItem(localizer.getString("trayMenu", "exit"));
						i.name = "exit";
						menu.addItem(i);
					}

			}

			nativeApplication.icon.menu = menu;
		},
        
        enable: function (name) {
            var item = nativeApplication.icon.menu.getItemByName(name);
            if (item !== null) item.enabled = true;
        },
        
        disable: function (name) {
            var item = nativeApplication.icon.menu.getItemByName(name);
            if (item !== null) item.enabled = false;
        },

		iconMenuSelectEvent: function (event) {
			// Responds to the selection of an icon menu item
			switch (event.target.name) {
				case "openPlayerPage":
					requestManager.playerPage.open();
					break;
                    
                case "updateNow":
                    updateManager.userUpdate();
                    break;

				case "logout":
					logout();
					break;

				case "exit":
					appExit();
			}
		}
	}
};

/* Object iconManager
 *   void setIcon(String name)
 *   void setTooltip(String primary, String secondary)
 */
var iconManager = {

	initialised: false,
    clickTimer: null,

	initialise: function () {
		// Prepares the object and initiates the loading of all icon files.
		if (!this.initialised) {
			this.initialised = true;
			this.icons = {
				alert: ["alert_128.png", "alert_48.png", "alert_32.png", "alert_16.png"],
				idle: ["idle_128.png", "idle_48.png", "idle_32.png", "idle_16.png"],
				error: ["error_128.png", "error_48.png", "error_32.png", "error_16.png"],
				blank: ["blank_128.png", "blank_48.png", "blank_32.png", "blank_16.png"],
				1: ["1_128.png", "1_48.png", "1_32.png", "1_16.png"],
				2: ["2_128.png", "2_48.png", "2_32.png", "2_16.png"],
				3: ["3_128.png", "3_48.png", "3_32.png", "3_16.png"],
				4: ["4_128.png", "4_48.png", "4_32.png", "4_16.png"],
				5: ["5_128.png", "5_48.png", "5_32.png", "5_16.png"],
				6: ["6_128.png", "6_48.png", "6_32.png", "6_16.png"],
				7: ["7_128.png", "7_48.png", "7_32.png", "7_16.png"],
				8: ["8_128.png", "8_48.png", "8_32.png", "8_16.png"],
				9: ["9_128.png", "9_48.png", "9_32.png", "9_16.png"],
				10: ["10_128.png", "10_48.png", "10_32.png", "10_16.png"],
				11: ["11_128.png", "11_48.png", "11_32.png", "11_16.png"],
				12: ["12_128.png", "12_48.png", "12_32.png", "12_16.png"],
				13: ["13_128.png", "13_48.png", "13_32.png", "13_16.png"],
				14: ["14_128.png", "14_48.png", "14_32.png", "14_16.png"],
				15: ["15_128.png", "15_48.png", "15_32.png", "15_16.png"]
			};
            
            if (air.NativeApplication.supportsSystemTrayIcon) {
                function clickEvent () { iconManager.click(); }
                nativeApplication.icon.addEventListener(air.ScreenMouseEvent.CLICK, clickEvent);
            }
		}
	},
    
    click: function () {
        if (this.clickTimer === null) {
            function clickTimeout () {
                iconManager.clickTimer = null;
                iconManager.singleClick();
            }
            this.clickTimer = window.setTimeout(clickTimeout, settings.clickThreshold);
        } else {
            window.clearTimeout(this.clickTimer);
            this.clickTimer = null;
            this.doubleClick();
        }
    },
    
    singleClick: function () {
        // Update now
        updateManager.userUpdate();
    },
    
    doubleClick: function () {
        // Open player page
        requestManager.playerPage.open();
    },

	setIcon: function (name) {
		// Sets the array of icons specified by a string as the current tray icon.
		// If the icons have not finished loading, they will be set when they do.
		this.initialise();
		if (name !== this.active) {
			if (name in this.icons) {
				this.active = name;
				this.array = [];
				function completeEvent (event) { iconManager.loadComplete(event); }
				for (var index in this.icons[name]) {
					var loader = new air.Loader();
					loader.contentLoaderInfo.addEventListener(air.Event.COMPLETE, completeEvent);
					loader.load(new air.URLRequest("app:/icons/" + this.icons[name][index]));
					this.array.push(loader);
				}
				this.loading = this.icons[name].length;
			}
			else {
				delete this.array;
				delete this.active;
				nativeApplication.icon.bitmaps = [];
			}
		}
	},

	setTooltip: function (primary, secondary) {
		// If supported, sets the tooltip string of the system tray icon
		// If the primary string is too long, the optional secondary string is used instead
		if (air.NativeApplication.supportsSystemTrayIcon) {
			if ((primary.length > air.SystemTrayIcon.MAX_TIP_LENGTH) && (secondary !== undefined)) {
				nativeApplication.icon.tooltip = secondary;
			} else {
				nativeApplication.icon.tooltip = primary;
			}
		}
	},

	loadComplete: function (event) {
		// Handles the completed loading of a single icon file.
		event.target.removeEventListener(event.type, this.loadComplete);
		this.loading--;
		if (!this.loading) {
			var bitmaps = [];
			for (var index in this.array) {
				bitmaps.push(this.array[index].content.bitmapData);
			}
			delete this.array;
			nativeApplication.icon.bitmaps = bitmaps;
		}
	}

};

/* Object requestManager
 *   Object playerPage
 *     void initialise(Object credentials)
 *	   void open(NativeMenuItem item)
 */
var requestManager = {
	playerPage: {
		initialise: function (aCredentials) {
			// Sets the object to use the specified username and password for login request
			// Must be called before open or after destroy
			this.request = new air.URLRequest("http://" + settings.server + "/index.php?page=login");
			this.request.method = air.URLRequestMethod.POST;
			this.request.cacheResponse = false;
			this.request.useCache = false;
			var vars = new air.URLVariables();
				vars.id = aCredentials.id;
				vars.password = aCredentials.pw;
				vars.data = "yes";
			this.request.data = vars;

			// Set to destroy on logout
			var logoutEvent = function () {
				requestManager.playerPage.destroy();
				nativeApplication.removeEventListener("logout", arguments.callee);
			};
			nativeApplication.addEventListener("logout", logoutEvent);
            
            // Initialise status
            this.status = "idle";
		},

		destroy: function () {
			// Clears all data stored in memory and stops any current request
			this.close();
			delete this.request;
		},

		open: function () {
            if (this.status == "idle") {
                // Begins the process of logging in with the user's credentials
                // and opening their player page in a new browser window
                this.loader = new air.URLLoader();

                function httpResponseEvent (event) { requestManager.playerPage.httpResponse(event); }
                this.loader.addEventListener(air.HTTPStatusEvent.HTTP_RESPONSE_STATUS, httpResponseEvent);

                function closeEvent (event) { requestManager.playerPage.close(event); }
                this.loader.addEventListener(air.Event.COMPLETE, closeEvent);
                this.loader.addEventListener(air.SecurityErrorEvent.SECURITY_ERROR, closeEvent);
                this.loader.addEventListener(air.IOErrorEvent.IO_ERROR, closeEvent);

                this.loader.load(this.request);

                this.status = "requesting";
                menuManager.appIcon.disable("playerPage");
            }
		},

		httpResponse: function (event) {
			// Handles the HTTP response from the player page request
			if (event.status === 200) {
				var req = new air.URLRequest(event.responseURL);
				req.cacheResponse = false; req.useCache = false;
				air.navigateToURL(req);
			}
		},

		close: function () {
			// Cleans up after the HTTP request finishes
			delete this.loader;
            this.status = "idle";
            menuManager.appIcon.enable("playerPage");
		}
	}
};