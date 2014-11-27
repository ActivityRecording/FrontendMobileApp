/* 
 * MLE ActivityRecoring App
 * ========================
 * Basicaly it's an angularJS Module, with dependencies to ionic-Framwork, 
 * Cordova-Plugins and MLE controllers, services and directives
 * 
 * Authors: haueb1@stutents.bfh.ch
 *          walls2@students.bfh.ch
 */

var ActivityRecordingApp = angular.module('ActivityRecordingApp', ['ionic', 'directives', 'controllers', 'services', 'config']);

/*
 * Lesen und Initialisieren der Konfiguration vom LocalStorage.
 * Die Initialisierung der Konstanten, insbesondere der URL, muss vor 
 * dem Angular Bootstraping erfolgen. Das Bootstraping wird daher manuell 
 * ausgelöst und im index.html darf keine ng-app Directive angegeben werden.
 */
var ipAddress = window.localStorage['ip'] || '192.168.1.103';
var employeeNr = window.localStorage['empNr'] || '10101';
ActivityRecordingApp.constant("ip", ipAddress);
ActivityRecordingApp.constant("employeeNr", employeeNr);
ActivityRecordingApp.constant("url", "http://" + ipAddress + ":8080/MLEBackend/webresources/");

/* 
 * Starten des Bootstraping von Angularjs 
 * Fuer die Cordova-Umgebung (Smartphone) muss das deviceready-Event abgewartet werden.
 * In einer Browser-Umgebung kann das Bootstraping direkt gestartet werden.
 */
angular.element(document).ready(function() {
    if (window.cordova) {
        document.addEventListener('deviceready', function() {
            angular.bootstrap(document.body, ["ActivityRecordingApp"]);
            }, false);
    } else {
            angular.bootstrap(document.body, ["ActivityRecordingApp"]);
    }
});


/*
 * ionic wrapper to cordova's onDeviceRedy function
 * it will be called, as soon as the hole platfrom is ready by the device
 * Daher wird das NFC-Plugin via NDEF-Listener hier instanziert
 */
ActivityRecordingApp.run(function($ionicPlatform, $state, TimeService) {
  $ionicPlatform.ready(function() {
      console.log('ionicPlattform ready');
      
 // Read NDEF formatted NFC Tags
    nfc.addNdefListener (
        function (nfcEvent) {
            var tag = nfcEvent.tag,
                ndefMessage = tag.ndefMessage;

            // assuming the first record in the message has 
            // a payload that can be converted to a string.
            var obj = nfc.bytesToString(ndefMessage[0].payload).substring(3);
            //alert(obj.toString());
            
            var fid = obj.substring(11,15);
            //alert('Patienten-ID: ' +pid +' Fall-ID: '+fid);
            
            //NFC-Scan im Home Bildschrim
            if($state.includes('tabs.home')){
                TimeService.start(fid);
                $state.go('tabs.patTime');   
            };
            
            //NFC-Scann aus der Patientenübersicht
            if($state.includes('tabs.patients')){
                TimeService.start(fid); 
                $state.go('tabs.patTime');   
            }
            //NFC-Scann aus der Zeit und Leistungserassungsübersicht
            if($state.includes('tabs.patTime')){   
                TimeService.start(fid); 
            }
            //NFC-Scann aus der Leistungskatalog
            if($state.includes('tabs.catalogue')){
                TimeService.start(fid); 
                $state.go('tabs.patTime');   
            }
            
        }, 
        function () { // success callback
        console.log('Waiting for NDEF tag"');
            // alert("Waiting for NDEF tag");
        },
        function (error) { // error callback
           console.log('Error adding NDEF listener ' + JSON.stringify(error));
            // alert("Error adding NDEF listener " + JSON.stringify(error));
        }
    );
  });
});

ActivityRecordingApp.config(function($stateProvider, $urlRouterProvider) {
    
  //Ionic view tab states  
  $stateProvider
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })
    .state('tabs.home', {
      url: "/home",
      controller: HomeTabCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/home.html",
          controller: 'HomeTabCtrl'
        }
      }
    })
     
    //Patients overview state
    .state('tabs.patients', {
      url: "/patients/:edit",
      controller: PatientsCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/patients.html"
        }
      }
    })
    
    //Patient activity time state 
    .state('tabs.patTime', {
      url: "/patients/treatment/:fid",
      controller: PatientTimeCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/patient.html"
        }
      }
    })

    .state('tabs.catalogue', {
      url: "/catalogue/:fid",
      controller: CatalogueCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/catalogue.html"
        }
      }
    })
    
    .state('tabs.editoverview', {
      url: "/editoverview/:fid",
      controller: EditOverviewCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/editoverview.html"
        }
      }
    })
    
    .state('tabs.edittime', {
      url: "/edittime/:fid",
      controller: EditTimeCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/edittime.html"
        }
      }
    })
    
    .state('tabs.approval', {
      url: "/approval",
      controller: ApprovalCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/approval.html"
        }
      }
    })
    
    .state('tabs.about', {
      url: "/about",
      views: {
        'about-tab': {
          templateUrl: "templates/about.html"
        }
      }
    })
    
    .state('tabs.config', {
      url: "/config",
      views: {
        'config-tab': {
          templateUrl: "templates/config.html"
        }
      }
    });

   $urlRouterProvider.otherwise("/tab/home");

});
