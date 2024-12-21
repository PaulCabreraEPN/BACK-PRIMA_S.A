import {Schema,model} from "mongoose";

const ClientSchema = new Schema({
    Name:{
        type:String,
        required:true,
        unique:true
    },
    Ruc:{
        type:String,
        required:true,
        trim:true
    },
    Address:{
        type:String,
        required:true,
        trim:true
    },
    telephone:{
        type:Number,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    credit:{
        type:String,
        required:true,
        trim:true
    },
    state:{
        type:String,
        required:true,
        trim:true
    }
})

export default model('clients',ClientSchema)
