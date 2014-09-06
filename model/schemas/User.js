var mongoose = require('mongoose'),
    crypto = require('crypto'),
    uuid = require('node-uuid'),
    Schema = mongoose.Schema;

var userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    hashPassword: { type: String, required: true },
    saltPassword: { type: String, required: true, default: uuid.v4() },
    saltApplicationPassword: { type: String, required: true, default: uuid.v4() }
});

function hash(password, salt) {
    return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

//generate hashed password
userSchema.methods.setPasswords = function(password) {
    this.hashPassword = hash(password, this.saltPassword);
}

//verify if the password is correct
userSchema.methods.validPassword = function(password) {
    return this.hashPassword === hash(password, this.saltPassword);
};

module.exports = mongoose.model('User', userSchema);