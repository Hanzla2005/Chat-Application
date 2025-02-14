import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Channel from "./models/ChannelModel.js";

const setupSocket = (server) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET", "POST"],
            credentials: true, // Correct property name
        },
    });

    const userSocketMap = new Map();

    const disconnect = (socket) => {
        console.log(`Client disconnected: ${socket.id}`);
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                // console.log(`User disconnected: ${userId}`);
                break;
            }
        }
    };

    const sendMessage = async (message) => {
        console.log("sendMessage called");
        if (!message.messageType) {
            throw new Error("Message type is required");
        }

        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        // Create the message in the database
        const createdMessage = await Message.create(message);

        // Fetch the created message with populated sender and recipient data
        const messageData = await Message.findById(createdMessage._id)
            .populate("sender", "id email firstName lastName image color")
            .populate("recipient", "id email firstName lastName image color");

        // Emit the message to the recipient if they are connected
        if (recipientSocketId) {
            // console.log("This is wokring receiver");
            io.to(recipientSocketId).emit("receiveMessage", messageData);
        }

        // Emit the message to the sender if they are connected
        if (senderSocketId) {
            // console.log("This is wokring sender");
            io.to(senderSocketId).emit("receiveMessage", messageData);
        }
        // console.log("Message sent successfully", messageData);
    };

    const sendChannelMessage = async (message) => {
        // console.log("sendChannelMessage called with:", message);
    
        const { channelId, sender, content, messageType, fileURL } = message;
    
        // Validate message data
        if (!channelId || !sender || !messageType) {
            console.error("Missing required fields:", { channelId, sender, messageType });
            return;
        }
    
        try {
            // Create the message in the database
            const createdMessage = await Message.create({
                sender,
                recipient: null,
                content,
                messageType,
                timestamp: new Date(),
                fileURL: fileURL
            });
    
            // console.log("Created Message:", createdMessage);
    
            // Fetch the created message with sender details
            const messageData = await Message.findById(createdMessage._id)
                .populate("sender", "id email firstName lastName image color")
                .exec();
    
            // console.log("Fetched Message Data:", messageData);
    
            // Update the channel to include the new message
            await Channel.findByIdAndUpdate(channelId, {
                $push: { messages: createdMessage._id },
            });
    
            // Fetch the channel and its members
            const channel = await Channel.findById(channelId).populate("members admin");
    
            if (!channel) {
                console.error("Channel not found:", channelId);
                return;
            }
    
            // console.log("Channel Members:", channel.members);
            // console.log("Channel Admin:", channel.admin);
    
            // Prepare the final message data to send
            const finalData = { ...messageData._doc, channelId: channelId };
    
            // Emit the message to all members
            channel.members.forEach((member) => {
                const memberSocketId = userSocketMap.get(member._id.toString());
                if (memberSocketId) {
                    console.log(`Sending to member: ${member._id}`);
                    io.to(memberSocketId).emit("receive-channel-message", finalData);
                }
            });
    
            // Emit to admin
            if (channel.admin) {
                const adminSocketId = userSocketMap.get(channel.admin._id.toString());
                if (adminSocketId) {
                    // console.log(`Sending to admin: ${channel.admin._id}`);
                    io.to(adminSocketId).emit("receive-channel-message", finalData);
                }
            }
    
        } catch (error) {
            console.error("Error sending channel message:", error);
        }
    };
    


    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            // console.log(`User Connected: ${userId} with socket ID: ${socket.id}`);
        } else {
            // console.log("User connected without userId");
        }
        socket.on("sendMessage", sendMessage)
        socket.on("send-channel-message", sendChannelMessage);
        socket.on("disconnect", () => disconnect(socket));
    });

    return io; // Ensure the io instance is returned if needed
};

export default setupSocket;
