//(function(window, angular, undefined) {
//'use strict';

// io settings
angular.module('io.config', []).value('io.config', {});

angular.module('io.controllers', [
	'io.controller.company',
	'io.controller.confirm',
	'io.controller.onboard',
	'io.controller.page',
	'io.controller.reset',
	'io.controller.sign',
	'io.controller.user',
	'io.controller.password'
]);
angular.module('io.directives', ['io.config', 'io.directive.htmlExtend', 'io.directive.inputMask']);
angular.module('io.filters', ['io.config', 'io.filter.format', 'io.filter.range']);
angular.module('io.factories', ['io.config']);
angular.module('io.init', ['io.config', 'io.init.settings', 'io.init.rootScope']);


// io plugings
angular.module('io.markdown', 		['io.config', 'io.directive.markdown']);
angular.module('io.follow', 		['io.config', 'io.factory.follow', 'io.controller.follow']);
angular.module('io.message', 		['io.config', 'io.filter.truncate', 'io.factory.message']);
angular.module('io.filepicker', 	['io.config', 'io.factory.filepicker', 'io.controller.filepicker']);
angular.module('io.accessibility', 	['io.config', 'io.factory.accessibility']);

angular.module('io.plugins', 		['io.follow', 'io.message', 'io.filepicker', 'io.accessibility', 'io.markdown']);

angular.module('io', ['io.directives', 'io.filters', 'io.factories', 'io.plugins', 'io.init', 'io.config']);

angular.module('ui', ['ui.directives']); // 'ui.directives.if', 'ui.bootstrap.tabs'

// app settings
angular.module('app.config', []).value('app.config', {});

angular.module('app.controllers', [
	'io.controller.contact',
	
	// app
	'app.controller.root',
	'app.controller.dashboard'
]);

angular.module('app.directives', ['app.config']);
angular.module('app.filters', ['app.config']);
angular.module('app.factories', ['app.config']);

angular.module('app.init', ['app.config', 'app.route']);

var app = angular.module('app', ['ngCookies', 'ui', 'io', 'app.directives', 'app.filters', 'app.factories', 'app.init', 'app.config']);



/*angular.element(document.documentElement).ready(function() {
	console.log('*** READY **');
    
    var locale = JSON.parse(localStorage.getItem('locale'));    
    //var url = 'i18n/angular-locale_'+locale+'.js';
    //if (locale) document.write('<script src="js/vendor/i18n/angular-locale_'+locale+'.js"><\/script>');
    
    //angular.bootstrap(document,['app']);
});*/

//})(window, window.angular);

/*window.onload = function() {
	console.log('Load any missing CDN scripts');
	
	// jQuery
	window.jQuery || document.write('<script src="js/vendor/jquery.min.js"><\/script>');
	
	// angular
	window.angular || document.write('<script src="js/vendor/angular.min.js"><\/script>');
	
	// bootstrap
	(window.$.fn.button || window.$.fn.modal) || document.write('<script src="js/vendor/bootstrap.min.js"><\/script>');
	
	//var locale = JSON.parse(localStorage.getItem('locale'));    
    //var url = 'i18n/angular-locale_'+locale+'.js';
    //if (locale) document.write('<script src="js/vendor/i18n/angular-locale_'+locale+'.js"><\/script>');
}*/