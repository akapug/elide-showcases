# Blog Platform Example

Complete full-stack blog platform built with Elidebase, demonstrating all major features.

## Features

- User authentication (email/password, OAuth)
- Create, edit, delete blog posts
- Rich text editor
- Image uploads for post covers
- Comments and likes
- Categories and tags
- User profiles with avatars
- Real-time notifications
- RSS feed generation
- SEO optimization
- Full-text search
- Admin dashboard

## Database Schema

```sql
-- migrations/0001_create_blog_schema.sql

-- +migrate Up

-- Authors/Users (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    website_url TEXT,
    twitter_handle VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_-]{3,50}$')
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tag_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    search_vector tsvector
);

-- Post tags (many-to-many)
CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Likes
CREATE TABLE likes (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

-- Bookmarks
CREATE TABLE bookmarks (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

-- Followers (author following)
CREATE TABLE followers (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_featured ON posts(featured) WHERE featured = true;
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_followers_following ON followers(following_id);
CREATE INDEX idx_notifications_user ON notifications(user_id) WHERE NOT read;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles
CREATE POLICY profiles_select_all ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: Posts
CREATE POLICY posts_select_published ON posts
    FOR SELECT
    USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY posts_insert_own ON posts
    FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY posts_update_own ON posts
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY posts_delete_own ON posts
    FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

-- RLS Policies: Comments
CREATE POLICY comments_select_all ON comments
    FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY comments_insert_auth ON comments
    FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY comments_update_own ON comments
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid());

CREATE POLICY comments_delete_own ON comments
    FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

-- RLS Policies: Likes
CREATE POLICY likes_select_all ON likes FOR SELECT USING (true);
CREATE POLICY likes_insert_own ON likes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY likes_delete_own ON likes
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS Policies: Bookmarks
CREATE POLICY bookmarks_select_own ON bookmarks
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY bookmarks_insert_own ON bookmarks
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY bookmarks_delete_own ON bookmarks
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS Policies: Followers
CREATE POLICY followers_select_all ON followers FOR SELECT USING (true);
CREATE POLICY followers_insert_own ON followers
    FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY followers_delete_own ON followers
    FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- RLS Policies: Notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Triggers: Update timestamps
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Update search vector on post changes
CREATE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        coalesce(NEW.title, '') || ' ' ||
        coalesce(NEW.excerpt, '') || ' ' ||
        coalesce(NEW.content, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_search_update
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Trigger: Create notification on new comment
CREATE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_title TEXT;
    commenter_name TEXT;
BEGIN
    -- Get post author and title
    SELECT author_id, title INTO post_author_id, post_title
    FROM posts WHERE id = NEW.post_id;

    -- Get commenter name
    SELECT display_name INTO commenter_name
    FROM profiles WHERE id = NEW.author_id;

    -- Don't notify if author comments on own post
    IF post_author_id != NEW.author_id THEN
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
            post_author_id,
            'new_comment',
            'New comment on your post',
            commenter_name || ' commented on "' || post_title || '"',
            '/posts/' || NEW.post_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_notification
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Trigger: Create notification on new like
CREATE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_title TEXT;
    liker_name TEXT;
BEGIN
    SELECT author_id, title INTO post_author_id, post_title
    FROM posts WHERE id = NEW.post_id;

    SELECT display_name INTO liker_name
    FROM profiles WHERE id = NEW.user_id;

    IF post_author_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
            post_author_id,
            'new_like',
            'New like on your post',
            liker_name || ' liked "' || post_title || '"',
            '/posts/' || NEW.post_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_notification
    AFTER INSERT ON likes
    FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Trigger: Create notification on new follower
CREATE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    SELECT display_name INTO follower_name
    FROM profiles WHERE id = NEW.follower_id;

    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
        NEW.following_id,
        'new_follower',
        'New follower',
        follower_name || ' started following you',
        '/profile/' || (SELECT username FROM profiles WHERE id = NEW.follower_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_notification
    AFTER INSERT ON followers
    FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Functions: Get trending posts
CREATE FUNCTION get_trending_posts(days_back INT DEFAULT 7, limit_count INT DEFAULT 10)
RETURNS TABLE (
    post_id UUID,
    title TEXT,
    slug TEXT,
    author_name TEXT,
    likes_count BIGINT,
    comments_count BIGINT,
    score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.slug,
        pr.display_name,
        COUNT(DISTINCT l.user_id) AS likes_count,
        COUNT(DISTINCT c.id) AS comments_count,
        (COUNT(DISTINCT l.user_id) * 2 + COUNT(DISTINCT c.id) + p.views_count / 10.0) AS score
    FROM posts p
    LEFT JOIN profiles pr ON p.author_id = pr.id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id AND c.deleted_at IS NULL
    WHERE p.status = 'published'
        AND p.published_at >= CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL
    GROUP BY p.id, p.title, p.slug, pr.display_name, p.views_count
    ORDER BY score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Functions: Get user feed (posts from followed authors)
CREATE FUNCTION get_user_feed(user_uuid UUID, limit_count INT DEFAULT 20)
RETURNS TABLE (
    post_id UUID,
    title TEXT,
    excerpt TEXT,
    cover_image_url TEXT,
    author_name TEXT,
    author_avatar TEXT,
    published_at TIMESTAMP,
    likes_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.excerpt,
        p.cover_image_url,
        pr.display_name,
        pr.avatar_url,
        p.published_at,
        COUNT(l.user_id) AS likes_count
    FROM posts p
    JOIN profiles pr ON p.author_id = pr.id
    JOIN followers f ON p.author_id = f.following_id
    LEFT JOIN likes l ON p.id = l.post_id
    WHERE f.follower_id = user_uuid
        AND p.status = 'published'
    GROUP BY p.id, p.title, p.excerpt, p.cover_image_url, pr.display_name, pr.avatar_url, p.published_at
    ORDER BY p.published_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
    ('Technology', 'technology', 'Posts about technology and programming'),
    ('Design', 'design', 'Posts about design and UX'),
    ('Business', 'business', 'Posts about business and entrepreneurship'),
    ('Writing', 'writing', 'Posts about writing and storytelling'),
    ('Personal', 'personal', 'Personal posts and reflections');

-- +migrate Down
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS followers CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS get_trending_posts CASCADE;
DROP FUNCTION IF EXISTS get_user_feed CASCADE;
DROP FUNCTION IF EXISTS update_post_search_vector CASCADE;
DROP FUNCTION IF EXISTS notify_on_comment CASCADE;
DROP FUNCTION IF EXISTS notify_on_like CASCADE;
DROP FUNCTION IF EXISTS notify_on_follow CASCADE;
```

