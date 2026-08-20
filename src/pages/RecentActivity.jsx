import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PhoneFrame from "../components/frames/PhoneFrame";
import ScreenHeader from "../components/navigation/ScreenHeader";
import TransactionRow from "../components/data/TransactionRow";
import SectionHeader from "../components/navigation/SectionHeader";
import EmptyState from "../components/feedback/EmptyState";
import { useApp } from "../state/store";
import { screenTransition, listStagger, listItem } from "../lib/motion";

function groupByDay(items) {
  const groups = {};
  for (const t of items) {
    const day = t.date.split(",")[0];
    groups[day] = groups[day] || [];
    groups[day].push(t);
  }
  return groups;
}

export default function RecentActivity() {
  const navigate = useNavigate();
  const { state } = useApp();
  const groups = groupByDay(state.wallet.transactions);
  return (
    <PhoneFrame>
      <motion.div {...screenTransition} style={{ position: "absolute", inset: 0, boxSizing: "border-box", padding: "66px 20px 40px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
        <ScreenHeader title="Recent Activity" />
        {state.wallet.transactions.length === 0 ? (
          <EmptyState icon="clock" title="No activity yet" message="Sends, swaps, buys and card spend will show up here." />
        ) : (
          <motion.div variants={listStagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(groups).map(([day, items]) => (
              <div key={day}>
                <SectionHeader title={day} />
                <div style={{ marginTop: 4 }}>
                  {items.map((t) => (
                    <motion.button
                      key={t.id}
                      variants={listItem}
                      onClick={() => navigate(`/activity/${t.id}`)}
                      style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, textAlign: "left" }}
                    >
                      <TransactionRow {...t} />
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </PhoneFrame>
  );
}
