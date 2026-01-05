import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Incident from '@/models/Incident';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise
) {
    try {
        const { id } = await params;
        const body = await request.json();
        await connectDB();

        const incident = await Incident.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!incident) {
            return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }

        return NextResponse.json(incident);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();

        const incident = await Incident.findByIdAndDelete(id);

        if (!incident) {
            return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Incident deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
    }
}
