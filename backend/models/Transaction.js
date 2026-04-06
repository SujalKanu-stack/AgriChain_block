const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["created", "updated", "price_updated", "sold"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    snapshot: {
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
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        if (ret.batchId && typeof ret.batchId === "object" && ret.batchId._id) {
          ret.batch = {
            id: ret.batchId._id.toString(),
            name: ret.batchId.name,
            quantity: ret.batchId.quantity,
            price: ret.batchId.price,
            status: ret.batchId.status,
          };
          ret.batchId = ret.batch.id;
        } else if (ret.batchId) {
          ret.batchId = ret.batchId.toString();
        }
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

module.exports = mongoose.model("Transaction", transactionSchema);
