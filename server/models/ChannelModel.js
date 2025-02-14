import mongoose from "mongoose";

const channelShcema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    members: [{
        type: mongoose.Schema.ObjectId,
        ref: "Users",
        required: true,
    }],
    admin: {
        type: mongoose.Schema.ObjectId,
        ref: "Users",
        required: true,
    },
    messages: [{
        type: mongoose.Schema.ObjectId,
        ref: "Messages",
        required: false,
    }],
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now(),
    },
});

channelShcema.pre("save", function(next) {
    this.updatedAt = Date.now();
    next();
});

channelShcema.pre("find", function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

const Channel = mongoose.model("Channels", channelShcema);
export default Channel;