"use client";

import { columns } from "../leaderboard-columns";
import { DataTable } from "../leaderboard-data-table";

export default function Leaderboard() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Splitrail Leaderboard</h1>
        <p className="text-muted-foreground">
          Competitive rankings for developers using agentic workflow tools.
        </p>
      </div>

      <DataTable columns={columns} />
    </>
  );
}
