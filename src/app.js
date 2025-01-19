import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

//taking json data from
app.use(
  express.json({
    limit: "32kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "32kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());
export { app };
