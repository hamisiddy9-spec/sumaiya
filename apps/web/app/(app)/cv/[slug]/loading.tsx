// CV-shaped skeleton for the public share page. Because the page is
// force-dynamic (fetched fresh per request), a tailored skeleton beats the
// generic app spinner — the visitor immediately sees a CV taking shape.
export default function LoadingPublicCv() {
  return (
    <div className="min-h-dvh bg-sand-2 flex flex-col">
      <main className="flex-1 w-full px-3 sm:px-6 pt-6 sm:pt-10 pb-28">
        <div
          className="w-full mx-auto bg-white rounded-[3px] shadow-[0_10px_50px_rgba(0,0,0,0.14)] overflow-hidden"
          style={{ maxWidth: 794, aspectRatio: "794 / 1123" }}
          aria-hidden="true"
        >
          <div className="p-10 sm:p-14 animate-pulse">
            <div className="h-8 w-1/2 bg-sand rounded mb-3" />
            <div className="h-4 w-1/3 bg-sand-2 rounded mb-8" />
            <div className="space-y-2.5 mb-9">
              <div className="h-3 w-full bg-sand-2 rounded" />
              <div className="h-3 w-11/12 bg-sand-2 rounded" />
              <div className="h-3 w-4/5 bg-sand-2 rounded" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="mb-7">
                <div className="h-4 w-1/4 bg-sand rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-sand-2 rounded" />
                  <div className="h-3 w-10/12 bg-sand-2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
