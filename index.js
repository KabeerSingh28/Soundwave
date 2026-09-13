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
let currentSongIndex = null;
let isQuitting = false;

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
  console.log("n → Next song");
  console.log("b → Previous song");
  console.log("q → Quit");
}

function stopCurrentSong() {
  if (!playerProcess) {
    return;
  }

  if (isPaused) {
    playerProcess.kill("SIGCONT");
  }

  playerProcess.kill("SIGTERM");
  isPaused = false;
}

function playSong(songNumber) {
  if (!Number.isInteger(songNumber) || songNumber < 1 || songNumber > songs.length) {
    console.log("Please enter a song number from the list.");
    return;
  }

  const song = songs[songNumber - 1];
  const songPath = path.join(songsFolder, song);

  stopCurrentSong();
  currentSongIndex = songNumber - 1;

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

function playNextSong() {
  if (currentSongIndex === null) {
    console.log("Select a song first.");
    return;
  }

  const nextIndex = (currentSongIndex + 1) % songs.length;
  playSong(nextIndex + 1);
}

function playPreviousSong() {
  if (currentSongIndex === null) {
    console.log("Select a song first.");
    return;
  }

  const previousIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  playSong(previousIndex + 1);
}

function quitPlayer() {
  if (isQuitting) {
    return;
  }

  isQuitting = true;
  console.log("Thanks for using Soundwave!");
  input.close();

  if (!playerProcess) {
    process.exit(0);
  }

  const processToStop = playerProcess;
  processToStop.once("exit", () => process.exit(0));
  stopCurrentSong();

  // Do not leave Node open if ffplay does not respond to SIGTERM.
  setTimeout(() => process.exit(0), 1000).unref();
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

  if (command === "n") {
    playNextSong();
    return;
  }

  if (command === "b") {
    playPreviousSong();
    return;
  }

  if (command === "q") {
    quitPlayer();
    return;
  }

  playSong(Number(command));
});

process.on("SIGINT", quitPlayer);
