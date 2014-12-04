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
 * Patienten Controller liefert alle treatmentCases, deren  States und den Patienten zurück
 * Der Filter ist mit dem Query-Parameter State implementiert
 */
function PatientsCtrl($scope, $ionicPopup, $stateParams, $state, Patients, MyPatients, ConfigService, TimeService, PatientService) {

    $scope.timeService = TimeService;
    $scope.empNr = ConfigService.empNr;

    //Select Option Model
    $scope.patTypes = [
        {name: 'Heute', value: 0},
        {name: 'Woche', value: 1},
        {name: 'Alle', value: 2}];
    $scope.patientFilter = $scope.patTypes[0];

    $scope.suppliedCases = [
        {name: 'Meine', value: $scope.empNr},
        {name: 'Alle', value: 0}];
    $scope.supplierFilter = $scope.suppliedCases[0];

    //Initial List Ressource call
    $scope.patients = MyPatients.query({supplier: $scope.supplierFilter.value,
        state: $scope.patientFilter.value});

    //Retrieve changed ressources
    $scope.updatePatientList = function (val, state) {
        if ($scope.empNr === val) {
            $scope.patients = MyPatients.query({supplier: val, state: state});
        }
        else {
            $scope.patients = Patients.query({state: state});
        }
    };

    //Bestaetigungs-Pop-Up
    $scope.showConfirm = function (fid) {
        var self = this;
        self.fid = fid;
        var confirmPopup = $ionicPopup.confirm({
            title: 'Laufende Zeitmessung beenden',
            template: 'Wollen Sie die laufende Zeitmessung beenden?'
        });
        confirmPopup.then(function (res) {
            if (res) {
                TimeService.stop();
                PatientService.updatePatient(self.fid);
                PatientService.curPatient.$promise.then(function () {
                    $state.go('tabs.editoverview');
                });
            } else {
                //Nothing to do
            }
        });
    };

    /**
     * Transition nach PatientTimeCtrl und startet die Zeitmessung
     * oder eine Transition nach EditOverviewCntrl    
     * @param {type} fid
     */
    $scope.goTo = function (fid) {
        //Pfad: "Zeitmessung starten"
        if ($stateParams.edit == 0) {
            TimeService.start(fid);
            PatientService.curPatient.$promise.then(function () {
                $state.go('tabs.patTime');
            });
        }
        //Pfad: "Leistungen bearbeiten"
        else {
            //Gibt es eine laufende Zeitmessung
            if ($scope.timeService.running && $scope.timeService.fid !== fid) {
                this.showConfirm(fid);
            }
            else {
                PatientService.updatePatient(fid);
                PatientService.curPatient.$promise.then(function () {
                    $state.go('tabs.editoverview');
                });
            }
        }
    };
}
;

/*
 * Controller für das Messen der Zeitstempeln der Leistungserfassung {start/stopp Timer}
 * In $stateParams wird der Parameter FId aus dem PatientsCntrl injected
 */
function PatientTimeCtrl($scope, $state, TimeService, PatientService) {

    //Lokale ControllerVariabeln
    $scope.timeService = TimeService;
    $scope.patientService = PatientService;

    /*
     * Beim Betätigen des "Zeitmessung starten" Buttons wird diese Funktion aufgerufen
     * Es wird TimePeriode.startTime mit dem aktuellen Timestamp gesetzt
     */
    $scope.startTimer = function () {
        if (!TimeService.running) {
            TimeService.start(PatientService.curPatient.treatmentNumber);
        }
    };

    /*
     * Beim Betätigen des "Zeitmessung stoppen" Buttons wird diese Funktion aufgerufen
     * Es wird TimePeriode.endTime mit dem aktuellen Timestamp gesetzt und per
     * Post-Request die TimePeriode an das Backend übermittelt
     */
    $scope.stopTimer = function () {
        if (TimeService.running) {
            TimeService.stop();
        }
    };

    $scope.cancelTimer = function () {
        if (TimeService.running) {
            TimeService.cancel();
        }
    };

    $scope.goToCatalogue = function () {
        $state.go('tabs.catalogue');
    };
}
;

