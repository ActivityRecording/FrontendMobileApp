/* 
 * MLE Service Controller - Implements the resourceFactory
 */


var services = angular.module('services', ['ngResource', 'config']);

//Get Patient-TreatmentCases with Queryparameter State
services.factory('Patients', function($resource, ConfigService, stateStr) {
    return $resource(ConfigService.url+'patients'+stateStr+':stateParam',{stateParam: '@stateParam'}, {
    });
});

//Get Patient-TreatmentCases per Supplier and Queryparameter State
services.factory('MyPatients', function($resource, ConfigService, stateStr) {
    return $resource(ConfigService.url+'patients/supplier/:supplierParam'+stateStr+':stateParam',
                      {supplierParam: '@supplier', stateParam: '@stateParam'}, {
    });
});

//Get Patient-TreatmentCase by TeatmentNumber
services.factory('Patient', function($resource, ConfigService ) {
    return $resource(ConfigService.url+'patients/treatment/:fid',{fid: '@fid'}, {
    });
});

//Time Periode Ressource for sending the measuerments to the backend
services.factory('TimePeriode', function($resource, ConfigService ) {
    return $resource(ConfigService.getUrl()+'timePeriods', {
    });
});

//Get StandardActivites by EmployeeNumber
services.factory('StandardCatalogue', function($resource, ConfigService, employeeNr ) {
    return $resource(ConfigService.url+'standardActivities/supplier/'+employeeNr, {
    });
});

services.factory('Activity', function($resource, ConfigService ) {
    return $resource(ConfigService.url+'activities/container',{}, {
    });
});

services.factory('Activity2', function($resource, ConfigService ) {
    return $resource(ConfigService.url+'activities',{}, {
    });
});

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

    
services.factory('ConfigService', function(employeeNr, url){
    var service = {};
    service.url = url;
    service.empNr = employeeNr;
    
    service.getUrl = function (){ 
        return service.url;
    };
    
    service.setUrl = function (url){
        service.url = url;
    };
    
    service.getEmployeeNr = function (){
        return service.empNr;
    };
    
    service.setEmployeeNr = function (empNr){
        service.empNr = empNr;
    };
    return service;
});