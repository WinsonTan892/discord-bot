const mongoose = require('mongoose');

const completedProblemSchema = new mongoose.Schema({
    username: { type: String, required: true }, // Username
    problemName: { type: String, required: true }, // Problem Name
    completedAt: { type: Date, default: Date.now } // Timestamp
});

const CompletedProblem = mongoose.model('CompletedProblem', completedProblemSchema);

module.exports = CompletedProblem;
