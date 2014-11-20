var app = angular.module('indexedDB', []);

app.factory('ConfigDB', function($window, $q, ip, employeeNr){
    
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    
    var indexedDB = $window.indexedDB;
    var db = null;
  
    var open = function(){
        
        var deferred = $q.defer();
        var request = indexedDB.open("MleDatabase", 1);

        request.onupgradeneeded = function(e) {
            db = e.target.result;

            e.target.transaction.onerror = indexedDB.onerror;

            if(db.objectStoreNames.contains("configData")) {
                db.deleteObjectStore("configData");
            }

            var store = db.createObjectStore("configData",{keyPath: "id"});
            
            store.transaction.oncomplete = function() {
                var trans = db.transaction(["configData"], "readwrite");
                var store = trans.objectStore("configData");
                store.add({id: "ip", ip: ip});
                store.add({id: "empNr", empNr: employeeNr});
            };
        };

        request.onsuccess = function(e) {
            db = e.target.result;
            deferred.resolve();
        };

        request.onerror = function(){
            deferred.reject();
        };

        return deferred.promise;
    };
  
    var getConfig = function(id){
        var deferred = $q.defer();
	var item;
    
        if(db === null){
            deferred.reject("IndexDB is not opened yet!");
        } else {
            var trans = db.transaction(["configData"], "readwrite");
            var store = trans.objectStore("configData");
            var request = store.get(id);

            request.onsuccess = function(e) {
		item = event.target.result;
		deferred.resolve(item);
            };

            request.onerror = function(e){
                console.log(e.value);
                deferred.reject("ConfigItem couldn't be read!");
            };
        }

        return deferred.promise;
    };

    var deleteConfig = function(id){
        var deferred = $q.defer();
    
        if(db === null){
            deferred.reject("IndexDB is not opened yet!");
        } else {
            var trans = db.transaction(["configData"], "readwrite");
            var store = trans.objectStore("configData");
    
            var request = store.delete(id);
    
            request.onsuccess = function(e) {
                deferred.resolve();
            };
    
            request.onerror = function(e) {
                console.log(e.value);
                deferred.reject("Config item couldn't be deleted");
            };
        }
    
        return deferred.promise;
    };
  
    var addConfig = function(configItem){
        var deferred = $q.defer();
    
        if(db === null){
            deferred.reject("IndexDB is not opened yet!");
        } else {
            var trans = db.transaction(["configData"], "readwrite");
            var store = trans.objectStore("configData");
            var request = store.put(configItem);
    
            request.onsuccess = function(e) {
                deferred.resolve();
            };
    
            request.onerror = function(e) {
                console.log(e.value);
                deferred.reject("Config item couldn't be added!");
            };
        }
        return deferred.promise;
    };
  
  return {
    open: open,
    getConfig: getConfig,
    addConfig: addConfig,
    deleteConfig: deleteConfig
  };
  
});