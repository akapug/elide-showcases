<template>
  <div class="home">
    <Hero
      title="Elide Nuxt Blog"
      subtitle="Lightning-fast Vue blogging with Elide"
    />

    <section class="posts">
      <h2>Latest Posts</h2>
      <div class="grid">
        <PostCard
          v-for="post in posts"
          :key="post.slug"
          :post="post"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Auto-imported: useFetch, ref, computed
const { data: posts } = await useFetch('/api/posts');

// Auto-imported: useHead
useHead({
  title: 'Elide Nuxt Blog',
  meta: [
    { name: 'description', content: 'A blazing fast blog' },
  ],
});
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
</style>
