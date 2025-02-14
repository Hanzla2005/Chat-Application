import { Router } from "express"
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { createChannel, getUserChannels, getChannelMessages } from "../controllers/ChannelControllerr.js";

const channelRoutes = Router();

channelRoutes.post("/create-channel", verifyToken, createChannel);
channelRoutes.get("/get-user-channels", verifyToken, getUserChannels);
channelRoutes.get("/get-channel-messages/:channelId", verifyToken, getChannelMessages)

export default channelRoutes;