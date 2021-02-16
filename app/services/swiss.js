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
    playerMatches: function(event, player) {
      var ret = [];
      var matches = eerData.getMatches(event);
      for (var i in matches) {
        var m = matches[i];
        if (m.players.indexOf(player._id) !== -1)
          ret.push(m);
      }
      return ret;
    },
    winLossTie: function(event, player) {
      var matches = this.playerMatches(event, player);
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
    matchPoints: function(event, player) {
      var wlt = this.winLossTie(event, player);
      return (wlt[0] * 3) + (wlt[1] * 0) + (wlt[2] * 1);
    },
    opponentsMatchWinPercentage: function(event, player) {
      var matches = this.playerMatches(event, player);
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
        totalOp += self.matchPoints(event, opponent) /
          (self.playerMatches(event, opponent).length * 3);
        ++totalMatches;
      });
      var ret = totalOp / totalMatches;
      return isNaN(ret) ? 0 : ret;
    },
    matchRank: function(match) {
      if (match.players[1] === null)
        return [0, 0];
      var p1 = eerData.data.players[match.players[0]];
      var p2 = eerData.data.players[match.players[1]];
      var mpAvg = (this.matchPoints(eerData.data.events[match.event], p1) +
                   this.matchPoints(eerData.data.events[match.event], p2)) / 2;
      var omwpAvg = (this.opponentsMatchWinPercentage(eerData.data.events[match.event], p1) +
                     this.opponentsMatchWinPercentage(eerData.data.events[match.event], p2)) / 2;
      return [mpAvg, omwpAvg];
    },
    pair: function(event, pairNext) {
      if (!pairNext)
        --event.current_round;
      var players = eerData.getPlayers(event);
      var ranked_players = [];
      for (var i in players) {
        if (players[i].dropped !== true && players[i].paid === true)
          ranked_players.push({
            points: this.matchPoints(event, players[i]),
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
      var rankedIndex = {};
      
      // Build who has played who map.
      var matches = eerData.getMatches(event);
      var playerIdToOpponents = {};
      for (i = 0; i < ranked_players.length; ++i) {
        rankedIndex[ranked_players[i].player._id] = i;
        playerIdToOpponents[ranked_players[i].player._id] = {};
      }
      var indiciesToRemove = {};
      for (i in matches) {
        var m = matches[i];
        var player1 = m.players[0];
        var player2 = m.players[1];
        if (m.round == event.current_round) {
          indiciesToRemove[rankedIndex[player1]] = true;
          indiciesToRemove[rankedIndex[player2]] = true;
        }
        if (player2 === null)
          player2 = "bye";
        if (player1 in playerIdToOpponents)
          playerIdToOpponents[player1][player2] = true;
        if (player2 in playerIdToOpponents)
          playerIdToOpponents[player2][player1] = true;
      }

      var newRanked = [];
      for (i = 0; i < ranked_players.length; ++i) {
        if (!(i in indiciesToRemove))
          newRanked.push(ranked_players[i]);
      }
      var alreadyMatched = ranked_players.length !== newRanked.length;
      ranked_players = newRanked;
      
      // Build weighted edges.
      var edgeList = [];
      for (i = 0; i < ranked_players.length; ++i) {
        for (var j = i + 1; j < ranked_players.length; ++j) {
          var p1 = ranked_players[i];
          var p2 = ranked_players[j];
          var weight = 0;
          var alreadyPlayedCount = playerIdToOpponents[p1.player._id][p2.player._id] === true ? 1 : 0;
          if (alreadyPlayedCount !== 0) {
            weight = -9999999;
          } else {
            // calculate pairing weight. higher is better.
            var max = Math.max(p1.points, p2.points);
            var min = Math.min(p1.points, p2.points);
            // Base weight is the average of the two players
            weight = ((max + min) / 2) - ((max-min)*(max-min));
            // console.log(weight,max,min);
          }
          edgeList.push([i, j, weight]);
        }
      }

      var indexToPlayer = {};

      for (i = 0; i < ranked_players.length; ++i) {
        var player = ranked_players[i].player;
        indexToPlayer[i] = player;
      }
      
      var self = this;
      return $http.post(document.location.protocol + '//' + document.location.hostname + ':8156', edgeList)
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
            match.rank = self.matchRank(match);
            addedMatches.push(match);
          }
          
          // Sort matches and assign tables.
          addedMatches.sort(function(a, b) {
            if (a.players[1] === null)
              return 1;
            if (b.players[1] === null)
              return -1;
            if (a.rank[0] !== b.rank[0])
              return b.rank[0] - a.rank[0];
            if (a.rank[1] !== b.rank[1])
              return b.rank[1] - a.rank[1];
            return a._id < b._id;
          });
          
          if (!alreadyMatched) {
            for (i = 0; i < addedMatches.length; ++i)
              addedMatches[i].table = i + 1;
          } else {
            // Find empty tables.
            var usedTables = {};
            for (i = 0; i < matches.length; ++i) {
              var m = matches[i];
              if (m.round == event.current_round)
                usedTables[m.table] = true;
            }
            i = 1;
            var j = 0;
            while (j < addedMatches.length) {
              if (!(i in usedTables))
                addedMatches[j++].table = i;
              ++i;
            }
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
