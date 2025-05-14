import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NoteProps {
  note: {
    _id: string;
    title?: string;
    content?: string;
    tags?: string[];
    createdBy: {
      username?: string;
      email?: string;
    } | null;
    lastEditedBy: {
      username?: string;
      email?: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  };
  teamId: string;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function TeamNote({
  note,
  teamId,
  onUpdate,
  onDelete,
}: NoteProps) {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [tags, setTags] = useState((note.tags || []).join(", "));

  const handleUpdate = async () => {
    const trimmedTitle = title?.trim() || "";
    const trimmedContent = content?.trim() || "";

    if (!trimmedTitle || !trimmedContent) {
      toast.error("Title and content are required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/notes/${note._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update note");
      }

      setIsEditing(false);
      onUpdate();
      toast.success("Note updated successfully");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update note"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/notes/${note._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete note");
      }

      setIsDeleting(false);
      onDelete();
      toast.success("Note deleted successfully");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete note"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle(note.title || "");
    setContent(note.content || "");
    setTags((note.tags || []).join(", "));
    setIsEditing(false);
  };

  // Add a helper function to get user display name
  const getUserDisplayName = (
    user: { username?: string; email?: string } | null
  ) => {
    if (!user) return "Unknown User";
    return user.username || user.email || "Unknown User";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">
          {note.title || "Untitled Note"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            disabled={isLoading}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDeleting(true)}
            className="p-2 hover:bg-gray-100 rounded-full text-red-600 disabled:opacity-50"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-4 whitespace-pre-wrap">
        {note.content || "No content"}
      </p>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>Created by {getUserDisplayName(note.createdBy)}</p>
        <p>Last edited by {getUserDisplayName(note.lastEditedBy)}</p>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isLoading}
                required
                placeholder="Enter note title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded"
                disabled={isLoading}
                required
                placeholder="Enter note content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isLoading}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading || !title?.trim() || !content?.trim()}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <p className="p-4">
            Are you sure you want to delete this note? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setIsDeleting(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
