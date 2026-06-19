const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");
const QRCode = require("qrcode");

const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "config.json");

function readConfig() {
  const fallback = { port: 8787, host: "0.0.0.0", autoOpen: true };
  try {
    return { ...fallback, ...JSON.parse(fs.readFileSync(configPath, "utf8")) };
  } catch (error) {
    console.warn("Could not read config.json, using defaults.");
    return fallback;
  }
}

const config = readConfig();
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function localOpenHost() {
  return config.host === "0.0.0.0" || config.host === "::" ? "127.0.0.1" : config.host;
}

function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}

function accessInfo() {
  const localUrl = `http://${localOpenHost()}:${config.port}/`;
  const lanUrls = getLanAddresses().map((address) => `http://${address}:${config.port}/`);
  return {
    localUrl,
    mobileUrl: lanUrls[0] || localUrl,
    lanUrls,
    host: config.host,
    port: config.port
  };
}

function resolveRequestPath(url) {
  const parsed = new URL(url, `http://${config.host}:${config.port}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const target = path.resolve(root, relative);
  if (!target.startsWith(root)) return null;
  return target;
}

const server = http.createServer((req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    send(res, 405, "Method not allowed");
    return;
  }

  const parsedUrl = new URL(req.url, `http://${localOpenHost()}:${config.port}`);

  if (parsedUrl.pathname === "/connection.json") {
    send(res, 200, JSON.stringify(accessInfo(), null, 2), "application/json; charset=utf-8");
    return;
  }

  if (parsedUrl.pathname === "/qr.svg") {
    QRCode.toString(accessInfo().mobileUrl, {
      type: "svg",
      margin: 1,
      width: 220,
      color: {
        dark: "#04101a",
        light: "#ffffff"
      }
    }, (error, svg) => {
      if (error) {
        send(res, 500, "Could not generate QR code");
        return;
      }
      send(res, 200, svg, "image/svg+xml; charset=utf-8");
    });
    return;
  }

  const target = resolveRequestPath(req.url);
  if (!target) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(target, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(res, 404, "Not found");
      return;
    }

    const type = mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store"
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    fs.createReadStream(target).pipe(res);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use. Edit config.json and choose another port.`);
  } else {
    console.error(error.message);
  }
  process.exit(1);
});

server.listen(config.port, config.host, () => {
  const info = accessInfo();
  console.log("");
  console.log("Prayer Portal is running.");
  console.log(`Desktop: ${info.localUrl}`);
  if (info.lanUrls.length) {
    console.log(`Mobile:  ${info.mobileUrl}`);
  } else {
    console.log("Mobile:  No LAN address detected. Keep using the desktop URL.");
  }
  console.log("");
  console.log("Press Ctrl+C to stop the server.");

  if (config.autoOpen) {
    const command = process.platform === "win32"
      ? `start "" "${info.localUrl}"`
      : process.platform === "darwin"
        ? `open "${info.localUrl}"`
        : `xdg-open "${info.localUrl}"`;
    exec(command);
  }
});
