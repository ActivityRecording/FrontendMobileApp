/** 
 * MLE Controller
 */
'use strict';

var controllers = angular.module('controllers', ['services', 'config']);

function MenuController($scope, $route, $routeParams, $location) {
    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;
}
;

/**
 * Patienten-Controller
 * Der Controller steuert die View templates/patients.html.
 * Er stellt alle Behandlungsfaelle und die zugehoerigen Patienten
 * fuer die Patientenauswahl zur Verfuegung. 
 * Die Liste kann nach Zeitbereich und Zugehoerigkeit eingeschraenkt werden.
 * Initial werden eigene Patienten des laufenden Tages angezeigt.
 */
function PatientsCtrl($scope, $ionicPopup, $stateParams, $state, Patients, MyPatients, ConfigService, TimeService, PatientService) {

    $scope.timeService = TimeService;
    $scope.empNr = ConfigService.empNr;

    // Filter fuer den Zeitraum
    $scope.patTypes = [
        {name: 'Heute', value: 0},
        {name: 'Woche', value: 1},
        {name: 'Alle', value: 2}];
    $scope.patientFilter = $scope.patTypes[0];

    // Filter fuer die Zugehoerigkeit
    $scope.suppliedCases = [
        {name: 'Meine', value: $scope.empNr},
        {name: 'Alle', value: 0}];
    $scope.supplierFilter = $scope.suppliedCases[0];

    // Setzt die initiale Liste der Patienten/Behandlungsfaelle
    $scope.patients = MyPatients.query({supplier: $scope.supplierFilter.value,
        state: $scope.patientFilter.value});

    /**
     * Aktualisiert die Patienteliste nach Veraenderung der Auswahlfilter.
     * @param val Mitarbeiternummer
     * @param state Zeitbereich
     * @returns {undefined}
     */
    $scope.updatePatientList = function (val, state) {
        if ($scope.empNr === val) {
            $scope.patients = MyPatients.query({supplier: val, state: state});
        }
        else {
            $scope.patients = Patients.query({state: state});
        }
    };

    /**
     * Zeigt eine Warnung an, dass noch eine Zeitmessung am Laufen ist.
     * Eine Bestaetigung mit ja stoppt die Zeitmessung und wechselt in die
     * Leistungsbearbeitung. 
     * @param fid
     * @returns {undefined}
     */
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
                // Nothing to do
            }
        });
    };

    /**
     * Wechselt in die View "Zeitmessung" oder "Leistung bearbeiten", je nachdem
     * von welcher View aus auf die Liste navigiert wurde (Parameter edit=0 oder 1).
     * Es wird die selektiet Behandlungsfall-Id uebergeben, mit der der gewaehlte Patient
     * gelesen wird. Wird auf die Zeitmessung gewechselt, wird automatisch eine
     * Zeitmessung gestartet. 
     * @param {type} fid
     */
    $scope.goTo = function (fid) {
        // Zeitmessung starten
        if ($stateParams.edit == 0) {
            TimeService.start(fid);
            PatientService.curPatient.$promise.then(function () {
                $state.go('tabs.patTime');
            });
        }
        // Leistungen bearbeiten
        else {
            // Es gibt eine laufende Zeitmessung
            if ($scope.timeService.running && $scope.timeService.fid !== fid) {
                this.showConfirm(fid);
            }
            // Keine Zeitmessung aktiv - Wechsel kann direkt erfolgen
            else {
                PatientService.updatePatient(fid);
                PatientService.curPatient.$promise.then(function () {
                    $state.go('tabs.editoverview');
                });
            }
        }
    };
};

/**
 * Zeitmessungs-Controller
 * Der Controller steuert die View templates/patient.html.
 * Er stellt die Funktionen zur Steuerung der Zeitmessung eines Behandlungsfalls
 * zur Verfuegung.
 */
