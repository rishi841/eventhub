const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        college: {
            type: String,
            required: true,
            trim: true,
        },
        year: {
            type: String,
            required: true,
            enum: ["1st", "2nd", "3rd", "4th"],
        },
        reason: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

registrationSchema.index({ event: 1, user: 1 }, { unique: true });  

module.exports = mongoose.model("Registration", registrationSchema);