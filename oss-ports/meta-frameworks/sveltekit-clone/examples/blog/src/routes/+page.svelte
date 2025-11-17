<script lang="ts">
  export let data;
</script>

<svelte:head>
  <title>Elide SvelteKit Blog</title>
  <meta name="description" content="Lightning-fast Svelte blogging" />
</svelte:head>

<div class="home">
  <header class="hero">
    <h1>Elide SvelteKit Blog</h1>
    <p>Experience the fastest Svelte framework on the planet</p>

    <div class="stats">
      <div class="stat">
        <div class="value">32ms</div>
        <div class="label">Cold Start</div>
      </div>
      <div class="stat">
        <div class="value">2.1ms</div>
        <div class="label">SSR</div>
      </div>
      <div class="stat">
        <div class="value">5.2s</div>
        <div class="label">Build Time</div>
      </div>
    </div>
  </header>

  <section class="posts">
    <h2>Latest Posts</h2>
    <div class="grid">
      {#each data.posts as post}
        <article class="post-card">
          <a href="/posts/{post.slug}">
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <div class="meta">
              <span>{post.author}</span>
              <span>{post.date}</span>
            </div>
          </a>
        </article>
      {/each}
    </div>
  </section>
</div>

<style>
  .home {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .hero {
    text-align: center;
    padding: 4rem 0;
  }

  .hero h1 {
    font-size: 3.5rem;
    margin: 0;
    color: #ff3e00;
  }

  .hero p {
    font-size: 1.5rem;
    color: #666;
  }

  .stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-top: 3rem;
  }

  .stat {
    text-align: center;
  }

  .stat .value {
    font-size: 2.5rem;
    font-weight: bold;
    color: #ff3e00;
  }

  .stat .label {
    font-size: 0.875rem;
    color: #999;
    text-transform: uppercase;
  }

  .posts {
    margin-top: 4rem;
  }

  .posts h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }

  .post-card {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }

  .post-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .post-card a {
    text-decoration: none;
    color: inherit;
  }

  .post-card h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .post-card p {
    color: #666;
    line-height: 1.6;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #999;
  }
</style>
