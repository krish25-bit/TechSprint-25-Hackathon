import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIncident extends Document {
    type: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    peopleAffected: number;
    location: {
        lat: number;
        lng: number;
    };
    placeName: string;
    timestamp: Date;
    status: 'OPEN' | 'RESOLVED' | 'DISPATCHED';
}

const IncidentSchema: Schema = new Schema({
    type: { type: String, required: true },
    priority: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
        default: 'MEDIUM'
    },
    description: { type: String, required: true },
    peopleAffected: { type: Number, default: 0 },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    placeName: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['OPEN', 'RESOLVED', 'DISPATCHED'],
        default: 'OPEN'
    }
});

// Prevent model overwrite during hot reload
const Incident: Model<IIncident> = mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);

export default Incident;
