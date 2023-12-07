document.addEventListener("DOMContentLoaded", function () {
    const sketchGallery = document.getElementById("sketch-gallery");
    let autoChangeEnabled = true; // remove auto change if you want
    let changeOnClick = !true; // change on click
    let jsonData;

    function renderImageGrid(sketchIDs) {
        const gridContainer = document.createElement("div");
        gridContainer.id = "sketch-grid";
        gridContainer.style = "display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(15, minmax(0, 1fr)); margin-top: 20px";
        sketchGallery.appendChild(gridContainer);

        const columns = getGridTrackCount(getComputedStyle(gridContainer).gridTemplateColumns);
        const rows = getGridTrackCount(getComputedStyle(gridContainer).gridTemplateRows);

        // Preload images
        const preloadedImages = shuffleArray(sketchIDs).slice(0, columns * rows).map((sketch_id) => {
            const img = new Image();
            img.src = `https://vab-recog.s3.us-west-2.amazonaws.com/vab-production-sketches/${sketch_id}.png`;
            img.style.transition = "opacity .7s ease-in-out"; // Apply transition for fade-in effect
            img.style.opacity = 0; // Set initial opacity to 0
            return img;
        });

        // Change the image source & fade
        function changeImage(img, newSketchId) {
            img.loading = "lazy";
            img.style.opacity = 0; // Set opacity to 0 for fade-out effect

            // Preload the next image
            const preloadImage = new Image();
            preloadImage.onload = function () {
                // Image is fully loaded, now change the source and apply fade-in effect
                setTimeout(() => {
                    img.src = `https://vab-recog.s3.us-west-2.amazonaws.com/vab-production-sketches/${newSketchId}.png`;
                    img.style.opacity = 1; // Set opacity to 1 for fade-in effect
                }, 1000);
            };
            preloadImage.src = `https://vab-recog.s3.us-west-2.amazonaws.com/vab-production-sketches/${newSketchId}.png`;
        }

        // Init auto image change every 7 seconds
        function initializeAutoChange(images, sketchIDs) {
            setInterval(() => {
                if (autoChangeEnabled) {
                    images.forEach((img, index) => {
                        const newSketchId = getRandomSketchId(sketchIDs);
                        changeImage(img, newSketchId);
                    });
                }
            }, 7000);
        }

        preloadedImages.forEach((img, index) => {
            // Add a click event listener to each image
            if (changeOnClick) {
                img.addEventListener("click", function () {
                    const newSketchId = getRandomSketchId(sketchIDs);
                    changeImage(this, newSketchId);
                });

                img.addEventListener("mouseover", function () {
                    this.style.cursor = "pointer";
                });
            }

            // Append the image to the grid
            gridContainer.appendChild(img);
            // Trigger the fade-in effect after a short delay
            setTimeout(() => {
                img.style.opacity = 1;
            }, 20 * index);
        });

        // Start automatic image changes
        initializeAutoChange(preloadedImages, sketchIDs);
    }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function removeBadIDs(sketchIDs) {
        // bad IDs TBD
        let badIDs = ['63cb6590c966b17f84910ff0',
            '63cb29770328517f9fc4443c',
            '63cb65a4c966b17f84910ffe',
            '63cb6250f845c37fbc6fb4b7',
            '63cb64d20328517f9fc449fb',
            '63cb29c40328517f9fc444ed',
            '63cb62abf845c37fbc6fb4e4',
            '63cb29290328517f9fc44361',
            '63cb298a0328517f9fc4446c',
            '63cb6590c966b17f84910ff0',
            '63cb64610328517f9fc449bf',
            '63cb65b2c966b17f84911006',
            '63cb657bc966b17f84910fe2',
            '63cb29290328517f9fc44361',
            '63cb627df845c37fbc6fb4cc',
            '63cb64020328517f9fc449a4',
            '63cb2a250328517f9fc44588',
            '63cb6559c966b17f84910fc6',
            '63cb62b6f845c37fbc6fb4e9',
            '63cb6267f845c37fbc6fb4c1']
        for (let i = 0; i < badIDs.length; i++) {
            sketchIDs.splice(sketchIDs.indexOf(badIDs[i]), 1)
        }
    }

    function searchBar(id, concepts, jsonData) {
        let showRandomConcepts = true; // Flag to determine which set of concepts to show initially

        $(id).autocomplete({
            source: function (req, resp) {
                let results;

                if (showRandomConcepts) {
                    // Show 5 random concepts initially
                    results = getRandomConcepts(concepts, 5);
                } else {
                    let results_1 = $.map(concepts, function (tag) {
                        if (((tag.toUpperCase().indexOf(req.term.toUpperCase()) === 0))) {
                            return tag;
                        }
                    })

                    let results_2 = $.map(concepts, function (tag) {
                        if ((tag.toUpperCase().includes(req.term.toUpperCase())) && !(tag.toUpperCase().indexOf(req.term.toUpperCase()) === 0)) {
                            return tag;
                        }
                    })

                    results = results_1.concat(results_2);
                }

                resp(results);
            },
            minLength: 0,
            select: function (event, ui) {
                autoChangeEnabled = false;
                let sketchIDs;
                let selectedConcept = ui.item.value;
                if (abstraction.value != '') {
                    sketchIDs = extractSketchIDs(jsonData[selectedConcept][abstraction.value]);
                } else {
                    sketchIDs = extractSketchIDs(jsonData[selectedConcept]);
                };
                removeBadIDs(sketchIDs);
                renderImageGrid(sketchIDs);
                removeGrid();
            }
        }).focus(function () {
            // When the input field gains focus, switch to showing full concepts when the user starts typing
            $(this).autocomplete('option', 'minLength', 0);
            showRandomConcepts = true;
            $(this).autocomplete('search', '');
        }).on('input', function () {
            // When the user starts typing, switch to showing the full list of concepts
            showRandomConcepts = false;
            $(this).autocomplete('option', 'minLength', 2);
        });
    }

    // Helper function to get a random subset of concepts
    function getRandomConcepts(concepts, count) {
        let randomConcepts = [];
        while (randomConcepts.length < count) {
            let randomIndex = Math.floor(Math.random() * concepts.length);
            let randomConcept = concepts[randomIndex];
            if (!randomConcepts.includes(randomConcept)) {
                randomConcepts.push(randomConcept);
            }
        }
        return randomConcepts;
    }


    function removeGrid() {
        let sketchGrid = document.getElementById("sketch-grid");
        sketchGrid.remove();
    }

    function extractSketchIDs(json, abstraction = '', filterIDs = false) {
        const resultArray = [];
    
        function recursiveExtract(obj, currentAbstraction, filter = false) {
            for (const key in obj) {
                if (['4000', '8000', '16000', '32000'].includes(key) && filterIDs) {
                    if (key != String(currentAbstraction)) {
                        continue;
                    }
                }
    
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    recursiveExtract(obj[key], currentAbstraction);
                } else {
                    resultArray.push(obj[key]);
                }
            }
        }
    
        recursiveExtract(json, abstraction, filterIDs);
        return resultArray;
    }
    

    // Function to fetch and read the JSON file containing a list of sketch ids
    async function fetchAndReadJsonFile(filePath) {
        try {
            const response = await fetch(filePath);
            jsonData = await response.json();
            let sketchIDs = extractSketchIDs(jsonData);
            removeBadIDs(sketchIDs);
            renderImageGrid(sketchIDs);
            return jsonData;
        } catch (error) {
            console.error("Error reading the JSON file:", error);
        }
    }

    // Function to get a random sketch id
    function getRandomSketchId(sketchIDs) {
        const randomIndex = Math.floor(Math.random() * sketchIDs.length);
        return sketchIDs[randomIndex];
    }

    // Function to get the count of grid tracks from the grid template style
    function getGridTrackCount(gridTemplateStyle) {
        return gridTemplateStyle.split(" ").length;
    }

    // Fetch and read the JSON file
    fetchAndReadJsonFile("./static/sketch_ids.json").then((data) => {

        searchBar('#search-concept', Object.keys(jsonData), jsonData);

        let abstraction = document.getElementById('abstraction');
        let concept = document.getElementById('search-concept');

        abstraction.addEventListener('change', function () {
            let sketchIDs;
            let selectedConcept = concept.value;
            autoChangeEnabled = false;
            if (Object.keys(jsonData).includes(selectedConcept) && abstraction.value != '') {
                sketchIDs = extractSketchIDs(jsonData[selectedConcept][abstraction.value]);
            } else if (selectedConcept === '') {
                sketchIDs = extractSketchIDs(jsonData, abstraction.value, true);
            } else {
                sketchIDs = extractSketchIDs(jsonData[selectedConcept]);
            };
            removeGrid();
            removeBadIDs(sketchIDs);
            renderImageGrid(sketchIDs);
        });
    });
});