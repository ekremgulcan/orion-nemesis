/**
 * template.html icindeki {{IMG_*}} placeholder'larini assets/ altindaki
 * PNG'lerin base64 data URI'leriyle degistirip index.html'i uretir.
 * Tek dosya, tasinabilir sunum (calisma zamaninda internet/relative
 * path gerektirmez, fontlar icin Google Fonts CDN'ine dusebilir).
 *
 * Kullanim: node build.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const ASSETS_DIR = path.join(__dirname, "assets");
const TEMPLATE_PATH = path.join(__dirname, "template.html");
const OUTPUT_PATH = path.join(__dirname, "index.html");

function toDataUri(fileName) {
  const filePath = path.join(ASSETS_DIR, fileName);
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

const replacements = {
  "{{IMG_ZK}}": toDataUri("zk-teminat-islemleri.png"),
  "{{IMG_REACT}}": toDataUri("react-teminat-islemleri.png"),
  "{{IMG_PASS}}": toDataUri("rapor-pass-ornegi.png"),
  "{{IMG_FAIL}}": toDataUri("rapor-fail-ornegi.png"),
};

let html = fs.readFileSync(TEMPLATE_PATH, "utf8");
for (const [token, dataUri] of Object.entries(replacements)) {
  html = html.split(token).join(dataUri);
}

fs.writeFileSync(OUTPUT_PATH, html, "utf8");
console.log("Sunum uretildi:", OUTPUT_PATH);
