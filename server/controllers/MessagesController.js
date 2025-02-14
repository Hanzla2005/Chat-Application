import Message from "../models/MessagesModel.js";
import { mkdirSync, renameSync } from "fs";

export const getMessages = async (req, res, next) => {
    try {
        const user1 = req.userId;
        const user2 = req.body.id;

        if (!user1 || !user2) {
            return res.status(400).json({ error: "User1 and User2 is required" });
        }

        const messages = await Message.find({
            $or: [
                { sender: user1, recipient: user2 },
                { sender: user2, recipient: user1 }
            ],
        }).sort({timestamp: 1});

        return res.status(200).json({ messages });

    } catch (error) {
        console.error("Search Contacts Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Corrected file URL
        const fileURL = `/uploads/files/${req.file.filename}`; // Use req.file.filename, not originalname!

        return res.status(200).json({ 
            fileURL: fileURL,
            messageType: "file",
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
