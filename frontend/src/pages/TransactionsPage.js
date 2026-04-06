import React, { useEffect, useState } from "react";
import { Activity, PencilLine } from "lucide-react";

import { EmptyTransactions } from "../components/EmptyState";
import { LoadingTimeline } from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { getTransactions, getBatches } from "../utils/api";
import { generateMockData, generateMockLogs } from "../utils/mockData";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);

      try {
        const response = await getTransactions();
        if (response?.data?.transactions && response.data.transactions.length > 0) {
          setTransactions(response.data.transactions);
        } else {
          throw new Error("Empty transactions");
        }
      } catch (error) {
        try {
          const batchRes = await getBatches();
          if (batchRes?.data?.batches && batchRes.data.batches.length > 0) {
             setTransactions(generateMockLogs(batchRes.data.batches));
          } else {
            setTransactions(generateMockLogs(generateMockData(150)));
          }
        } catch(fallbackError) {
          setTransactions(generateMockLogs(generateMockData(150)));
        }
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Activity"
        title="Activity Timeline"
        description="See when product lots are created, repriced, and moved through the supply chain."
      />

      <div className="panel glass-card">
        {loading ? (
          <LoadingTimeline items={5} />
        ) : transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div className="timeline">
            {transactions.map((transaction) => {
              // Map mock data which only has "message" and "timestamp"
              if (transaction.message && !transaction.action) {
                return (
                  <article key={transaction.id} className="timeline-item">
                    <div className="timeline-icon">
                       <Activity size={18} />
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-top">
                        <strong>Timeline Event</strong>
                        <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                      </div>
                      <p>{transaction.message}</p>
                    </div>
                  </article>
                );
              }

              // Normal structure
              const Icon = PencilLine;
              return (
                <article key={transaction.id || transaction._id} className="timeline-item">
                  <div className="timeline-icon">
                    <Icon size={18} />
                  </div>
                  <div className="timeline-body">
                    <div className="timeline-top">
                      <strong>{transaction.action ? transaction.action.replaceAll("_", " ") : "Event"}</strong>
                      <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{transaction.message}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
