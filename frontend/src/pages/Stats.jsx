import { ShieldCheck } from "lucide-react";
import useApi from "../useApi";
import { formatDate } from "../constants";
import { Card, ErrorBanner, Loading, PageHeader } from "../components/ui";

function Kpi({ label, value, suffix = "", hint }) {
  const shown = value === null || value === undefined ? "—" : typeof value === "string" ? value : `${value}${suffix}`;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-[#19324D] mt-2">{shown}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

/** Single-series horizontal bars. Values are printed beside each bar, so the
 * list doubles as a table. Suppressed counts ("<5") get a short hatched bar. */
function BarList({ title, rows }) {
  const numeric = rows.map((r) => (typeof r.count === "number" ? r.count : 0));
  const max = Math.max(5, ...numeric);

  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 p-5">No data yet.</p>
      ) : (
        <ul className="p-5 space-y-3">
          {rows.map((row) => {
            const suppressed = typeof row.count !== "number";
            // A suppressed count stays visibly short so it never reads as a real value.
            const width = suppressed ? Math.min((2.5 / max) * 100, 8) : (row.count / max) * 100;
            const valueText = suppressed ? "fewer than 5" : row.count;
            return (
              <li key={row.key} className="grid grid-cols-[minmax(7rem,10rem)_1fr_auto] items-center gap-3 text-sm" title={`${row.label}: ${valueText}`}>
                <span className="text-slate-600 truncate">{row.label}</span>
                <span className="h-3 bg-slate-100 rounded-r">
                  <span
                    className="block h-3 rounded-r"
                    style={{
                      width: `${Math.max(width, 1.5)}%`,
                      background: suppressed
                        ? "repeating-linear-gradient(45deg, #367C78 0 2px, transparent 2px 5px)"
                        : "#367C78",
                    }}
                  />
                </span>
                <span className={`tabular-nums text-right ${suppressed ? "text-slate-500 text-xs" : "font-medium text-[#19324D]"}`}>
                  {suppressed ? "<5" : row.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Stats() {
  const { data, loading, error } = useApi("/api/stats/summary/");

  if (loading && !data) return <Loading />;

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Anonymised Statistics"
        subtitle="Aggregate figures for oversight and planning. No names, descriptions or case references."
      />
      <ErrorBanner message={error} />
      {data && (
        <>
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="shrink-0 text-[#367C78]" />
            Counts from 1 to {data.suppression_threshold - 1} are shown as "&lt;{data.suppression_threshold}" (hatched bar) so that no child can be singled out in a small district.
            Generated {formatDate(data.generated_at, true)}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <Kpi label="Median time to acknowledge a referral" value={data.kpis.median_hours_to_acknowledge} suffix=" h" hint="Referral sent → accepted or declined" />
            <Kpi label="Acknowledged within 48 hours" value={data.kpis.percent_acknowledged_within_48h} suffix="%" />
            <Kpi label="Referrals completed" value={data.kpis.percent_referrals_completed} suffix="%" />
            <Kpi label="Public reports converted to cases" value={data.kpis.percent_reports_converted_to_cases} suffix="%" />
            <Kpi label="Pending referrals older than 48 h" value={data.kpis.pending_referrals_older_than_48h} />
            <Kpi label="Overdue follow-ups" value={data.kpis.overdue_follow_ups} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Kpi label="Public reports" value={data.totals.public_reports} />
            <Kpi label="Cases" value={data.totals.cases} />
            <Kpi label="Referrals" value={data.totals.referrals} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <BarList title="Public reports by district" rows={data.reports_by_district} />
            <BarList title="Public reports by channel" rows={data.reports_by_channel} />
            <BarList title="Public reports by concern" rows={data.reports_by_category} />
            <BarList title="Referrals by status" rows={data.referrals_by_status} />
            <BarList title="Cases by category" rows={data.cases_by_category} />
            <BarList title="Cases by age band" rows={data.cases_by_age_band} />
            <BarList title="Referrals by receiving institution" rows={data.referrals_by_receiving_institution} />
          </div>
        </>
      )}
    </div>
  );
}

export default Stats;
