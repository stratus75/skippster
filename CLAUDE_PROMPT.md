Continue building the Skippster decentralized video platform.

CURRENT STATUS:
- PDS minimal server is running on port 4000
- Health endpoint works: GET /health → {"ok":true}
- User API has basic CRUD working
- Database is SQLite with full schema (15 tables)
- Need to complete Video API and upload flow

TASK: Implement complete Video API

1. Extend core/pds/src/minimal-server.ts with endpoints:
   GET    /api/videos              - List all videos
   GET    /api/videos/:id          - Get video by ID
   POST   /api/videos              - Create video metadata
   PATCH  /api/videos/:id          - Update video
   GET    /api/videos/:id/comments - Get video comments
   POST   /api/videos/:id/comments - Add comment

2. Implement full VideoRepository:
   - findAll(limit?, offset?) - Paginated list
   - findById(id) - Single video
   - create(dto) - Create new
   - update(id, dto) - Partial update
   - delete(id) - Remove video
   - findByDID(did) - Creator's videos
   - findTrending(limit) - Popular videos
   - search(query, limit) - Text search
   - incrementViews(id) - Track views

3. Add CommentRepository:
   - findByTarget(type, id) - Video/post comments
   - create(dto) - Add comment
   - findReplies(parentId) - Threaded replies

4. Test all endpoints with curl:
   curl http://localhost:4000/api/videos
   curl http://localhost:4000/api/videos/vid123
   curl -X POST http://localhost:4000/api/videos \
     -H "Content-Type: application/json" \
     -d '{"id":"vid1","did":"did:plc:test","title":"Test Video", "magnetLink":"magnet:?...", "duration":120}'

ACCEPTANCE CRITERIA:
✓ All endpoints return correct JSON
✓ Data persists in SQLite (check with sqlite3 skippster.db)
✓ No TypeScript compilation errors
✓ Server starts cleanly: node dist/minimal-server.js
✓ curl tests all pass

REFERENCE: Use existing patterns from:
- UserRepository (core/pds/src/models/user.ts)
- Database schema (core/pds/src/database/schema.ts)
- Server setup (core/pds/src/minimal-server.ts)

After this works, we'll add Phase 2: Video upload flow with WebTorrent.

Implement now and show working curl commands.

