const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    required: true,
    enum: ['farmer', 'distributor', 'retailer', 'consumer', 'admin'],
    default: 'consumer'
  },
  walletAddress: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    company: String,
    location: String,
    phone: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ walletAddress: 1 });

module.exports = mongoose.model('User', userSchema);