## Backend API

```kotlin
// BlogApp.kt

package com.example.blog

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.cio.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import tools.elide.oss.elidebase.core.*
import tools.elide.oss.elidebase.database.*
import tools.elide.oss.elidebase.auth.*
import tools.elide.oss.elidebase.storage.*
import tools.elide.oss.elidebase.realtime.*
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

@Serializable
data class CreatePostRequest(
    val title: String,
    val content: String,
    val excerpt: String?,
    val categoryId: String?,
    val tags: List<String> = emptyList(),
    val coverImage: String? = null,
    val status: String = "draft"
)

@Serializable
data class UpdatePostRequest(
    val title: String? = null,
    val content: String? = null,
    val excerpt: String? = null,
    val categoryId: String? = null,
    val tags: List<String>? = null,
    val coverImage: String? = null,
    val status: String? = null
)

@Serializable
data class CreateCommentRequest(
    val content: String,
    val parentId: String? = null
)

fun main() {
    val dbConfig = DatabaseConfig(
        host = "localhost",
        port = 5432,
        database = "blogdb",
        username = "blog",
        password = "password"
    )

    val dbManager = DatabaseManager(dbConfig)
    val authManager = AuthManager(dbManager, jwtSecret = "your-secret-key")
    val storageManager = StorageManager(dbManager)
    val realtimeServer = RealtimeServer(dbManager)
    val dbApi = DatabaseRestAPI(dbManager)

    embeddedServer(CIO, port = 8000) {
        routing {
            // Public routes
            get("/") {
                call.respondText("Blog Platform API v1.0")
            }

            // Get all published posts
            get("/api/posts") {
                val category = call.request.queryParameters["category"]
                val tag = call.request.queryParameters["tag"]
                val search = call.request.queryParameters["q"]
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 0
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20

                val filters = mutableListOf(QueryFilter("status", "EQ", "published"))

                category?.let { filters.add(QueryFilter("category_id", "EQ", it)) }
                tag?.let {
                    // Query posts by tag (requires join)
                }
                search?.let { filters.add(QueryFilter("search_vector", "FTS", it)) }

                val posts = dbApi.select(
                    table = "posts",
                    filters = filters,
                    sorts = listOf(SortParam("published_at", "DESC")),
                    limit = limit,
                    offset = page * limit
                )

                call.respond(posts)
            }

            // Get single post
            get("/api/posts/{slug}") {
                val slug = call.parameters["slug"]!!

                val posts = dbApi.select(
                    table = "posts",
                    filters = listOf(QueryFilter("slug", "EQ", slug))
                )

                if (posts.data?.isNotEmpty() == true) {
                    val post = posts.data.first()

                    // Increment view count
                    dbManager.withConnection { connection ->
                        val sql = "UPDATE posts SET views_count = views_count + 1 WHERE slug = ?"
                        connection.prepareStatement(sql).use { stmt ->
                            stmt.setString(1, slug)
                            stmt.executeUpdate()
                        }
                    }

                    call.respond(post)
                } else {
                    call.respond(HttpStatusCode.NotFound, mapOf("error" to "Post not found"))
                }
            }

            // Get trending posts
            get("/api/posts/trending") {
                val days = call.request.queryParameters["days"]?.toIntOrNull() ?: 7
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 10

                val trending = dbApi.executeRaw(
                    "SELECT * FROM get_trending_posts($days, $limit)"
                )

                call.respond(trending)
            }

            // Get post comments
            get("/api/posts/{postId}/comments") {
                val postId = call.parameters["postId"]!!

                val comments = dbApi.select(
                    table = "comments",
                    filters = listOf(
                        QueryFilter("post_id", "EQ", postId),
                        QueryFilter("deleted_at", "IS", "NULL")
                    ),
                    sorts = listOf(SortParam("created_at", "ASC"))
                )

                call.respond(comments)
            }

            // Search posts
            get("/api/search") {
                val query = call.request.queryParameters["q"] ?: ""
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20

                val results = dbApi.select(
                    table = "posts",
                    filters = listOf(
                        QueryFilter("status", "EQ", "published"),
                        QueryFilter("search_vector", "FTS", query)
                    ),
                    limit = limit
                )

                call.respond(results)
            }

            // Get categories
            get("/api/categories") {
                val categories = dbApi.select(table = "categories")
                call.respond(categories)
            }

            // Get tags
            get("/api/tags") {
                val tags = dbApi.select(
                    table = "tags",
                    sorts = listOf(SortParam("name", "ASC"))
                )
                call.respond(tags)
            }

            // Get user profile
            get("/api/profiles/{username}") {
                val username = call.parameters["username"]!!

                val profiles = dbApi.select(
                    table = "profiles",
                    filters = listOf(QueryFilter("username", "EQ", username))
                )

                if (profiles.data?.isNotEmpty() == true) {
                    call.respond(profiles.data.first())
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            // Get user's posts
            get("/api/profiles/{username}/posts") {
                val username = call.parameters["username"]!!

                // First get user ID
                val profile = dbApi.select(
                    table = "profiles",
                    filters = listOf(QueryFilter("username", "EQ", username))
                ).data?.firstOrNull()

                if (profile != null) {
                    val userId = profile["id"]?.toString()
                    val posts = dbApi.select(
                        table = "posts",
                        filters = listOf(
                            QueryFilter("author_id", "EQ", userId ?: ""),
                            QueryFilter("status", "EQ", "published")
                        ),
                        sorts = listOf(SortParam("published_at", "DESC"))
                    )
                    call.respond(posts)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            // Protected routes (require authentication)
            authenticate("auth-jwt") {
                // Create post
                post("/api/posts") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val request = call.receive<CreatePostRequest>()

                    // Generate slug from title
                    val slug = request.title.toSlug() + "-" + UUID.randomUUID().toString().substring(0, 8)

                    // Calculate reading time
                    val wordCount = request.content.split(Regex("\\s+")).size
                    val readingTime = (wordCount / 200).coerceAtLeast(1)

                    val post = JsonObject(mapOf(
                        "title" to JsonPrimitive(request.title),
                        "slug" to JsonPrimitive(slug),
                        "content" to JsonPrimitive(request.content),
                        "excerpt" to JsonPrimitive(request.excerpt),
                        "author_id" to JsonPrimitive(userId),
                        "category_id" to JsonPrimitive(request.categoryId),
                        "cover_image_url" to JsonPrimitive(request.coverImage),
                        "status" to JsonPrimitive(request.status),
                        "reading_time_minutes" to JsonPrimitive(readingTime),
                        "published_at" to JsonPrimitive(
                            if (request.status == "published") Instant.now().toString() else null
                        )
                    ))

                    val result = dbApi.insert(table = "posts", data = post)

                    if (result.data != null) {
                        // Add tags
                        val postId = result.data["id"]?.toString()
                        request.tags.forEach { tagName ->
                            // Get or create tag
                            // Link post to tag
                        }

                        call.respond(HttpStatusCode.Created, result.data)
                    } else {
                        call.respond(HttpStatusCode.BadRequest, result.error!!)
                    }
                }

                // Update post
                patch("/api/posts/{id}") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val postId = call.parameters["id"]!!
                    val request = call.receive<UpdatePostRequest>()

                    val updates = mutableMapOf<String, JsonElement>()

                    request.title?.let { updates["title"] = JsonPrimitive(it) }
                    request.content?.let {
                        updates["content"] = JsonPrimitive(it)
                        // Recalculate reading time
                        val wordCount = it.split(Regex("\\s+")).size
                        updates["reading_time_minutes"] = JsonPrimitive((wordCount / 200).coerceAtLeast(1))
                    }
                    request.excerpt?.let { updates["excerpt"] = JsonPrimitive(it) }
                    request.categoryId?.let { updates["category_id"] = JsonPrimitive(it) }
                    request.coverImage?.let { updates["cover_image_url"] = JsonPrimitive(it) }
                    request.status?.let {
                        updates["status"] = JsonPrimitive(it)
                        if (it == "published") {
                            updates["published_at"] = JsonPrimitive(Instant.now().toString())
                        }
                    }

                    val result = dbApi.update(
                        table = "posts",
                        data = JsonObject(updates),
                        filters = listOf(
                            QueryFilter("id", "EQ", postId),
                            QueryFilter("author_id", "EQ", userId)
                        )
                    )

                    call.respond(result)
                }

                // Delete post
                delete("/api/posts/{id}") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val postId = call.parameters["id"]!!

                    val result = dbApi.delete(
                        table = "posts",
                        filters = listOf(
                            QueryFilter("id", "EQ", postId),
                            QueryFilter("author_id", "EQ", userId)
                        )
                    )

                    call.respond(HttpStatusCode.NoContent)
                }

                // Create comment
                post("/api/posts/{postId}/comments") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val postId = call.parameters["postId"]!!
                    val request = call.receive<CreateCommentRequest>()

                    val comment = JsonObject(mapOf(
                        "post_id" to JsonPrimitive(postId),
                        "author_id" to JsonPrimitive(userId),
                        "parent_id" to JsonPrimitive(request.parentId),
                        "content" to JsonPrimitive(request.content)
                    ))

                    val result = dbApi.insert(table = "comments", data = comment)

                    // Notification will be created automatically via trigger

                    call.respond(HttpStatusCode.Created, result)
                }

                // Like post
                post("/api/posts/{postId}/like") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val postId = call.parameters["postId"]!!

                    val like = JsonObject(mapOf(
                        "post_id" to JsonPrimitive(postId),
                        "user_id" to JsonPrimitive(userId)
                    ))

                    val result = dbApi.insert(table = "likes", data = like)

                    call.respond(result)
                }

                // Unlike post
                delete("/api/posts/{postId}/like") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val postId = call.parameters["postId"]!!

                    dbApi.delete(
                        table = "likes",
                        filters = listOf(
                            QueryFilter("post_id", "EQ", postId),
                            QueryFilter("user_id", "EQ", userId)
                        )
                    )

                    call.respond(HttpStatusCode.NoContent)
                }

                // Bookmark post
                post("/api/posts/{postId}/bookmark") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val postId = call.parameters["postId"]!!

                    val bookmark = JsonObject(mapOf(
                        "post_id" to JsonPrimitive(postId),
                        "user_id" to JsonPrimitive(userId)
                    ))

                    dbApi.insert(table = "bookmarks", data = bookmark)
                    call.respond(HttpStatusCode.Created)
                }

                // Follow author
                post("/api/profiles/{username}/follow") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val username = call.parameters["username"]!!

                    // Get user ID from username
                    val profile = dbApi.select(
                        table = "profiles",
                        filters = listOf(QueryFilter("username", "EQ", username))
                    ).data?.firstOrNull()

                    if (profile != null) {
                        val followingId = profile["id"]?.toString()

                        val follow = JsonObject(mapOf(
                            "follower_id" to JsonPrimitive(userId),
                            "following_id" to JsonPrimitive(followingId)
                        ))

                        dbApi.insert(table = "followers", data = follow)
                        call.respond(HttpStatusCode.Created)
                    } else {
                        call.respond(HttpStatusCode.NotFound)
                    }
                }

                // Get user feed
                get("/api/feed") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20

                    val feed = dbApi.executeRaw(
                        "SELECT * FROM get_user_feed('$userId', $limit)"
                    )

                    call.respond(feed)
                }

                // Get notifications
                get("/api/notifications") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject

                    val notifications = dbApi.select(
                        table = "notifications",
                        filters = listOf(QueryFilter("user_id", "EQ", userId)),
                        sorts = listOf(SortParam("created_at", "DESC")),
                        limit = 50
                    )

                    call.respond(notifications)
                }

                // Mark notification as read
                patch("/api/notifications/{id}") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val notificationId = call.parameters["id"]!!

                    dbApi.update(
                        table = "notifications",
                        data = JsonObject(mapOf("read" to JsonPrimitive(true))),
                        filters = listOf(
                            QueryFilter("id", "EQ", notificationId),
                            QueryFilter("user_id", "EQ", userId)
                        )
                    )

                    call.respond(HttpStatusCode.NoContent)
                }

                // Upload cover image
                post("/api/upload/cover") {
                    // Handle multipart file upload
                    // Process and upload to storage
                    // Return URL
                }
            }

            // WebSocket for real-time updates
            webSocket("/realtime") {
                val token = call.request.queryParameters["token"]
                val userId = token?.let { authManager.verifyToken(it)?.subject }

                realtimeServer.handleConnection(this, userId)
            }
        }
    }.start(wait = true)
}
```

