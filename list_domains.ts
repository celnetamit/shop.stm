import { getDomainCountsFromCsv } from "./lib/journal-catalog";

async function run() {
  const counts = await getDomainCountsFromCsv();
  console.log(counts.map(c => c.domain));
}
run();
