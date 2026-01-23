# Board Module Backend Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the corrupted `board/router.py`, remove duplicate code, and implement missing endpoints (`owned`, `received`, `share`) to satisfy Frontend requirements.

**Architecture:**
- REST API using FastAPI `APIRouter`
- Service layer (`BoardService`) for business logic
- Pydantic schemas for data validation
- Async/Await for non-blocking I/O

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Python 3.13

---

### Task 1: Fix `upload_document` and Missing Endpoints

**Files:**
- Modify: `backend/app/modules/board/router.py`

**Step 1: Create a corrected version of router.py**

I will rewrite `backend/app/modules/board/router.py` with the following changes:
1.  **Fix `upload_document`**: Complete the logic that was cut off at line 101.
    - It needs to create `DocumentCreate` object.
    - Call `BoardService.create_document`.
    - Return the created document.
2.  **Add `GET /documents/owned`**:
    - Call `BoardService.get_owned_documents`.
    - Return list of `DocumentResponse`.
3.  **Add `GET /documents/received`**:
    - Call `BoardService.get_shared_with_me_documents`.
    - Return list of `DocumentShareResponse`.
4.  **Add `POST /documents/{doc_id}/share`**:
    - Accept `recipient_id` in body (using a Pydantic model or `Body` param).
    - Call `BoardService.share_document`.
    - Return `DocumentShareResponse`.
5.  **Clean up helper functions**:
    - Remove duplicate definitions of `_post_document_to_channel` and `_send_document_via_dms`.
    - Ensure they are defined once and used correctly.
6.  **Verify Imports**: Ensure all used schemas (`DocumentShareCreate`) and services (`BoardService`, `ChatService`) are imported.

**Step 2: Verify Syntax**
Run `lsp_diagnostics` on the file to ensure no syntax errors or unresolved references exist.

**Step 3: Verification**
Since we don't have existing tests, we will rely on syntax check and manual verification plan (Phase 2).
