const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["Farmer", "Distributor", "Retailer", "Consumer", "Created", "Processing", "Completed"],
      default: "Farmer",
    },
    blockchainId: {
      type: Number,
      default: null,
    },
    txHash: {
      type: String,
      trim: true,
      default: "",
    },
    farmerName: {
      type: String,
      trim: true,
      default: "",
    },
    originLocation: {
      type: String,
      trim: true,
      default: "",
    },
    transactionHashes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Product", productSchema);
