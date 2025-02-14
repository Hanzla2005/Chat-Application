import User from "../models/UserModel.js"; // Correct User model import
import mongoose from "mongoose";
import Message from "../models/MessagesModel.js";

export const searchContacts = async (req, res, next) => {
    try {
        const { searchTerm } = req.body;

        if (!searchTerm.trim()) {
            return res.status(400).json({ error: "Please provide a search term" });
        }

        // Split search term into words (e.g., "John Doe" -> ["John", "Doe"])
        const searchWords = searchTerm.trim().split(/\s+/);

        // Create regex for each word (escaping special characters)
        const regexArray = searchWords.map(word => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i"));

        // Find contacts, excluding the current user
        const contacts = await User.find({
            _id: { $ne: req.userId },
            $or: [
                { firstName: { $in: regexArray } },
                { lastName: { $in: regexArray } },
                { email: { $in: regexArray } }
            ],
        });

        return res.status(200).json({ contacts });

    } catch (error) {
        console.error("Search Contacts Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


export const getContactsForDMList = async (req, res, next) => {
    try {
        let { userId } = req;
        userId = new mongoose.Types.ObjectId(userId);

        const contacts = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { recipient: userId },
                    ],
                },
            },
            {
                $sort: { timestamp: -1 },
            },
            {
                $group: {
                    _id:{
                        $cond: {
                            if:{ $eq: ["$sender", userId] },
                            then: "$recipient",
                            else: "$sender",
                        },
                    },
                    lastMessageTime: { $first: "$timestamp" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "contactInfo",
                },
            },
            {
                $unwind: "$contactInfo",
            },
            {
                $project: {
                    _id: 1,
                    lastMessageTime: 1,
                    email: "$contactInfo.email",
                    firstName: "$contactInfo.firstName",
                    lastName: "$contactInfo.lastName",
                    image: "$contactInfo.image",
                    color: "$contactInfo.color",
                },
            },
            {
                $sort: { lastMessageTime: -1 },
            }
        ]);


        return res.status(200).json({ contacts });

    } catch (error) {
        console.error("Search Contacts Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


export const getAllContacts = async (req, res, next) => {
    try {
        const users = await User.find({_id: {$ne: req.userId}},
            "firstName lastName _id email"
        );

        const contacts = users.map((user) => ({
            label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
            value: user._id,
        }));

        // Return contacts
        return res.status(200).json({ contacts });

    } catch (error) {
        console.error("Search Contacts Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};