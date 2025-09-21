const z = require('zod');

const authUserSchema = z.object({
    email: z.string().email()
});

const purchaseSchema = z.object({
    productId: z.string().min(1),
});

export { authUserSchema, purchaseSchema }