const { spawn } = require("child_process");
const fs = require("fs");

const path = "./songs";

let childProcess = null;

// Get all mp3 files
const songs = fs
  .readdirSync(path)
  .filter((song) => song.endsWith(".mp3"));

console.log("🎶 Welcome to the Songs App 🎶\n");

// Show songs
for (let i = 0; i < songs.length; i++) {
  console.log(`${i + 1}: ${songs[i].split(".")[0]}`);
}

console.log("\n🎵 Select a number to play the song:");
console.log("⏸️ Press p to pause");

process.stdin.setEncoding("utf-8");

process.stdin.on("data", (input) => {
  const userInput = input.trim();

  // Pause song
  if (userInput === "p") {
    pauseSong();
    return;
  }

  // Play song
  player(Number(userInput));
});

function player(userInput) {
  if (userInput < 1 || userInput > songs.length) {
    console.log("❌ Invalid song number");
    return;
  }

  const song = songs[userInput - 1];

  console.log(`🎵 Playing: ${song}`);

  // Stop previous song
  if (childProcess) {
    childProcess.kill();
  }

  // Play song
  childProcess = spawn("ffplay", [
    "-nodisp",
    "-vn",
    "-autoexit",
    "-loglevel",
    "quiet",
    `./songs/${song}`,
  ]);
}

function pauseSong() {
  if (childProcess) {
    childProcess.stdin.write(" ");
    console.log("⏸️ Song paused");
  } else {
    console.log("❌ No song is playing");
  }
  childProcess.kill();
}