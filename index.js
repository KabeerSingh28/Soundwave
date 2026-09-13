const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawn } = require("child_process");

const songsFolder = path.join(__dirname, "songs");
const songs = fs
  .readdirSync(songsFolder)
  .filter((song) => song.toLowerCase().endsWith(".mp3"));

let playerProcess = null;
let isPaused = false;

if (songs.length === 0) {
  console.log("No MP3 files found in the songs folder.");
  process.exit(0);
}

function showMenu() {
  console.log("\n🎶 Welcome to Soundwave 🎶\n");

  songs.forEach((song, index) => {
    console.log(`${index + 1}. ${path.parse(song).name}`);
  });

  console.log("\nCommands:");
  console.log("[number] → Select and play a song");
  console.log("p → Pause / Resume");
}

function playSong(songNumber) {
  if (!Number.isInteger(songNumber) || songNumber < 1 || songNumber > songs.length) {
    console.log("Please enter a song number from the list.");
    return;
  }

  const song = songs[songNumber - 1];
  const songPath = path.join(songsFolder, song);

  if (playerProcess) {
    playerProcess.kill("SIGTERM");
  }

  isPaused = false;

  console.log(`🎵 Playing: ${path.parse(song).name}`);

  playerProcess = spawn(
    "ffplay",
    ["-nodisp", "-vn", "-autoexit", "-loglevel", "error", songPath],
    { stdio: ["ignore", "inherit", "inherit"] }
  );

  playerProcess.on("error", () => {
    console.log("Could not start ffplay. Make sure ffplay is installed.");
    playerProcess = null;
  });

  const startedProcess = playerProcess;

  startedProcess.on("exit", () => {
    if (playerProcess === startedProcess) {
      playerProcess = null;
      isPaused = false;
    }
  });
}

function pauseOrResumeSong() {
  if (!playerProcess) {
    console.log("No song is playing.");
    return;
  }

  if (isPaused) {
    playerProcess.kill("SIGCONT");
    isPaused = false;
    console.log("▶️ Song resumed");
  } else {
    playerProcess.kill("SIGSTOP");
    isPaused = true;
    console.log("⏸️ Song paused");
  }
}

showMenu();

const input = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

input.on("line", (answer) => {
  const command = answer.trim().toLowerCase();

  if (command === "p") {
    pauseOrResumeSong();
    return;
  }

  playSong(Number(command));
});
