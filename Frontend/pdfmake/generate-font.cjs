const fs = require("fs");
const path = require("path");

function embedFont(fontPath, fontName) {
  const fontData = fs.readFileSync(fontPath).toString("base64");
  return `"${fontName}": "${fontData}"`;
}

const fontsDir = path.join(__dirname, "fonts");

const customFonts = [
  { file: "THSarabunNew.ttf", name: "THSarabunNew" },
  { file: "THSarabunNew Bold.ttf", name: "THSarabunNew-Bold" },
  { file: "THSarabunNew Italic.ttf", name: "THSarabunNew-Italic" },
  { file: "THSarabunNew BoldItalic.ttf", name: "THSarabunNew-BoldItalic" }
];

let fontsData = customFonts
  .map(f => embedFont(path.join(fontsDir, f.file), f.name))
  .join(",\n");

const vfsContent = `var pdfMake = { vfs: {
  ${fontsData}
}};
export default pdfMake;`;

fs.writeFileSync(path.join(__dirname, "vfs_fonts.js"), vfsContent);
console.log("✅ vfs_fonts.js generated successfully!");