/*
 * Catalogcontroller: Zeigt den Standard-Leistungskatalog an und 
 * übermittelt ausgewählte Leistungen des Benutzers an das Backend
 */
function CatalogueCtrl($scope, $ionicListDelegate, StandardCatalogue, Activity, TimeService, PatientService, ConfigService) {

    $scope.timeService = TimeService;
    $scope.fid = PatientService.curPatient.treatmentNumber;
    $scope.catItems = StandardCatalogue.query({empNr: ConfigService.empNr, fid: $scope.fid});
    $scope.listCanSwipe = true;
    $scope.step = 1;
    $scope.cnt = 1;

    /*
     * Initial werden alle Leistungsgruppen ausgeblendet
     */
    $scope.visibleBase = false;
    $scope.visibleSpecial = false;
    $scope.visibleOthers = false;

    /*
     *  Addiert oder subtrahiert 1 zur Anzahl cnt der ausgewählten Leistung item.
     *  Das Total der ausgewaehlten und der bereits erfassten Anzahl (cnt + capturedCount)
     *  darf beim Erhoehen nicht groesser werden als die Kardinalitaet der Leistung.
     *  Beim Verringern der Anzahl darf diese nicht kleiner werden als 0.
     *  Die Anzahl darf nicht 0 sein. 0 wird beim Subtrahieren und Addieren uebersprungen
     */
    $scope.setCnt = function (item) {
        if (($scope.step > 0 && $scope.cnt + item.capturedCount < item.cardinality) ||
                ($scope.step < 0 && $scope.cnt + item.capturedCount > 0)) {
            $scope.cnt = $scope.cnt + $scope.step;
            // Ueberspringen von 0
            if ($scope.cnt === 0 && $scope.step > 0) {
                $scope.cnt = 1;
            } else if ($scope.cnt === 0 && $scope.step < 0 && item.capturedCount > 0) {
                $scope.cnt = -1;
            } else if ($scope.cnt === 0 && $scope.step < 0 && item.capturedCount <= 0) {
                $scope.cnt = 1;
            }
        }
    };

    $scope.reset = function () {
        $scope.cnt = 1;
        $scope.step = 1;
    };

    $scope.onHold = function () {
        $scope.step = $scope.step * -1;
    };

    $scope.submitData = function (amount, item) {
        if (amount === 0)
            return;
        var container = new Activity();
        container.employeeId = ConfigService.empNr;
        container.treatmentNumber = PatientService.curPatient.treatmentNumber;
        container.activities = [{tarmedActivityId: item.tarmedId, number: amount}];
        container.$save();
        item.capturedCount = item.capturedCount + amount;
        $ionicListDelegate.closeOptionButtons();
        $scope.reset();
    };

    $scope.toggleCatLists = function (type) {
        //Grundleistungen
        if (type === 0) {
            if (!$scope.visibleBase) {
                $scope.visibleBase = true;
                $scope.visibleSpecial = false;
                $scope.visibleOthers = false;
            } else
                $scope.visibleBase = false;
        }
        //Spezialleistungen
        if (type === 1) {
            if (!$scope.visibleSpecial) {
                $scope.visibleBase = false;
                $scope.visibleSpecial = true;
                $scope.visibleOthers = false;
            } else
                $scope.visibleSpecial = false;
        }
        //Andere Leistungen
        if (type === 2) {
            if (!$scope.visibleOthers) {
                $scope.visibleBase = false;
                $scope.visibleSpecial = false;
                $scope.visibleOthers = true;
            } else
                $scope.visibleOthers = false;
        }
    };
}
;

function EditOverviewCtrl($scope, $state, Activity, PatientService, CumulatedTime, employeeNr) {

    $scope.activityItems = Activity.query({fid: PatientService.curPatient.treatmentNumber});
    $scope.times = CumulatedTime.get({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});

    $scope.deleteItem = function (item) {
        var index = $scope.activityItems.indexOf(item);
        if (index !== -1) {
            $scope.activityItems.splice(index, 1);
            Activity.delete({fid: item.activityId});
        }
    };

    $scope.goToCatalogue = function () {
        $state.go('tabs.catalogue');
    };

    $scope.goToEditTime = function () {
        $state.go('tabs.edittime');
    };
}
;

