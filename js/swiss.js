function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

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

function stableSort(arr, cmpFunc) {
    //wrap the arr elements in wrapper objects, so we can associate them with their origional starting index position
    var arrOfWrapper = arr.map(function(elem, idx){
        return {elem: elem, idx: idx};
    });

    //sort the wrappers, breaking sorting ties by using their elements orig index position
    arrOfWrapper.sort(function(wrapperA, wrapperB){
        var cmpDiff = cmpFunc(wrapperA.elem, wrapperB.elem);
        return cmpDiff === 0 
             ? wrapperA.idx - wrapperB.idx
             : cmpDiff;
    });

    //unwrap and return the elements
    return arrOfWrapper.map(function(wrapper){
        return wrapper.elem;
    });
}

function paired(array) {
  if (array.length >= 2)
    return [[array[0], array[1]]].concat(paired(array.slice(2)))
  else if (array.length === 1)
    return [[array[0], null]]
  else
    return []
}

app.factory('swiss', ['EventData', function(EventData) {
  return {
    winLossTie: function(player) {
      var matches = $.grep(EventData.data.matches, function(match) {
        return match.players.indexOf(player.id) != -1
      })
      return [
        $.grep(matches, function(match) {
          return match.winner === player.id
        }).length,
        $.grep(matches, function(match) {
          return match.winner != player.id && match.winner != "tie"
        }).length,
        $.grep(matches, function(match) {
          match.winner === "tie"
        }).length
      ]
    },
    matchPoints: function(player) {
      var wlt = this.winLossTie(player)
      return (wlt[0] * 3) + wlt[2]
    },
    pair: function(event) {
      event.current_round++
      var players = EventData.players(event)
      var ranked_players = []
      for (var i in players) {
        ranked_players.push({
          points: this.winLossTie(players[i])[0],
          player: players[i]
        })
      }

      shuffle(ranked_players)
      ranked_players = stableSort(ranked_players, function(a, b) {
        return b.points - a.points
      })

      var match_pairs = paired(ranked_players)

      for (var i in match_pairs) {
        EventData.data.matches.push({
          id: "match." + uuid(),
          event: event.id,
          round: event.current_round,
          players: [match_pairs[i][0].player.id, match_pairs[i][1] ? match_pairs[i][1].player.id : null],
          games: [],
          winner: match_pairs[i][1] ? null : match_pairs[i][0].player.id
        })
      }
    }
  }
}])
