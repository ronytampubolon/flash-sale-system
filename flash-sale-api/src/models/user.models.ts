import mongoose from "mongoose";
import { IUser } from "../types";

export interface IUserModel extends IUser, mongoose.Document {}

const userSchema = new mongoose.Schema<IUserModel>({
    email: { type: String, required: true, unique: true },
}, {
    timestamps: true, // adds createdAt, updatedAt automatically
});

export default mongoose.model<IUserModel>("User",userSchema);