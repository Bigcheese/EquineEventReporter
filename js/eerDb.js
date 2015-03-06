(function() {
'use strict';
var _dbPath = "http://127.0.0.1:5984/eer";

var eerServices = angular.module('errServices', ['ngResource']);

eerServices.factory('Events', ['$http', 'alertsManager',
  function($http, alertsManager) {
    var Events = {
      events: {data: []},
      update: function() {
        $http.get(_dbPath + "/_design/eer/_view/events")
          .success(function(data, status, headers, config) {
            Events.events.data = data.rows;
          })
          .error(function(data, status, headers, config) {
            alertsManager.addAlert(data.reason);
          });
      }
    };

    return Events;
  }]);

eerServices.factory('Event', ['$resource',
  function($resource) {
    return $resource(_dbPath + "/:id");
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

})();
