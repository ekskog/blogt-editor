// Configure multer to store files in memory
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const path = require("path");
const fs = require("fs").promises;
const debug = require("debug")("blogt-editor:editor-route");

const {
  fetchBuckets,
  commitPost,
  updateTagsDictionary,
  parseBlogEntry,
} = require("../utils/utils");

var express = require("express");
var router = express.Router();
const postsDir = path.join(__dirname, "..", "posts");

const API_BASE_URL = process.env.BLOGT_API_BASE_URL || "http://blogt-api:3000";
debug("API Base URL:", API_BASE_URL);

/* HANDLE NEW POSTS */
router.get("/", async (req, res) => {
  res.render("new");
});

router.post("/", async (req, res) => {
  // Extract date and text from the request body
  let { date, text, tags, title } = req.body;

  // Normalize incoming date (editor UI may send YYYY-MM-DD); convert to DDMMYYYY
  date = date.split("-").reverse().join("");

  debug("Received data:", { date, text, tags, title });
  console.log("\n");

  try {
    // Normalize tags from comma-separated string to array
    const tagsArray =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : Array.isArray(tags)
        ? tags
        : [];

    // First try to create the post via the API
    const apiUrl = `${API_BASE_URL}/posts`;
    debug("Creating post via API:", apiUrl);
    console.log("[editor] Creating post via API", apiUrl, {
      date,
      title,
      tagsCount: tagsArray.length,
      contentLength: text ? text.length : 0,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date, // DDMMYYYY normalized
        title,
        tags: tagsArray,
        content: text,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(
        "[editor] API create post failed",
        response.status,
        response.statusText,
        errText
      );
      throw new Error(`API responded with status ${response.status}`);
    }

    // On success, render index
    return res.render("index");
  } catch (error) {
    debug("Error creating post via API", error.message);
    console.error(
      "[editor] Error in API create flow, using filesystem fallback:",
      error
    );

    // Fallback: use legacy filesystem commit + tags dictionary
    try {
      const tagsHeader =
        typeof tags === "string"
          ? tags
          : Array.isArray(tags)
          ? tags.join(", ")
          : "";
      const postResult = await commitPost(date, text, tagsHeader, title);

      if (postResult.res !== "ok") {
        let message = "Error writing post to disk";
        let fsError = postResult.error;
        return res.render("error", { error: fsError, message });
      }

      const tagsResult = await updateTagsDictionary(date, title, tagsHeader);
      debug("Tags result (fallback):", tagsResult);

      return res.render("index");
    } catch (fsError) {
      debug("Fallback filesystem write failed:", fsError);
      let message = "Error processing request";
      return res.render("error", { error: fsError, message });
    }
  }
});

/* HANDLE IMAGES */
router.get("/imgupl", async (req, res) => {
  const buckets = await fetchBuckets();
  res.render("imgup", {
    buckets,
  });
});

router.post("/imgup", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const dateField = req.body.dateField;
    const date = dateField.split("-").reverse().join("");

    if (!date || !/^\d{8}$/.test(date)) {
      return res.status(400).send("Invalid or missing date");
    }

    // Prefer uploading via API so the editor is a client of blogt-api
    const apiUrl = `${API_BASE_URL}/media/images`;
    debug("Uploading image via API:", apiUrl);

    const formData = new FormData();
    formData.append("file", new Blob([file.buffer]), file.originalname);
    formData.append("date", date);

    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(
        "[editor] API image upload failed",
        response.status,
        response.statusText,
        errText
      );
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    debug("Upload result via API:", data);

    res.render("index", { result: `Image uploaded: ${data.url}` });
  } catch (error) {
    console.error("Error handling file upload via API:", error);
    res.status(500).send("Error uploading file.");
  }
});

// EDIT an existing blog post
router.get("/edit/", async (req, res) => {
  res.render("load", {
    post: {},
  });
});

router.post("/load/", async (req, res) => {
  let { date } = req.body;
 date = date.toISOString().slice(8,10) + date.toISOString().slice(5,7) + date.toISOString().slice(0,4);

  try {
    // Prefer loading via API so the editor is a client of blogt-api
    const apiUrl = `${API_BASE_URL}/posts/details/${date}`;
    console.log("[editor] Loading post via API:", apiUrl);
    debug("Loading post from API:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const post = await response.json();

    console.log(post);

    res.render("edit", {
      post,
    });
  } catch (error) {
    debug("Error loading post via API:", error.message);
  }
});

router.post("/edit/", async (req, res) => {
  let { date, title, tags, content } = req.body;
  console.log("[editor] Saving edited post:", { date });
  let editedPost = JSON.stringify({ title, tags, content });

  try {
    // First try to save via the API so that blogt-api owns the posts
    const apiUrl = `${API_BASE_URL}/posts/${date}`; // date is DDMMYYYY
    debug("Saving post via API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: editedPost,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    // If API save succeeded, render index
    return res.render("index");
  } catch (error) {
    debug(
      "Error saving post via API, falling back to filesystem:",
      error.message
    );

    // Fallback to legacy filesystem commit if API save fails
    try {
      const tagsHeader = tagsString || "";
      const result = await commitPost(date, content, tagsHeader, title);

      if (result.res == "ok") {
        return res.render("index");
      } else {
        let message = "Error writing to disk";
        let fsError = result.error;
        return res.render("error", { error: fsError, message });
      }
    } catch (fsError) {
      let message = "Error writing to disk";
      return res.render("error", { error: fsError, message });
    }
  }
});

// Help endpoint: proxy the API root (GET /) so the editor can show API overview
router.get("/help", async (req, res) => {
  try {
    const apiUrl = `${API_BASE_URL}/`;
    debug("Fetching API root for help:", apiUrl);

    const response = await fetch(apiUrl);
    const text = await response.text();

    // Return the API root response as HTML/plain text
    res.type("html").send(text);
  } catch (err) {
    debug("Error fetching API root:", err.message);
    res.status(502).send("Failed to fetch API help content");
  }
});

module.exports = router;
