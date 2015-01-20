/* 
 * MLE Services
 */
var services = angular.module('services', ['ngResource', 'config']);

/*
 * Der REST-Service Patients gibt alle Behandlungsfaelle  * fuer Status 0, 1 oder 2 
 * zurueck. Der Status dient der Filterung der Behandlungsfaelle.
 * Status 0 = Alle, 1 = Patienten ohne Leistungen, 2 = Patienten mit Leistungen
 */
services.factory('Patients', function($resource, url) {
    return $resource(url + 'patients', {state: '@state'}, {
    });
});

/*
 * Der REST-Service MyPatients gibt alle Behandlungsfaelle fuer einen
 * Leistungserbringer fuer Status 0, 1 oder 2 zurueck.
 * Der Status dient der Filterung der Behandlungsfaelle.
 * Status 0 = Alle, 1 = Patienten ohne Leistungen, 2 = Patienten mit Leistungen
 */
services.factory('MyPatients', function($resource, url) {
    return $resource(url + 'patients/supplier/:supplier', {supplier: '@supplier', state: '@state'}, {
    });
});

/*
 * Der Rest-Service Patient gibt einen Behandlungsfall mit der Fallnummer fid fuer
 * den Leistungserbringer empNr zurueck
 */
services.factory('Patient', function($resource, url ) {
    return $resource(url + 'patients/treatment/:fid/:empNr', {fid: '@fid', empNr: '@empNr'}, {
    });
});

/*
 * Der REST-Service Suppliers gibt Leistungserbringer zurueck.
 */
services.factory('Supplier', function($resource, url) {
    return $resource(url + 'suppliers', {}, {
    });
});


/*
 * Der Rest-Service TimePeriode gibt alle Zeitraeme zurueck
 */
services.factory('TimePeriode', function($resource, url ) {
    return $resource(url + 'timePeriods/:fid/:empNr', {fid: '@fid', empNr: '@empNr'}, {
    });
});

/*
 * Der Rest-Service StandardCatalogue gibt die Leistungen des Standardkatalogs
 * fuer den Mitarbeiter empNr mit der Anzahl bereits erfassten Leistungen zu einem
 * Behandlungsfall fid zurueck.
 */
services.factory('StandardCatalogue', function($resource, url) {
    return $resource(url + 'standardActivities/supplier/:empNr/:fid', {empNr: '@empNr', fid: '@fid'}, {
    });
});

/*
 * Der Rest-Service Activity gibt die erfasste Leistung mit id zurueck.
 */
services.factory('Activity', function($resource, url ) {
    return $resource(url + 'activities/:fid/:empNr', {fid: '@fid', empNr: '@empNr'}, {
    });
});

/*
 * Der Rest-Service TreatmentCase gibt die erfassten Behandlungsfaelle zurück.
 */
services.factory('TreatmentCase', function($resource, url ) {
    return $resource(url + 'treatmentCases', {}, {
//        'update': {method:'PUT'}
    });
});

/*
 * Der Rest-Service CumulatedTimes gibt das Total der gemessenen und der 
 * verbuchten Zeit (erfasste Leistungen) eines Leistungserbringers empNr 
 * fuer den Behandlungsfall fid zurueck
 */
services.factory('CumulatedTime', function($resource, url ) {
    return $resource(url + 'treatmentCases/times/:fid/:empNr', {fid: '@fid', empNr: '@empNr'}, {
   });
});

/*
 * Der Rest-Service ApprovalService dient der Freigabe einer Behandlungsfalles fid
 * durch den Leistungserbringer empNr
 */
services.factory('Approval', function($resource, url ) {
    return $resource(url + 'approval/:empNr/:fid', {empNr: '@empNr', fid: '@fid'}, {
   });
});

/*
 * Der TimeService dient der Messung eines Zeitraumes, waehrend dem ein Leistungserbringer 
 * eine Leistung fuer einen Patienten erbringt. Es wird im Hintergrund ein Timer
 * gestartet und die abgelaufene Zeit wird in der Variable seconds propagiert.
 */
