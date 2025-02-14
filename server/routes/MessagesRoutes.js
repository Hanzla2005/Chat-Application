import { Router } from "express";
import {verifyToken} from "../middlewares/AuthMiddleware.js";
import { getMessages } from "../controllers/MessagesController.js";
import multer from "multer";
import { uploadFile } from "../controllers/MessagesController.js";

const storage = multer.diskStorage({
    destination: "uploads/files",
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Ensure unique filename
    },
});

const messagesRoutes = Router();
messagesRoutes.post("/get-messages", verifyToken, getMessages);
const upload = multer({ storage });
messagesRoutes.post("/upload-file", verifyToken, upload.single("file"), uploadFile);

export default messagesRoutes;