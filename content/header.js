// Contains standard declarations used by all HTML files

if ("air" in window) {
    // Local context
	var nativeApplication = air.NativeApplication.nativeApplication;
	var nativeWindow = window.nativeWindow;
	var htmlLoader = runtime.htmlLoader;

	if ("Localizer" in air) {
		var localizer = air.Localizer.localizer;
	}

    // AIR Aliases
    air.errors = runtime.flash.errors;
    air.ScreenMouseEvent = runtime.flash.events.ScreenMouseEvent;
}