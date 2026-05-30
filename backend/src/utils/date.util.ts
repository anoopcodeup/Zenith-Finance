export const getMonthRange = (month: string) => {
  const [year, m] = month.split("-").map(Number);

  const start = new Date(Date.UTC(year, m - 1, 1));
  const end = new Date(Date.UTC(year, m, 1));

  return { start, end };
};

//   input: "2026-01"
//   output: [2026-01-01T00:00:00Z, 2026-02-01T00:00:00Z)
