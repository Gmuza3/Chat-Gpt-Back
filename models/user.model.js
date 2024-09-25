import mongoose from "mongoose";
import bcrypt from "bcrypt";

var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

const userSchema = mongoose.Schema(
    {
        name:{
            type:String,
            required:[true,"This Field Is Required"],
            lowercase:true
        },
        surName:{
            type:String,
            required:[true,'This Field Is Required'],
            lowercase:true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            required:[true,'This Field Is Required'],
            validate: [validateEmail, 'Please fill a valid email address'],
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        password:{
            type:String,
            required:[true,'This Field Is Required'],
            minLength:6
        },
        age:{
            type:Number,
            default:3
        },
        messages:[
            {
                User:{
                    type:String,
                    required:true
                },
                Asistent:{
                    type:String,
                    required:true
                }
            }
        ]
    },
    { timestamps: true }
);

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); 
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword =async function(password) {
    return await bcrypt.compare(password,this.password)
}

export const User = mongoose.model("user",userSchema)