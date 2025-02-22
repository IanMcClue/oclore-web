import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Your route handler logic for GET requests
  return NextResponse.json({ message: 'Callback route' });
}

