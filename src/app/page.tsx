export default function HomePage() {
  return (
    <main>
      <header className="masthead"><a className="wordmark" href="/">PLAYFORGE<span aria-hidden="true">✳</span></a><span className="edition">THE UNIVERSE STARTS HERE</span></header>
      <section className="hero" aria-labelledby="title">
        <p className="eyebrow">IN DEVELOPMENT / LIMITLESS BY DESIGN</p>
        <h1 id="title">Worlds worth<br /><span>playing.</span></h1>
        <p className="intro">Build your empire. Chase the apex. Explore the unknown. A new universe of browser games is taking shape.</p>
        <a className="button" href="#vision">Enter the vision</a>
        <div className="orbital" aria-hidden="true"><i /><i /><i /><span>PF</span></div>
      </section>
      <section id="vision" className="vision" aria-labelledby="vision-title">
        <p className="eyebrow">MANY GENRES. ONE PLAYFORGE.</p>
        <h2 id="vision-title">A bigger playground.</h2>
        <div className="worlds">
          <article><span className="symbol" aria-hidden="true">◈</span><h3>Discover worlds</h3><p>Action, RPG, racing, strategy, simulation and experiments that break the mold.</p></article>
          <article><span className="symbol" aria-hidden="true">✳</span><h3>Find your rivals</h3><p>A future home for shared adventures, competitive rooms and tournaments.</p></article>
          <article><span className="symbol" aria-hidden="true">▧</span><h3>Forge something new</h3><p>A creator workshop for player-made levels and experiences.</p></article>
        </div>
      </section>
      <footer><span>PLAYFORGE</span><span>Foundation preview · Games and online services are in development.</span></footer>
    </main>
  );
}
