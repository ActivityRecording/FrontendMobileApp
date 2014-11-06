/* 
 * MLE Service Controller - Implements the resourceFactory
 */


var services = angular.module('services', ['ngResource', 'config']);

//Get Patient-TreatmentCases with Queryparameter State
services.factory('Patients', function($resource, url, stateStr) {
    return $resource(url+'patients'+stateStr+':stateParam',{stateParam: '@stateParam'}, {
        'update': {method: 'PUT'}
    });
});

//Get Patient-TreatmentCases per Supplier and Queryparameter State
services.factory('MyPatients', function($resource, url, stateStr) {
    return $resource(url+'patients/supplier/:supplierParam'+stateStr+':stateParam',
                      {supplierParam: '@supplier', stateParam: '@stateParam'}, {
        'update': {method: 'PUT'}
    });
});

//Get Patient-TreatmentCase by TeatmentNumber
services.factory('Patient', function($resource, url ) {
    return $resource(url+'patients/treatment/:fid',{fid: '@fid'}, {
        'update': {method: 'PUT'}
    });
});


//Time Periode Ressource for sending the measuerments to the backend
services.factory('TimePeriode', function($resource, url ) {
    return $resource(url+'timePeriods', {
//        'update': {method: 'PUT'}
    });
});


//Get StandardActivites by EmployeeNumber
services.factory('StandardCatalogue', function($resource, url, employeeNr ) {
    return $resource(url+'standardActivities/supplier/'+employeeNr, {
//        'update': {method: 'PUT'}
    });
});

services.factory('Activity', function($resource, url ) {
    return $resource(url+'activities/container',{}, {
        
    });
});

services.factory('TimeService', function($filter, $interval, Patient, TimePeriode, employeeNr) {
        
        var service = {};
        service.seconds = 0;
        service.fid = null;
        service.curPatient = null;
        service.running = false;
        
        var self = this;
        self.timer = null;
        self.startTime = null;
        self.stopTime = null;
        
        new Patient();
        self.newPeriode = new TimePeriode({
                'timePeriodId': null, 
                'type': 'TREATMENT',
                'employeeId': employeeNr});
        
        self.startTimer = function() {
            service.seconds = 0;
            self.timer = $interval(function() {
                service.seconds++;
            }, 1000);
        };
        self.updatePatient = function(fid){
            service.curPatient = Patient.get({fid: fid});
        }; 
        self.submitTimePeriode = function(){
            self.newPeriode.treatmentNumber = service.fid;
            self.newPeriode.startTime = self.startTime;
            self.newPeriode.endTime = self.stopTime;
            self.newPeriode.$save();
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
            self.updatePatient(newFid); 
            self.startTimer();
        };
        
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
        service.updatePatient = function(fid){
            self.updatePatient(fid);
        }; 
        return service;
    });