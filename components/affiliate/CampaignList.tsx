"use client";

import Link from "next/link";
import { useState } from "react";
import {
  affiliateStateLabel,
  campaignListFilters,
  postStateLabel,
  statusLabel,
  type CampaignAffiliateState,
  type CampaignListModel,
  type CampaignListStatus,
  type CampaignPostState,
} from "@/lib/affiliate/campaign-list";

const STATUS_CHIP: Record<CampaignListStatus, string> = {
  draft: "bg-[#EFEAE9] text-[#4A3A37]",
  sent: "bg-[#FBEFD6] text-[#7A4E00]",
  active: "bg-ink text-white",
  completed: "bg-[#DDF0E4] text-[#1D6340]",
  cancelled: "bg-[#EFEAE9] text-[#4A3A37]",
};

const AFFILIATE_CHIP: Record<CampaignAffiliateState, string> = {
  invited: "bg-[#FBEFD6] text-[#7A4E00]",
  progress: "bg-[#F3E6E3] text-[#5A2A24]",
  completed: "bg-[#DDF0E4] text-[#1D6340]",
  declined: "bg-[#EFEAE9] text-[#4A3A37]",
};

const POST_CHIP: Record<CampaignPostState, string> = {
  todo: "bg-[#EFEAE9] text-[#4A3A37]",
  pending: "bg-[#FBEFD6] text-[#7A4E00]",
  changes: "bg-[#FBE3DF] text-[#9B2C1F]",
  ready: "bg-ink text-white",
  published: "bg-[#F3E6E3] text-[#5A2A24]",
  verified: "bg-[#DDF0E4] text-[#1D6340]",
  rejected: "bg-[#FBE3DF] text-[#9B2C1F]",
  failed: "bg-[#FBE3DF] text-[#9B2C1F]",
};

const COLUMNS = "minmax(0,2fr) minmax(0,1.3fr) minmax(4.5rem,0.8fr) minmax(0,1.5fr) minmax(4.5rem,0.8fr) auto";

