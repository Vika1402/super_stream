import { app } from "./app.js";
import conectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./env" });


conectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("Server is running on port", process.env.PORT);
    });
    app.on("error", (error) => {
      console.log("Error:", error);
      throw error;
    });
  })
  .catch((err) => {
    console.log("MONGODB CONNECT FAILED", err);
  });

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERROR", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`pApp is running on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// })();
