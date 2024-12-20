import { Schema,model } from "mongoose";
import bcrypt from "bcryptjs";

const AdminsSchema = new Schema({
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
    role:{
        type:String,
        require:true,
        trim:true
    },
    status:{
        type:Boolean,
        default:true
    },
    chances:{
        type: Number,
        require: true 
    },
    lastLogin:{
        type: Date,
        require: true, 
        trim: true,
        default:Date.now() 
    }
},{
    timestamps:true
}

);

//* Metodos
AdminsSchema.methods.encryptPassword = async function (password){
    const salt = await bcrypt.genSalt(10);
    const passwordEncrypt = await bcrypt.hash(password,salt)
    return passwordEncrypt;
}


AdminsSchema.methods.matchPassword = async function (password){
    return await bcrypt.compare(password,this.password);
}

export default model('admins',AdminsSchema)