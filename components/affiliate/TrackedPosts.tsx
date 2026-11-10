export type TrackedPostCard = {
  id: string;
  caption: string;
  postUrl: string | null;
  metrics: { label: string; value: string }[];
};

export function TrackedPosts({ posts }: { posts: TrackedPostCard[] }) {
  return (
    <section className="mt-6 border-t border-rose/60 pt-6">
      <h3 className="text-lg">Tracked posts</h3>
      <p className="mt-1 text-sm text-brown">These numbers come from Instagram and do not change commission or payouts.</p>
      {posts.length === 0 ? <p className="mt-4 text-sm text-brown">No tracked posts yet.</p> : null}
      {posts.length > 0 ? (
        <ul className="mt-4 divide-y divide-rose/60">
          {posts.map((post) => (
            <li key={post.id} className="py-4 text-sm">
              <p className="whitespace-pre-wrap break-words">{post.caption}</p>
              {post.postUrl ? (
                <p className="mt-2 break-all">
                  <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {post.postUrl}
                  </a>
                </p>
              ) : null}
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {post.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dt className="text-xs text-brown">{metric.label}</dt>
                    <dd className="mt-1">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
