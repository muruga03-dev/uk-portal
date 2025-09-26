import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const History = () => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/history");

        if (res.data.length > 0) {
          const latestHistory = res.data[res.data.length - 1]; // pick latest entry
          const lang = i18n.language;

          if (latestHistory.content && latestHistory.content[lang]) {
            setHistory(latestHistory.content[lang]);
          } else {
            setHistory("History not available in this language.");
          }
        } else {
          setHistory("No history found.");
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="p-8 text-center text-lg font-semibold">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">{t("history")}</h2>
      <p className="text-lg whitespace-pre-line">{history}</p>
    </div>
  );
};

export default History;
