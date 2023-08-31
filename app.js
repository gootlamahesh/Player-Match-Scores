const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API1 GET list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `SELECT player_id AS playerId, player_name AS playerName FROM player_details;`;
  const playerListArray = await db.all(getPlayerQuery);
  response.send(playerListArray);
});

const caseConversion = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};
//API2  specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `SELECT player_id, player_name FROM player_details
    WHERE player_id=${playerId};`;
  const playerList = await db.get(getQuery);
  response.send(caseConversion(playerList));
});

//API3 PUT Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `UPDATE player_details
                            SET player_name='${playerName}'
                            WHERE player_id=${playerId};`;
  const dbResponse = await db.run(updateQuery);
  response.send("Player Details Updated");
});

//API4 GET the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
        SELECT match_id AS matchId,
        match,
        year
        FROM match_details
        WHERE matchId=${matchId};`;
  const dbResponse = await db.get(matchQuery);
  response.send(dbResponse);
});

//API5 GET list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
    SELECT match_details.match_id AS matchId,match_details.match AS match,
    match_details.year AS year
    FROM (player_details INNER JOIN player_match_score ON
        player_details.player_id=player_match_score.player_id) AS T INNER JOIN
        match_details ON T.match_id = match_details.match_id
    WHERE player_details.player_id=${playerId};`;
  const dbResponse = await db.all(getQuery);
  response.send(dbResponse);
});

//API6 Returns a list of players of a specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
    SELECT player_details.player_id AS playerId, player_details.player_name AS playerName
    FROM (player_details INNER JOIN player_match_score ON
        player_details.player_id=player_match_score.player_id) AS T INNER JOIN
        match_details ON T.match_id = match_details.match_id
    WHERE match_details.match_id=${matchId};`;
  const dbResponse = await db.all(getQuery);
  response.send(dbResponse);
});

/*API7Returns the statistics of the total score, fours, sixes 
of a specific player based on the player ID*/
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
    SELECT player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score ON
        player_details.player_id=player_match_score.player_id
    WHERE player_details.player_id = ${playerId}
    GROUP BY playerName ;`;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});
