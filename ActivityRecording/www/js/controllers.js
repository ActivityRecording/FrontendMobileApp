/* 
 * MLE Controllers
 */
'use strict';

var controllers = angular.module('controllers', ['services', 'config']);

function MenuController($scope, $route, $routeParams, $location) {

    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;
}
;
/*
 * Patients Controller returns all treatmentCases, their states and it's patient
 * Filter of Treatment-Types is realized with query State Parameters
 */
function PatientsCtrl($scope, $state, Patients, MyPatients, employeeNr, TimeService) {

    $scope.empNr = employeeNr;

    //Select Option Model
    $scope.patTypes = [
        {name: 'Alle', value: 0},
        {name: 'Offene', value: 1},
        {name: 'Erfasst', value: 2}];
    $scope.patientFilter = $scope.patTypes[0];

    $scope.suppliedCases = [
        {name: 'Meine', value: $scope.empNr},
        {name: 'Alle', value: 0}];
    $scope.supplierFilter = $scope.suppliedCases[0];

    new Patients();
    new MyPatients();

    //Initial List Ressource call
    $scope.patients = MyPatients.query({supplierParam: $scope.supplierFilter.value,
        stateParam: $scope.patientFilter.value});

    //Retrieve changed ressources
    $scope.updatePatientList = function (val, state) {
        if ($scope.empNr === val) {
            $scope.patients = MyPatients.query({supplierParam: val, stateParam: state});
        }
        else {
            $scope.patients = Patients.query({stateParam: state});
        }
    };

    //Transition to PatientTimeCntrl start    
    $scope.goTo = function (id) {
        TimeService.start(id);
        $state.go('tabs.patTime', {fid: id});
    };
}
;

/*
 * Controller für das Messen der Zeitstempeln der Leistungserfassung {start/stopp Timer}
 * In $stateParams wird der Parameter FId aus dem PatientsCntrl injected
 */
function PatientTimeCtrl($scope, $state, $stateParams, $interval, $filter, Patient, TimePeriode, employeeNr, TimeService) {

    //Lokale ControllerVariabeln
    $scope.running = TimeService.running();
    $scope.timeService = TimeService;
 
    /*
     * Legt eine Instanz des Patienten-Service an und ermittlet via Get-Request
     * den aktuellen Fall und Identifiziert so den Patienten
     */
    new Patient();
    $scope.curPatient = Patient.get({fid: $stateParams.fid});

    /*
     * Beim Betätigen des "Zeitmessung starten" Buttons wird diese Funktion aufgerufen
     * Es wird TimePeriode.startTime mit dem aktuellen Timestamp gesetzt
     */
    $scope.startTimer = function() {
        if (!TimeService.running()) {
            TimeService.start($stateParams.fid);
            $scope.running = TimeService.running();
        }
    };

    /*
     * Beim Betätigen des "Zeitmessung stoppen" Buttons wird diese Funktion aufgerufen
     * Es wird TimePeriode.endTime mit dem aktuellen Timestamp gesetzt und per
     * Post-Request die TimePeriode an das Backend übermittelt
     */
    $scope.stoppTimer = function() {
        if (TimeService.running()) {
            TimeService.stop();
            $scope.running = TimeService.running();
        }
    };
    
    $scope.goToCatalogue = function(){
        $state.go('tabs.catalogue', {fid: $stateParams.fid});
    };
    
}
;

/*
 * Catalogcontroller: Verwaltet die Tarmed StandardKatalog Leistungen und 
 * übermittelt ausgewählte Leistungen des Benutzers an das Backend
 */
function CatalogueCtrl($scope, $http, $stateParams, StandardCatalogue, Activity, employeeNr, url) {

    new StandardCatalogue();
    $scope.catItems = StandardCatalogue.query();
    $scope.baseItems = [];
    $scope.specialItems = [];
    $scope.otherItems = [];
    $scope.listCanSwipe = true;
    $scope.cnt = 1;
    
    /*
     * Initial werden alle Leistungsgruppen ausgeblendet,
     * um den Benutzer eine besser Übersicht zu bieten
     */
    $scope.visibleBase = false;
    $scope.visibleSpecial = false;
    $scope.visibleOthers = false;

    /*
     *  Fügt solange eine zusätzliche Einheit hinzu,
     *  wie es die Katalog-Kardinalität zulässt
     */
    $scope.setCnt = function (item) {
        if (item.cardinality <= $scope.cnt)$scope.cnt = item.cardinality;
        else $scope.cnt++;
    };

    $scope.submitData = function(amount, tarmedId) {
        
      //Temporärerer Aufruf -> Ziel via ngResource newActivity.$saveAll 
      //$scope.data = [{activityId: null, number: amount, employeeId: employeeNr, tarmedActivityId: tarmedId, treatmentNumber: $stateParams.fid}];
      //$http.post(url+'activities/container',$scope.data);
        
      var container = new Activity();
      container.employeeId = employeeNr;
      container.treatmentNumber = $stateParams.fid;
      container.activities = [{tarmedActivityId: tarmedId, number: amount}];
      container.$save();

    };

    $scope.toggleCatLists = function (type) {
        //Grundleistungen
        if (type === 0) {
            if(!$scope.visibleBase){
               $scope.visibleBase = true;
               $scope.visibleSpecial = false;
               $scope.visibleOthers = false; 
            }else $scope.visibleBase = false;
        }
        //Spezialleistungen
        if (type === 1) {
            if(!$scope.visibleSpecial){
               $scope.visibleBase = false;
               $scope.visibleSpecial = true;
               $scope.visibleOthers = false;  
            }else $scope.visibleSpecial = false;
        }
        //Andere Leistungen
        if (type === 2) {
            if(!$scope.visibleOthers){
               $scope.visibleBase = false;
               $scope.visibleSpecial = false;
               $scope.visibleOthers = true;  
            }else $scope.visibleOthers = false;
        }
    };
}
;

function HomeTabCtrl($scope, $state, TimeService) {
    // Just for Testing
    $scope.simulateNFCEvent = function(){
        setTimeout(
            function(){
                //alert('NFC Simulation started');
                TimeService.start(2001);
                $state.go('tabs.patTime',{fid: 2001});
            }, 
            5000);
    };
};