services.factory('TimeService', function($filter, $interval, PatientService, TimePeriode, ConfigService) {
        
        // Service Schnittstelle
        var service = {};
        service.seconds = 0;
        service.fid = null;
        service.running = false;
        
        // Lokale Daten
        var self = this;
        self.timer = null;
        self.startTime = null;
        self.stopTime = null;
        
        self.startTimer = function() {
            service.seconds = 0;
            self.timer = $interval(function() {
                service.seconds = Math.floor((new Date().getTime() - self.startTime.getTime()) / 1000);
                //service.seconds++;
            }, 1000);
        };
  
        /*
         * Uebemittelt den gemessenen Zeitraum mit einem REST-Call
         */
        self.submitTimePeriode = function(){
            self.newPeriode = new TimePeriode({'timePeriodId': null, 'type': 'TREATMENT', 'employeeId': ConfigService.empNr});
            self.newPeriode.treatmentNumber = service.fid;
            self.newPeriode.startTime = $filter('date')(self.startTime, 'yyyy-MM-ddTHH:mm:ss');
            self.newPeriode.endTime = $filter('date')(self.stopTime, 'yyyy-MM-ddTHH:mm:ss');
            self.newPeriode.$save();
            self.newPeriode = undefined;
        };
        
        service.start = function(newFid, callbackFunction){
            if (service.fid === newFid && service.running){
                service.stop();
                callbackFunction();
                return;
            } else if (service.fid){
                service.stop();
            }
            self.stopTime = null;
            PatientService.updatePatient(newFid, function(){
                service.fid = newFid;
                self.startTime = new Date();
                service.running = true;
                self.startTimer();
                callbackFunction();
            }); 
        };
        
        /*
         * Beendet eine laufende Zeitmessung und uebermittelt die gemessene Zeit
         * ueber die REST-Schnittstelle.
         */
        service.stop = function(){
            self.stopTime = new Date();
            self.submitTimePeriode();
            service.fid = null;
            service.running = false;
            self.startTime = null;
            self.stopTime = null;
            $interval.cancel(self.timer);
            self.timer = null;
            service.seconds = 0;
        };
        
        /*
         * Bricht die laufende Zeitmessung ab.
         */
        service.cancel = function(){
            $interval.cancel(self.timer);
            self.timer = null;
            self.startTime = null;
            self.stopTime = null;
            service.running = false;
            service.fid = null;
            service.seconds = 0;
        };
        
        return service;
    });
    

/*
 * Der PatientService stellt den aktuell ausgewaehlten Patienten, resp. 
 * Behandlungsfall zur Verfuegung. Alle erfassten Zeitmessungen und Leistungen
 * beziehen sich auf den aktuell ausgewaehlten Patienen/Behandlungsfall.
 */
services.factory('PatientService', function(Patient, employeeNr){
    var service = {};
    service.curPatient = null;
    
    var self = this;
    self.fid = null;   
    
    service.updatePatient = function(fid, onSuccess){
            service.curPatient = 
                Patient.get(
                    {fid: fid, empNr: employeeNr}, 
                    function(response){
                        if (!response.treatmentNumber || !response.patientNumber){
                            service.curPatient = null;
                            self.fid = null; 
                            alert('Der Behandlungfall wurde nicht gefunden');
                        } else if (response.released || response.releasedBySupplier){
                            service.curPatient = null;
                            self.fid = null; 
                            alert('Der Behandlungfall ist freigegeben');
                        } 
                        else {
                            self.fid = fid;
                            onSuccess();
                        }
                    }, 
                    function(){
                        service.curPatient = null;
                        self.fid = null; 
                        alert("Der Patientenservice funktioniert nicht");
                    });
    }; 
    return service;
});

/*
 * Der ConfigService stellt allgemeine Konfigurationsparameter zur Verfuegung.
 */
services.factory('ConfigService', function(employeeNr, ip){
    var service = {};
    service.ip = ip;
    service.empNr = employeeNr;
    
    service.saveConfig = function(){
        window.localStorage['ip'] = service.ip;
        window.localStorage['empNr'] = service.empNr;
    };
 
    service.deleteConfig = function(){
        window.localStorage.clear();
    };
 
    return service;
});