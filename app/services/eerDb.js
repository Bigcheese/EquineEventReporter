(function() {
'use strict';

var _dbPath = "http://127.0.0.1:5984/eer";
var eerServices = angular.module('errServices', ['ngResource', 'eer.uuid']);

function couchRowsToObjectById(rows, object) {
  rows.forEach(function(r) {
    object[r.id] = r.value;
  });
  return object;
}

eerServices.factory('eerData', ['$resource', 'alertsManager', 'uuid',
  function($resource, alerts, uuid) {
    var self = this;
    
    self.data = {};
    self.data.events = {};
    self.data.players = {};
    self.data.matches = {};

    var Event = $resource(_dbPath + "/:id", {}, {
      query: {
        method: "GET",
        isArray: false,
        url: _dbPath + "/_design/eer/_view/events"
      }
    });
    
    var Player = $resource(_dbPath + "/:id", {}, {
      query: {
        method: "GET",
        isArray: false,
        url: _dbPath + "/_design/eer/_view/players"
      }
    });
    
    var Match = $resource(_dbPath + "/:id", {}, {
      query: {
        method: "GET",
        isArray: false,
        url: _dbPath + "/_design/eer/_view/matches"
      },
      saveBulk: {
        method: "POST",
        isArray: true,
        url: _dbPath + "/_bulk_docs"
      }
    });
    
    self.loadEvents = function() {
      return Event.query().$promise
        .then(function(res) {
          return couchRowsToObjectById(res.rows, self.data.events);
        })
        .catch(function(error) {
          alerts.addAlert(error);
        });
    };
    
    self.loadEvent = function(id) {
      return Event.get({id: id}).$promise
        .then(function(res) {
          self.data.events[id] = res;
          return self.data.events[id];
        })
        .catch(function(error) {
          alerts.addAlert(error);
        });
    };
    
    self.loadPlayers = function(event) {
      var queryParams = {};
      
      if (event !== undefined)
        queryParams.keys = JSON.stringify(event.players);
      
      return Player.query(queryParams).$promise
        .then(function(res) {
          // Update cache
          couchRowsToObjectById(res.rows, self.data.players);
          if (event === undefined)
            return self.data.players;
          var ret = {};
          return couchRowsToObjectById(res.rows, ret);
        })
        .catch(function(error) {
          alerts.addAlert(error);
        });
    };

    self.loadMatches = function() {
      return Match.query().$promise
        .then(function(res) {
          return couchRowsToObjectById(res.rows, self.data.matches);
        })
        .catch(function(error) {
          alerts.addAlert(error);
        });
    };
    
    self.getMatches = function(event) {
      var ret = [];
      for (var i in self.data.matches) {
        if (self.data.matches[i].event === event._id)
          ret.push(self.data.matches[i]);
      }
      return ret;
    };
    
    self.saveMatches = function(matches) {
      return Match.saveBulk({docs: matches}).$promise
        .then(function(res) {
          matches.forEach(function(m) {
            self.data.matches[m._id] = m;
          });
          return matches;
        });
    };
    
    self.addPlayer = function(event, name) {
      var player = {
        _id: "player." + uuid(),
        type: "player",
        name: name
      };

      this.name = "";

      return Player.save(player)
        .$promise.then(function(res) {
          player._rev = res.rev;
          event.players.push(player._id);
          self.data.players[player._id] = player;
          return Event.save(event).$promise;
        })
        .then(function(res) {
          event._rev = res.rev;
          return player;
        })
        .catch(function(error) {
          alerts.addAlert(error);
          return error;
        });
    };
    
    self.savePlayer = function(player) {
      return Player.save(player).$promise
        .then(function(res) {
          player._rev = res.rev;
        })
        .catch(function(error) {
          alerts.addAlert(error);
          return error;
        });
    };
    
    self.getPlayers = function(event) {
      var ret = [];
      event.players.forEach(function(p) {
        ret.push(self.data.players[p]);
      });
      return ret;
    };
    
    return self;
  }]);

})();
