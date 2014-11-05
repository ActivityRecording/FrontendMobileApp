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

//Submit captured Activites of employee
//services.factory('Activity', function($resource, url ) {
//    return $resource(url+'activities',{}, {
//        'saveAll': {method: 'POST', isArray: true}
//    });
//});
services.factory('Activity', function($resource, url ) {
    return $resource(url+'activities/container',{}, {
        
    });
});

services.factory('TimeService', function($rootScope, $filter, $interval, Patient, TimePeriode, employeeNr) {
        
        var service = {};
        service.seconds = 0;
        service.fid = null;
        service.curPatient = null;
        service.isRunning = false;
        var timer;
        var startTime;
        var stopTime;
        
        new Patient();
        var newPeriode = new TimePeriode({'timePeriodId': null, 'type': 'TREATMENT',
                                          'employeeId': employeeNr});
        
        service.running = function(){
            return service.isRunning === true;
        }; 
        
        var startTimer = function () {
            service.seconds = 0;
            timer = $interval(function() {
                service.seconds++;
            }, 1000);
        };
        var updatePatient = function(fid){
            service.curPatient = Patient.get({fid: fid});
        }; 
        var submitTimePeriode = function(){
            newPeriode.treatmentNumber = service.fid;
            newPeriode.startTime = startTime;
            newPeriode.endTime = stopTime;
            newPeriode.$save();
        };
        
        service.init = function(fid){
            startTime = null;
            stopTime = null;
            service.fid = fid;
            service.seconds = 0;
            service.isRunning = false;
            this.updatePatient(fid); 
        };
        

        service.start = function(newFid){
            if (service.fid === newFid && service.isRunning){
                service.stop();
                return;
            } else if (service.fid !== null){
                service.stop();
            }
            startTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss');
            stopTime = null;
            service.fid = newFid;
            service.isRunning = true;
            this.updatePatient(newFid); 
            startTimer();
        };
        
        service.stop = function(){
            stopTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss');
            submitTimePeriode();
            service.fid = null;
            service.isRunning = false;
            this.startTime = null;
            this.stopTime = null;
            $interval.cancel(timer);
            this.timer = null;
            service.seconds = 0;
        };
        service.updatePatient = function(fid){
            updatePatient(fid);
            $rootScope.$broadcast("patientUpdated");
        }; 
        return service;
    });