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
                
//                var element = angular.element($('#PatientTimeCtrl'));
//                element.scope().startTimer();
//                element.scope().$apply();
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
      url: "/catalogue/:fid",
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


ActivityRecoridngApp
    .factory('corovaService', function() {
        document.addEventListener("deviceready", function() {
            console.log('** cordova ready **');
        }, false);
    })
    .factory('TimeService', function($filter, $interval) {
        
        var service = {};
        service.seconds = 0;
        service.fid = null;
        var timer;
        var startTime;
        var stopTime;
        
        service.running = function(){
            return service.fid != null;
        }; 
        
        var startTimer = function () {
            service.seconds = 0;
            timer = $interval(function() {
                service.seconds++;
            }, 1000);
        };
        
        service.start = function(newFid){
            if (service.fid == newFid){
                service.stop();
                return;
            } else if (service.fid != null){
                service.stop();
            }
            this.startTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss');
            this.stopTime = null;
            service.fid = newFid;
            startTimer();
        };
        
        service.stop = function(){
            this.stopTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss');
            // Rest Service call mit fid
            service.fid = null;
            this.startTime = null;
            this.stopTime = null;
            $interval.cancel(timer);
            timer = null;
            service.seconds = 0;
        };
        
        return service;
    });
