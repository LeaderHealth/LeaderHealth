import Link from "next/link";
import { formatCents } from "@/lib/affiliate/format";
import type { CampaignAffiliateBoard } from "@/lib/affiliate/roi";

function count(value: number) {
  return value.toLocaleString("en-US");
}

export function CampaignAffiliateRank({ boards }: { boards: CampaignAffiliateBoard[] }) {
  return (
    <section aria-labelledby="affiliate-rank-title" className="rounded-[28px] bg-white p-4 sm:p-6">
      <h3 id="affiliate-rank-title" className="text-xl">Affiliate rank</h3>
      <p className="mt-2 max-w-2xl text-sm text-brown">Affiliates who gained the most views, engagements, and orders for each campaign in this range. Orders are sales placed during that campaign&apos;s dates.</p>
      {boards.length === 0 ? (
        <p className="mt-5 text-sm text-brown">No affiliate stats for a campaign in this range.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-6">
          {boards.map((board) => (
            <div key={board.campaign}>
              <h4 className="text-base font-medium">{board.campaign}</h4>
              <ul className="mt-3 xl:hidden">
                {board.affiliates.map((affiliate) => (
                  <li key={affiliate.code} className="border-t border-ink/10 py-4 text-sm">
                    <div className="font-medium">
                      {affiliate.rank}.{" "}
                      <Link href={`/admin/affiliates/accounts?code=${encodeURIComponent(affiliate.code)}`} className="underline underline-offset-4">
                        {affiliate.name}
                      </Link>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                      <div>
                        <dt className="text-xs text-brown">Posts</dt>
                        <dd className="mt-1">{count(affiliate.posts)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Views</dt>
                        <dd className="mt-1">{count(affiliate.views)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Engagements</dt>
                        <dd className="mt-1">{count(affiliate.engagements)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Orders</dt>
                        <dd className="mt-1">{count(affiliate.orders)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Revenue</dt>
                        <dd className="mt-1">{formatCents(affiliate.revenueCents)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
              <table className="mt-3 hidden w-full table-fixed border-collapse text-left text-sm leading-6 xl:table">
                <thead className="text-brown">
                  <tr>
                    <th scope="col" className="w-[8%] py-3 pr-3 font-medium">Rank</th>
                    <th scope="col" className="w-[28%] py-3 pr-3 font-medium">Affiliate</th>
                    <th scope="col" className="w-[12%] py-3 pr-3 font-medium">Posts</th>
                    <th scope="col" className="w-[13%] py-3 pr-3 font-medium">Views</th>
                    <th scope="col" className="w-[15%] py-3 pr-3 font-medium">Engagements</th>
                    <th scope="col" className="w-[12%] py-3 pr-3 font-medium">Orders</th>
                    <th scope="col" className="w-[12%] py-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {board.affiliates.map((affiliate) => (
                    <tr key={affiliate.code} className="border-t border-rose/60">
                      <td className="py-4 pr-3">{affiliate.rank}</td>
                      <td className="py-4 pr-3 font-medium">
                        <Link href={`/admin/affiliates/accounts?code=${encodeURIComponent(affiliate.code)}`} className="underline underline-offset-4">
                          {affiliate.name}
                        </Link>
                      </td>
                      <td className="py-4 pr-3">{count(affiliate.posts)}</td>
                      <td className="py-4 pr-3">{count(affiliate.views)}</td>
                      <td className="py-4 pr-3">{count(affiliate.engagements)}</td>
                      <td className="py-4 pr-3">{count(affiliate.orders)}</td>
                      <td className="py-4">{formatCents(affiliate.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
