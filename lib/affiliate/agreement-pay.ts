export const STANDARD_DELIVERABLE_DESCRIPTION =
  "Each live post is one deliverable. An independent post locks the standing rate per 1,000 views, the maximum payout, and the tracking period when it is sent. An accepted marketing offer locks that offer’s rate, maximum, and tracking period, and that offer can have only one post and one payment.";

export const STANDARD_PAYMENT_CONDITIONS =
  "The dollar amount is recorded views ÷ 1,000 × the locked rate, and it cannot exceed the locked maximum when one is set. It is calculated after the tracking period, once the views are on file, then an admin approves it. Lab commission stays separate.";

export function monthlyRateCondition(monthly: string, postTotal: number) {
  if (!monthly || postTotal <= 0) return "";
  const posts = postTotal === 1 ? "the 1 required post is" : `all ${postTotal} required posts are`;
  return `You also earn ${monthly} for each month in which ${posts} live. The monthly rate is added on top of view and engagement pay, and nothing is paid for a month with fewer live posts.`;
}
