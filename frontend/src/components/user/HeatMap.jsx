import { useEffect, useMemo, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import { API_BASE_URL } from "../../api";

const formatDate = (date) => date.toISOString().split("T")[0];

const getStartDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addContribution = (contributionMap, rawDate) => {
  if (!rawDate) return;

  const date = formatDate(new Date(rawDate));
  contributionMap.set(date, (contributionMap.get(date) || 0) + 1);
};

const buildContributionData = (repositories) => {
  const contributionMap = new Map();

  repositories.forEach((repo) => {
    addContribution(contributionMap, repo.createdAt);

    if (repo.updatedAt && repo.updatedAt !== repo.createdAt) {
      addContribution(contributionMap, repo.updatedAt);
    }
  });

  return Array.from(contributionMap, ([date, count]) => ({ date, count }));
};

const panelColors = {
  0: "#161b22",
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353",
};

const HeatMapProfile = ({ userId }) => {
  const [activityData, setActivityData] = useState([]);
  const [repositoryCount, setRepositoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const startDate = useMemo(() => getStartDate(), []);

  const totalContributions = activityData.reduce((sum, item) => sum + item.count, 0);

  useEffect(() => {
    const fetchContributionData = async () => {
      const profileUserId = userId || localStorage.getItem("userId");

      if (!profileUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/repo/user/${profileUserId}`);

        if (!response.ok && response.status !== 404) {
          throw new Error("Unable to fetch contribution data.");
        }

        const data = await response.json();
        const repositories = data.repositories || [];

        setRepositoryCount(repositories.length);
        setActivityData(buildContributionData(repositories));
      } catch (err) {
        console.error("Error while fetching contribution data: ", err);
        setError("Contribution data unavailable right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchContributionData();
  }, [userId]);

  return (
    <div className="contribution-card">
      <div className="contribution-header">
        <div>
          <h4>Recent Contributions</h4>
          <p>{totalContributions} contributions in the last year</p>
        </div>
        <div className="contribution-stat">
          <strong>{repositoryCount}</strong>
          <span>Repositories</span>
        </div>
      </div>

      {loading ? (
        <p className="contribution-message">Loading contributions...</p>
      ) : error ? (
        <p className="contribution-message">{error}</p>
      ) : (
        <>
          <HeatMap
            className="HeatMapProfile"
            style={{ maxWidth: "100%", height: "200px", color: "var(--muted)" }}
            value={activityData}
            weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
            startDate={startDate}
            endDate={new Date()}
            rectSize={14}
            space={3}
            rectProps={{
              rx: 2.5,
            }}
            panelColors={panelColors}
          />
          {activityData.length === 0 && (
            <p className="contribution-message">No repository activity yet.</p>
          )}
        </>
      )}
    </div>
  );
};

export default HeatMapProfile;
