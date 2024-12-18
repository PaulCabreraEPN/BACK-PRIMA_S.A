import { Schema,model } from "mongoose";

const ProductSchema = new Schema({
    id:{
        type:Number,
        required:true,
        unique:true
    },
    product_name:{
        type:String,
        required:true,
        trim:true
    },
    measure:{
        type:String,
        required:true,
        trim:true
    },
    price:{
        type:Number,
        required:true,
    },
    stock:{
        type:Number,
        required:true,
    },
    imgUrl:{
        type:String,
        required:true,
        trim:true
    }
})

export default model('products',ProductSchema)