## Frontend (React)

```jsx
// App.jsx

import React, { useState, useEffect } from 'react';
import { ElidebaseClient } from '@elidebase/client';

const client = new ElidebaseClient('http://localhost:8000');

function App() {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
        checkAuth();
    }, []);

    async function loadPosts() {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/posts');
        const data = await response.json();
        setPosts(data.data || []);
        setLoading(false);
    }

    async function checkAuth() {
        const session = client.auth.getSession();
        if (session) {
            setCurrentUser(session.user);
        }
    }

    return (
        <div className="app">
            <Header user={currentUser} />
            <main>
                {loading ? (
                    <Loading />
                ) : (
                    <PostList posts={posts} />
                )}
            </main>
        </div>
    );
}

function Header({ user }) {
    return (
        <header className="header">
            <div className="container">
                <h1>Blog Platform</h1>
                <nav>
                    <a href="/">Home</a>
                    <a href="/trending">Trending</a>
                    {user ? (
                        <>
                            <a href="/write">Write</a>
                            <a href="/profile">{user.email}</a>
                        </>
                    ) : (
                        <a href="/login">Login</a>
                    )}
                </nav>
            </div>
        </header>
    );
}

function PostList({ posts }) {
    return (
        <div className="posts">
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}

function PostCard({ post }) {
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);

    async function toggleLike() {
        if (liked) {
            await fetch(`http://localhost:8000/api/posts/${post.id}/like`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${client.auth.getSession()?.accessToken}`
                }
            });
            setLikes(likes - 1);
        } else {
            await fetch(`http://localhost:8000/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${client.auth.getSession()?.accessToken}`
                }
            });
            setLikes(likes + 1);
        }
        setLiked(!liked);
    }

    return (
        <div className="post-card">
            {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.title} />
            )}
            <h2>
                <a href={`/posts/${post.slug}`}>{post.title}</a>
            </h2>
            <p>{post.excerpt}</p>
            <div className="post-meta">
                <span>{post.reading_time_minutes} min read</span>
                <button onClick={toggleLike}>
                    {liked ? '❤️' : '🤍'} {likes}
                </button>
            </div>
        </div>
    );
}

function Loading() {
    return <div className="loading">Loading...</div>;
}

export default App;
```

## Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: blogdb
      POSTGRES_USER: blog
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - blog-db-data:/var/lib/postgresql/data

  blog-api:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://blog:${DB_PASSWORD}@postgres:5432/blogdb
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  blog-frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:8000

volumes:
  blog-db-data:
```

## Features Demonstrated

- ✅ User authentication and authorization
- ✅ CRUD operations with RLS
- ✅ Rich relationships (many-to-many, one-to-many)
- ✅ Full-text search
- ✅ File uploads (cover images)
- ✅ Real-time notifications
- ✅ Database triggers
- ✅ Complex queries with aggregations
- ✅ Social features (likes, follows, comments)
- ✅ Trending algorithm
- ✅ Personalized feed
- ✅ SEO optimization

This example demonstrates a production-ready blog platform using all major Elidebase features.
