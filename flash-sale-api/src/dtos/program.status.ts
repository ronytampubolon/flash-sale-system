interface IProgramStatus {
    isActive: boolean;
}
interface IFlashProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    thumbnail: string;
}
const ProgramStatus = {
    Active: { isActive: true } as IProgramStatus,
    Inactive: { isActive: false } as IProgramStatus,
};
export { IProgramStatus, IFlashProduct, ProgramStatus }