function StatusPill({ status }: { status: CampaignListStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${STATUS_CHIP[status]}`}>{statusLabel(status)}</span>;
}

export function CampaignList({ rows }: { rows: CampaignListModel[] }) {
  const filters = campaignListFilters(rows);
  const [filter, setFilter] = useState<"all" | CampaignListStatus>("all");
  const [selected, setSelected] = useState(rows[0]?.id ?? "");
  const visible = rows.filter((row) => filter === "all" || row.status === filter);
  const current = visible.find((row) => row.id === selected) ?? visible[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-normal">Campaigns</h2>
          <p className="mt-1.5 text-[15px] text-[#4A3A37]">Invite affiliates to make specific content at agreed terms.</p>
        </div>
        <Link href="/admin/affiliates/campaigns/new" className="inline-flex h-[46px] items-center rounded-full bg-ink px-5 text-[15px] font-medium text-white">
          + Create campaign
        </Link>
      </div>
      <div role="group" aria-label="Campaign status" className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const on = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(item.id)}
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${on ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink"}`}
            >
              {item.label} {item.count}
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p className="rounded-3xl bg-white px-5 py-6 text-sm text-[#4A3A37]">No campaigns in this view.</p>
      ) : (
        <section className="rounded-3xl bg-white px-3 py-4 sm:px-5">
          <div className="hidden px-2.5 pb-2.5 text-[13px] font-semibold tracking-wide text-[#6B5A57] uppercase xl:grid" style={{ gridTemplateColumns: COLUMNS, gap: "16px" }}>
            <span>Campaign</span>
            <span>Dates</span>
            <span>Affiliates</span>
            <span>Posts verified</span>
            <span className="text-right">Budget</span>
            <span>Status</span>
          </div>
          <div className="flex flex-col">
            {visible.map((row) => {
              const on = current?.id === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelected(row.id)}
                  aria-current={on ? "true" : undefined}
                  className={`w-full border-t border-[#F0E8E6] px-2.5 py-3.5 text-left first:border-t-0 xl:grid xl:items-center xl:gap-4 xl:rounded-xl ${on ? "bg-[#F7F3F2]" : "bg-transparent"}`}
                  style={{ gridTemplateColumns: COLUMNS }}
                >
                  <span className="flex flex-col gap-3 xl:hidden">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 text-base font-semibold">{row.name}</span>
                      <StatusPill status={row.status} />
                    </span>
                    <span className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[12px] font-semibold text-[#6B5A57]">Dates</span>
                        <span className="text-sm">{row.dates}</span>
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[12px] font-semibold text-[#6B5A57]">Affiliates</span>
                        <span className="text-sm">{row.affiliateLine}</span>
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[12px] font-semibold text-[#6B5A57]">Budget</span>
                        <span className="text-sm font-semibold">{row.budgetLabel}</span>
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-[12px] font-semibold text-[#6B5A57]">Posts verified</span>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="h-2 min-w-10 flex-1 overflow-hidden rounded bg-[#E8DEDC]">
                            <span className="block h-2 bg-[#1D6340]" style={{ width: `${row.progressPct}%` }} />
                          </span>
                          <span className="text-sm whitespace-nowrap">{row.progress}</span>
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden xl:contents">
                    <span className="text-base font-semibold">{row.name}</span>
                    <span className="text-sm text-[#4A3A37]">{row.dates}</span>
                    <span className="text-[15px]">{row.affiliateLine}</span>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2 min-w-16 flex-1 overflow-hidden rounded bg-[#E8DEDC]">
                        <span className="block h-2 bg-[#1D6340]" style={{ width: `${row.progressPct}%` }} />
                      </span>
                      <span className="text-sm whitespace-nowrap">{row.progress}</span>
                    </span>
                    <span className="text-[15px] font-semibold xl:text-right">{row.budgetLabel}</span>
                    <span><StatusPill status={row.status} /></span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {current ? (
        <section aria-labelledby="campaign-detail-title" className="flex flex-col gap-4 rounded-3xl bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 id="campaign-detail-title" className="text-2xl font-semibold">{current.name}</h3>
                <StatusPill status={current.status} />
              </div>
              <p className="mt-1.5 text-[15px] text-[#4A3A37]">{current.meta}</p>
            </div>
            {current.pending > 0 ? (
              <Link href="/admin/affiliates/posts/pending" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-[15px] font-medium text-white">
                Review {current.pending} pending
              </Link>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {current.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
                <span className="text-sm text-[#4A3A37]">{stat.label}</span>
                <span className="text-2xl">{stat.value}</span>
              </div>
            ))}
          </div>
          {current.affiliates.length === 0 ? <p className="text-sm text-[#6B5A57]">No affiliates assigned yet.</p> : (
            <div className="flex flex-col">
              <div className="hidden px-2 pb-2.5 text-[13px] font-semibold tracking-wide text-[#6B5A57] uppercase xl:grid xl:grid-cols-[1.3fr_1fr_2fr_1.2fr_0.9fr_0.8fr] xl:gap-4">
                <span>Affiliate</span>
                <span>Status</span>
                <span>Posts</span>
                <span>Terms</span>
                <span className="text-right">Campaign earned</span>
                <span className="text-right">Performance</span>
              </div>
              {current.affiliates.map((affiliate) => (
                <div key={affiliate.code} className="grid grid-cols-2 items-center gap-x-4 gap-y-3 border-t border-[#F0E8E6] py-3.5 sm:grid-cols-3 xl:grid-cols-[1.3fr_1fr_2fr_1.2fr_0.9fr_0.8fr] xl:gap-4 xl:px-2">
                  <span className="col-span-2 flex min-w-0 flex-wrap items-center justify-between gap-2.5 sm:col-span-3 xl:col-span-1">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#F3CFCB] text-xs font-semibold">{affiliate.initials}</span>
                      <span className="text-base font-semibold">{affiliate.name}</span>
                    </span>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-[13px] font-semibold xl:hidden ${AFFILIATE_CHIP[affiliate.state]}`}>{affiliateStateLabel(affiliate.state)}</span>
                  </span>
                  <span className={`hidden w-fit rounded-full px-2.5 py-1 text-[13px] font-semibold xl:inline-flex ${AFFILIATE_CHIP[affiliate.state]}`}>{affiliateStateLabel(affiliate.state)}</span>
                  <span className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-3 xl:col-span-1">
                    <span className="text-[12px] font-semibold text-[#6B5A57] xl:hidden">Posts</span>
                    <span className="flex flex-wrap gap-1.5">
                      {affiliate.posts.map((post) => (
                        <span key={post.text} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${post.text === "Waiting for answer" ? "bg-transparent px-0 text-[#6B5A57]" : POST_CHIP[post.state]}`}>
                          {post.text}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[12px] font-semibold text-[#6B5A57] xl:hidden">Terms</span>
                    <span className="text-sm text-[#4A3A37]">{affiliate.terms}</span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5 xl:items-end">
                    <span className="text-[12px] font-semibold text-[#6B5A57] xl:hidden">Campaign earned</span>
                    <span className="text-[15px] font-semibold">{affiliate.earnedLabel}</span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5 xl:items-end">
                    <span className="text-[12px] font-semibold text-[#6B5A57] xl:hidden">Performance</span>
                    <span className="text-[13px] text-[#6B5A57]">{current.performance}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col">
            <h4 className="pb-2 text-base font-semibold">Live posts</h4>
            {current.livePosts.length === 0 ? (
              <p className="border-t border-[#F0E8E6] py-3 text-sm text-[#6B5A57]">No live posts for this campaign yet.</p>
            ) : (
              <ul>
                {current.livePosts.map((post) => (
                  <li key={post.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#F0E8E6] py-3">
                    <span className="flex min-w-0 flex-1 basis-60 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{post.name}</span>
                      <span className="break-words text-[13px] text-[#4A3A37]">{[post.caption, post.published ? `Published ${post.published}` : ""].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${POST_CHIP[post.state]}`}>{postStateLabel(post.state)}</span>
                    {post.url ? (
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-[#CDBDBA] px-4 text-[13px] font-medium text-ink hover:bg-[#F7F3F2]">
                        View post
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
