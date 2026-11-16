import type { TikTokReviewList } from "@/lib/affiliate/tiktok-review";

const count = new Intl.NumberFormat("en-US");

export function TikTokVideos({ list }: { list: TikTokReviewList }) {
  return (
    <section className="mt-6 border-t border-rose/60 pt-6" aria-labelledby="tiktok-videos-title">
      <h3 id="tiktok-videos-title" className="text-lg">TikTok videos</h3>
      <p className="mt-1 text-sm text-brown">From {list.accountName}. These are the videos TikTok returned for the connected account.</p>
      {list.status === "unavailable" ? <p className="mt-4 text-sm text-ink">The video list could not be loaded.</p> : null}
      {list.status === "empty" ? <p className="mt-4 text-sm text-brown">No videos were returned.</p> : null}
      {list.status === "ready" ? (
        <ul className="mt-4 divide-y divide-rose/60">
          {list.videos.map((video) => (
            <li key={video.id} className="py-4 text-sm">
              <p className="whitespace-pre-wrap break-words">{video.caption.trim() || "No caption on this video."}</p>
              {video.shareUrl ? (
                <p className="mt-2 break-all">
                  <a href={video.shareUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {video.shareUrl}
                  </a>
                </p>
              ) : (
                <p className="mt-2 text-brown">No link was returned for this video.</p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Count label="Views" value={video.views} />
                <Count label="Likes" value={video.likes} />
                <Count label="Comments" value={video.comments} />
                <Count label="Shares" value={video.shares} />
              </dl>
              <p className="mt-3 text-brown">
                {video.matched
                  ? "Contains this affiliate’s tracking link, or matches a submitted post URL."
                  : "Does not contain the tracking link or match a submitted post URL."}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-brown">{label}</dt>
      <dd className="mt-1">{count.format(value)}</dd>
    </div>
  );
}
