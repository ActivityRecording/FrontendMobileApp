/**
 * MLE Mobile Leistungserfassungs App <br>
 * ================================== <br>
 * Angularjs-Hauptmodul mit Abhaengigkeiten zu allen Submodulen.
 * Die app verwendet die Module fuer die Controller, Services, Filter und Ionic.
 * Bei Starten der App wird die Konfiguration aus dem LocalStorage geladen
 * und die Konstanten werden initialisiert. Die url fuer die Rest-Services muss
 * vor der run Methode erfolgen, da dort bereits Rest-Services initialisiert werden.
 * In der run Methode wird das NFC-Event registriert, welches auf RFID-Tags reagiert.
 * 
 * Authors: haueb1@stutents.bfh.ch
 *          walls2@students.bfh.ch
 */
var ActivityRecordingApp = angular.module('ActivityRecordingApp', ['ionic', 'controllers', 'services', 'config', 'filters']);

/**
 * Lesen und Initialisieren der Konfiguration vom LocalStorage.
 * Die Initialisierung der Konstanten, insbesondere der URL, muss vor 
 * dem Angular Bootstraping erfolgen. Das Bootstraping wird daher manuell 
 * ausgeloest und im index.html darf keine ng-app Directive angegeben werden.
 */
var ipAddress = window.localStorage['ip'] || '192.168.1.103';
var employeeNr = window.localStorage['empNr'] || '10101';
ActivityRecordingApp.constant("ip", ipAddress);
ActivityRecordingApp.constant("employeeNr", employeeNr);
ActivityRecordingApp.constant("url", "http://" + ipAddress + ":8080/MLEBackend/webresources/");

/**
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


ActivityRecordingApp.run(function($ionicPlatform, $state, TimeService) {
    /**
     * Ionic wrapper fuer Cordova's onDeviceRedy Funktion.
     * Sie wird aufgerufen, sobald die Ionic Platform bereit ist.
     * Daher wird das NFC-Plugin via NDEF-Listener hier instanziert.
     */
    $ionicPlatform.ready(function() {
        console.log('ionicPlattform ready');
      
        // Registrieren des Listeners fuer NDEF formatted NFC Tags
        nfc.addNdefListener (
            function (nfcEvent) {
                var tag = nfcEvent.tag,
                    ndefMessage = tag.ndefMessage;
                // Es wird angenommen, dass die NDEF-Message einen String mit 
                // Fall- und Patienten-Id enthaelt, getrennt durch ein :
                // Beispiel: 123456:9876543
                var str = nfc.bytesToString(ndefMessage[0].payload);
                var pos = str.indexOf(":");
                if (pos === -1){
                    alert('Die RFID enthält ein unbekanntes Datenformat');
                    return;
                } else {
                    pos = pos + 1;
                }
                var len = str.length;
                var fidString = str.substring(pos,len);
                var fid = parseInt(fidString);
                // Start der Zeitmessung
                if($state.includes('tabs.patTime')){   
                    // NFC-Scan auf der Zeitmessungsuebersicht (Kein Seitenwechsel notwendig)
                    TimeService.start(fid, function(){}); 
                } else {
                    //NFC-Scan aus allen anderen States
                    TimeService.start(fid, function(){$state.go('tabs.patTime');}); 
                    //$state.go('tabs.patTime');   
                }

            }, 
            function () { // success callback
            console.log('NDEF listener waiting for NDEF tags..."');
            },
            function (error) { // error callback
               console.log('Error adding NDEF listener ' + JSON.stringify(error));
            }
        );
    });
});

/**
 * Routingdefinitionen
 */
ActivityRecordingApp.config(function($stateProvider, $urlRouterProvider) {
    
  //Ionic Tabs  
  $stateProvider
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })
    
    // Homedialog
    .state('tabs.home', {
      url: "/home",
      views: {
        'home-tab': {
          templateUrl: "templates/home.html"
        }
      }
    })
    
    // Patientenliste
    .state('tabs.patients', {
      url: "/patients/:edit",
      views: {
        'home-tab': {
          templateUrl: "templates/patients.html"
        }
      }
    })
    
    // Zeitmessungsansicht 
    .state('tabs.patTime', {
      url: "/patients/treatment/",
      views: {
        'home-tab': {
          templateUrl: "templates/patient.html"
        }
      }
    })

    // Leistungskatalog
    .state('tabs.catalogue', {
      url: "/catalogue",
      views: {
        'home-tab': {
          templateUrl: "templates/catalogue.html"
        }
      }
    })
    
    // Bearbeitungsuebersicht
    .state('tabs.editoverview', {
      url: "/editoverview",
      views: {
        'home-tab': {
          templateUrl: "templates/editoverview.html"
        }
      }
    })
    
    // Zeitbearbeitung
    .state('tabs.edittime', {
      url: "/edittime",
      views: {
        'home-tab': {
          templateUrl: "templates/edittime.html"
        }
      }
    })
    
    // Freigabe
    .state('tabs.approval', {
      url: "/approval",
      views: {
        'home-tab': {
          templateUrl: "templates/approval.html"
        }
      }
    })
    
    // Info
    .state('tabs.about', {
      url: "/about",
      views: {
        'about-tab': {
          templateUrl: "templates/about.html"
        }
      }
    })
    
    // Konfiguration
    .state('tabs.config', {
      url: "/config",
      views: {
        'config-tab': {
          templateUrl: "templates/config.html"
        }
      }
    });

    // Default
   $urlRouterProvider.otherwise("/tab/home");

});
