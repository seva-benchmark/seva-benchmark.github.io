document.addEventListener("DOMContentLoaded", function () {
    const sketchGallery = document.getElementById("sketch-gallery");
    let autoChangeEnabled = true; // remove auto change if you want
  
    function renderImageGrid(sketch_ids) {
      const gridContainer = document.createElement("div");
      gridContainer.className = "sketch-grid";
      sketchGallery.appendChild(gridContainer);
  
      const columns = getGridTrackCount(getComputedStyle(gridContainer).gridTemplateColumns);
      const rows = getGridTrackCount(getComputedStyle(gridContainer).gridTemplateRows);
  
      // Preload images
      const preloadedImages = sketch_ids.slice(0, columns * rows).map((sketch_id) => {
        const img = new Image();
        img.src = `https://vab-recog.s3.us-west-2.amazonaws.com/vab-production-sketches/${sketch_id}.png`;
        return img;
      });
  
      // Change the image source & fade
      function changeImage(img, newSketchId) {
        // Apply fade out effect
        img.style.transition = "opacity .7s ease-in-out";
        img.style.opacity = 0;
  
        // Preload the next image
        const preloadImage = new Image();
        preloadImage.onload = function () {
          // Image is fully loaded, now change the source and apply fade in effect
          setTimeout(() => {
            img.src = `https://vab-recog.s3.us-west-2.amazonaws.com/vab-production-sketches/${newSketchId}.png`;
            // Reset transition and apply fade in effect
            img.style.transition = "opacity .7s ease-in-out";
            img.style.opacity = 1;
          }, 1000);
        };
        preloadImage.src = `https://vab-recog.s3.us-west-2.amazonaws.com/vab-production-sketches/${newSketchId}.png`;
      }
  
      // Init auto image change every 7 seconds
      function initializeAutoChange(images, sketch_ids) {
        setInterval(() => {
          if (autoChangeEnabled) {
            images.forEach((img, index) => {
              const newSketchId = getRandomSketchId(sketch_ids);
              changeImage(img, newSketchId);
            });
          }
        }, 7000);
      }
  
      preloadedImages.forEach((img, index) => {
        // Add a click event listener to each image
        img.addEventListener("click", function () {
          const newSketchId = getRandomSketchId(sketch_ids);
          changeImage(this, newSketchId);
        });
  
        img.addEventListener("mouseover", function () {
          this.style.cursor = "pointer";
        });
  
        // Append the image to the grid
        gridContainer.appendChild(img);
      });
  
      // Start automatic image changes
      initializeAutoChange(preloadedImages, sketch_ids);
    }
  
    // Function to fetch and read the JSON file containing a list of sketch ids
    async function fetchAndReadJsonFile(filePath) {
      try {
        const response = await fetch(filePath);
        const jsonData = await response.json();
  
        renderImageGrid(jsonData);
      } catch (error) {
        console.error("Error reading the JSON file:", error);
      }
    }
  
    // Function to get a random sketch id
    function getRandomSketchId(sketch_ids) {
      const randomIndex = Math.floor(Math.random() * sketch_ids.length);
      return sketch_ids[randomIndex];
    }
  
    // Function to get the count of grid tracks from the grid template style
    function getGridTrackCount(gridTemplateStyle) {
      return gridTemplateStyle.split(" ").length;
    }
  
    // Fetch and read the JSON file
    fetchAndReadJsonFile("./static/sketch_ids.json");
  });  