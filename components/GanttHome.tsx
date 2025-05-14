"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"; // Adjust path if necessary
import TeamGanttChart from "./TeamGanttChart";

interface Team {
  _id: string;
  name: string;
  // Add other team properties if needed for display or logic
}

interface Member {
  _id: string; // This is the user ID
  email: string;
  username?: string;
  role?: "admin" | "member";
}

interface MembersResponse {
  members: Member[];
}

const GanttHome: React.FC = () => {
  const { user: currentUser, token, isLoading: authLoading } = useAuth(); // Destructure and rename isLoading
  const [joinedTeams, setJoinedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (authLoading) {
        // Auth context is still loading user data, wait.
        // setLoading(true); // Keep local loading true or let the main authLoading check handle UI
        return;
      }

      if (!currentUser || !currentUser._id || !token) {
        // Auth is done, but no valid user or token.
        setLoading(false);
        setJoinedTeams([]); // Ensure no stale data
        // setError("User not authenticated or token not available."); // Optionally set an error
        return;
      }

      setLoading(true);
      setError(null);
      const teamsUserIsIn: Team[] = [];

      try {
        const teamsResponse = await fetch("/api/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!teamsResponse.ok) {
          const errorData = await teamsResponse
            .json()
            .catch(() => ({
              message: "Failed to fetch teams and parse error",
            }));
          throw new Error(errorData.message || "Failed to fetch teams");
        }

        const responseData = await teamsResponse.json();
        const allTeams: Team[] =
          responseData.teams || responseData.data || responseData;

        if (!Array.isArray(allTeams)) {
          console.error("Fetched teams data is not an array:", allTeams);
          throw new Error(
            "Fetched teams data is not in the expected format (array)."
          );
        }

        for (const team of allTeams) {
          if (!team || typeof team._id === "undefined") {
            console.warn("Skipping invalid team object:", team);
            continue;
          }
          try {
            const membersResponse = await fetch(
              `/api/teams/${team._id}/members`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (membersResponse.ok) {
              const membersData: MembersResponse = await membersResponse.json();
              if (
                membersData &&
                Array.isArray(membersData.members) &&
                membersData.members.some(
                  (member) => member._id === currentUser._id
                )
              ) {
                teamsUserIsIn.push(team);
              }
            } else {
              console.warn(
                `Failed to fetch members for team ${team.name || team._id} (${
                  team._id
                })`
              );
            }
          } catch (memberFetchError) {
            console.warn(
              `Error fetching members for team ${team.name || team._id}:`,
              memberFetchError
            );
          }
        }
        setJoinedTeams(teamsUserIsIn);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching team data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeams();
  }, [currentUser, token, authLoading]); // Add authLoading to dependency array

  if (authLoading) {
    // Prioritize authLoading check
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-700">Loading authentication...</p>
      </div>
    );
  }

  if (loading) {
    // Then check local loading for fetching teams
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-700">Loading your teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-md text-center">
        <h3 className="text-lg font-semibold text-red-700">
          Oops! Something went wrong.
        </h3>
        <p className="text-red-600 mt-1">Error: {error}</p>
        {/* You could add a retry button here if applicable */}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Team Dashboard
        </h2>
      </div>

      <div>
        {joinedTeams.length > 0 ? (
          <select
            id="team-select"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="h-10 mt-1 block w-full max-w-md pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="">-- Please select a team --</option>
            {joinedTeams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-1 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
            <p className="text-sm text-blue-700">
              You are not currently a member of any teams, or no teams could be
              loaded.
            </p>
          </div>
        )}
      </div>

      {selectedTeamId && (
        <div className="mt-8 pt-4 ">
          <div className="flex justify-between items-center ">
            <h3 className="text-xl font-semibold text-gray-800">
              Gantt Chart:{" "}
              {joinedTeams.find((t) => t._id === selectedTeamId)?.name}
            </h3>
          </div>
          <TeamGanttChart teamId={selectedTeamId} showAddControls={false} />
        </div>
      )}
    </div>
  );
};

export default GanttHome;
