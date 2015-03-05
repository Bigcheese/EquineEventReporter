app.factory('EventData', function() {
  var EventData = {
    data: {
      events: [
        {
          _id: "event.w4yfhwo874f",
          name: "Tournament 1",
          type: "swiss",
          players: ["player.398ruw3", "player.4fis93kd"],
          current_round: 0,
          done: false
        }
      ],
      players: [
        {
          _id: "player.398ruw3",
          name: "Bigcheese",
          deck: "",
          paid: true,
          dropped: false,
          warning_count: 0
        },
        {
          _id: "player.4fis93kd",
          name: "Aracat",
          deck: "",
          paid: true,
          dropped: false,
          warning_count: 0
        },
       {
          _id: "player.4fie93kd",
          name: "Bugle",
          deck: "",
          paid: true,
          dropped: false,
          warning_count: 0
        },
        {
          _id: "player.4fdfis93kd",
          name: "Gippy",
          deck: "",
          paid: true,
          dropped: false,
          warning_count: 0
        },
        {
          _id: "player.4fis9sef3kd",
          name: "TCO",
          deck: "",
          paid: true,
          dropped: false,
          warning_count: 0
        }
      ],
      matches: []
    },
    players: function(event) {
      var playerIds = event.players
      var ret = []
      for (i in this.data.players) {
        var player = this.data.players[i]
        if ($.inArray(player._id, playerIds.some)) {
          ret.push(player)
        }
      }
      return ret
    },
    matches: function(event) {
      return $.grep(this.data.matches, function(match) {
        return match.event === event._id
      })
    },
    player: function(playerId) {
      return $.grep(this.data.players, function(player) {
        return player._id === playerId
      })[0]
    },
  }
  return EventData
})
