import mongoose, {Schema,model} from 'mongoose'

const orderSchema = new Schema({
    customer: {
        type: Number,
        ref: 'clients',
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'Sellers',
        required: true
    },
    products: [{
        productId:{
            type: String,
            ref: 'products',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        _id: false,
    }],
    discountApplied: {
        type: Number,
        required: true
    },
    netTotal: {
        type: Number,
        required: true
    },
    totalWithTax: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pendiente', 'En proceso', 'Enviado','Cancelado'],
        default: 'Pendiente'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    },
    comment: {
        type: String,
        default: ''
    }
},{
    timestamps: true
});



export default model('orders',orderSchema)