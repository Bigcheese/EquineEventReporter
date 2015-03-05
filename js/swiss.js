(function() {
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

app.factory('swiss', ['EventData', 'edmons', function(EventData, edmons) {
  return {
    playerMatches: function(player) {
      return $.grep(EventData.data.matches, function(match) {
        return match.players.indexOf(player.id) != -1;
      });
    },
    winLossTie: function(player) {
      var matches = this.playerMatches(player);
      return [
        $.grep(matches, function(match) {
          return match.winner === player.id;
        }).length,
        $.grep(matches, function(match) {
          return match.winner != player.id &&
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
      return (wlt[0] * 3) + wlt[2];
    },
    pair: function(event) {
      event.current_round++
      var players = EventData.players(event)
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
            id: "bye"
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
      var matches = EventData.matches(event);
      var playerIdToOpponents = {}
      for (var i = 0; i < ranked_players.length; ++i)
        playerIdToOpponents[ranked_players[i].player.id] = {}
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
          playerToIndex[player.id] = j;
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
            if (opponent.id in playerIdToOpponents[player.id])
              continue;
            graph[playerToIndex[player.id]].push(playerToIndex[opponent.id]);
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

      for (var i in match_pairs) {
        // Bye always is 2nd player.
        if (match_pairs[i][0].id === "bye")
          match_pairs[i][1] = [match_pairs[i][0], match_pairs[i][0] = match_pairs[i][1]][0];
        EventData.data.matches.push({
          id: "match." + uuid(),
          event: event.id,
          round: event.current_round,
          players: [match_pairs[i][0].id, match_pairs[i][1].id !== "bye" ? match_pairs[i][1].id : null],
          games: [],
          winner: match_pairs[i][1].id !== "bye" ? null : match_pairs[i][0].id
        });
      }
    }
  };
}]);
})();