function EditTimeCtrl($scope, TimePeriode, TimeService, PatientService, ConfigService, CumulatedTime, employeeNr) {

    $scope.timeService = TimeService;
    $scope.fid = PatientService.curPatient.treatmentNumber;
    $scope.showTimeEdit = false;

    $scope.durationItems = TimePeriode.query({fid: $scope.fid});
    $scope.times = CumulatedTime.get({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});

    //Datum und Zeit für UI per "jetz" initiiert
    $scope.startDate = PatientService.curPatient.startTime;
    $scope.duration = {min: 5};

    /*
     * Neuen Zeitraum gemäss Benutzereingabe übermitteln
     * Direkter Zugriff auf Scope ist über bei Time / Date Input nicht mehr möglich
     */
    $scope.addDuration = function (min) {
        var from = PatientService.curPatient.startTime;
        var to = new Date(from);
        to.setMinutes(to.getMinutes() + min);

        //Erstellen des neuen Eintrages per POST
        var newPeriode = new TimePeriode({'timePeriodId': null, 'type': 'TREATMENT', 'employeeId': ConfigService.empNr});
        newPeriode.treatmentNumber = $scope.fid;
        newPeriode.startTime = from;
        newPeriode.endTime = to;
        newPeriode.$save().then(function(){
            //Ausbelndung und Liste aktualisieren
            $scope.showTimeEdit = false;
            $scope.durationItems = TimePeriode.query({fid: $scope.fid});
            $scope.times = CumulatedTime.get({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});
        });
    };

    $scope.toggleTimeEdit = function () {
        if ($scope.showTimeEdit)
            $scope.showTimeEdit = false;
        else
            $scope.showTimeEdit = true;
    };

    $scope.deleteItem = function (item) {
        var index = $scope.durationItems.indexOf(item);
        if (index === -1) return;
        TimePeriode.delete({fid: item.timePeriodId},function(){
            $scope.durationItems.splice(index, 1);
            $scope.times = CumulatedTime.get({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});
        });
     };
}
;

function ApprovalCtrl($scope,$ionicListDelegate, $ionicPopup, Approval, MyPatients, TimeService, employeeNr) {
    
    $scope.timeService = TimeService;
    //Alle offenen Fälle per Leistungserbringer
    $scope.approvalItems = MyPatients.query({supplier: employeeNr, state: 2});

    $scope.listCanSwipe = true;

    $scope.approve = function (item) {
        if (!item.released) {
            var index = $scope.approvalItems.indexOf(item);
            var curItem = $scope.approvalItems[index];
            if (TimeService.running && TimeService.fid === curItem.treatmentNumber) {
                this.showAlert(curItem.treatmentNumber);
            }
            else {
                var approval = new Approval({empNr: employeeNr, fid: curItem.treatmentNumber});
                approval.$save();
                $scope.approvalItems.splice(index,1);
                //$scope.approvalItems =  MyPatients.query({supplier: employeeNr, state: 2});
                $ionicListDelegate.closeOptionButtons();
            }
        }
    };

    $scope.showAlert = function (fid) {
        var alertPopup = $ionicPopup.alert({
            title: 'Laufende Zeitmessung für diesen Fall!',
            template: 'Bitte beenden Sie vorgängig die Zeitmessung für FID: '+fid
        });
        alertPopup.then(function (res) {
           $ionicListDelegate.closeOptionButtons();
        });
    
    };
    };

    function HomeTabCtrl($scope, $state, TimeService) {
        $scope.timeService = TimeService;
        $scope.goToPatients = function (mode) {
            $state.go('tabs.patients', {edit: mode});
        };
        $scope.goToApproval = function () {
            $state.go('tabs.approval');
        };
    }
    ;

    function ConfigCtrl($scope, TimeService, ConfigService) {
        $scope.timeService = TimeService;
        $scope.config = ConfigService;

        $scope.saveConfig = function () {
            ConfigService.saveConfig();
        };
}
;
