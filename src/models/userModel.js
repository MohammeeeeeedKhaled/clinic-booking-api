const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required: [true,'Enter Your Name'],
            trim: true,
            minlength: [3,'Name must be at least 3 chars'],
            maxlength: [50,'Name must not exceed 50 chars'],
        },
        email: {
            type: String,
            required: [true,'Enter Your email'],
            unique: true,
            trim: true,//remove whiltespaces at start and end
            lowercase:true,// Converts string to lowercase before saving (case-insensitive indexing)
            match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,// Validates email format via Regex pattern
            'Please provide a valid email address',
            ]
        },
        password: {
            type: String,
            required: [true,'Enter a password'],
            match: [
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character',
                ],
            select:false // Prevents field from being returned in query projections by default (security best practice)
        },
        role: {
            type:String,
            enum:{
                values: ['patient', 'doctor', 'admin'],
                message: '{VALUE} is not a valid role'//error message 
            },
            default: 'patient'
        },
        phone: {
            type: String,
            trim: true,
            match: [
                /^01[0125][0-9]{8}$/,
                'Please enter a valid 11-digit Egyptian phone number',
            ]
        }
    },
    {
    timestamps: true, // Automatically generates and manages 'createdAt' and 'updatedAt' UTC date fields
    }
);

userSchema.pre('save', async function () {
    if(!this.isModified('password')){
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);  
})
userSchema.methods.matchedPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword , this.password);
}
const User = mongoose.model('User',userSchema);
module.exports = User;