// Contains standard declarations used by all HTML files

if ("air" in window) {
    // Local context
	var nativeApplication = air.NativeApplication.nativeApplication;
	var nativeWindow = window.nativeWindow;
	var htmlLoader = runtime.htmlLoader;
    var mainScreen = air.Screen.mainScreen;

	if ("Localizer" in air) {
		var localizer = air.Localizer.localizer;
	}

    // AIR Aliases
    air.errors = runtime.flash.errors;
    air.ScreenMouseEvent = runtime.flash.events.ScreenMouseEvent;
}

function eventHandler (object, method) {
    // Returns an event handler function which when called forwards the
    // invocation to a certain method of a certain object
    // - If method is a function, it is invoked in the context of object;
    //   otherwise, object[method] is invoked in the context of object.
    // - All arguments passed to the handler are forwarded to the method,
    //   after which all extra arguments passed to this function are included
    var postArguments = Array.prototype.slice.call(arguments, 2);
    if (method instanceof Function) return (function () {
        return method.apply(object, Array.prototype.slice.call(arguments).concat(postArguments));
    });
    return (function () {
        return object[method].apply(object, Array.prototype.slice.call(arguments).concat(postArguments));
    });
}