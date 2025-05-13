"use client";

import AddTeam from "@/components/AddTeam";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Import Button for consistency
import { PlusCircle } from "lucide-react"; // Import an icon for the button

interface Team {
  _id: string;
  name: string;
  admins: string[];
}

export default function TeamsPage() {
  const { isLoading, isAuthenticated, token } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false); // Renamed for clarity
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const userId = token ? JSON.parse(atob(token.split(".")[1]))?.id : null;

  const fetchTeams = useCallback(() => { // Wrapped in useCallback
    if (!token) return;
    setLoadingTeams(true);
    fetch("/api/teams", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) {
          if (r.status === 401) router.push("/login"); // Redirect on 401
          throw new Error("Failed to fetch teams");
        }
        return r.json();
      })
      .then((data) => setTeams(data.teams || []))
      .catch(console.error)
      .finally(() => setLoadingTeams(false));
  }, [token, router]);

  const handleDeleteOrLeave = useCallback(
    async (team: Team) => {
      if (!token || !team) return;
      try {
        const res = await fetch(`/api/teams/${team._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete/leave team");
        fetchTeams(); // Refresh list
      } catch (err) {
        alert((err as Error).message);
      }
    },
    [token, fetchTeams] // Added fetchTeams to dependency array
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && token) { // Ensure token exists before fetching
      fetchTeams();
    }
  }, [isAuthenticated, token, fetchTeams]); // Added fetchTeams

  if (isLoading || loadingTeams) return <Loading />;

  const handleCreated = () => {
    setShowCreateModal(false);
    fetchTeams();
  };

  return (
    <div className="animate-fade-in p-4 sm:p-6"> {/* Added padding to the main container */}
      {/* header + create button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Your Teams</h1>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusCircle size={18} className="sm:hidden" /> {/* Icon for smaller screens */}
          <span className="hidden sm:inline">Create Team</span>
          <span className="sm:hidden">New Team</span> {/* Shorter text for mobile */}
        </Button>
      </div>

      {/* teams list */}
      <div className="px-0 sm:px-6"> {/* Adjusted padding */}
        {teams.length ? (
          <ul className="space-y-3"> {/* Increased space slightly */}
            {teams.map((t, idx) => (
              <li
                key={t._id ?? idx}
                onClick={() => router.push(`/teams/${t._id}`)}
                className="p-3 sm:p-4 bg-white border rounded-lg hover:bg-gray-50 flex items-center justify-between cursor-pointer transition-colors duration-150"
              >
                <span className="text-sm sm:text-base font-medium truncate mr-2">{t.name}</span>
                {userId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeamToDelete(t);
                      setShowConfirmModal(true);
                    }}
                    className="ml-2 sm:ml-4 p-1.5 sm:p-2 rounded-md hover:bg-gray-200 transition-colors duration-150" // Adjusted padding and added hover
                  >
                    {t.admins?.includes(userId) ? (
                      <img
                        src="/assets/trash-bin.png"
                        alt="Delete"
                        className="w-4 h-4 sm:w-5 sm:h-5" // Responsive icon size
                      />
                    ) : (
                      <img
                        src="/assets/leave.png"
                        alt="Leave"
                        className="w-4 h-4 sm:w-5 sm:h-5" // Responsive icon size
                      />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center sm:text-left mt-4">No teams yet. Start by creating one!</p>
        )}
      </div>

      {/* Confirm Delete/Leave Modal (using shadcn Dialog) */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md"> {/* Responsive width */}
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {teamToDelete?.admins?.includes(userId)
                ? "Delete Team"
                : "Leave Team"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm sm:text-base">
              Are you sure you want to{" "}
              {teamToDelete?.admins?.includes(userId) ? "delete" : "leave"} the team "<strong>{teamToDelete?.name}</strong>"?
              {teamToDelete?.admins?.includes(userId) && " This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                type="button"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive" // Use destructive variant for delete/leave
              className="w-full sm:w-auto"
              type="button"
              onClick={async () => {
                if (teamToDelete) {
                  await handleDeleteOrLeave(teamToDelete);
                  setShowConfirmModal(false);
                  setTeamToDelete(null);
                }
              }}
            >
              {teamToDelete?.admins?.includes(userId) ? "Delete" : "Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Team Modal (custom) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg"> {/* Responsive width and padding */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
              aria-label="Close modal"
            >
              {/* Using a simple X, consider an icon component if available */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* AddTeam component should also be responsive internally */}
            <div className="p-6 sm:p-8"> {/* Padding inside the modal content area */}
              <AddTeam onCreated={handleCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
