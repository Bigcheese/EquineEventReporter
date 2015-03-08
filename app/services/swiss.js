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

Swiss.factory('swiss', ['edmons', 'eerData', 'uuid', function(edmons, eerData, uuid) {
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
          return match.winner != player._id &&
                 match.winner != null &&
                 match.winner != "tie";
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
    pair: function(event) {
      var players = eerData.getPlayers(event);
      var ranked_players = []
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
            _id: "bye"
          }
        });
      }

      shuffle(ranked_players);

      // Group by rank.
      var groups = {};
      for (var i = 0; i < ranked_players.length; ++i) {
        if (!(ranked_players[i].points in groups))
          groups[ranked_players[i].points] = [];
        groups[ranked_players[i].points].push(ranked_players[i]);
      }

      var groupIndex = []
      for (var i in groups) {
        groupIndex.push({points: i, players: groups[i]});
      }

      groupIndex.sort(function(a, b) {
        return b.points - a.points;
      });

      // Build who has played who map.
      var matches = eerData.getMatches(event);
      var playerIdToOpponents = {}
      for (var i = 0; i < ranked_players.length; ++i)
        playerIdToOpponents[ranked_players[i].player._id] = {}
      for (var i in matches) {
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

      var match_pairs = [];

      // Pair groups using max matching.
      for (var i = 0; i < groupIndex.length; ++i) {
        // Convert to graph format.
        var playerToIndex = {};
        var indexToPlayer = {};
        var players = groupIndex[i].players;

        for (var j = 0; j < players.length; ++j) {
          var player = players[j].player;
          playerToIndex[player._id] = j;
          indexToPlayer[j] = player;
        }

        var graph = new Array(players.length);
        for (var j = 0; j < graph.length; ++j)
          graph[j] = [];

        for (var j = 0; j < players.length; ++j) {
          var player = players[j].player;
          for (var k = 0; k < players.length; ++k) {
            var opponent = players[k].player;
            if (opponent === player)
              continue;
            if (opponent._id in playerIdToOpponents[player._id])
              continue;
            graph[playerToIndex[player._id]].push(playerToIndex[opponent._id]);
          }
        }

        var matchings = edmons.maxMatching(graph);

        // Only pair each player once.
        var paired = {};
        for (var j in matchings) {
          var m0 = matchings[j][0];
          var m1 = matchings[j][1];
          if (m0 in paired || m1 in paired)
            continue;
          paired[m0] = true;
          paired[m1] = true;
          match_pairs.push([indexToPlayer[m0], indexToPlayer[m1]]);
          delete indexToPlayer[m0];
          delete indexToPlayer[m1];
        }

        // Pair down the remaining players.
        for (var j in indexToPlayer) {
          if (groupIndex[i + 1] === undefined)
            break;
          groupIndex[i + 1].players.unshift({points: null, player: indexToPlayer[j]});
        }
      }

      // Failed to pair all players.
      if (match_pairs.length !== ranked_players.length / 2)
        return;

      var addedMatches = [];
      for (var i in match_pairs) {
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
      eerData.saveMatches(addedMatches)
        .then(function(res) {
          ++event.current_round;
          return eerData.saveEvent(event);
        });
    }
  };
}]);
})();
