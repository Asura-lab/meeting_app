import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Note from "@/models/Note";
import { verifyToken } from "@/lib/jwt";

export const runtime = "nodejs";

interface User {
  _id: string;
  username?: string;
  email?: string;
}

interface NoteDocument {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  teamId: string;
  createdBy: User | null;
  lastEditedBy: User | null;
  createdAt: string;
  updatedAt: string;
}

// Get all notes for a team
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const notes = await Note.find({ teamId: params.id })
      .populate("createdBy", "username email")
      .populate("lastEditedBy", "username email")
      .sort({ updatedAt: -1 })
      .lean<NoteDocument[]>()
      .exec();

    // Transform the notes to handle null values
    const transformedNotes = notes.map((note) => ({
      ...note,
      createdBy: note.createdBy || {
        username: "Unknown",
        email: "unknown@example.com",
      },
      lastEditedBy: note.lastEditedBy || {
        username: "Unknown",
        email: "unknown@example.com",
      },
    }));

    return NextResponse.json(
      { success: true, notes: transformedNotes },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Create a new note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const { title, content, tags } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: "Title and content are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const note = await Note.create({
      title: title.trim(),
      content: content.trim(),
      tags: tags?.filter(Boolean) || [],
      teamId: params.id,
      createdBy: decoded.id,
      lastEditedBy: decoded.id,
    });

    // Fetch the populated note
    const populatedNote = await Note.findById(note._id)
      .populate("createdBy", "username email")
      .populate("lastEditedBy", "username email")
      .lean<NoteDocument>()
      .exec();

    if (!populatedNote) {
      throw new Error("Failed to create note");
    }

    // Transform the note to handle null values
    const transformedNote = {
      ...populatedNote,
      createdBy: populatedNote.createdBy || {
        username: "Unknown",
        email: "unknown@example.com",
      },
      lastEditedBy: populatedNote.lastEditedBy || {
        username: "Unknown",
        email: "unknown@example.com",
      },
    };

    return NextResponse.json(
      { success: true, note: transformedNote },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
