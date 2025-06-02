import {Schema,model} from "mongoose";

const ClientSchema = new Schema({
    Name:{
        type:String,
        required:true,
    },
    ComercialName:{
        type:String,
        required:true,
        trim:true
    },
    Ruc:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    Address:{
        type:String,
        required:true,
        trim:true
    },
    telephone:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    state:{
        type:String,
        required:true,
        trim:true
    }
})

export default model('clients',ClientSchema)
