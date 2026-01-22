const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "docs/api");
const swaggerDistDir = path.join(rootDir, "node_modules", "swagger-ui-dist");
const specPath = path.join(rootDir, "openapi.yaml");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copySwaggerDist() {
  if (!fs.existsSync(swaggerDistDir)) {
    throw new Error("swagger-ui-dist is not installed. Run npm install.");
  }
  fs.cpSync(swaggerDistDir, outputDir, { recursive: true });
}

function copySpec() {
  if (!fs.existsSync(specPath)) {
    throw new Error("openapi.yaml not found in project root.");
  }
  fs.copyFileSync(specPath, path.join(outputDir, "openapi.yaml"));
}

function writeIndexHtml() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Docs</title>
    <link rel="stylesheet" href="./swagger-ui.css" />
    <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
    <style>
      body { margin: 0; background: #f9fafb; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="./swagger-ui-bundle.js"></script>
    <script src="./swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "./openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "BaseLayout"
        });
      };
    </script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
}

ensureDir(outputDir);
copySwaggerDist();
copySpec();
writeIndexHtml();

// eslint-disable-next-line no-console
console.log(`Swagger UI built at ${outputDir}`);
