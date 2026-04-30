import type { Post } from "~/types/post";
import type { PublisherName } from "~/constants/publishers";

export function usePosts(pub: Ref<PublisherName>, pageSize = 12) {
  const items = ref<Post[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loadingMore = ref(false);
  const error = ref<string | null>(null);
  const offset = ref(0);

  const hasMore = computed(() => items.value.length < total.value);

  async function loadInitial() {
    loading.value = true;
    error.value = null;
    offset.value = 0;

    try {
      const result = await fetchPostsDirect({
        pub: pub.value,
        take: pageSize,
        offset: 0,
      });
      items.value = result.posts;
      total.value = result.total;
      offset.value = result.posts.length;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch posts";
      items.value = [];
      total.value = 0;
      offset.value = 0;
    } finally {
      loading.value = false;
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return;
    loadingMore.value = true;
    error.value = null;

    try {
      const result = await fetchPostsDirect({
        pub: pub.value,
        take: pageSize,
        offset: offset.value,
      });
      items.value = [...items.value, ...result.posts];
      total.value = result.total;
      offset.value += result.posts.length;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch more posts";
    } finally {
      loadingMore.value = false;
    }
  }

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadInitial,
    loadMore,
  };
}
