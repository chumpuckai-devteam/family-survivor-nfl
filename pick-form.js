(function () {
  var api = (document.querySelector('meta[name="pick-api"]') || {}).content || "";
  var msg = document.getElementById("pick-msg");
  var memberEl = document.getElementById("pick-member");
  var teamEl = document.getElementById("pick-team");
  var pinEl = document.getElementById("pick-pin");
  var form = document.getElementById("pick-form");
  var board = null;

  function say(text) {
    if (msg) msg.textContent = text;
  }

  function selectedMember() {
    if (!board) return null;
    var name = memberEl.value;
    for (var i = 0; i < board.members.length; i++) {
      if (board.members[i].name === name) return board.members[i];
    }
    return null;
  }

  function fillTeams() {
    var member = selectedMember();
    var used = member ? member.used : [];
    var current = member ? member.pick : "";
    teamEl.innerHTML = "";
    if (!board || !board.games) return;
    board.games.forEach(function (game) {
      [game.away, game.home].forEach(function (team) {
        var opt = document.createElement("option");
        opt.value = team;
        var label = team + " · " + game.kickoff;
        if (game.started) label += " · started";
        if (used.indexOf(team) !== -1 && team !== current) label += " · used";
        opt.textContent = label;
        opt.disabled = game.started || (used.indexOf(team) !== -1 && team !== current);
        if (team === current) opt.selected = true;
        teamEl.appendChild(opt);
      });
    });
  }

  function fillMembers() {
    memberEl.innerHTML = "";
    board.members.forEach(function (member) {
      var opt = document.createElement("option");
      opt.value = member.name;
      opt.textContent = member.pin_set ? member.name : member.name + " · set a PIN";
      memberEl.appendChild(opt);
    });
    fillTeams();
  }

  function load() {
    if (!api) {
      say("Pick form is offline. Post the pick in the family thread.");
      form.hidden = true;
      return;
    }
    fetch(api + "/board", { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        board = data;
        if (!data.week) {
          say("No games left to pick.");
          form.hidden = true;
          return;
        }
        say("Week " + data.week + ". PIN is 4 digits. The first PIN for a name sticks.");
        fillMembers();
      })
      .catch(function () {
        say("Pick form is offline. Post the pick in the family thread.");
        form.hidden = true;
      });
  }

  function post(path, payload) {
    pinEl.value = "";
    return fetch(api + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().then(function (data) {
        say(data.message || "Could not save that.");
        if (data.ok) load();
      });
    }).catch(function () {
      say("Could not reach the pick server.");
    });
  }

  memberEl.addEventListener("change", fillTeams);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    post("/pick", {
      member: memberEl.value,
      team: teamEl.value,
      pin: pinEl.value
    });
  });
  document.getElementById("set-pin").addEventListener("click", function () {
    post("/pin", { member: memberEl.value, pin: pinEl.value });
  });
  load();
})();
