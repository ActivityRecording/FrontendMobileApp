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
function PatientsCtrl($scope, $stateParams, $state, Patients, MyPatients, ConfigService, TimeService, PatientService) {

    $scope.empNr = ConfigService.empNr;
    $scope.edit = $stateParams.edit;

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

    //Transition to PatientTimeCtrl start or to EditOverviewCntrl    
    $scope.goTo = function (fid) {
        if($stateParams.edit == 0){
            TimeService.start(fid);
            PatientService.curPatient.$promise.then($state.go('tabs.patTime', {fid: fid}));
            
        }else{
             $state.go('tabs.editoverview', {fid: fid}); 
        }
    };
}
;


/*
 * Controller für das Messen der Zeitstempeln der Leistungserfassung {start/stopp Timer}
 * In $stateParams wird der Parameter FId aus dem PatientsCntrl injected
 */
function PatientTimeCtrl($scope, $state, $stateParams, TimeService, PatientService) {

    //Lokale ControllerVariabeln
    $scope.timeService = TimeService;
    $scope.patientService = PatientService;
    $scope.fid = $stateParams.fid;
 
    /*
     * Beim Betätigen des "Zeitmessung starten" Buttons wird diese Funktion aufgerufen
     * Es wird TimePeriode.startTime mit dem aktuellen Timestamp gesetzt
     */
    $scope.startTimer = function() {
        if (!TimeService.running) {
            TimeService.start($scope.fid);
        }
    };

    /*
     * Beim Betätigen des "Zeitmessung stoppen" Buttons wird diese Funktion aufgerufen
     * Es wird TimePeriode.endTime mit dem aktuellen Timestamp gesetzt und per
     * Post-Request die TimePeriode an das Backend übermittelt
     */
    $scope.stoppTimer = function() {
        if (TimeService.running) {
            TimeService.stop();
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
function CatalogueCtrl($scope, $stateParams, $ionicListDelegate, StandardCatalogue, Activity, employeeNr) {

    new StandardCatalogue();
    $scope.catItems = StandardCatalogue.query();
    $scope.baseItems = [];
    $scope.specialItems = [];
    $scope.otherItems = [];
    $scope.listCanSwipe = true;
    $scope.cnt = 1;
    $scope.sent = false;
    
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
      var container = new Activity();
      container.employeeId = employeeNr;
      container.treatmentNumber = $stateParams.fid;
      container.activities = [{tarmedActivityId: tarmedId, number: amount}];
      container.$save();
      $scope.sent = true;
      $ionicListDelegate.closeOptionButtons();
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


function EditOverviewCtrl($scope, $stateParams, Activity2){
    $scope.fid = $stateParams.fid;
    new Activity2();
    $scope.activites = Activity2.query();
};


function HomeTabCtrl($scope, $state) {
    $scope.goToPatients= function(mode){$state.go('tabs.patients', {edit: mode});};
};



function ConfigCtrl($scope, ConfigService) {
    $scope.config = ConfigService;
    
    //nur benötigt, wenn wir die Implementation via ein UI-Button machen wollen
    $scope.updateConfig = function(){
        ConfigService.setUrl($scope.config.url);
        ConfigService.setEmployeeNr($scope.config.empNr);
    };
};