function PatientTimeCtrl($scope, $state, TimeService, PatientService) {

    // Services
    $scope.timeService = TimeService;
    $scope.patientService = PatientService;

    /**
     * Beim Betaetigen des Buttons "Zeitmessung starten" wird auf dem TimeService
     * die Zeitmessung zum aktuellen Patienten gestartet
     */
    $scope.startTimer = function () {
        if (!TimeService.running) {
            TimeService.start(PatientService.curPatient.treatmentNumber);
        }
    };

    /*
     * Beim Betaetigen des Buttons "Zeitmessung stoppen" wird auf dem TimeService
     * die Zeitmessung beendet und der gemessene Zeitraum wird an den Server
     * uebermuittelt.
     */
    $scope.stopTimer = function () {
        if (TimeService.running) {
            TimeService.stop();
        }
    };

    /**
     * Beim Betaetigen des Buttons "Zeitmessung abbrechen" wird die laufende 
     * Zeitmessung auf dem TimeService abgebrochen.
     */
    $scope.cancelTimer = function () {
        if (TimeService.running) {
            TimeService.cancel();
        }
    };

    /**
     * Navigation zum Leistungskatalog
     */
    $scope.goToCatalogue = function () {
        $state.go('tabs.catalogue');
    };
};

/**
 * Leistungskatalog-Controller
 * Der Controller kontrolliert die View templates/catalogue.html.
 * Der Controller stellt den Standard-Leistungskatalog fuer die Anzeige zur Verfuegung
 * und uebermittelt durch den Benutzer ausgewaehlte Leistungen an den Server.
 */
function CatalogueCtrl($scope, $ionicListDelegate, StandardCatalogue, Activity, TimeService, PatientService, ConfigService) {

    $scope.timeService = TimeService;
    $scope.patientService = PatientService;
    $scope.fid = PatientService.curPatient.treatmentNumber;
    $scope.catItems = StandardCatalogue.query({empNr: ConfigService.empNr, fid: $scope.fid});
    $scope.listCanSwipe = true;
    $scope.step = 1;
    $scope.cnt = 1;

    // Initial werden alle Leistungsgruppen ausgeblendet
    $scope.visibleBase = false;
    $scope.visibleSpecial = false;
    $scope.visibleOthers = false;

    /**
     *  Addiert oder subtrahiert 1 zur Anzahl der ausgewählten Leistung.
     *  Das Total der ausgewaehlten und der bereits erfassten Anzahl (cnt + capturedCount)
     *  darf beim Erhoehen nicht groesser werden als die Kardinalitaet der Leistung.
     *  Beim Verringern der Anzahl darf diese nicht kleiner werden als 0.
     *  Die Anzahl darf nicht 0 sein. 0 wird beim Subtrahieren und Addieren uebersprungen.
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

    /**
     * Setzt den Zaehler zurueck und schaltet auf Addition um.
     */
    $scope.reset = function () {
        $scope.cnt = 1;
        $scope.step = 1;
    };

    /**
     * Schaltet auf Addition oder Subtraktion um.
     */
    $scope.onHold = function () {
        $scope.step = $scope.step * -1;
    };

    /**
     * Sendet die ausgewaehlten Leistungen an den Server
     */
    $scope.submitData = function (amount, item) {
        if (amount === 0)
            return;
        var container = new Activity();
        container.employeeId = ConfigService.empNr;
        container.treatmentNumber = PatientService.curPatient.treatmentNumber;
        container.tarmedActivityId = item.tarmedId; 
        container.number = amount;
        container.$save();
        item.capturedCount = item.capturedCount + amount;
        $ionicListDelegate.closeOptionButtons();
        $scope.reset();
    };

    /**
     * Steuert die Anzeige der Leistungskatalog-Gruppen abhaengig vom mitgegebenen
     * Parameter.
     * @param type
     */
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
};

/**
 * Bearbeitungsuebersichts-Controller
 * Der Controller kontrolliert die View templates/editoverview.html.
 */
