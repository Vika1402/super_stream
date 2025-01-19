import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const conectDB = async () => {
  try {
    const connectionInnstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB Connnected !! DB HOST: ${connectionInnstance.connection.host}`
    );
  } catch (error) {
    console.log("Mongodb Connection Error", error);
    process.exit(1);
  }
};
export default conectDB;
