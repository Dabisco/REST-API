import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
// import liveReload from "livereload";
// import connectLiveReload from "connect-livereload";
import axios from "axios";

dotenv.config();

const app = express();

const port = 3005;

const API_URL = "https://secrets-api.appbrewery.com/";
const bearerToken = "482f2bd5-3f04-4df5-a2fd-3de0cfc9d9d7";
const bearer_Config = {
  headers: {
    Authorization: `Bearer ${bearerToken}`,
  },
};

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

function errorHandler(error) {
  let errorText;

  if (error.response) {
    if (error.response.status === 404) {
      errorText = `Secret not found: It appears that there is no such secret!`;
      console.log(errorText);
    } else {
      errorText = `Failed to fetch secret from server: ${error.message}`;
      console.log(errorText);
    }
  } else if (error.request) {
    errorText = `Failed to send request: ${error.message}`;
    console.log(errorText);
  } else {
    errorText = `Request failed due to request config!`;
    console.log(errorText);
    console.log(error);
  }

  return errorText;
}

//middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/get-secret", async (req, res) => {
  const secretId = req.query.id;
  try {
    const response = await axios.get(`${API_URL}secrets/${secretId}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const secret = JSON.stringify(response.data);
    res.render("index.ejs", { secret });
  } catch (error) {
    const error_Message = errorHandler(error);
    res.render("index.ejs", { error_Message });
  }
});

app.post("/create-secret", async (req, res) => {
  const secret = req.body.secret;
  const score = req.body.score;
  const body = { secret: secret, score: score };

  try {
    const response = await axios.post(`${API_URL}secrets`, body, bearer_Config);
    const notification = JSON.stringify(response.data);
    res.render("index.ejs", { notification });
  } catch (error) {
    const error_Message = errorHandler(error);
    res.render("index.ejs", { error_Message });
  }
});

app.post("/change-secret", (req, res) => {
  const id = req.body.id;
  const secret = req.body.secret;
  const score = req.body.score;
  const body = { secret: secret, score: score };

  axios
    .put(`${API_URL}secrets/${id}`, body, bearer_Config)
    .then((response) => {
      const notification = JSON.stringify(response.data);
      res.render("index.ejs", { notification });
    })
    .catch((error) => {
      const error_Message = errorHandler(error);
      res.render("index.ejs", { error_Message });
    });
});

app.post("/modify-secret", (req, res) => {
  let body = {};
  const id = req.body.id;

  //Check for empty input form fields
  for (let key in req.body) {
    //exclude id
    if (key !== "" && key !== "id") {
      body[key] = req.body[key];
    }
  }

  axios
    .patch(`${API_URL}secrets/${id}`, body, bearer_Config)
    .then((response) => {
      const notification = JSON.stringify(response.data);
      res.render("index.ejs", { notification });
    })
    .catch((error) => {
      const error_Message = errorHandler(error);
      res.render("index.ejs", { error_Message });
    });
});

app.post("/delete-secret", (req, res) => {
  const id = req.body.id;

  axios
    .delete(`${API_URL}secrets/${id}`, bearer_Config)
    .then((response) => {
      const notification = JSON.stringify(response.data);
      res.render("index.ejs", { notification });
    })
    .catch((error) => {
      const error_Message = errorHandler(error);
      res.render("index.ejs", { error_Message });
    });
});

app.listen(port, () => {
  console.log("Server running on port ", port);
});
