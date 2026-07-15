import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const css = (await readFile(resolve(root, "dist/assets/app.css"), "utf8")).replaceAll("</style", "<\\/style");
const js = (await readFile(resolve(root, "dist/assets/main.js"), "utf8")).replaceAll("</script", "<\\/script");

await mkdir(resolve(root, "pages"), { recursive: true });
await cp(resolve(root, "dist/assets"), resolve(root, "pages/assets"), { recursive: true, force: true });
await writeFile(resolve(root, "pages/.nojekyll"), "");
await writeFile(
  resolve(root, "pages/index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="icon"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%2303244d'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' font-family='Arial' font-weight='700' fill='%23dd550c'%3EAU%3C/text%3E%3C/svg%3E"
    />
    <title>Auburn Engineering | Room Reservations</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${js}</script>
  </body>
</html>
`,
);
