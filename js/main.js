var app = angular.module('eer', ['ui.router', 'edmons'])
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
        })
    }
  ])
  .controller('SidebarCtrl', ['$scope', function($scope) {
  }])
  .controller('EventsCtrl', ['$scope', 'EventData', function($scope, EventData) {
  	$scope.model = {
  		events: EventData.data.events
  	}
  }])
  .controller('EventCtrl', ['$scope', 'EventData', 'swiss',
    function($scope, EventData, swiss) {
      $scope.model = {
        matches_filter: null,
        'swiss': swiss,
        'data': EventData,
        'event': $.grep(EventData.data.events, function (e) {
          return e.id === $scope.$stateParams.id
        })[0]
      }
    }
  ])
