# Buildora — Rating & Review System
## Product Design & Architecture Document

**Version:** 1.0  
**Date:** May 29, 2026  
**Author:** Senior PM & Software Architect  
**Status:** Pre-Implementation Design

---

## Table of Contents

1. [Feature Specification](#1-feature-specification)
2. [User Flow & Contractor Flow](#2-user-flow--contractor-flow)
3. [Database Schema Design (MongoDB)](#3-database-schema-design-mongodb)
4. [API Endpoints](#4-api-endpoints)
5. [Security & Fraud Prevention](#5-security--fraud-prevention)
6. [Edge Cases](#6-edge-cases)
7. [UI/UX Recommendations](#7-uiux-recommendations)
8. [How Top Platforms Handle Reviews](#8-how-top-platforms-handle-reviews)
9. [Trust-Building & Competitive Advantage](#9-trust-building--competitive-advantage)

---

## 1. Feature Specification

### 1.1 Overview

The Rating & Review system is Buildora's primary trust layer — enabling homeowners and clients to evaluate contractors based on real project outcomes, and giving contractors a reputation asset they can build over time. The system must be honest, resistant to manipulation, and actionable for both sides.

### 1.2 Core Requirements

**Review Eligibility**
- A review can only be submitted after the associated project's status is `completed`.
- Only the client (user) who hired the contractor on that specific project may leave a review.
- One review per user per project — no editing after a grace period of 48 hours.
- Contractors cannot review themselves, cannot review projects they were not hired for, and cannot submit reviews as clients.

**Rating Scale**
- 1 to 5 stars, whole numbers only (no half-stars on submission; display can show averages with decimals).
- Star rating is mandatory; written review text is optional but strongly encouraged via UX nudges.

**Review Content**
- Written review: up to 1,000 characters.
- Optional photo upload: up to 5 project photos (before/after encouraged), max 10 MB each, JPEG/PNG/WebP only.
- Optional category sub-ratings: Quality of Work, Communication, Timeliness, Value for Money (each 1–5 stars). These are optional but enrich the profile.
- Optional tags: pre-defined labels the user can select (e.g., "On time", "Clean workspace", "Great communication", "Would hire again").

**Contractor Profile Display**
- Overall average rating (calculated live from all non-hidden reviews).
- Total review count.
- Rating breakdown: percentage and count for each star tier (5-star through 1-star), shown as a horizontal bar chart.
- Sub-rating averages (Quality, Communication, Timeliness, Value) if enough data exists (minimum 3 reviews).
- Selected tags with counts (e.g., "Would hire again · 42").
- Recent reviews paginated (default 5, load more on demand), sorted newest-first by default; sortable by Most Helpful and Lowest Rated.
- Contractor reply displayed below each review inline.

**Contractor Replies**
- A contractor may post one reply per review.
- Reply limit: 500 characters.
- Replies are not ratings — they do not affect the score.
- Reply can be edited within 24 hours of posting; after that it is locked.

**Search Ranking Impact**
- Average rating is a weighted signal in search ranking alongside recency, job completion rate, and response time.
- Contractors with fewer than 3 reviews are ranked lower in search regardless of score (insufficient data).
- A contractor with a high volume of recent positive reviews gets a ranking boost (recency-weighted rolling average).

**Admin Moderation**
- Admins can: hide a review (soft-delete, not visible publicly but retained in DB), permanently delete a review, flag a review for secondary review, add an internal note.
- Hiding a review recalculates the contractor's average immediately.
- Admins receive a dashboard showing flagged and reported reviews.

**Future: Verified Reviews**
- A review earns a "Verified Project" badge when it is linked to a project paid through Buildora's platform (payment record exists).
- Third-party verification (e.g., photo metadata, project invoice match) is a Phase 2 feature.

**Future: Review Reporting**
- Users and contractors can report a review as inappropriate, spam, or fake.
- Reports are queued for admin review; repeated reports auto-flag for priority.

---

## 2. User Flow & Contractor Flow

### 2.1 User (Client) — Submitting a Review

```
Project marked as "Completed" by both parties
        │
        ▼
User receives push notification + email:
"Your project with [Contractor Name] is complete. Share your experience."
        │
        ▼
User opens the completed project card in their dashboard
        │
        ▼
"Leave a Review" CTA is prominently displayed
        │
        ▼
Review modal / dedicated page opens:
  Step 1 — Star Rating (required, 1–5)
  Step 2 — Sub-ratings (optional): Quality / Communication / Timeliness / Value
  Step 3 — Tags selection (optional, multi-select chips)
  Step 4 — Written review (optional, 1,000 char limit with live counter)
  Step 5 — Photo upload (optional, drag-and-drop or file picker)
        │
        ▼
"Submit Review" button
        │
        ├─ Review saved, contractor average recalculated
        │
        ▼
Confirmation screen: "Thank you! Your review helps others find great contractors."
  → Option: "Share your review" (social share)
        │
        ▼
Contractor receives notification: "You have a new review!"
        │
        ▼
Review appears publicly on contractor's profile within seconds
(admin moderation queue runs asynchronously in background)
```

**Review Edit Window:**
- User can edit their review within 48 hours of submission.
- After 48 hours, review is locked. User must contact support to dispute.

**Review Reminder:**
- If user has not reviewed within 7 days of project completion, send a single reminder notification/email.
- If still no review after 14 days, the CTA is surfaced on next app open (not again after that — avoid spam).

---

### 2.2 Contractor Flow — Responding to a Review

```
Contractor receives notification: "[User Name] left you a review."
        │
        ▼
Contractor opens review in their dashboard under "My Reviews"
        │
        ▼
Contractor reads the review (star rating + written text + photos)
        │
        ▼
Option: "Reply to this review"
        │
        ▼
Reply textarea opens (500 char limit, live counter)
Placeholder guidance: "Thank the client, address concerns professionally.
                        Your reply is public."
        │
        ▼
"Post Reply" → Reply saved, appears publicly under the review
        │
        ▼
User receives notification: "[Contractor Name] replied to your review."
```

**Contractor Dispute Flow (separate from reply):**
- Contractor can flag a review as "inaccurate or unfair" via a separate "Report Review" link.
- This queues it for admin review — the review remains visible until admin acts.
- Contractors cannot remove reviews themselves.

---

### 2.3 Admin Moderation Flow

```
Reported / flagged review appears in Admin Moderation Queue
        │
        ▼
Admin reviews: original review, contractor's report reason,
               project details, user history
        │
        ├─ No action: Dismiss report, review stays
        ├─ Hide review: Soft-delete, recalculate average
        ├─ Delete permanently: Hard delete, recalculate average
        └─ Request edit: Contact user to revise (edge case)
        │
        ▼
Both parties notified of the outcome
```

---

## 3. Database Schema Design (MongoDB)

### 3.1 Collections Overview

- `reviews` — core review documents
- `review_replies` — contractor replies (1:1 with a review)
- `review_reports` — user/contractor reports of reviews
- `contractor_rating_summary` — denormalized aggregates for fast reads
- `projects` — existing collection; requires `status` and `reviewSubmitted` fields

---

### 3.2 `reviews` Collection

```js
{
  _id: ObjectId,

  // Relationship
  projectId: ObjectId,          // ref: projects._id (unique constraint with userId)
  contractorId: ObjectId,       // ref: users._id (the contractor being reviewed)
  userId: ObjectId,             // ref: users._id (the reviewer — must be the client)

  // Core rating
  overallRating: Number,        // 1–5, integer, required

  // Sub-ratings (optional)
  subRatings: {
    quality: Number,            // 1–5 or null
    communication: Number,
    timeliness: Number,
    value: Number
  },

  // Tags (optional)
  tags: [String],               // e.g. ["on_time", "great_communication"]

  // Content
  reviewText: String,           // max 1,000 chars, optional
  photos: [
    {
      url: String,              // CDN URL (S3 / Cloudinary)
      thumbnailUrl: String,
      uploadedAt: Date,
      metadata: {
        originalName: String,
        sizeBytes: Number,
        mimeType: String
      }
    }
  ],

  // Verification
  isVerifiedProject: Boolean,   // true if payment record exists in platform
  verificationSource: String,   // "platform_payment" | "manual_admin" | null

  // Moderation
  status: String,               // "visible" | "hidden" | "deleted" | "under_review"
  adminNote: String,            // internal only, not exposed to users
  moderatedBy: ObjectId,        // admin user id
  moderatedAt: Date,

  // Helpfulness (future)
  helpfulCount: Number,         // upvotes from other users
  notHelpfulCount: Number,

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  editableUntil: Date,          // createdAt + 48h
  deletedAt: Date               // soft delete timestamp
}

// Indexes:
// { projectId: 1, userId: 1 }  — unique (prevents duplicate reviews)
// { contractorId: 1, status: 1, createdAt: -1 }  — profile display
// { status: 1, createdAt: -1 }  — admin queue
// { userId: 1 }                — "my reviews" page
```

---

### 3.3 `review_replies` Collection

```js
{
  _id: ObjectId,
  reviewId: ObjectId,           // ref: reviews._id, unique (one reply per review)
  contractorId: ObjectId,       // must match review.contractorId
  replyText: String,            // max 500 chars
  status: String,               // "visible" | "hidden"
  editableUntil: Date,          // createdAt + 24h
  createdAt: Date,
  updatedAt: Date
}

// Index: { reviewId: 1 } — unique
```

---

### 3.4 `review_reports` Collection

```js
{
  _id: ObjectId,
  reviewId: ObjectId,           // ref: reviews._id
  reportedBy: ObjectId,         // user or contractor id
  reporterRole: String,         // "client" | "contractor"
  reason: String,               // "fake" | "spam" | "inappropriate" | "inaccurate" | "other"
  description: String,          // optional free text, max 500 chars
  status: String,               // "pending" | "reviewed" | "dismissed"
  resolvedBy: ObjectId,         // admin id
  resolvedAt: Date,
  createdAt: Date
}

// Index: { reviewId: 1, reportedBy: 1 } — unique (one report per user per review)
// Index: { status: 1, createdAt: 1 }   — admin queue sorted by oldest first
```

---

### 3.5 `contractor_rating_summary` Collection

This is a **denormalized aggregate** — updated asynchronously whenever a review is added, hidden, or deleted. It powers fast reads on profile and search pages without real-time aggregation.

```js
{
  _id: ObjectId,
  contractorId: ObjectId,       // unique

  averageRating: Number,        // e.g. 4.7 (2 decimal places)
  totalReviews: Number,         // count of visible reviews

  // Star breakdown
  breakdown: {
    five: Number,
    four: Number,
    three: Number,
    two: Number,
    one: Number
  },

  // Sub-rating averages (null if < 3 reviews have sub-ratings)
  avgSubRatings: {
    quality: Number,
    communication: Number,
    timeliness: Number,
    value: Number
  },

  // Top tags with counts
  topTags: [
    { tag: String, count: Number }
  ],

  // Rolling average for search ranking (last 90 days)
  recentAverageRating: Number,
  recentReviewCount: Number,

  lastCalculatedAt: Date
}

// Index: { contractorId: 1 } — unique
// Index: { averageRating: -1, totalReviews: -1 } — search ranking
```

---

### 3.6 `projects` Collection — Required Fields

Add to existing `projects` documents:

```js
{
  // ... existing fields ...
  status: String,               // must be "completed" to allow review
  completedAt: Date,
  reviewSubmitted: Boolean,     // denormalized flag — updated when review is created
  clientId: ObjectId,           // the user who hired
  contractorId: ObjectId        // the contractor hired
}
```

---

## 4. API Endpoints

### Base path: `/api/v1`

All endpoints require JWT authentication. Role-based access control (RBAC) is enforced server-side.

---

### 4.1 Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reviews` | Client | Submit a new review |
| `GET` | `/reviews/:reviewId` | Public | Get a single review |
| `PATCH` | `/reviews/:reviewId` | Client (owner, within 48h) | Edit own review |
| `GET` | `/contractors/:contractorId/reviews` | Public | List reviews for a contractor |
| `GET` | `/projects/:projectId/review` | Client/Contractor | Get review for a specific project |
| `GET` | `/users/me/reviews` | Client | List all reviews submitted by self |

**POST `/reviews` — Request Body:**
```json
{
  "projectId": "string",
  "overallRating": 4,
  "subRatings": {
    "quality": 5,
    "communication": 4,
    "timeliness": 3,
    "value": 4
  },
  "tags": ["on_time", "great_communication"],
  "reviewText": "Excellent work on the kitchen renovation...",
  "photos": ["photo_upload_token_1", "photo_upload_token_2"]
}
```

**Server-side validations on POST:**
1. `projectId` exists and belongs to the authenticated user as client.
2. Project `status === "completed"`.
3. No existing review for `(projectId, userId)` — unique constraint.
4. Authenticated user's role is `client`, not `contractor`.
5. `overallRating` is integer between 1 and 5.
6. `reviewText` ≤ 1,000 characters.
7. ≤ 5 photos, all pre-validated upload tokens.

**GET `/contractors/:contractorId/reviews` — Query Params:**
- `page` (default 1), `limit` (default 5, max 20)
- `sort`: `newest` | `helpful` | `lowest` (default: `newest`)
- `rating`: filter by star value (e.g., `?rating=5`)

---

### 4.2 Review Replies

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reviews/:reviewId/reply` | Contractor (owns the review) | Post a reply |
| `PATCH` | `/reviews/:reviewId/reply` | Contractor (within 24h) | Edit reply |
| `DELETE` | `/reviews/:reviewId/reply` | Admin | Remove reply |

---

### 4.3 Photo Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reviews/photos/upload` | Client | Upload photo, get a pre-signed upload token |
| `DELETE` | `/reviews/photos/:photoId` | Client (owner) or Admin | Delete a photo |

Photos are uploaded directly to S3/Cloudinary via pre-signed URLs — the API only manages tokens, not binary data.

---

### 4.4 Rating Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/contractors/:contractorId/rating-summary` | Public | Fetch denormalized summary |

Response includes `averageRating`, `totalReviews`, `breakdown`, `avgSubRatings`, `topTags`.

---

### 4.5 Reporting

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reviews/:reviewId/report` | Client or Contractor | Report a review |
| `GET` | `/admin/reports` | Admin | List all pending reports |
| `PATCH` | `/admin/reports/:reportId` | Admin | Resolve a report |

---

### 4.6 Admin Moderation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `PATCH` | `/admin/reviews/:reviewId` | Admin | Hide, restore, or delete a review |
| `GET` | `/admin/reviews` | Admin | List all reviews (filterable by status) |

---

## 5. Security & Fraud Prevention

### 5.1 Eligibility Enforcement (Server-Side Only)

Never trust the client to determine review eligibility. Every POST to `/reviews` runs these checks in sequence, and any failure returns a `403 Forbidden`:

1. **Authenticated user is the project client** — verify `project.clientId === req.user._id`.
2. **Project is completed** — verify `project.status === "completed"`.
3. **No duplicate review** — query `reviews` collection for `(projectId, userId)` unique pair.
4. **Reviewer is not the contractor** — verify `req.user._id !== project.contractorId`.
5. **User account is in good standing** — no suspended or banned accounts can submit reviews.

### 5.2 Anti-Fraud Measures

**Account-Level Controls**
- New accounts created within 30 days cannot submit reviews (configurable cooldown).
- An account that submits more than 3 reviews in 24 hours is flagged for review (rate limiting).
- IP-based rate limiting: max 5 review submissions per IP per hour.
- Device fingerprinting (future): flag multiple accounts submitting reviews from the same device.

**Review Content Analysis**
- Run submitted review text through a lightweight toxicity / spam classifier before saving (can use a simple rule-based filter initially, upgrade to ML later).
- Flag reviews with suspiciously high similarity to each other (cosine similarity check on review text corpus for a contractor — catches bot-generated reviews).
- Flag reviews where `overallRating = 5` and `reviewText` is empty or fewer than 10 characters (common pattern in fake review campaigns).

**Contractor Manipulation Prevention**
- Contractors cannot access the review submission endpoint regardless of role claims in JWT.
- Contractors cannot delete or edit reviews — only admins can.
- A contractor who is also registered as a client cannot review contractors they have a business relationship with (directorship/partnership conflict detection is Phase 2).

**Photo Validation**
- Photos are scanned for NSFW content via automated moderation (e.g., AWS Rekognition) before becoming publicly visible.
- Metadata stripping on upload to remove GPS data and device identifiers.
- Photos are stored in private S3 buckets and served via signed CDN URLs with short expiry (1 hour).

**Signals for Admin Review Queue (Automated Flagging)**
- Review submitted within 5 minutes of project completion (suspiciously fast).
- Reviewer account age < 30 days.
- Contractor has received 3+ one-star reviews from accounts created within the same 7-day window (coordinated attack indicator).
- Review text matches a known spam template (regex + hash comparison).

### 5.3 Data Integrity

- The `contractor_rating_summary` is always recalculated from source `reviews` documents — it is not user-editable.
- Summary recalculation is triggered by a background job (event-driven via message queue) on every review create, hide, or delete. It is never calculated in the review submission request path (avoids blocking and race conditions).
- All review mutations are logged in an audit trail with actor ID, timestamp, and previous values.

---

## 6. Edge Cases

### Review Eligibility Edge Cases

| Scenario | Handling |
|----------|----------|
| User tries to review before project is marked complete | 403: "You can only review after the project is completed." |
| User tries to review a project they were not the client on | 403: Forbidden |
| User submits a review for a project that was later disputed or refunded | Review remains unless admin moderates; a "Project disputed" label may be added |
| Contractor account is deleted after review is submitted | Review remains on record; contractor display name shows "[Deleted Contractor]" |
| User account is deleted after review is submitted | Review is anonymized — display name shows "A Buildora Client" |
| Project status is rolled back from "completed" after review was submitted | Review is soft-hidden pending admin review; not immediately deleted |

### Content Edge Cases

| Scenario | Handling |
|----------|----------|
| Review text is in a non-English language | Accepted as-is; translation badge shown (auto-translate in Phase 2) |
| Review photos fail NSFW scan | Photos are rejected; review text is still accepted |
| User uploads duplicate photos | Deduplicate by hash; silently ignore the second upload |
| Review text contains personal information (phone numbers, emails) | Regex scan strips or redacts before saving |
| Contractor reply contains a link | Strip hyperlinks; plain text only in replies |

### Rating Calculation Edge Cases

| Scenario | Handling |
|----------|----------|
| Contractor has 0 reviews | Show "No reviews yet" — do not display a "0 stars" badge |
| Contractor has exactly 1 review | Show the rating but add a disclaimer: "Based on 1 review" |
| Admin hides a review that was the only 5-star, dropping average significantly | Recalculation is automatic; contractor is notified of the change |
| Multiple reviews submitted simultaneously (race condition) | Unique index on `(projectId, userId)` enforces deduplication at DB level |
| Sub-rating averages with very few data points | Only display sub-ratings section when ≥ 3 reviews include them |

### Contractor Reply Edge Cases

| Scenario | Handling |
|----------|----------|
| Contractor tries to post a second reply | 409: "You have already replied to this review." |
| Contractor tries to edit reply after 24 hours | 403: "Reply editing window has closed." |
| Admin hides the review but contractor reply exists | Reply is also hidden automatically |

---

## 7. UI/UX Recommendations

### 7.1 Review Submission Experience

**Principle:** Make it as easy as possible to leave an honest review. Friction kills review volume.

- **Step-by-step modal** (not a long form): Each step is one screen — star rating first (instant gratification), then optional enrichment. Users who stop after step 1 still submit a valid review.
- **Animated star interaction:** Stars should light up on hover/tap with a warm color. The selected rating should briefly animate (scale pulse) to confirm selection.
- **Contextual placeholder text** in the review text area based on star rating:
  - 5 stars: "What made [Contractor] stand out?"
  - 3 stars: "What went well? What could be improved?"
  - 1 star: "We're sorry to hear that. What happened?"
- **Photo upload with preview:** Show thumbnail previews immediately on upload. Allow reordering via drag-and-drop.
- **Character counter** appears at 800/1,000 characters (not from the start — avoid intimidating users).
- **"Before & After" label toggle** on photos to encourage useful content.

### 7.2 Contractor Profile — Review Display

- **Summary card at top:** Overall star rating (large, prominent), total reviews, and a horizontal breakdown bar chart. Tapping a bar filters the review list by that star.
- **Review cards:** Reviewer first name + avatar initial, date (relative: "3 weeks ago"), star rating, tags as chips, review text (truncated at 3 lines with "Read more"), photos as a small horizontal scroll. Contractor reply in a visually distinct indented block below.
- **"Verified Project" badge** on reviews linked to platform payments — a key trust signal.
- **Sort and filter controls** above the list: "Most Recent", "Most Helpful", "Lowest Rated". Filter by star tier.
- **Empty state:** If a contractor has no reviews, show a friendly message with a brief explanation of how reviews work on Buildora — do not show a zero-star rating.

### 7.3 Review Notifications

- **User notification** (post-completion): "How was your experience with [Contractor]? Leave a review — it only takes a minute." (with deep link to review form)
- **Contractor notification** (new review): "[Client Name] left you a [4-star] review. See what they said." (with deep link to review)
- **Contractor notification** (new reply): Keep tone professional. Do not notify on admin moderation unless action is taken.

### 7.4 Contractor Reply UX

- Reply textarea should appear inline below the review (no separate page).
- Show a brief tip: "Professional replies build trust. Thank your client and address feedback constructively."
- Character limit indicator visible at all times.
- Reply is clearly visually distinguished from the review (different background, "Response from [Contractor]" label).

### 7.5 Admin Dashboard

- Reviews moderation queue sortable by: Most Reported, Newest, By Contractor.
- Side-by-side view: review content on left, project details and user/contractor history on right.
- One-click actions: Hide, Delete, Dismiss Report, Add Note.
- Audit log visible per review showing all moderation actions.

### 7.6 Accessibility

- Star rating component must be keyboard-navigable and screen-reader accessible (use `<fieldset>` + `<legend>` + radio inputs styled as stars).
- Color should not be the only indicator of star selection (use icon fill and accessible contrast).
- Review photos must have auto-generated alt text or allow users to add captions.

---

## 8. How Top Platforms Handle Reviews

### 8.1 Uber

**Model:** Mutual blind rating — both driver and rider submit ratings before seeing each other's score. This eliminates retaliation bias.

**Key mechanics:**
- Rating is given immediately after ride completion via a post-trip prompt (high conversion).
- Drivers below a 4.6 average face account suspension after multiple warnings.
- No written review — just star rating + predefined issue tags (e.g., "Route", "Music volume").
- Ratings below 3 stars trigger automatic loss of trip details for the driver (privacy-preserving).

**Takeaway for Buildora:** The immediate post-completion prompt is critical for review volume. Consider the mutual blind rating model if contractor-to-client rating is ever added.

---

### 8.2 Urban Company (UrbanClap)

**Model:** One-sided (client rates professional). Very similar to Buildora's use case — home services.

**Key mechanics:**
- Review prompt appears immediately in-app after professional marks job complete.
- Star rating + written review + predefined tags (Behavior, Skills, Punctuality).
- Photos of work can be uploaded by the professional (portfolio) separately from client reviews.
- Pro's rating affects their ranking in search and their "Superpro" eligibility badge.
- Ratings below threshold trigger coaching interventions, not immediate suspension.

**Takeaway for Buildora:** The tiered badge system (e.g., "Top Contractor", "Verified Pro") powered by review scores is a strong retention and trust mechanism worth replicating.

---

### 8.3 Airbnb

**Model:** Mutual blind review — host and guest both submit reviews within 14 days of checkout. Reviews are only revealed after both submit or the window closes.

**Key mechanics:**
- Private feedback to Airbnb (not shown publicly) + public review (shown on profile).
- Review prompts are persistent and appear in multiple surfaces (app, email).
- Category sub-ratings: Cleanliness, Accuracy, Check-in, Communication, Location, Value.
- Hosts with consistently high ratings earn "Superhost" status (quarterly evaluation).
- Airbnb can remove reviews that violate content policy (bias, irrelevant content, extortion).

**Takeaway for Buildora:** The two-layer review (public + private) gives the platform data without exposing sensitive feedback publicly. Sub-ratings are directly applicable to contractor profiles.

---

### 8.4 Upwork

**Model:** Mutual review for both client and freelancer. Both must submit within 14 days; reviews go live simultaneously.

**Key mechanics:**
- Structured questions for clients: "Would you recommend this freelancer?", "Was work delivered as described?", "Communication quality?" — not just free text.
- Freelancers rate clients on: Communication, Cooperation, Reasonableness, Payment, Rehire likelihood.
- Upwork's Job Success Score (JSS) is a weighted composite that includes private feedback, long-term relationships, and review patterns — not just the public star rating.
- Reviews can be responded to publicly.
- "Top Rated", "Top Rated Plus", and "Expert-Vetted" badges are powered partly by review scores.

**Takeaway for Buildora:** The concept of a private composite score (like JSS) that factors in more signals than just public reviews is powerful for ranking — it is harder to game than a simple star average.

---

### 8.5 Summary Comparison

| Feature | Uber | Urban Company | Airbnb | Upwork | Buildora (Proposed) |
|---------|------|--------------|--------|--------|---------------------|
| Who rates | Both | Client only | Both | Both | Client only (Phase 1) |
| Blind review | Yes | No | Yes | Yes | No (Phase 1) |
| Written review | No | Optional | Yes | Yes | Optional |
| Sub-ratings | No | Yes | Yes | Yes | Yes |
| Photo upload | No | Professional only | Host photos | No | Yes (client) |
| Reply to review | No | No | Yes | Yes | Yes |
| Verified badge | No | Pro badge | Superhost | Top Rated | Verified Project |
| Admin moderation | Yes | Yes | Yes | Yes | Yes |
| Ranking impact | Yes | Yes | Yes | Yes (JSS) | Yes |

---

## 9. Trust-Building & Competitive Advantage

### 9.1 Why Reviews Are Buildora's Most Valuable Asset

In a marketplace connecting homeowners with contractors, trust is the product. The rating and review system is not a feature — it is the infrastructure that makes strangers trust each other with their homes and livelihoods. Every design decision should optimize for one outcome: **authentic, high-volume, high-quality reviews.**

### 9.2 Differentiating Moves for Buildora

**"Verified Project" Badge**
Every review linked to a project paid through Buildora carries a verified checkmark. This is a direct signal that the reviewer is a real client, not a competitor or fake account. This badge immediately differentiates Buildora from contractor directories (like Thumbtack or HomeAdvisor) where reviews are less verified.

**Photo-First Reviews**
Encourage before/after photos as a cultural norm on Buildora. A kitchen remodel with photo evidence is worth 10 text-only reviews for conversion. Build UI that celebrates photos — show them prominently on contractor profiles and use them in search result thumbnails. This also differentiates Buildora from Upwork and text-heavy platforms.

**Sub-Rating Transparency**
Show clients not just "4.8 stars" but "4.8 stars — Communication: 5.0, Timeliness: 4.2". This granularity helps clients make informed decisions and helps contractors understand exactly where they need to improve. No major home-services platform does this well.

**Contractor Response Culture**
Platforms that encourage contractors to respond to reviews — even negative ones — see higher trust scores. A contractor who professionally addresses a 2-star review demonstrates accountability. Surface reply prompts proactively with templates: "Thank [Client] for their honest feedback..." Contractors who reply to all reviews within 48 hours earn a "Responsive" badge.

**Review Velocity as a Ranking Signal**
A contractor with 10 reviews in the last 30 days should rank above a contractor with 50 lifetime reviews and none recent. Build recency-weighting into the ranking algorithm from day one. This rewards active contractors and creates a virtuous cycle: more jobs → more reviews → higher rank → more jobs.

**Proactive Review Nudges at Completion**
The single biggest driver of review volume is timing. The review prompt must appear within minutes of project completion — not buried in an email 3 days later. Push notification + in-app banner immediately on project completion. Urban Company achieves 70%+ review submission rates with this approach.

**"Would Hire Again" as a Primary Signal**
Add a binary "Would you hire [Contractor] again?" question at the top of the review form. This single signal, aggregated over time, is more predictive of contractor quality than the star rating. Display it prominently on profiles: "94% would hire again." This is the Buildora equivalent of Upwork's private recommendation score — but made public and trust-building.

**Review Analytics for Contractors (Premium Feature)**
Give contractors a dashboard showing: rating trend over time, which sub-ratings are improving or declining, how they compare to the Buildora average in their category, and which tags clients use most. This turns reviews into actionable business intelligence and creates stickiness — contractors who see value in the data become long-term platform partners.

### 9.3 Long-Term Trust Architecture

**Phase 1 (Launch):** Core review system with photos, contractor replies, admin moderation, and basic fraud prevention.

**Phase 2 (3–6 months post-launch):** Verified reviews badge, review reporting by users, sub-rating analytics dashboard for contractors, review-driven search ranking.

**Phase 3 (6–12 months):** Blind mutual review (clients can rate contractors AND contractors rate clients, unlocking a client-quality signal), ML-based spam detection, third-party project verification (invoice matching), review translation for multi-language support.

**Phase 4 (12+ months):** A composite "Buildora Score" (similar to Upwork's JSS) that factors in public reviews, private feedback, on-time delivery rate, repeat hire rate, and dispute history — giving a more complete and harder-to-game quality signal.

---

## Appendix: Key Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| One-sided reviews (client only) in Phase 1 | Lower complexity; avoids retaliation concerns at launch |
| 48-hour edit window for reviews | Allows correction of typos/errors without enabling manipulation |
| Denormalized `contractor_rating_summary` | O(1) reads for profile and search — critical for performance at scale |
| Event-driven summary recalculation | Decouples write performance from aggregate calculation |
| No half-star submissions | Reduces decision fatigue; cleaner data distribution |
| Review visible immediately, moderation async | Maximizes contractor feedback timeliness; moderation catches abuse without blocking flow |
| Contractor cannot delete reviews | Maintains integrity of the trust layer; only admins have this power |
| Unique index on `(projectId, userId)` | Database-level enforcement of "one review per project" — cannot be bypassed |

---

*Document prepared for Buildora internal product and engineering use. Not for external distribution.*
