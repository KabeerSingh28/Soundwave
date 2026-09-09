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

process.stdin.setEncoding("utf-8");

process.stdin.on("data", (input) => {
  const userInput = Number(input.trim());

  player(userInput);
});

function player(userInput) {
  // Check song number
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

  // Play song using ffplay
  childProcess = spawn("ffplay", [
    "-nodisp",
    "-autoexit",
    `./songs/${song}`,
  ]);
}