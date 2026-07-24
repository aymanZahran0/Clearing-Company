import { prisma } from "../../lib/prisma.js";

// FR-007a/contracts/public-stats.md: real, computed home-page trust
// numbers. Each field is omitted (not sent as 0/null) when not yet
// meaningful, so the client never has to distinguish "no data" from a
// real zero.
export async function getPublicStats() {
  const [completedBookingsCount, ratingAggregate] = await Promise.all([
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);

  const stats: {
    completedBookingsCount?: number;
    averageRating?: number;
  } = {};

  if (completedBookingsCount > 0) {
    stats.completedBookingsCount = completedBookingsCount;
  }

  if (ratingAggregate._avg.rating !== null) {
    stats.averageRating = Math.round(ratingAggregate._avg.rating * 10) / 10;
  }

  return stats;
}
