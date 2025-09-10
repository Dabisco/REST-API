import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import liveReload from "livereload";
import connectLiveReload from "connect-livereload";

dotenv.config();

const app = express();

const port = 3005;

const __filePath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filePath);

//setup livereload in non-production environment
if (process.env.NODE_ENV === "development") {
  const liveReloadServer = liveReload.createServer({
    exts: ["ejs", "js", "css"],
    liveCSS: true,
  });

  liveReloadServer.watch(path.join(__dirname, "views"));
  liveReloadServer.watch(path.join(__dirname, "public"));

  liveReloadServer.server.once("connection", () => {
    console.log("Livereload connected...");
  });

  //Inject livereload before routes and static files
  app.use(connectLiveReload());

  console.log("Livereload is now watching 'views' and 'public' ");

  //Disable caching in development
  app.use((req, res, next) => {
    res.set("cache-control", "no-store");
    next();
  });
}
//middleware
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.listen(port, () => {
  console.log("Server running on port ", port);
});
