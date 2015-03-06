(function() {
'use strict';

var _dbPath = "http://127.0.0.1:5984/eer";
var eerServices = angular.module('errServices', ['ngResource']);

eerServices.factory('Event', ['$resource',
  function($resource) {
    return $resource(_dbPath + "/:id", {}, {
      query: {
        method: "GET",
        isArray: false,
        url: _dbPath + "/_design/eer/_view/events"
      }
    });
  }]);

eerServices.factory('Player', ['$resource',
  function($resource) {
    return $resource(_dbPath + "/:id", {}, {
      query: {
        method: "GET",
        isArray: false,
        url: _dbPath + "/_design/eer/_view/players"
      }
    });
  }]);

eerServices.factory('Match', ['$resource',
  function($resource) {
    return $resource(_dbPath + "/:id", {}, {
      query: {
        method: "GET",
        isArray: false,
        url: _dbPath + "/_design/eer/_view/matches"
      }
    });
  }]);

})();
