import { copyFile, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const copy = async (src, dest) => {
  await mkdir(resolve(root, dest, ".."), { recursive: true });
  await copyFile(resolve(root, src), resolve(root, dest));
};
await copy(
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "public/vendor/pdf.worker.min.mjs",
);
await copy(
  "node_modules/tesseract.js/dist/worker.min.js",
  "public/vendor/tesseract/worker.min.js",
);
for (const name of await readdir(
  resolve(root, "node_modules/tesseract.js-core"),
))
  if (/\.(wasm|js)$/.test(name))
    await copy(
      `node_modules/tesseract.js-core/${name}`,
      `public/vendor/tesseract-core/${name}`,
    );
for (const lang of ["ces", "eng"])
  await copy(
    `node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,
    `public/vendor/tessdata/${lang}.traineddata.gz`,
  );
await copy(
  "node_modules/tesseract.js-core/LICENSE",
  "public/vendor/tesseract-core/LICENSE",
);
await copy("node_modules/pdfjs-dist/LICENSE", "public/vendor/pdfjs-LICENSE");
await copy(
  "node_modules/tesseract.js/LICENSE.md",
  "public/vendor/tesseract-LICENSE.md",
);
console.log("PDF a OCR jsou připravené pro místní zpracování, bez CDN.");
