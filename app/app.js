(function() {
'use strict';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function deCouchify(result) {
  var ret = [];
  result.rows.forEach(function(e) {
    ret.push(e.value);
  });
  return ret;
}

var app = angular.module('eer', ['ui.router', 'edmons', 'errServices', 'Swiss'])
  .run([     '$rootScope', '$state', '$stateParams',
    function ($rootScope,   $state,   $stateParams) {
      // Make $state and $stateParams available everywhere.
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
    }
  ])
  .config([  '$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('events', {
          url: "/events",
          templateUrl: "events/events.html",
          controller: 'EventsCtrl',
          controllerAs: 'events',
          resolve: {
            events: ['Event', 'alertsManager',
              function(Event, alerts) {
                return Event.query().$promise
                  .then(deCouchify)
                  .catch(function(e) {
                    alerts.addAlert(e);
                  });
              }]
          }
        })
        .state('event', {
          url: "/event/{id}",
          templateUrl: "events/event.html",
          controller: 'EventCtrl',
          controllerAs: 'event',
          resolve: {
            event: ['$stateParams', 'Event',
              function($stateParams, Event) {
                return Event.get({id: $stateParams.id}).$promise;
              }],
            players: ['$stateParams', 'event', 'Player',
              function($stateParams, event, Player) {
                return Player.query({keys: JSON.stringify(event.players)})
                  .$promise.then(deCouchify);
              }]
          },
          data: {
            sidebar: [{name: "Players", location: 'event.players'},
                      {name: "Matches", location: 'event.matches'}]
          }
        })
        .state('event.players', {
          url: "/players",
          templateUrl: "events/event.players.html"
        })
        .state('event.matches', {
          url: "/matches",
          templateUrl: "events/event.matches.html"
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
  .controller('EventsCtrl', ['$scope', 'events', function($scope, events) {
  	$scope.model = {
  		events: events
  	};
  }])
  .controller('EventCtrl', ['$scope', 'event', 'players', 'alertsManager', 'swiss', 'Event', 'Player',
    function($scope, event, players, alertsManager, swiss, Event, Player) {
      $scope.model = {
        matches_filter: null,
        swiss: swiss,
        event: event,
        players: players
      };

      $scope.addPlayer = function() {
        if (this.name === undefined || this.name === "")
          return;
        
        var player = {
          _id: "player." + uuid(),
          type: "player",
          name: this.name
        };
        
        this.name = "";
        
        Player.save(player)
          .$promise.then(function(res) {
            player._rev = res.rev;
            $scope.model.event.players.push(player._id);
            $scope.model.players.push(player);
            return Event.save($scope.model.event).$promise;
          })
          .then(function(res) {
            $scope.model.event._rev = res.rev;
          })
          .catch(function(error) {
            alertsManager.addAlert(error);
          });
      };
    }
  ])
  ;

})();
  