const fs = require("fs");
const path = require("path");
const os = require("os");
const net = require("net");
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
let playerSocket = null;

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

  playerProcess.kill("SIGTERM");
  isPaused = false;
}

function sendMpvCommand(command, onSuccess, attemptsLeft = 10) {
  if (!playerSocket) {
    console.log("No song is playing.");
    return;
  }

  const socket = net.createConnection(playerSocket);
  let finished = false;

  socket.on("connect", () => {
    socket.write(`${JSON.stringify({ command })}\n`);
  });

  socket.on("data", (data) => {
    if (finished) {
      return;
    }

    const response = JSON.parse(data.toString());
    finished = true;
    socket.end();

    if (response.error === "success") {
      onSuccess();
    } else {
      console.log("Could not control mpv.");
    }
  });

  socket.on("error", () => {
    if (finished) {
      return;
    }

    finished = true;
    socket.destroy();

    if (attemptsLeft > 0) {
      setTimeout(() => sendMpvCommand(command, onSuccess, attemptsLeft - 1), 100);
    } else {
      console.log("Could not connect to mpv.");
    }
  });
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
  playerSocket = path.join(os.tmpdir(), `soundwave-mpv-${process.pid}-${Date.now()}.sock`);

  if (fs.existsSync(playerSocket)) {
    fs.unlinkSync(playerSocket);
  }

  console.log(`🎵 Playing: ${path.parse(song).name}`);

  playerProcess = spawn(
    "mpv",
    ["--no-video", "--really-quiet", "--no-terminal", `--input-ipc-server=${playerSocket}`, songPath],
    { stdio: ["ignore", "inherit", "inherit"] }
  );

  playerProcess.on("error", () => {
    console.log("Could not start mpv. Install it with: brew install mpv");
    playerProcess = null;
    playerSocket = null;
  });

  const startedProcess = playerProcess;
  const startedSocket = playerSocket;

  startedProcess.on("exit", () => {
    if (playerProcess === startedProcess) {
      playerProcess = null;
      isPaused = false;
      playerSocket = null;
    }

    if (fs.existsSync(startedSocket)) {
      fs.unlinkSync(startedSocket);
    }
  });
}

function pauseOrResumeSong() {
  if (!playerProcess) {
    console.log("No song is playing.");
    return;
  }

  sendMpvCommand(["cycle", "pause"], () => {
    isPaused = !isPaused;
    console.log(isPaused ? "⏸️ Song paused" : "▶️ Song resumed");
  });
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
