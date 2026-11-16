import type { Metadata } from "next";
import Link from "next/link";
import { saveMarketingCampaignAction } from "@/app/admin/affiliates/actions";
import { ADMIN_ERRORS } from "@/app/admin/affiliates/messages";
import { formatPublishDate } from "@/lib/affiliate/format";
import { loadMarketingOffers, offerKindLabel, type MarketingOffer } from "@/lib/affiliate/marketing-offers";
import { loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import type { MarketingCampaignRecord } from "@/lib/affiliate/campaign-record";
import { loadAffiliateOverview, type AffiliateSummary } from "@/lib/affiliate/store";

export const metadata: Metadata = {
  title: "Campaigns",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "min-h-11 w-full min-w-0 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const areaClass =
  "mt-2 min-h-24 w-full rounded-2xl border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function sameName(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function postLabel(post: ContentSubmission) {
  if (post.contentStatus === "submitted") return "Waiting for review";
  if (post.contentStatus === "revision_requested") return "Changes requested";
  if (post.contentStatus === "approved") return "Approved";
  if (post.contentStatus === "rejected") return "Not approved";
  if (post.contentStatus === "draft") return "Draft";
  return "Post";
}

function offerLabel(offer: MarketingOffer) {
  if (offer.status === "sent") return "Waiting on affiliate";
  if (offer.status === "countered") return "Countered";
  if (offer.status === "accepted") return "Accepted";
  if (offer.status === "completed") return "Completed";
  if (offer.status === "paid") return "Paid";
  if (offer.status === "declined") return "Declined";
  if (offer.status === "withdrawn") return "Withdrawn";
  return "Offer";
}

function dateLine(record: MarketingCampaignRecord) {
  if (record.startsOn && record.endsOn) return `${formatPublishDate(record.startsOn)} – ${formatPublishDate(record.endsOn)}`;
  if (record.startsOn) return `Starts ${formatPublishDate(record.startsOn)}`;
  if (record.endsOn) return `Ends ${formatPublishDate(record.endsOn)}`;
  return "";
}

function CampaignFields({ record, affiliates, lockName = false }: { record?: MarketingCampaignRecord; affiliates: AffiliateSummary[]; lockName?: boolean }) {
  return (
    <>
      <input type="hidden" name="return" value="campaigns" />
      <input type="hidden" name="details" value="yes" />
      {lockName ? (
        <input type="hidden" name="name" value={record?.name ?? ""} />
      ) : (
        <label className="block text-sm text-brown">
          Name
          <input name="name" required maxLength={60} defaultValue={record?.name ?? ""} autoComplete="off" className={`${fieldClass} mt-2`} />
        </label>
      )}
      <label className="block text-sm text-brown">
        Description
        <textarea name="description" maxLength={500} defaultValue={record?.description ?? ""} className={areaClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-brown">
          Start date
          <input name="startsOn" type="date" defaultValue={record?.startsOn ?? ""} className={`${fieldClass} mt-2`} />
        </label>
        <label className="block text-sm text-brown">
          End date
          <input name="endsOn" type="date" defaultValue={record?.endsOn ?? ""} className={`${fieldClass} mt-2`} />
        </label>
      </div>
      <label className="block text-sm text-brown">
        Marketing goals
        <textarea name="goals" maxLength={500} defaultValue={record?.goals ?? ""} className={areaClass} />
      </label>
      <fieldset>
        <legend className="text-sm text-brown">Assigned affiliates</legend>
        {affiliates.length === 0 ? (
          <p className="mt-2 text-sm text-brown">No affiliate accounts yet.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {affiliates.map((affiliate) => (
              <label key={affiliate.code} className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="assigned" value={affiliate.code} defaultChecked={record?.assignedCodes.includes(affiliate.code) ?? false} className="size-4 accent-ink" />
                {affiliate.name} · {affiliate.code}
              </label>
            ))}
          </div>
        )}
      </fieldset>
    </>
  );
}

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const notice = query.notice === "created" || query.notice === "updated" ? "Campaign saved." : query.notice === "exists" ? "That campaign is already on the list." : "";
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  let loadError = "";
  let records: MarketingCampaignRecord[] = [];
  let offers: MarketingOffer[] = [];
  let posts: ContentSubmission[] = [];
  let affiliates: AffiliateSummary[] = [];
  try {
    const [campaigns, loadedOffers, loadedPosts, overview] = await Promise.all([
      loadMarketingCampaignRecords(),
      loadMarketingOffers(),
      loadContentSubmissions(),
      loadAffiliateOverview(),
    ]);
    records = campaigns;
    offers = loadedOffers;
    posts = loadedPosts.filter((post) => post.contentStatus !== "withdrawn");
    affiliates = [...overview.affiliates].sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    loadError = "Campaigns are unavailable right now.";
  }
  const affiliateNames = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Campaigns</h2>
          <p className="mt-2 max-w-2xl text-sm text-brown">
            Campaigns group posts and reporting. Assign one to the affiliates who may use it. A campaign does not set a rate or create a payment. Cost and profit stay on ROI.
          </p>
        </div>
        <Link href="/admin/affiliates/offers" className="text-sm font-medium text-ink underline underline-offset-4">
          Past monthly plans
        </Link>
      </div>
      {notice ? <p className="text-sm text-ink">{notice}</p> : null}
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <form action={saveMarketingCampaignAction} className="space-y-4 rounded-[28px] bg-white p-4 sm:p-6">
        <h3 className="text-xl">New campaign</h3>
        <p className="max-w-2xl text-sm text-brown">The name can be up to 60 letters, numbers, spaces, or &amp; &apos; . , -. Dates and goals are optional.</p>
        <CampaignFields affiliates={affiliates} />
        <button type="submit" className={buttonClass}>
          Save campaign
        </button>
      </form>

      {records.length === 0 ? (
        <p className="rounded-[28px] bg-white px-4 py-6 text-sm text-brown">No campaigns yet. Create one above.</p>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const planRows = offers.filter((offer) => offer.campaign && sameName(offer.campaign, record.name));
            const postRows = posts.filter((post) => post.campaign && sameName(post.campaign, record.name));
            const when = dateLine(record);
            const assigned = record.assignedCodes.map((code) => affiliateNames.get(code) ?? code);
            return (
              <section key={record.name} className="rounded-[28px] bg-white p-4 sm:p-6">
                <h3 className="text-xl">{record.name}</h3>
                {record.description ? <p className="mt-2 max-w-2xl text-sm text-brown">{record.description}</p> : null}
                {when ? <p className="mt-2 text-sm text-brown">{when}</p> : null}
                {record.goals ? <p className="mt-2 max-w-2xl text-sm text-brown">{record.goals}</p> : null}
                <p className="mt-2 text-sm text-brown">{assigned.length ? `Assigned to ${assigned.join(", ")}` : "Not assigned. Affiliates cannot select it yet."}</p>
                <form action={saveMarketingCampaignAction} className="mt-5 space-y-4 border-t border-rose/60 pt-5">
                  <h4 className="text-sm text-brown">Edit this campaign</h4>
                  <CampaignFields record={record} affiliates={affiliates} lockName />
                  <button type="submit" className={buttonClass}>
                    Save changes
                  </button>
                </form>
                {planRows.length === 0 && postRows.length === 0 ? (
                  <p className="mt-4 text-sm text-brown">No past plans or posts use this name.</p>
                ) : (
                  <div className="mt-4 grid gap-6 lg:grid-cols-2">
                    <div>
                      <h4 className="text-sm text-brown">Past monthly plans</h4>
                      {planRows.length === 0 ? (
                        <p className="mt-2 text-sm text-brown">None</p>
                      ) : (
                        <ul className="mt-2 divide-y divide-rose/60">
                          {planRows.map((offer) => (
                            <li key={offer.id} className="py-3 text-sm">
                              <Link href={`/admin/affiliates/offers?offer=${encodeURIComponent(offer.id)}`} className="font-medium text-ink underline underline-offset-4">
                                {offerKindLabel(offer.kind)}
                              </Link>
                              <p className="mt-1 text-brown">
                                {affiliateNames.get(offer.code) ?? offer.code} · {offerLabel(offer)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm text-brown">Posts</h4>
                      {postRows.length === 0 ? (
                        <p className="mt-2 text-sm text-brown">None</p>
                      ) : (
                        <ul className="mt-2 divide-y divide-rose/60">
                          {postRows.map((post) => (
                            <li key={post.id} className="py-3 text-sm">
                              <Link href={`/admin/affiliates/posts?post=${encodeURIComponent(post.id)}`} className="font-medium text-ink underline underline-offset-4">
                                {postLabel(post)}
                              </Link>
                              <p className="mt-1 text-brown">{affiliateNames.get(post.code) ?? post.code}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
