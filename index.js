const fs = require("fs");
const { spawn } = require("node:child_process");

// ==============================
// MILESTONE 1: READ SONGS
// ==============================

const songsPath = "./songs";

const songs = fs
    .readdirSync(songsPath)
    .filter((file) => file.endsWith(".mp3"));

if (songs.length === 0) {
    console.log("No MP3 files found in the songs folder.");
    process.exit(0);
}


// ==============================
// MILESTONE 3: STATE
// ==============================

let selectedIndex = 0;


// ==============================
// MILESTONE 4 & 5: PLAYER STATE
// ==============================

let currentProcess = null;
let isPaused = false;


// ==============================
// DISPLAY PLAYLIST
// ==============================

function displaySongs() {

    process.stdout.write("\x1b[2J");
    process.stdout.write("\x1b[H");

    console.log("🎵 TERMINAL MUSIC PLAYER\n");

    for (let i = 0; i < songs.length; i++) {

        if (i === selectedIndex) {
            console.log(`▶ ${songs[i].replace(".mp3", "")}`);
        } else {
            console.log(`  ${songs[i].replace(".mp3", "")}`);
        }
    }

    console.log("\n↑ ↓ Navigate");
    console.log("ENTER Play");
    console.log("SPACE Pause/Resume");
    console.log("N Next");
    console.log("P Previous");
    console.log("S Stop");
    console.log("Q Quit");
}


// ==============================
// MILESTONE 4: PLAY SONG
// ==============================

function playSong() {

    // Stop currently playing song
    if (currentProcess) {
        currentProcess.kill("SIGTERM");
    }

    const songPath = `${songsPath}/${songs[selectedIndex]}`;

    currentProcess = spawn("afplay", [songPath]);

    isPaused = false;

    console.log(`\n▶ Now Playing: ${songs[selectedIndex].replace(".mp3", "")}`);

    currentProcess.on("close", () => {
        currentProcess = null;
        isPaused = false;
    });
}


// ==============================
// INITIAL DISPLAY
// ==============================

displaySongs();


// ==============================
// MILESTONE 2: KEYBOARD INPUT
// ==============================

process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");

process.stdin.on("data", (key) => {


    // ==========================
    // MILESTONE 3: MOVE UP
    // ==========================

    if (key === "\x1b[A") {

        if (selectedIndex > 0) {
            selectedIndex--;
            displaySongs();
        }
    }


    // ==========================
    // MILESTONE 3: MOVE DOWN
    // ==========================

    if (key === "\x1b[B") {

        if (selectedIndex < songs.length - 1) {
            selectedIndex++;
            displaySongs();
        }
    }


    // ==========================
    // MILESTONE 4: ENTER
    // ==========================

    if (key === "\r") {
        playSong();
    }


    // ==========================
    // MILESTONE 5: PAUSE / RESUME
    // ==========================

    if (key === " ") {

        if (currentProcess) {

            if (isPaused === false) {
                currentProcess.kill("SIGSTOP");
                isPaused = true;
            } else {
                currentProcess.kill("SIGCONT");
                isPaused = false;
            }

        }
    }


    // ==========================
    // MILESTONE 5: STOP
    // ==========================

    if (key === "s") {

        if (currentProcess) {
            currentProcess.kill("SIGTERM");
            currentProcess = null;
            isPaused = false;
        }
    }


    // ==========================
    // MILESTONE 6: NEXT
    // ==========================

    if (key === "n") {

        if (selectedIndex < songs.length - 1) {

            selectedIndex++;

            displaySongs();

            playSong();
        }
    }


    // ==========================
    // MILESTONE 6: PREVIOUS
    // ==========================

    if (key === "p") {

        if (selectedIndex > 0) {

            selectedIndex--;

            displaySongs();

            playSong();
        }
    }


    // ==========================
    // QUIT
    // ==========================

    if (key === "q") {

        if (currentProcess) {
            currentProcess.kill("SIGTERM");
        }

        process.exit(0);
    }
});