/* 
 * MLE Services
 */
var services = angular.module('services', ['ngResource', 'config']);

/*
 * Der REST-Service Patients gibt alle Behandlungsfaelle  * fuer Status 0, 1 oder 2 
 * zurueck. Der Status dient der Filterung der Behandlungsfaelle.
 * Status 0 = Alle, 1 = Patienten ohne Leistungen, 2 = Patienten mit Leistungen
 */
services.factory('Patients', function($resource, ConfigService) {
    return $resource(ConfigService.url() + 'patients', {state: '@state'}, {
    });
});

/*
 * Der REST-Service MyPatients gibt alle Behandlungsfaelle fuer einen
 * Leistungserbringer fuer Status 0, 1 oder 2 zurueck.
 * Der Status dient der Filterung der Behandlungsfaelle.
 * Status 0 = Alle, 1 = Patienten ohne Leistungen, 2 = Patienten mit Leistungen
 */
services.factory('MyPatients', function($resource, ConfigService) {
    return $resource(ConfigService.url() + 'patients/supplier/:supplier', {supplier: '@supplier', state: '@state'}, {
    });
});

/*
 * Der Rest-Service Patient gibt einen Behandlungsfall mit der Fallnummer fid zurueck
 */
services.factory('Patient', function($resource, ConfigService ) {
    return $resource(ConfigService.url() + 'patients/treatment/:fid', {fid: '@fid'}, {
    });
});

/*
 * Der Rest-Service TimePeriode gibt alle Zeitraeme zurueck
 */
services.factory('TimePeriode', function($resource, ConfigService ) {
    return $resource(ConfigService.url() + 'timePeriods', {
    });
});

/*
 * Der Rest-Service StandardCatalogue gibt die Leistungen des Standardkatalogs
 * fuer den Mitarbeiter empNr mit der Anzahl bereits erfassten Leistungen zu einem
 * Behandlungsfall fid zurueck.
 */
services.factory('StandardCatalogue', function($resource, ConfigService) {
    return $resource(ConfigService.url() + 'standardActivities/supplier/:empNr/:fid', {empNr: '@empNr', fid: '@fid'}, {
    });
});

/*
 * Der Rest-Service Activity gibt die erfasste Leistung mit id zurueck.
 */
services.factory('Activity', function($resource, ConfigService ) {
    return $resource(ConfigService.url() + 'activities/:fid', {fid: '@fid'}, {
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
                service.seconds++;
            }, 1000);
        };
  
        /*
         * Uebemittelt den gemessenen Zeitraum mit einem REST-Call
         */
        self.submitTimePeriode = function(){
            self.newPeriode = new TimePeriode({'timePeriodId': null, 'type': 'TREATMENT', 'employeeId': ConfigService.empNr});
            self.newPeriode.treatmentNumber = service.fid;
            self.newPeriode.startTime = self.startTime;
            self.newPeriode.endTime = self.stopTime;
            self.newPeriode.$save();
            self.newPeriode = undefined;
        };
        
        service.start = function(newFid){
            if (service.fid === newFid && service.running){
                service.stop();
                return;
            } else if (service.fid){
                service.stop();
            }
            self.startTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss');
            self.stopTime = null;
            service.fid = newFid;
            service.running = true;
            PatientService.updatePatient(newFid); 
            self.startTimer();
        };
        
        /*
         * Beendet eine laufende Zeitmessung und uebermittelt die gemessene Zeit
         * ueber die REST-Schnittstelle.
         */
        service.stop = function(){
            self.stopTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss');
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
services.factory('PatientService', function(Patient){
    var service = {};
    service.curPatient = null;
    
    var self = this;
    self.fid = null;   
    
    service.updatePatient = function(fid){
        if(fid !== self.fid){
            service.curPatient = Patient.get({fid: fid});
            self.fid = fid;
        }
    }; 
    return service;
});

/*
 * Der ConfigService stellt allgemeine Konfigurationsparameter zur Verfuegung.
 */
services.factory('ConfigService', function(){
    var service = {};
    service.empNr = 10101;
    service.ip = '10.0.0.11';
    service.url = function(){
        return 'http\\://' + service.ip + '\\:8080/MLEBackend/webresources/';
    };
    
    return service;
});