import e from "express";

interface IUser {
    email: string;
}
interface IOrder {
    userId: string;
    itemId: string;
    quantity: number;
    totalPrice: number;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}
enum PurchaseStatus {
    Pending = 'pending',
    Completed = 'completed',
    Failed = 'failed',
}

interface BadRequestError extends Error {}
export { IUser, IOrder, BadRequestError, PurchaseStatus }