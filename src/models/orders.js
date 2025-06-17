import {Schema,model} from 'mongoose'

const orderSchema = new Schema({
    customer: {
        type: String,
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
    credit: {
        type: String,
        required: true,
        enum: ['Contado 1 día', 'Crédito 30 días','Crédito 1 día'],
        default: 'Contado 1 día'
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