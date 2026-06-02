import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { API_BASE_URL } from "../../api";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [followedUserIds, setFollowedUserIds] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const fetchRepositories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/repo/user/${userId}`);
        const data = await response.json();
        setRepositories(data.repositories || []);
      } catch (err) {
        console.error("Error while fetching repositories: ", err);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/repo/all`);
        const data = await response.json();
        setSuggestedRepositories(data || []);
      } catch (err) {
        console.error("Error while fetching repositories: ", err);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/userProfile/${userId}`);
        const data = await response.json();
        setFollowedUserIds((data.followedUsers || []).map((id) => id.toString()));
      } catch (err) {
        console.error("Error while fetching current user: ", err);
      }
    };

    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError("");
        const response = await fetch(`${API_BASE_URL}/allUsers`);

        if (!response.ok) {
          throw new Error("Unable to fetch users.");
        }

        const data = await response.json();
        setUsers((data || []).filter((user) => user._id !== userId));
      } catch (err) {
        console.error("Error while fetching users: ", err);
        setUsersError("Users are not available right now.");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const searchResults = useMemo(() => {
    if (searchQuery.trim() === "") {
      return repositories;
    }

    return repositories.filter((repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, repositories]);

  const filteredUsers = useMemo(() => {
    if (userSearch.trim() === "") {
      return users;
    }

    const normalizedSearch = userSearch.toLowerCase();

    return users.filter((user) => {
      const username = user.username?.toLowerCase() || "";
      const email = user.email?.toLowerCase() || "";

      return username.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [userSearch, users]);

  const handleFollowToggle = async (targetUserId) => {
    const currentUserId = localStorage.getItem("userId");
    const isFollowing = followedUserIds.includes(targetUserId);
    const endpoint = isFollowing ? "unfollow" : "follow";

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${targetUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentUserId }),
      });

      if (!response.ok) {
        throw new Error("Unable to update follow status.");
      }

      setFollowedUserIds((currentIds) =>
        isFollowing
          ? currentIds.filter((id) => id !== targetUserId)
          : [...currentIds, targetUserId]
      );
    } catch (err) {
      console.error("Error while updating follow status: ", err);
    }
  };

  const renderRepoCard = (repo) => (
    <article className="repo-card" key={repo._id}>
      <div>
        <div className="repo-card-header">
          <h4>{repo.name}</h4>
          <span>Public</span>
        </div>
        <p>{repo.description || "No description added yet."}</p>
      </div>
      <div className="repo-meta">
        <span className="language-dot"></span>
        <span>JavaScript</span>
      </div>
    </article>
  );

  return (
    <>
      <Navbar />
      <section id="dashboard">
        <aside className="dashboard-panel">
          <div className="panel-heading">
            <p>Explore</p>
            <h3>Suggested repositories</h3>
          </div>
          <div className="side-list">
            {suggestedRepositories.length > 0 ? (
              suggestedRepositories.slice(0, 6).map((repo) => (
                <article className="side-card" key={repo._id}>
                  <h4>{repo.name}</h4>
                  <p>{repo.description || "Repository from your network."}</p>
                </article>
              ))
            ) : (
              <p className="empty-note">No suggestions available.</p>
            )}
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-hero">
            <div>
              <p className="eyebrow">Workspace</p>
              <h1>Your repositories</h1>
              <p className="hero-copy">
                Search, scan, and open the projects connected to your account.
              </p>
            </div>
            <div className="repo-count">
              <strong>{repositories.length}</strong>
              <span>Total repos</span>
            </div>
          </div>

          <div id="search" className="search-card">
            <input
              type="text"
              value={searchQuery}
              placeholder="Search repositories"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <section className="user-search-card">
            <div className="user-search-header">
              <div>
                <p className="eyebrow">Network</p>
                <h2>Find developers</h2>
              </div>
              <span>{usersLoading ? "Loading" : `${filteredUsers.length} users`}</span>
            </div>

            <div className="user-search-field">
              <input
                className="user-search-input"
                type="text"
                value={userSearch}
                placeholder="Search by username or email"
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {userSearch && (
                <button
                  className="user-search-clear"
                  type="button"
                  onClick={() => setUserSearch("")}
                  aria-label="Clear user search"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="user-result-list">
              {usersLoading ? (
                <p className="user-search-message">Loading users...</p>
              ) : usersError ? (
                <p className="user-search-message error">{usersError}</p>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 5).map((user) => {
                  const isFollowing = followedUserIds.includes(user._id);

                  return (
                    <article
                      className="user-result-card"
                      key={user._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/profile/${user._id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(`/profile/${user._id}`);
                        }
                      }}
                    >
                      <div className="user-avatar">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-result-info">
                        <h4>{user.username}</h4>
                        <p>{user.email}</p>
                      </div>
                      <button
                        type="button"
                        className={isFollowing ? "user-follow-btn following" : "user-follow-btn"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(user._id);
                        }}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="user-search-empty">
                  <h3>{userSearch ? "No matching users" : "No other users yet"}</h3>
                  <p>
                    {userSearch
                      ? "Try searching with a different username or email."
                      : "Create another account to test follow and profile search."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="repo-grid">
            {searchResults.length > 0 ? (
              searchResults.map(renderRepoCard)
            ) : (
              <div className="empty-state">
                <h3>No repositories found</h3>
                <p>Try a different search term.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="dashboard-panel">
          <div className="panel-heading">
            <p>Calendar</p>
            <h3>Upcoming events</h3>
          </div>
          <ul className="event-list">
            <li><span>15 Dec</span><p>Tech Conference</p></li>
            <li><span>25 Dec</span><p>Developer Meetup</p></li>
            <li><span>5 Jan</span><p>React Summit</p></li>
          </ul>
        </aside>
      </section>
    </>
  );
};

export default Dashboard;
