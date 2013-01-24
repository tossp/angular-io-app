angular.module('io.init.rootScope', [])
.run(
	['$rootScope', '$locale', '$http', '$window', '$location', '$accessibility', '$filepicker',
	function($rootScope, $locale, $http, $window, $location, accessibility, filepicker) {
	console.log('io.init.rootScope ('+$rootScope.$id+')');
 	
 	// factories
 	$rootScope.accessibility = accessibility;
 	$rootScope.filepicker = filepicker;
 	
	$rootScope.default_settings = {
		'client'			:'',	// https://static.domain.com/
		'server'			:'',	// https://api.domain.com/
		'proxy'				:'',	// https://proxy.domain.com/ // for importing photos into filepicker
		'dashboard'			:'app', // app dashboard ie #/app
		//'offline'			:[],	// name of object that will be stored offline
		//'class':{},
		'i18n':{
			'default'		:'en-ca',	// default lang
			'lang'		:[						// array of file names, in lang only folder ie en
				//'countries',					// {'country_code':'country_name'}
				'languages'						// {'en-ca':'English (Canadian)'}
			],
			'lang-locale'		:[				// array of file names, in locale folder ie en-ca
				'app',
				'angular-io'
			],
			'options'		:[]			// 'en-ca' use country locals
		},
		'json':{					// load json files into $rootScope.json = {key:value};
			//'key':'FILENAME',		// json/FILENAME.json
		},
		'password':{				// As per OWASP
			'min_timestamp'	:0,		// all password must be new then this unix_timestamp (sec)
			'max_age'		:90,	// max number of days a password is allowed to be used (days)
			'min_length'	:10,	// OWASP:10
			'min_params'	:3,		// OWASP:3
			'min_upper'		:1,		// OWASP:1
			'min_lower'		:1,		// OWASP:1
			'min_number'	:1,		// OWASP:1
			'min_special'	:1		// OWASP:1
		},
		'account': {
			'user_name'		:false,	// Require username in profile
			'company'		:false,
			'follow'		:false
		},
		'onboard':{
			'required'		:false,	// always true
			'start'			:''		// url of dashboard ie #/app
		}
		
	};
	
	//-- add in default settings if not set --//
	$rootScope.settings = syncVar($rootScope.settings, $rootScope.default_settings);
	delete $rootScope.default_settings;
	console.log('$rootScope.settings:');
	console.log($rootScope.settings);
	
	//!-- Session --//
	$rootScope.session = db.get('session', {});
	$rootScope.resetSession = function() {
		console.log('resetSession()');
		console.log($rootScope.$id);
		$rootScope.session = {};
		db.set('session', $rootScope.session);
	};
	$rootScope.saveSession = function() {
		console.log('saveSession()');
		if ($rootScope.session.save) {
			db.set('session', $rootScope.session);
		}
	};
	$rootScope.updateSession = function(callback) {
		console.log('updateSession(callback)');
		console.log(callback);
		
		$http.get($rootScope.settings.server+'account/session')	// re-get session data if currently no storing any
			.success(function(data) {
				console.log('updateSession.get.success');
				console.log(data);
				$rootScope.session = syncVar(data, $rootScope.session);
				//$rootScope.session.timestamp = +new Date();
				
				$rootScope.saveSession();
				if (callback) $rootScope.$eval(callback());
			})
			.error(function() {
				console.log('updateSession.get.error');
				$rootScope.http_error();
			});
	};
	$rootScope.regenSession = function() {
		console.log('regenSession()');
		$http.get($rootScope.settings.server+'account/regen')
			.success(function(data) {
				console.log('regenSession.get.success');
			})
			.error(function() {
				console.log('regenSession.get.error');
				$rootScope.http_error();
			});
	};
	$rootScope.checkSession = function(callback) {
		console.log('checkSession(callback)');
		console.log(callback);
		
		$http.get($rootScope.settings.server+'account/signcheck')
			.success(function(data) {
				console.log('checkSession.get.success');
				console.log(data);
				if (parseInt(data, 10)) {	// has active cookie
					if (objectIsEmpty($rootScope.session)) {
						$rootScope.updateSession(callback);
					} else if (callback) {
						$rootScope.$eval(callback());
					}
				} else if ($rootScope.session.user_ID) {
					$rootScope.href('#/sign/out');
				}
			})
			.error(function() {
				console.log('checkSession.get.error');
				$rootScope.http_error();
			});
	};
	$rootScope.require_signin = function(callback) {
		console.log('require_signin(callback)');
		console.log(callback);
		
		// not signed in -> sign/in
		if (objectIsEmpty($rootScope.session)) {
			$rootScope.href('#/sign/in?redirect='+$rootScope.uri().substr(2));
		
		// email not confirmed -> onboard
		} else if($rootScope.settings.onboard.required && !$rootScope.session.email_confirm && $rootScope.uri().match(/#\/onboard/) === null) {
			$rootScope.href('#/onboard/email');
		
		// haven't completed manditory onboard steps -> onboard
		} else if($rootScope.settings.onboard.required && !$rootScope.session.user_level && $rootScope.uri().match(/#\/onboard/) === null) {
			$rootScope.href('#/onboard/'+$rootScope.settings.onboard.start);
		
		// has an old password -> change pass
		} else if ($rootScope.settings.password.max_age && $rootScope.session.password_age > $rootScope.settings.password.max_age) {
			$rootScope.href('#/onboard/password');
		
		// force password change set -> change password
		} else if ($rootScope.settings.password.min_timestamp && $rootScope.session.password_timestamp < $rootScope.settings.password.min_timestamp) {
			$rootScope.href('#/onboard/password');
		
		// all good -> eval callback
		} else if (callback) {
			$rootScope.$eval(callback());
		}
	};
	//$rootScope.checkSession(); // new load - recheck
	//!-- End Session --//

	//!-- Loading Screen --//
	$rootScope.loader = {
		width:0,
		details:'',
		count:0,
		total:(
			objectLength($rootScope.settings['class'])
			+$rootScope.settings.i18n['lang'].length
			+$rootScope.settings.i18n['lang-locale'].length
			+$rootScope.settings.i18n['json'].length
			+objectLength($rootScope.settings.json)
		)
	};

	$rootScope.$on('loaderEvent', function(e, name) {
		name = name ? name.replace(/[^0-9a-zA-Z]/g, ' ') : '';
		++$rootScope.loader.count;
		console.log($rootScope.loader.count+' / '+$rootScope.loader.total+' '+name);

		if ($rootScope.loader.count < $rootScope.loader.total) {	// progress bar
			$rootScope.loader.width = (($rootScope.loader.count / $rootScope.loader.total)*100);
			$rootScope.loader.details = name;
		}
	});
	//!-- End Loading Screen --//

	// Events
	$rootScope.$on('$viewContentLoaded', function(event) {
		
	});
	$rootScope.$on('$includeContentLoaded', function(event) {
		
	});
	






	//!-- Global Vars --//
	$rootScope.set = function(key, value) { $rootScope[key] = value; };
	
	$rootScope.device 	= (typeof device != 'undefined') ? device : false; // cordova active?
	$rootScope.loading 	= false;	// nav bar loading indicator
	$rootScope.sliderNav 	= -1;		// slider nav state (-1,+1)
	$rootScope.alerts 	= [];	// for alert-fixed-top
	$rootScope.modal 	= {};	// for alertModal
	$rootScope.timezone = new Date().getTimezoneOffset();
 	
 	$rootScope.i18n = {};
	$rootScope.json = {};
	
	//!-- JSON -- //
	$rootScope.loadJSON = function(key, file, folder) {
		folder || (folder = 'json');
		console.log('loadJSON('+key+', '+file+')');
		$http.get($rootScope.settings.client+folder+'/'+file+'.json')
			.success(function(data){
				console.log('loadJSON.get.success');
				//console.log(data);
				//$rootScope.json[config.id] = data;
				$rootScope.$emit('loaderEvent', key);
				$rootScope.json[key] = data;
			})
			.error(function(){
				console.log('loadJSON.get.error');
				$rootScope.$emit('loaderEvent', key);
				$rootScope.json[key] = {};
			});
	};

	for (var key in $rootScope.settings.json) {
		$rootScope.loadJSON(key, $rootScope.settings.json[key]);
	}
	
	//!-- Lang --//
	$rootScope.init = function() {
		$rootScope.locale 	= db.get('locale', $locale.id);							// en-ca
	 	$rootScope.language = db.get('language', $rootScope.locale.substr(0,2)); 	// en
		db.set('language', $rootScope.language);
	 	if ($rootScope.locale > 2) {
			$rootScope.country_code = locale.substr(3,2).toUpperCase();
			db.set('country_code', $rootScope.country_code);
		} else {
			$rootScope.country_code = '';
		}
	};
	$rootScope.changeLocale = function(locale) {
		db.set('locale', locale);
		window.location.reload();
	};
	$rootScope.loadLocaleFile = function(locale, file) {
		console.log('loadLocaleFile('+locale+', '+file+')');
		
		$http.get($rootScope.settings.client+'i18n/'+locale+'/'+file+'.json')
			.success(function(data) {
				console.log('loadLocaleFile.get('+locale+'/'+file+').success');
				//console.log(data);
				for (var key in data) { $rootScope.i18n[key] = data[key]; }
				$rootScope.i18n.id = locale;
				$rootScope.$emit('loaderEvent', locale);
			})
			.error(function(data, status, headers, config) {
				console.log('loadLocaleFile.get('+locale+'/'+file+').error');
				if (locale.length == 2) $rootScope.loadLocaleFile($rootScope.settings.i18n['default'], file);	// load default if root lang doesn't exist
				else $rootScope.loadLocaleFile(locale.substr(0,2), file);
			});
	};
	$rootScope.loadLocale = function() {
		console.log('loadLocale()');
		
		for (var i = 0, l = $rootScope.settings.i18n['lang'].length; i < l; i++) {
			console.log($rootScope.language+'/'+$rootScope.settings.i18n['lang'][i]);
			$rootScope.loadLocaleFile($rootScope.language, $rootScope.settings.i18n['lang'][i]);
		}
		for (var i = 0, l = $rootScope.settings.i18n['lang-locale'].length; i < l; i++) {
			console.log($rootScope.locale+'/'+$rootScope.settings.i18n['lang-locale'][i]);
			$rootScope.loadLocaleFile($rootScope.locale, $rootScope.settings.i18n['lang-locale'][i]);
		}
		for (var i = 0, l = $rootScope.settings.i18n['json'].length; i < l; i++) {
			console.log($rootScope.language+'/'+$rootScope.settings.i18n['json'][i]);
			$rootScope.loadJSON($rootScope.settings.i18n['json'][i], $rootScope.language+'/'+$rootScope.settings.i18n['json'][i], 'i18n');
		}
		$rootScope.loadJSON 
	};
	$rootScope.init();
	$rootScope.loadLocale($rootScope.locale); // $locale.id == 'en-us'
	//!-- End Lang --//

	
	//!-- JSON Special Cases --//
	$rootScope.loadRegions = function(country_code) {
		$rootScope.json.regions || ($rootScope.json.regions = {});
		console.log('loadRegions('+country_code+')');
		$http.get($rootScope.settings.client+'i18n/'+$scope.language+'/geo/'+country_code+'.json')
			.success(function(data){
				console.log('loadRegions.get.success');
				$rootScope.json.regions[country_code] = data;
			})
			.error(function(){
				console.log('loadRegions.get.error');
			});
	}
	
	
	// days in a month
	$rootScope.json.day = function(year, month) {
		var day = {};
		if (year && month) {
			for (var i = 1, l = (32 - new Date(year, month, 32).getDate()); i<=l; i++) {
				key = numberPadding(i.toString(), 2);
				day[key] = key;
			}
		}
		return day;
	};
	//!-- End JSON --//
	
	
	//!-- Classes --//
	/*$rootScope.loadClass = function(key, _var) {
		console.log('loadClass('+key+')');
		$rootScope[key] = _var;
		$rootScope.$emit('loaderEvent', key);
	};

	for (var key in $rootScope.settings['class']) {
		$rootScope.loadClass(key, $rootScope.settings['class'][key]);
		//delete key;	// remove from global scope
	}*/
	//!-- End Classes --//
	
	//!-- Offline Sync --// ***** needs testing!!!!
	// que requests for when connection re-established
    
	// settings.offline = []
	$rootScope.offline = db.get('offline', {
		"_state":!$window.navigator.onLine,
		"_requests":[],
		"_count":0
	});
	
	$rootScope.offline.que_request = function(http_config, callback) {
		console.log('offline.que_request(http_config, callback)');
		callback || (callback = function(){});
		
		$rootScope.offline._requests.push({http_config:http_config, callback:callback});
		$rootScope.offline.store();
	};
	
	$rootScope.offline.run_request = function() {
		console.log('offline.run_request()');
		if (!$rootScope.offline._requests.length) return;
		$rootScope.loading = true;
		
		//$rootScope.$emit('loaderEvent', 'Processing offline requests.');
		
		var request = $rootScope.offline._requests.shift();
		console.log('offline.run_request.http('+request.http_config.method+' '+request.http_config.url+' '+JSON.stringify(request.http_config.data)+')');
		$http(request.http_config)
			.success(function(data, status, headers, config) {
				console.log('offline.run_request.http.success');
				//$rootScope.offline._count--;
				if (request.callback) request.callback(data, status, headers, config);
				$rootScope.loading = false;
				$rootScope.offline.store();
				$rootScope.offline.run_request();
			})
			.error(function(data, status, headers, config) {
				console.log('offline.run_request.http.error');
				console.log(''+JSON.stringify(data)+', '+status+', '+headers+', '+JSON.stringify(config)+'');
				$rootScope.offline._requests.unshift(request);
				$rootScope.loading = false;
			});
	};
	
	
	$rootScope.offline.store = function() {
		db.set('offline', {
			"_state":$rootScope.offline._state,
			"_requests":$rootScope.offline._requests,
			"_count":$rootScope.offline._requests.length
		});
	};
	
	$rootScope.offline.alertOffline = function() {
		console.log('offline.alertOffline()');
		$rootScope.modal = {
			hide:{
				header:false,
				close:false,
				footer:false
			},
			header:$rootScope.i18n.alert_online_offline_label,
			content:$rootScope.i18n.alert_online_offline_message,
			buttons:[
				{
					"class":"btn-primary",
					value:"Ok",
					callback:function(){}
				}
			]
		};
		$('#alertModal').modal('show');
	};
	
	$rootScope.offline.alertOnline = function() {
		console.log('offline.alertOnline()');
		$rootScope.modal = {
			hide:{
				header:false,
				close:false,
				footer:false
			},
			header:$rootScope.i18n.alert_offline_online_label,
			content:$rootScope.i18n.alert_offline_online_message,
			buttons:[
				{
					"class":"btn-primary",
					value:"Ok, Thanks!",
					callback:function(){}
				}
			]
		};
		$('#alertModal').modal('show');
	};
	
	//$rootScope.offline.run_request();
	
	// $http.get().error()
	$rootScope.http_error = function() {
		$rootScope.alerts = [{'class':'error', 'label':'Connection Error:', 'message':'We were unable to complete you request at this time.'}];
	}
	
	$window.addEventListener("online", function () {
		console.log('Event online');
		if ($rootScope.offline._state) {	// was offline
			$rootScope.offline.alertOnline();
			setTimeout(function() {  // timeout is required to bypass some weird bug in angular **
	          $rootScope.offline.run_request();
	        }, 1000);
			
		}
        $rootScope.offline._state = false;
        $rootScope.$digest();
    }, true);
    
    $window.addEventListener("offline", function () {
        console.log('Event offline');
        $rootScope.offline._state = true;
        $rootScope.offline.alertOffline();
        $rootScope.$digest();
    }, true);
	
	//!-- End Offline Sync --//

	//!-- Page Functions --//
	// get current uri with leading #
	$rootScope.uri = function() {
		var uri = ($location.$$url.indexOf("?") == -1)
			? $location.$$url
			: $location.$$url.substr(0, $location.$$url.indexOf("?"));
		return "#"+uri;
	};
	
	// redirect to new page
	$rootScope.href = function(url, open) {
		url || (url = '#');
		console.log('href -> '+url);
		if (open) window.open(url);
		else window.location.href=url;
	};
	
	// refreshes current page
	$rootScope.refresh = function() {
		$rootScope.href($rootScope.uri()+'?'+(+new Date()));	// ? forces a refresh of user data
	};
	
	
	// history tracking - research History API - migrate?
	$rootScope.history = history;
	/*$rootScope.back_history = [];
	$rootScope.add_history = function() {
		var uri = $rootScope.uri();
		if ($rootScope.back_history[$rootScope.back_history.length-1] != uri)
			$rootScope.back_history.push(uri);	// prevent logging reloads
	};
	$rootScope.back = function() {
		if ($rootScope.back_history.length < 2) $rootScope.back_history.unshift('#/');
		$rootScope.back_history.pop();	// current
		var uri = $rootScope.back_history.pop();	// last -> will be added back on refresh
		$rootScope.href(uri);
	};
	$rootScope.back_init = function() {
		var uri = $rootScope.uri();
		if ($rootScope.back_history[$rootScope.back_history.length-1] != uri)
			$rootScope.back_history.push(uri);	// prevent logging reloads
		$rootScope.add_history();
	};*/
	
	// load scripts and styles on the fly
	$rootScope.loadStyle = function(filename) {
		var headID = document.getElementsByTagName("head")[0];
		var cssNode = document.createElement('link');
		cssNode.type = 'text/css';
		cssNode.rel = 'stylesheet';
		cssNode.href = filename;
		cssNode.media = 'screen';
		headID.appendChild(cssNode);
	};
	$rootScope.unloadStyle = function(filename) {
		var allCtrl = document.getElementsByTagName('link');
		for (var i=allCtrl.length; i>=0; i--)  { //search backwards within nodelist for matching elements to remove
			if (allCtrl[i] && allCtrl[i].getAttribute("href")!=null && allCtrl[i].getAttribute("href").indexOf(filename)!=-1)
				allCtrl[i].parentNode.removeChild(allCtrl[i]);
		}	
	};
	$rootScope.loadScript = function(filename, callback) {
		var headID = document.getElementsByTagName("head")[0];         
		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.src = filename;
		newScript.onreadystatechange = callback;
		newScript.onload = callback;
		headID.appendChild(newScript);
	};
	
	$rootScope.unloadScript = function(filename) {
		var allCtrl = document.getElementsByTagName('script');
		for (var i=allCtrl.length; i>=0; i--)  { //search backwards within nodelist for matching elements to remove
			if (allCtrl[i] && allCtrl[i].getAttribute("src")!=null && allCtrl[i].getAttribute("src").indexOf(filename)!=-1)
				allCtrl[i].parentNode.removeChild(allCtrl[i]);
		}	
	};
	//!-- End Page Functions --//
	
	//!-- Validation --//
	$rootScope.validate = {};
	// Called via data-ng-change="validate.function(scope, value, value2, value3, settings)"
	// return true to show error message
	
	// Password
	// 
	// Called from:
	// page/reset
	// page/sign
	// user/edit
	$rootScope.validate.password = function(scope, value, sameas, settings) {
		console.log('validate.password(scope, "'+value+'", "'+sameas+'", settings)');
		
		value || (value = '');
		sameas || (sameas = '');
		// https://www.owasp.org/index.php/Authentication_Cheat_Sheet#Password_Complexity
	
		scope.$error = {};
		if (!value.length) {	// clear errors is blank
			scope.$valid = objectIsEmpty(scope.$error);
			scope.$invalid = !scope.$valid;
			return;
		}
	
		if (value.length < settings.min_length) scope.$error.minlength = true;
	
		// [has,count]
		var params = {
			lower:[0,0],
			upper:[0,0],
			number:[0,0],
			special:[0,0]
		};
	
		for (i = 0; i < value.length; i++) {
			if 		("abcdefghijklmnopqrstuvwxyz".indexOf(value.charAt(i)) > -1) 			{params.lower[0] = 1; ++params.lower[1];}
			else if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(value.charAt(i)) > -1) 			{params.upper[0] = 1; ++params.upper[1];}
			else if ("0123456789".indexOf(value.charAt(i)) > -1) 							{params.number[0] = 1; ++params.number[1];}
			else if ("~!@#$%^&*()_+{}|:\"<>? `-=[]\;',./�".indexOf(value.charAt(i)) > -1) 	{params.special[0] = 1; ++params.special[1];}
	
			// more then two identical chars in a row
			if (i > 1 && value.charAt(i) == value.charAt(i-1) && value.charAt(i) == value.charAt(i-2)) {
				scope.$error.identical = true;
			}
		}
	
		// must have n/4 params at min
		if (params.lower[0]+params.upper[0]+params.number[0]+params.special[0] < settings.min_params) {
			scope.$error.upper 		= (params.upper[1] < settings.min_upper);
			scope.$error.lower 		= (params.lower[1] < settings.min_lower);
			scope.$error.number 	= (params.number[1] < settings.min_number);
			scope.$error.special 	= (params.special[1] < settings.min_special);
		}
	
		if (value === sameas) scope.$error.sameas = true;
	
		scope.$valid = objectIsEmpty(scope.$error);
		scope.$invalid = !scope.$valid;
		//console.log(scope);
	};
	
	
	//!-- End Validation --//
	
	//!-- JS Functions --//
	// called from inside HTML templates 
	
	$rootScope.inArray = function(needle, haystack) {
		if (!haystack) return false;
	    for (var i = 0, l = haystack.length; i < l; i++) {
	        if (haystack[i] == needle) return true;
	    }
	    return false;
	};
	
	$rootScope.objectIsEmpty = function(obj) {
	    for (var p in obj) return false;
		return true;
	};

	$rootScope.objectLength = function(obj) {
	  	var c = 0;
	    for (var p in obj) if (obj.hasOwnProperty(p)) ++c;
	    return c;
	};
	
	$rootScope.objectArray = function(obj) {
		var arr = [];
	    for (var i in obj) {
	        arr.push(obj[i]);
	    }
	    return arr;
	};
	
	//!-- End JS Functions --//
}]);