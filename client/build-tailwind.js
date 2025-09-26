const tailwindcss = require("tailwindcss");
const fs = require("fs");
const postcss = require("postcss");

// Read input CSS
const inputCSS = fs.readFileSync("./src/styles.css", "utf8");

// Run PostCSS with Tailwind
postcss([tailwindcss, require("autoprefixer")])
  .process(inputCSS, { from: "./src/styles.css", to: "./src/tailwind-output.css" })
  .then(result => {
    fs.writeFileSync("./src/tailwind-output.css", result.css);
    console.log("Tailwind compiled successfully!");
  })
  .catch(err => console.error(err));
