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