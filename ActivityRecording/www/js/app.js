/* 
 * MLE ActivityRecoring App
 * ========================
 * Basicaly it's an angularJS Module, with dependencies to ionic-Framwork, 
 * Cordova-Plugins and MLE controllers, services and directives
 * 
 * Authors: haueb1@stutents.bfh.ch
 *          walls1@students.bfh.ch
 */

var ActivityRecoridngApp = angular.module('ActivityRecordingApp', ['ionic', 'controllers', 'services', 'config'])

/*
 * ionic wrapper to cordova's onDeviceRedy function
 * it will be called, as soon as the hole platfrom is ready by the device
 */
.run(function($ionicPlatform, $state) {
  $ionicPlatform.ready(function() {
      console.log('ionicPlattform ready');
      
 // Read NDEF formatted NFC Tags
    nfc.addNdefListener (
        function (nfcEvent) {
            var tag = nfcEvent.tag,
                ndefMessage = tag.ndefMessage;

            // the payload from each record
           //alert(JSON.stringify(ndefMessage));

            // assuming the first record in the message has 
            // a payload that can be converted to a string.
            var obj = nfc.bytesToString(ndefMessage[0].payload).substring(3);
            alert(obj.toString());
           // var pid = obj.substring(5,6);
            var fid = obj.substring(11,15);
        
            if($state.includes('tabs.home')){
                  $state.go('tabs.patTime',{fid: fid});
                
                  //controllers.PatientTimeCtrl.startTimer();
                  //angular.element(document.getElementById('PatientTimeCtrl')).scope().startTimer();
            };
            

        }, 
        function () { // success callback
        console.log('Waiting for NDEF tag"');
         //   alert("Waiting for NDEF tag");
        },
        function (error) { // error callback
           console.log('Error adding NDEF listener ' + JSON.stringify(error));
            // alert("Error adding NDEF listener " + JSON.stringify(error));
        }
    );
  })
})

.config(function($stateProvider, $urlRouterProvider) {
    
  //Ionic view tab states  
  $stateProvider
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })
    .state('tabs.home', {
      url: "/home",
      views: {
        'home-tab': {
          templateUrl: "templates/home.html",
          controller: 'HomeTabCtrl'
        }
      }
    })
     
    //Patients overview state
    .state('tabs.patients', {
      url: "/patients",
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
      url: "/catalogue",
      controller: CatalogueCtrl,
      views: {
        'home-tab': {
          templateUrl: "templates/catalogue.html"
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
    
    .state('tabs.contact', {
      url: "/contact",
      views: {
        'contact-tab': {
          templateUrl: "templates/contact.html"
        }
      }
    });

   $urlRouterProvider.otherwise("/tab/home");

});


ActivityRecoridngApp.factory('corovaService', function() {
  document.addEventListener("deviceready", function() {
    console.log('** cordova ready **');
  }, false);
  });
