﻿// Contains standard declarations used by all HTML files

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

function method (object, member) {
    // Returns an event handler function which when called forwards the
    // invocation to a certain member of a certain object
    // - If member is a function, it is invoked in the context of object;
    //   otherwise, object[member] is invoked in the context of object.
    // - All arguments passed to the handler are forwarded to the member,
    //   after which all extra arguments passed to this function are included
    if (arguments.length > 2) {
        var postArguments = Array.prototype.slice.call(arguments, 2);
        if (member instanceof Function) return function () {
            return member.apply(object, Array.prototype.slice.call(arguments).concat(postArguments));
        };
        return function () {
            return object[member].apply(object, Array.prototype.slice.call(arguments).concat(postArguments));
        };
    }
    if (member instanceof Function) return function () {
        return member.apply(object, arguments);
    };
    return function () {
        return object[member].apply(object, arguments);
    };
}