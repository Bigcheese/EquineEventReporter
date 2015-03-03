var app = angular.module('eer', ['ui.router'])
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
          controller: 'EventCtrl'
        })
    }
  ])
  .factory('EventData', function() {
    var EventData = [
    {
      name: 'Tournament 1',
      players: [{name: "Bigchese"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}, {name: "Aracat"}],
      done: false,
      matches: [{
        round: 0,
        players: ['Bigcheese', 'Aracat'],
        games: [{}],
        winner: null
      }]
    },
    {
      name: 'Tournament 2'
    },
    {
      name: 'THE BIG ONE'
    }
    ]
    return EventData
  })
  .factory('Sidebar', function() {
    var SidebarData = {subs: [{href: "#adena", name: "adena"}]}
    return SidebarData
  })
  .controller('SidebarCtrl', ['$scope', 'Sidebar', function($scope, Sidebar) {
    $scope.sidebar = Sidebar
  }])
  .controller('EventsCtrl', ['$scope', 'EventData', function($scope, EventData) {
  	$scope.model = {
  		events: EventData
  	}
  }])
  .controller('EventCtrl', ['$scope', 'EventData',
  function($scope, EventData) {
    $scope.model = {
      'event': EventData[0]
    }
  }])
