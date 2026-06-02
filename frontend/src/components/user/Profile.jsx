import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./profile.css";
import Navbar from "../Navbar";
import { UnderlineNav } from "@primer/react";
import { BookIcon, RepoIcon } from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../authContext";
import { API_BASE_URL } from "../../api";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userDetails, setUserDetails] = useState({ username: "username" });
  const [currentUserDetails, setCurrentUserDetails] = useState(null);
  const { setCurrentUser } = useAuth();
  const isOwnProfile = !id || id === localStorage.getItem("userId");
  const isFollowing =
    !isOwnProfile &&
    Boolean(
      currentUserDetails?.followedUsers?.some(
        (followedUser) => followedUser.toString() === id
      )
    );

  const getUserProfile = async (userId) => {
    const response = await axios.get(`${API_BASE_URL}/userProfile/${userId}`);
    return response.data;
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfileDetails = async () => {
      const profileUserId = id || localStorage.getItem("userId");
      const currentUserId = localStorage.getItem("userId");

      try {
        if (profileUserId) {
          const profileData = await getUserProfile(profileUserId);
          if (isMounted) {
            setUserDetails(profileData);
          }
        }

        if (currentUserId) {
          const currentUserData = await getUserProfile(currentUserId);
          if (isMounted) {
            setCurrentUserDetails(currentUserData);
          }
        }
      } catch (err) {
        console.error("Cannot fetch user details: ", err);
      }
    };

    loadProfileDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleFollowToggle = async () => {
    if (!id) return;

    const currentUserId = localStorage.getItem("userId");
    const endpoint = isFollowing ? "unfollow" : "follow";

    try {
      const response = await axios.put(`${API_BASE_URL}/${endpoint}/${id}`, {
        currentUserId,
      });

      if (response.status === 200) {
        if (response.data?.targetUser) {
          setUserDetails(response.data.targetUser);
        } else {
          setUserDetails(await getUserProfile(id));
        }

        setCurrentUserDetails((prev) => {
          if (!prev) return prev;

          const followedUsers = prev.followedUsers || [];
          const nextFollowedUsers = isFollowing
            ? followedUsers.filter((followedUser) => followedUser.toString() !== id)
            : [...followedUsers, id];

          return {
            ...prev,
            followedUsers: nextFollowedUsers,
          };
        });
      }
    } catch (err) {
      console.error("Unable to update follow status: ", err);
    }
  };

  return (
    <>
      <Navbar />
      <UnderlineNav aria-label="Repository">
        <UnderlineNav.Item
          aria-current="page"
          icon={BookIcon}
          sx={{
            backgroundColor: "transparent",
            color: "white",
            "&:hover": {
              textDecoration: "underline",
              color: "white",
            },
          }}
        >
          Overview
        </UnderlineNav.Item>

        <UnderlineNav.Item
          onClick={() => navigate("/repo")}
          icon={RepoIcon}
          sx={{
            backgroundColor: "transparent",
            color: "whitesmoke",
            "&:hover": {
              textDecoration: "underline",
              color: "white",
            },
          }}
        >
          Starred Repositories
        </UnderlineNav.Item>
      </UnderlineNav>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          setCurrentUser(null);

          window.location.href = "/auth";
        }}
        id="logout"
      >
        Logout
      </button>

      <section className="profile-hero">
        <div>
          <p className="eyebrow">{isOwnProfile ? "Profile" : "Member profile"}</p>
          <h1>{userDetails.username}</h1>
          <p className="profile-handle">@{userDetails.username}</p>
        </div>
        <div className="profile-hero-badge">
          <span>{isOwnProfile ? "Your account" : isFollowing ? "Following" : "Not following"}</span>
        </div>
      </section>

      <div className="profile-page-wrapper">
        <div className="user-profile-section">
          <div className="profile-image"></div>

          <div className="name">
            <h3>{userDetails.username}</h3>
            <p>@{userDetails.username}</p>
          </div>

         <button
           className="follow-btn"
           disabled={isOwnProfile}
           onClick={handleFollowToggle}
         >
          {isOwnProfile ? "Your profile" : isFollowing ? "Following" : "Follow"}
         </button>

           <div className="follower">
    <p>{userDetails.followersCount || 0} Followers</p>
    <p>{userDetails.followingCount || 0} Following</p>
  </div>

        </div>

        <div className="heat-map-section">
          <HeatMapProfile userId={id || localStorage.getItem("userId")} />
        </div>
      </div>
    </>
  );
};

export default Profile;
