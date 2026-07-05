import { filterReviews, getFallbackReviewDataset, VALID_REVIEW_SOURCES } from "../services/analysisService";

const startDate = process.argv[2] || "2026-01-01";
const endDate = process.argv[3] || new Date().toISOString().slice(0, 10);
const dataset = getFallbackReviewDataset();

console.log(`Review corpus diagnostics (${startDate} to ${endDate})`);

for (const source of VALID_REVIEW_SOURCES) {
  const sourceRows = dataset.filter((review) => review.source === source);
  const filtered = filterReviews(sourceRows, { sources: [source], startDate, endDate });

  console.log(
    [
      source,
      `raw=${sourceRows.length}`,
      "live=not-run",
      `fallback=${sourceRows.length}`,
      `afterDate=${filtered.length}`,
      `final=${filtered.length}`,
    ].join(" | ")
  );
}

const filteredAll = filterReviews(dataset, {
  sources: VALID_REVIEW_SOURCES,
  startDate,
  endDate,
});

console.log(`total=${filteredAll.length}`);