function EditOverviewCtrl($scope, $state, Activity, PatientService, CumulatedTime, employeeNr) {

    /**
     * Initiale Anzeige der Zeiten und registrierten Leistungen
     */
    $scope.patientService = PatientService;
    $scope.activityItems = Activity.query({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});
    $scope.times = CumulatedTime.get({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});

    /**
     * Loescht die ausgewaehlte Leistung und aktualisiert die Zeitenanzeige.
     * Leistungen werden nicht gelöscht, sondern mit negativer Anzahl in der
     * Datenbank hinzugefuegt.
     * @param item
     */
    $scope.deleteItem = function (item) {
        var index = $scope.activityItems.indexOf(item);
        if (index !== -1) {
            var container = new Activity();
            container.employeeId = item.employeeId;
            container.treatmentNumber = item.treatmentNumber;
            container.tarmedActivityId = item.tarmedActivityId; 
            container.number = item.number * -1;
            container.$save().then(function(){
                $scope.activityItems.splice(index, 1);
                $scope.times = CumulatedTime.get({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});
                
            });
        }
    };

    /**
     * Navigiert zum Leistungskatalog
     * @returns {undefined}
     */
    $scope.goToCatalogue = function () {
        $state.go('tabs.catalogue');
    };
    
    /**
     * Navigiert zur Bearbeitung der Zeitraeume
     * @returns {undefined}
     */
    $scope.goToEditTime = function () {
        $state.go('tabs.edittime');
    };
};

/**
 * Zeitbearbeitungs-Controller
 * Der Controller kontrolliert die View templates/edittime.html.
 */
function EditTimeCtrl($scope, TimePeriode, TimeService, PatientService, ConfigService, CumulatedTime, employeeNr) {

    $scope.timeService = TimeService;
    $scope.patientService = PatientService;
    $scope.fid = PatientService.curPatient.treatmentNumber;
    $scope.showTimeEdit = false;
    // Setzt initial die Zeitraumliste und die Zeiten
    $scope.durationItems = TimePeriode.query({fid: $scope.fid, empNr: employeeNr});
    $scope.times = CumulatedTime.get({fid: PatientService.curPatient.treatmentNumber, empNr: employeeNr});

    // initialisiere die Startzeit und Dauer für einen neuen Zeitraum
    $scope.startDate = PatientService.curPatient.startTime;
    $scope.duration = {min: 5};

    /**
     * Neuen Zeitraum gemaess Benutzereingabe uebermitteln
     * Direkter Zugriff auf Scope ist bei Time / Date Input nicht mehr moeglich
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
            //Ausblendung und Liste aktualisieren
            $scope.showTimeEdit = false;
            $scope.durationItems = TimePeriode.query({fid: $scope.fid, empNr: employeeNr});
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
};

/**
 * Freigabe-Controller
 * Der Controller kontrolliert die View templates/approval.html.
 */
function ApprovalCtrl($scope,$ionicListDelegate, $ionicPopup, Approval, MyPatients, TimeService, employeeNr) {
    
    $scope.timeService = TimeService;
    //Alle offenen Faelle per Leistungserbringer
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

/**
 * Home-Controller
 * Der Controller kontrolliert die View templates/home.html.
 */
function HomeTabCtrl($scope, $state, TimeService) {
        $scope.timeService = TimeService;
        $scope.goToPatients = function (mode) {
            $state.go('tabs.patients', {edit: mode});
        };
        $scope.goToApproval = function () {
            $state.go('tabs.approval');
        };
};

/**
 * Konfigurations-Controller
 * Der Controller kontrolliert die View templates/config.html.
 */
function ConfigCtrl($scope, TimeService, ConfigService) {
        $scope.timeService = TimeService;
        $scope.config = ConfigService;

        $scope.saveConfig = function () {
            ConfigService.saveConfig();
        };
};
