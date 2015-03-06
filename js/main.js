'use strict';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

var app = angular.module('eer', ['ui.router', 'edmons', 'errServices'])
  .run([     '$rootScope', '$state', '$stateParams',
    function ($rootScope,   $state,   $stateParams) {
      // Make $state and $stateParams available everywhere.
      $rootScope.$state = $state
      $rootScope.$stateParams = $stateParams
    }
  ])
  .config([  '$stateProvider', '$urlRouterProvider',
    function ($stateProvider,   $urlRouterProvider) {
      $stateProvider
        .state('events', {
          url: "/events",
          templateUrl: "templates/events.html",
          controller: 'EventsCtrl'
        })
        .state('event', {
          url: "/event/{id}",
          templateUrl: "templates/event.html",
          controller: 'EventCtrl',
          data: {
            sidebar: [{name: "Players", location: 'event.players'},
                      {name: "Matches", location: 'event.matches'}]
          }
        })
        .state('event.players', {
          url: "/players",
          templateUrl: "templates/event.players.html"
        })
        .state('event.matches', {
          url: "/matches",
          templateUrl: "templates/event.matches.html"
        });
    }
  ])
  .controller('SidebarCtrl', ['$scope', function($scope) {
  }])
  .factory('alertsManager', function() {
    return {
      alerts: [],
      
      addAlert: function(message) {
        this.alerts.push(message);
      },

      closeAlert: function(index) {
        this.alerts.splice(index, 1);
      }
    };
  })
  .controller('AlertCtrl',
         ['$scope', 'alertsManager',
  function($scope,   alertsManager) {
    $scope.alerts = alertsManager.alerts;
    $scope.closeAlert = alertsManager.closeAlert;
  }])
  .controller('EventsCtrl', ['$scope', 'Events', function($scope, Events) {
    Events.update();
  	$scope.model = {
  		events: Events.events
  	}
  }])
  .controller('EventCtrl', ['$scope', '$http', 'alertsManager', 'swiss', 'Event', 'Player',
    function($scope, $http, alertsManager, swiss, Event, Player) {
      $scope.model = {
        matches_filter: null,
        swiss: swiss,
        event: {},
        players: {}
      };

      $scope.update = function() {
        Event.get({id: $scope.$stateParams.id},
          function(value) {
            $scope.model.event = value;

            Player.query({keys: JSON.stringify($scope.model.event.players)},
              function(value) {
                $scope.model.players = {};
                value.rows.forEach(function(p) {
                  $scope.model.players[p.value._id] = p.value;
                });
              });
          });
        };

      $scope.update();

      $scope.addPlayer = function() {
        if (this.name === undefined || this.name === "")
          return;
        
        var player = {
          _id: "player." + uuid(),
          type: "player",
          name: this.name
        };
        
        this.name = "";
        
        Player.save(player,
          function(value, responseHeaders) {
            player._rev = value.rev;
            var event = $scope.model.event;
            event.players.push(player._id);
            Event.save(event,
              function(value) {
                event._rev = value._rev;
                $scope.update();
              },
              function(httpResponse) {
                alertsManager.addAlert(
                  "Failed to update event: " + httpResponse.data.reason);
              });
          },
          function(httpResponse) {
            alertsManager.addAlert(
              "Failed to add player: " + httpResponse.data.reason);
          });
      };
    }
  ])
