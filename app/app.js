(function() {
'use strict';

function deCouchify(result) {
  var ret = [];
  result.rows.forEach(function(e) {
    ret.push(e.value);
  });
  return ret;
}

var app = angular.module('eer', ['ui.router', 'angular-toArrayFilter', 'edmons', 'errServices', 'Swiss'])
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
            events: ['eerData',
              function(eerData) {
                return eerData.loadEvents();
              }]
          }
        })
        .state('event', {
          url: "/event/{id}",
          templateUrl: "events/event.html",
          controller: 'EventCtrl',
          controllerAs: 'event',
          resolve: {
            event: ['$stateParams', 'eerData',
              function($stateParams, eerData) {
                return eerData.loadEvent($stateParams.id);
              }],
            players: ['event', 'eerData',
              function(event, eerData) {
                return eerData.loadPlayers(event);
              }],
            matches: ['event', 'eerData',
              function(event, eerData) {
                return eerData.loadMatches(event);
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
  .controller('EventsCtrl',
         ['$scope', 'events', 'eerData', 'uuid',
  function($scope,   events,   eerData,   uuid) {
  	$scope.model = {
  		events: events
  	};
    
    $scope.addEvent = function(name) {
      if (this.name === undefined || this.name === "")
        return;

      // TODO: Construct default events in a sane location?
      var event = {
        _id: 'event.' + uuid(),
        type: 'event',
        name: this.name,
        current_round: 1,
        players: [],
        done: false,
        eventType: "swiss"
      };

      eerData.saveEvent(event);

      this.name = "";
    };
    
    $scope.removeEvent = function(event) {
      return eerData.removeEvent(event);
    };
  }])
  .controller('EventCtrl',
           ['$scope', 'eerData', 'event', 'players', 'matches', 'alertsManager', 'swiss',
    function($scope,   eerData,   event,   players,   matches,   alertsManager,   swiss) {
      $scope.model = {
        swiss: swiss,
        event: event,
        players: players,
        matches: matches
      };
      
      $scope.matches_filter = null;

      $scope.addPlayer = function() {
        if (this.name === undefined || this.name === "")
          return;
        
        eerData.addPlayer(event, this.name)
          .then(function(player) {
            $scope.model.players[player._id] = player;
          });
        
        this.name = "";
      };
      
      $scope.savePlayer = function(player) {
        eerData.savePlayer(player);
      };
      
      $scope.removePlayer = function(player, event) {
        eerData.removePlayer(player, event)
          .then(function(res) {
            delete $scope.model.players[player._id];
          });
      };
      
      $scope.pair = function() {
        swiss.pair(event)
          .then(function(addedMatches) {
            addedMatches.forEach(function(match) {
              $scope.model.matches[match._id] = match;
            });
          });
      };
      
      $scope.saveMatch = function(match) {
        eerData.saveMatch(match);
      };
      
      $scope.resetMatches = function() {
        eerData.resetMatches($scope.model.event);
        $scope.model.matches = {};
      };
      
      $scope.comparePlayer = function(a) {
        var mp = $scope.model.swiss.matchPoints(a);
        var omwp = $scope.model.swiss.opponentsMatchWinPercentage(a);
        return mp + omwp;
      };
    }
  ])
  ;

})();
