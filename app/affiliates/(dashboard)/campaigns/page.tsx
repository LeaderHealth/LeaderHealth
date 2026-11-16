import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPublishDate } from "@/lib/affiliate/format";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "My campaigns",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dateLine(startsOn: string, endsOn: string) {
  if (startsOn && endsOn) return `${formatPublishDate(startsOn)} – ${formatPublishDate(endsOn)}`;
  if (startsOn) return `Starts ${formatPublishDate(startsOn)}`;
  if (endsOn) return `Ends ${formatPublishDate(endsOn)}`;
  return "";
}

export default async function AffiliateCampaignsPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  let unavailable = false;
  let records: Awaited<ReturnType<typeof loadMarketingCampaignRecords>> = [];
  try {
    records = (await loadMarketingCampaignRecords()).filter((record) => record.assignedCodes.includes(affiliate.code));
  } catch {
    unavailable = true;
  }

  return (
    <div className="space-y-4 rounded-[28px] bg-white p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">My campaigns</h2>
          <p className="mt-2 max-w-2xl text-sm text-brown">
            These campaigns were assigned to you. You can attach one when you create a post, or send a post with no campaign. You cannot create or join a campaign on your own.
          </p>
        </div>
        <Link href="/affiliates/offers" className="text-sm font-medium text-ink underline underline-offset-4">
          Past monthly plans
        </Link>
      </div>
      {unavailable ? <p className="text-sm text-ink">Campaigns are unavailable right now.</p> : null}
      {!unavailable && records.length === 0 ? (
        <p className="text-sm text-brown">No campaigns are assigned to you. You can still create a post without one.</p>
      ) : null}
      {records.map((record) => {
        const when = dateLine(record.startsOn, record.endsOn);
        return (
          <section key={record.name} className="rounded-[24px] bg-background p-4 sm:p-5">
            <h3 className="text-xl">{record.name}</h3>
            {record.description ? <p className="mt-2 text-sm text-brown">{record.description}</p> : null}
            {when ? <p className="mt-2 text-sm text-brown">{when}</p> : null}
            {record.goals ? <p className="mt-2 text-sm text-brown">{record.goals}</p> : null}
            <Link href={`/affiliates/posts/new?campaign=${encodeURIComponent(record.name)}`} className="mt-4 inline-flex text-sm font-medium text-ink underline underline-offset-4">
              Create a post in this campaign
            </Link>
          </section>
        );
      })}
    </div>
  );
}
