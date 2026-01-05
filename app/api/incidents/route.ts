import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Incident from '@/models/Incident';

export async function GET() {
    try {
        await connectDB();
        const incidents = await Incident.find({}).sort({ timestamp: -1 });
        return NextResponse.json(incidents);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        await connectDB();

        // Transform frontend ID to Mongoose/Mongo ID if needed, 
        // or let Mongo generate _id. The frontend sends 'id' as UUID, 
        // but we can just let Mongo manage IDs or store the UUID as a separate field.
        // Ideally, for sync, using the backend _id is better.

        const incident = await Incident.create(body);
        return NextResponse.json(incident, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
    }
}
