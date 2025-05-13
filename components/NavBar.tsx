"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constants";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook
import DateAndTime from "./DateAndTime";

const NavBar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(
    "/assets/profile-placeholder.png"
  );
  const [imageError, setImageError] = useState(false);
  const { user, logout } = useAuth(); // Get user from AuthContext as well
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Set profile image from AuthContext when available
  useEffect(() => {
    if (user?.imageUrl) {
      setProfileImage(user.imageUrl);
      setImageError(false); // Reset error state when we get a new URL
    }
  }, [user]);

  // Fetch user profile data as backup
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((c) => c.startsWith("token="))
          ?.split("=")[1];

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.imageUrl) {
            setProfileImage(userData.imageUrl);
            setImageError(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    // Only fetch if we don't have a user from context
    if (!user?.imageUrl) {
      fetchUserProfile();
    }
  }, [user]);

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    logout(); // Use the AuthContext logout function
  };

  // close sidebar on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Debug log to check what's happening
  console.log("Profile image URL:", profileImage);
  console.log("Image error state:", imageError);

  return (
    <>
      <nav className="flex justify-between items-center fixed z-50 w-full h-28 bg-gray-200 px-10 gap-4 shadow-xl">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 hover:scale-150 duration-500 sm:w-auto"
        >
          <Image
            src="/assets/logo.png"
            width={100}
            height={60}
            alt="Let's talk"
          />
        </Link>

        {/* Nav Links */}
        <section className="sticky top-0 flex justify-between text-black">
          <div className="flex flex-1 flex-wrap gap-2 sm:gap-6">
            {navLinks.map((item) => {
              const isActive = !!(
          pathname === item.route ||
          pathname?.startsWith(`${item.route}/`)
              );

              return (
          <Link
            href={item.route}
            key={item.label}
            className={cn(
              "flex gap-2 items-center p-2 sm:p-4 rounded-lg justify-start hover:scale-110 duration-300",
              isActive && "bg-blue-100 rounded-3xl"
            )}
          >
            <Image
              src={item.imgURL}
              alt={item.label}
              width={20}
              height={20}
              className="sm:w-6 sm:h-6"
            />

            <p className={cn("text-sm sm:text-lg font-semibold hidden md:block")}>
              {item.label}
            </p>
          </Link>
              );
            })}
          </div>
        </section>

        {/* User button */}
        <div ref={wrapperRef} className="relative flex gap-6 items-center">
            <div className="hidden sm:block">
            <DateAndTime />
            </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 focus:outline-none focus:border-blue-500"
          >
            {imageError ? (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                <span>User</span>
              </div>
            ) : (
              <Image
                src={profileImage}
                alt="Profile"
                width={40}
                height={40}
                className="object-cover w-full h-full"
                onError={() => setImageError(true)}
                priority
                unoptimized // Bypass image optimization for external URLs
              />
            )}
          </button>

          {/* Profile Sidebar */}
          {isOpen && (
            <div className="absolute right-0 mt-36 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <Link href="/profile">
                <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                  <div className="flex items-center">
                    <Image
                      src="/assets/profile-placeholder.png"
                      alt="Profile"
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Profile
                  </div>
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <Image
                    src="/assets/leave.png"
                    alt="Logout"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Logout
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default NavBar;
