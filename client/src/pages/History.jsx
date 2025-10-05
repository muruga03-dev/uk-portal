import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const History = () => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("adminToken"); // use token if required

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(`${API_BASE}/api/admin/history`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.data && res.data.length > 0) {
          const latestHistory = res.data[res.data.length - 1];
          const lang = i18n.language || "en";

          setHistory(
            latestHistory?.content?.[lang] ||
              latestHistory?.content?.en ||
              t("history_not_available")
          );
        } else {
          setHistory(t("no_history_found"));
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        if (err.response?.status === 401) {
          setError(t("unauthorized_access"));
        } else {
          setError(t("failed_load_history"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [i18n.language, API_BASE, t, token]);

  if (loading)
    return (
      <div className="p-8 text-center text-lg font-semibold animate-pulse">
        ⏳ {t("loading_history")}
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        ⚠️ {error}
      </div>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-green-700">
        📜 {t("history")}
      </h2>
      <p className="text-lg whitespace-pre-line text-gray-800">
        {history || t("no_history_found")}
      </p>
    </div>
  );
};

export default History;
