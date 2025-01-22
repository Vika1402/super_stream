import mongoose from "mongoose";

const subscriptionModel = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, //one whi os sbubscriing
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, //one to whome sunscriber who sbscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionModel);
