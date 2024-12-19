import { Schema,model } from "mongoose";

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

)

export default model('admins',AdminsSchema)