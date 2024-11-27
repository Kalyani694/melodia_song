let currentSongs = new Audio();
let songs;
let currentFolder;
document.addEventListener("DOMContentLoaded", () => {
    

    function secondsToMinutesSeconds(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return "00:00";
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    async function getSongs(folder) {
        currentFolder=folder;
        let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (const element of as) {
            if (element.href.endsWith("mp3")) {
                songs.push(element.href.split(`/${folder}`)[1]);
            }
        }
        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML= ""
        for (const song of songs) {
            songUL.innerHTML += `
                <li>
                    <i class="fa-solid fa-music"></i>
                    <div class="info">${song.replaceAll("%20", " ")}</div>
                    <i class="fa-solid fa-play"></i>
                </li>`;
        }

        Array.from(songUL.getElementsByTagName("li")).forEach((e, index) => {
            e.addEventListener("click", () => {
                playMusic(songs[index]);
            });
        });
        return songs;
    }

    const playMusic = (track, pause = false) => {
        currentSongs.src = `/${currentFolder}/` + track;
        if (!pause) {
            currentSongs.play();
        }
        document.querySelector(".songinfo").innerHTML = track;
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    };
    
    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.querySelector(".searchbox input");
    
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const songItems = document.querySelectorAll(".songlist ul li");
    
            songItems.forEach((item) => {
                const songTitle = item.querySelector(".info").textContent.toLowerCase();
                if (songTitle.includes(query)) {
                    item.style.display = ""; // Show matching songs
                } else {
                    item.style.display = "none"; // Hide non-matching songs
                }
            });
        });
    });
    
    async function displayAlbum() {
        // Fetch the HTML of the songs directory
        let response = await fetch("http://127.0.0.1:5500/songs/");
        let html = await response.text();
        let div = document.createElement("div");
    
        div.innerHTML = html;
        let cardContainer = document.querySelector(".cardContainer");
    
        // Get all anchor elements from the HTML
        let anchors = div.getElementsByTagName("a");
    
        // Collect promises for creating cards
        let cardPromises = Array.from(anchors).map(async (anchor) => {
            // Extract the folder name from the anchor href
            if (anchor.href.includes("/songs/") && !anchor.href.endsWith(".json")) {
                let folder = new URL(anchor.href).pathname.split("/").filter(Boolean).pop();
    
                // Construct the URL for info.json
                let infoJsonUrl = `http://127.0.0.1:5500/songs/${folder}/info.json`;
    
                console.log(`Fetching: ${infoJsonUrl}`); // Debugging log
    
                try {
                    // Fetch the info.json file
                    let infoResponse = await fetch(infoJsonUrl);
    
                    if (!infoResponse.ok) {
                        console.error(`Error fetching ${infoJsonUrl}: ${infoResponse.statusText}`);
                        return;
                    }
    
                    // Parse the JSON response
                    let response = await infoResponse.json();
                    console.log(response); // Debugging log
    
                    // Add the card to the container
                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <i class="fa-solid fa-play"></i>
                            </div>
                            <img src="/songs/${folder}/cover.jfif" alt="">
                            <h2>${response.title}</h2>
                            <p>${response.description}</p>
                        </div>`;
                } catch (error) {
                    console.error("Error fetching or parsing info.json:", error);
                }
            }
        });
    
        // Wait for all cards to be created
        await Promise.all(cardPromises);
    
        // Add event listeners to the cards after they are added to the DOM
        Array.from(document.getElementsByClassName("card")).forEach((card) => {
            card.addEventListener("click", async (event) => {
                let folder = event.currentTarget.dataset.folder;
                console.log(`Card clicked! Folder: ${folder}`);
                let songs = await getSongs(`songs/${folder}`);
                console.log(songs);
            });
        });
    }
    
  
    
    // Example c
    

    async function main() {
        await getSongs("songs/moody");
        playMusic(songs[0], true);
        await displayAlbum()
       //display album

        const playButton = document.getElementById("play");
        playButton.addEventListener("click", () => {
            if (currentSongs.paused) {
                currentSongs.play();
                playButton.classList.replace("fa-circle-play", "fa-circle-pause");
            } else {
                currentSongs.pause();
                playButton.classList.replace("fa-circle-pause", "fa-circle-play");
            }
        });

        currentSongs.addEventListener("timeupdate", () => {
            if (!isNaN(currentSongs.duration) && currentSongs.duration > 0) {
                document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSongs.currentTime)} / ${secondsToMinutesSeconds(currentSongs.duration)}`;
                document.querySelector(".circle").style.left = (currentSongs.currentTime / currentSongs.duration) * 100 + "%";
            }
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSongs.currentTime = (currentSongs.duration * percent) / 100;
        });
        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0"
        })
    
        // Add an event listener for close button
        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%"
        })
        previous.addEventListener("click",()=>{
            console.log("previous clicked")
            let index = songs.indexOf(currentSongs.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
        })
        next.addEventListener("click",()=>{
            console.log("next clicked")
            let index = songs.indexOf(currentSongs.src.split("/").slice(-1)[0])
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1])
            }
        })
    
    }
    document.querySelector(".range input").addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSongs.volume = parseInt(e.target.value) / 100;
    
        const volumeIcon = document.querySelector(".volume>i");
        if (currentSongs.volume > 0) {
            volumeIcon.classList.remove("fa-volume-xmark");
            volumeIcon.classList.add("fa-volume-high");
        } else {
            volumeIcon.classList.remove("fa-volume-high");
            volumeIcon.classList.add("fa-volume-xmark");
        }
    });
    
    // Add event listener to mute the track
    document.querySelector(".volume>i").addEventListener("click", (e) => {
        const volumeIcon = e.target;
        const volumeRange = document.querySelector(".range input");
    
        if (volumeIcon.classList.contains("fa-volume-high")) {
            volumeIcon.classList.remove("fa-volume-high");
            volumeIcon.classList.add("fa-volume-xmark");
            currentSongs.volume = 0;
            volumeRange.value = 0;
        } else {
            volumeIcon.classList.remove("fa-volume-xmark");
            volumeIcon.classList.add("fa-volume-high");
            currentSongs.volume = 0.10;
            volumeRange.value = 10;
        }
    });

  
    main(); 
   


});