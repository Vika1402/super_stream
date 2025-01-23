import mongoose from "mongoose";

const subscriptionModel = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, //like yt subscriber who use yt 
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, //most time we subscribe yt channel similer 
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionModel);
