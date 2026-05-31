import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "voice", "file"], default: "text" },
    // Text body — required only for text messages (enforced in pre-validate).
    content: { type: String, trim: true },
    // Voice payload — populated only for voice messages.
    audio: {
      url: String,
      publicId: String,
      duration: Number, // seconds
      mimeType: String,
      sizeBytes: Number
    },
    // File attachment — populated only for file messages.
    file: {
      url: String,
      publicId: String,
      name: String,
      mimeType: String,
      sizeBytes: Number
    },
    readAt: Date
  },
  { timestamps: true }
);

// A message must carry the payload appropriate to its type.
messageSchema.pre("validate", function ensurePayload(next) {
  if (this.type === "voice") {
    if (!this.audio?.url) return next(new Error("Voice message requires an audio clip"));
  } else if (this.type === "file") {
    if (!this.file?.url) return next(new Error("File message requires an attachment"));
  } else if (!this.content || !this.content.trim()) {
    return next(new Error("Message content is required"));
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
