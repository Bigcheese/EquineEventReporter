(function() {
'use strict';

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function fill(array, val) {
  for (var i = 0; i < array.length; ++i)
    array[i] = val;
}

var Swiss = angular.module('Swiss', []);

Swiss.factory('swiss', ['$http', 'edmons', 'eerData', 'uuid', function($http, edmons, eerData, uuid) {
  return {
    playerMatches: function(player) {
      var ret = [];
      for (var i in eerData.data.matches) {
        var m = eerData.data.matches[i];
        if (m.players.indexOf(player._id) !== -1)
          ret.push(m);
      }
      return ret;
    },
    winLossTie: function(player) {
      var matches = this.playerMatches(player);
      return [
        $.grep(matches, function(match) {
          return match.winner === player._id;
        }).length,
        $.grep(matches, function(match) {
          return match.winner !== player._id &&
                 match.winner !== null &&
                 match.winner !== "tie";
        }).length,
        $.grep(matches, function(match) {
          return match.winner === "tie";
        }).length
      ];
    },
    matchPoints: function(player) {
      var wlt = this.winLossTie(player);
      return (wlt[0] * 3) + wlt[1] + (wlt[2] * 2);
    },
    opponentsMatchWinPercentage: function(player) {
      var matches = this.playerMatches(player);
      var totalOp = 0;
      var totalMatches = 0;
      var self = this;
      matches.forEach(function(m) {
        // Ignore byes.
        if (m.players[1] === null)
          return;
        var opponent = m.players[0] === player._id ?
          eerData.data.players[m.players[1]] :
          eerData.data.players[m.players[0]];
        totalOp += self.matchPoints(opponent) /
          (self.playerMatches(opponent).length * 3);
        ++totalMatches;
      });
      var ret = totalOp / totalMatches;
      return isNaN(ret) ? 0 : ret;
    },
    pair: function(event) {
      var players = eerData.getPlayers(event);
      var ranked_players = [];
      for (var i in players) {
        if (players[i].dropped !== true && players[i].paid === true)
          ranked_players.push({
            points: this.matchPoints(players[i]),
            player: players[i]
          });
      }

      // Add a bye if we have an odd number of players.
      if (ranked_players.length % 2 === 1) {
        ranked_players.push({
          points: 0,
          player: {
            _id: "bye",
            name: "bye"
          }
        });
      }

      shuffle(ranked_players);
      
      // Build who has played who map.
      var matches = eerData.getMatches(event);
      var playerIdToOpponents = {};
      for (i = 0; i < ranked_players.length; ++i)
        playerIdToOpponents[ranked_players[i].player._id] = {};
      for (i in matches) {
        var m = matches[i];
        var player1 = m.players[0];
        var player2 = m.players[1];
        if (player2 === null)
          player2 = "bye";
        if (player1 in playerIdToOpponents)
          playerIdToOpponents[player1][player2] = true;
        if (player2 in playerIdToOpponents)
          playerIdToOpponents[player2][player1] = true;
      }
      
      // Build weighted edges.
      var edgeList = [];
      for (i = 0; i < ranked_players.length; ++i) {
        for (var j = i + 1; j < ranked_players.length; ++j) {
          var p1 = ranked_players[i];
          var p2 = ranked_players[j];
          var weight = 0;
          if (playerIdToOpponents[p1.player._id][p2.player._id] === true)
            // Higher ranked players less likely to be repaired.
            weight = -Math.max(p1.points, p2.points);
          else
            // Prefer same ranked players.
            weight = Math.min(p1.points, p2.points);
          edgeList.push([i, j, weight]);
        }
      }
      
      var indexToPlayer = {};

      for (i = 0; i < ranked_players.length; ++i) {
        var player = ranked_players[i].player;
        indexToPlayer[i] = player;
      }
      
      return $http.post("http://127.0.0.1:8156/", edgeList)
        .then(function(res) {
          var match_pairs = res.data;
          // Failed to pair all players.
          if (match_pairs.length !== ranked_players.length / 2)
            throw "Failed to pair";
          
          for (var i in match_pairs) {
            match_pairs[i][0] = indexToPlayer[match_pairs[i][0]];
            match_pairs[i][1] = indexToPlayer[match_pairs[i][1]];
          }

          var addedMatches = [];
          for (i in match_pairs) {
            // Bye always is 2nd player.
            if (match_pairs[i][0]._id === "bye")
              match_pairs[i][1] = [match_pairs[i][0], match_pairs[i][0] = match_pairs[i][1]][0];
            var match = {
              _id: "match." + uuid(),
              type: "match",
              event: event._id,
              round: event.current_round,
              players: [
                match_pairs[i][0]._id,
                match_pairs[i][1]._id !== "bye" ? match_pairs[i][1]._id : null
              ],
              games: [],
              winner: match_pairs[i][1]._id !== "bye" ? null : match_pairs[i][0]._id
            };
            addedMatches.push(match);
          }
          return eerData.saveMatches(addedMatches)
            .then(function(res) {
              ++event.current_round;
              return eerData.saveEvent(event)
                .then(function() {
                  // So the caller has access. 
                  return addedMatches;
                });
            });
        });
    }
  };
}]);
})();
