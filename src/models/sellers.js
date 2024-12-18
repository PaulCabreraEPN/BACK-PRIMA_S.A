import { Schema,model } from "mongoose";
import bcrypt from 'bcryptjs'

const SellersSchema = new Schema({
    names:{
        type:String,
        require:true,
        trim:true
    },
    lastNames:{
        type:String,
        require:true,
        trim:true
    },
    numberID:{
        type:Number,
        require:true,
        trim:true,
        unique:true
    },
    email:{
        type:String,
        require:true,
        trim:true,
        unique:true
    },
    username:{
        type:String,
        require:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        require:true,
        trim:true
    },
    SalesCity:{
        type:String,
        require:true,
        trim:true
    },
    PhoneNumber:{
        type:Number,
        require:true,
        trim:true
    },
    role:{
        type:String,
        require:true,
        trim:true
    },
    status:{
        type:Boolean,
        default:true
    },
    token:{
        type:String,
        default:null
    },
    confirmEmail:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})

//* Metodos

SellersSchema.methods.encryptPassword = async function (password){
    const salt = await bcrypt.genSalt(10);
    const passwordEncrypt = await bcrypt.hash(password,salt)
    return passwordEncrypt;
}

SellersSchema.methods.matchPassword = async function (password){
    return await bcrypt.compare(password,this.password);
}

SellersSchema.methods.createToken = function(){
    return this.token = Math.random().toString(36).slice(2)
}

export default model('Sellers',SellersSchema)