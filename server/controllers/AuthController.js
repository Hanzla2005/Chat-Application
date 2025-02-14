import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import { renameSync, unlinkSync } from "fs";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
    return jwt.sign({email, userId},process.env.JWT_KEY,{expiresIn: maxAge});
}

export const signup = async (req, res, next) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).send("Please provide email and password");
        }
        const user = await User.create({email, password});
        res.cookie("jwt",createToken(email,user.id),{
            maxAge,
            secure: true,
            sameSite: "None",
        });
        return res.status(201).json({user:{
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
        }})
    } catch(e){
        console.log("I am not working");
        console.log(e);
        return res.status(500).send("Internal Server");
    }
};

export const login = async (req, res, next) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).send("Please provide email and password");
        }
        const user = await User.findOne({email: email});
        if(!user){
            return res.status(401).send("Invalid credentials");
        }
        const auth = await compare(password, user.password);
        if(!auth) {
            return res.status(401).send("Invalid credentials");
        }
        res.cookie("jwt",createToken(email,user.id),{
            maxAge,
            secure: true,
            sameSite: "None",
        });
        return res.status(200).json({user:{
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        }})
    } catch(e){
        console.log(e);
        return res.status(500).send("Internal Server Error");
    }
}

export const getUserInfo = async (req, res, next) => {
    try{
        const user = await User.findById(req.userId);
        if(!user) {
            return res.status(404).send("User not found");
        }
        return res.status(200).json({
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
        })
    } catch(e){
        console.log(e);
        return res.status(500).send("Internal Server Error");
    }
}

export const updateProfile = async (req, res, next) => {
    try{
        const {userId} = req;
        const {firstName, lastName, color} = req.body;
        if(!firstName || !lastName) {
            return res.status(400).send("Please provide first name, last name, and color");
        }

        const user = await User.findByIdAndUpdate(userId, {
            firstName,
            lastName,
            color,
            profileSetup: true,
        }, {new: true, runValidators: true}
    );

        return res.status(200).json({
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image,
                color: user.color,
        })
    } catch(e){
        console.log(e);
        return res.status(500).send("Internal Server Error");
    }
}

export const addProfileImage = async (req, res, next) => {
    try{
        if(!req.file){
            return res.status(400).send("Please upload an image");
        }

        const date = Date.now();
        let fileName = "uploads/profiles/" + date + req.file.originalname;
        renameSync(req.file.path, fileName);
        const user = await User.findByIdAndUpdate(req.userId, {image: fileName}, {new: true, runValidators: true});

        return res.status(200).json({              
            image: user.image,
        })
    } catch(e){
        console.log("I am not working");
        console.log(e);
        return res.status(500).send("Internal Server Error");
    }
};

export const removeProfileImage = async (req, res, next) => {
    try{
        const {userId} = req;
        console.log("i am here")
        

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).send("User not found");
        }

        console.log("User found");

        if(user.image) {
            unlinkSync(user.image);
            console.log("Image removed");
        }

        user.image = null;
        await user.save();
        console.log("buhahaha")
        return res.status(200).send("Profile image removed successfully");
    } catch(e){
        console.log(e);
        return res.status(500).send("Internal Server Error");
    }
}

export const logout = async (req, res, next) => {
    try{
        res.cookie("jwt", "", {maxAge: 1, secure: true, sameSite:"None"})
        return res.status(200).send("Logout successfull");
    } catch(e){
        console.log(e);
        return res.status(500).send("Internal Server Error");
    }
}