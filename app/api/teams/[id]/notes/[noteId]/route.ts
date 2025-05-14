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

// Update a note
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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
    const note = await Note.findOneAndUpdate(
      { _id: params.noteId, teamId: params.id },
      {
        title: title.trim(),
        content: content.trim(),
        tags: tags?.filter(Boolean) || [],
        lastEditedBy: decoded.id,
      },
      { new: true }
    )
      .populate("createdBy", "username email")
      .populate("lastEditedBy", "username email")
      .lean<NoteDocument>()
      .exec();

    if (!note) {
      return NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 404 }
      );
    }

    // Transform the note to handle null values
    const transformedNote = {
      ...note,
      createdBy: note.createdBy || {
        username: "Unknown",
        email: "unknown@example.com",
      },
      lastEditedBy: note.lastEditedBy || {
        username: "Unknown",
        email: "unknown@example.com",
      },
    };

    return NextResponse.json(
      { success: true, note: transformedNote },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Delete a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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
    const note = await Note.findOneAndDelete({
      _id: params.noteId,
      teamId: params.id,
    });

    if (!note) {
      return NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Note deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
