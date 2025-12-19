// Configure multer to store files in memory
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const path = require("path");
const fs = require("fs").promises;
const debug = require("debug")("blogt-editor:editor-route");

const {
  fetchBuckets,
  getUploadParams,
  uploadToMinio,
  commitPost,
  updateTagsDictionary
} = require("../utils/utils");

var express = require("express");
var router = express.Router();
const postsDir = path.join(__dirname, "..", "posts");

// Base URL for the blogt API. In k8s this should be http://blogt-api:3000
const API_BASE_URL = process.env.BLOGT_API_BASE_URL || "http://localhost:3000";

/* GET the editor land page listing. */
router.get("/", async (req, res) => {
  res.render("new");
});

router.get("/imgupl", async (req, res) => {
  const buckets = await fetchBuckets();
  res.render("imgup", { 
    buckets
  });
});

router.post("/imgup", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const [year, month, day] = req.body.dateField.split("-");
    const date = `${year}-${month}-${day}`;

     if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
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

router.post("/", async (req, res) => {
  // Extract date and text from the request body
  const { date, text, tags, title } = req.body;

  console.log("NEW POST RECEiVEd")
  debug("Received data:", { date, text, tags, title });

  try {
    // Normalize tags from comma-separated string to array
    const tagsArray = typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
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
        date,          // YYYY-MM-DD; API accepts both this and DDMMYYYY
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
    debug("Error creating post via API, falling back to filesystem:", error.message);
    console.error("[editor] Error in API create flow, using filesystem fallback:", error);

    // Fallback: use legacy filesystem commit + tags dictionary
    try {
      const tagsHeader = typeof tags === "string" ? tags : (Array.isArray(tags) ? tags.join(", ") : "");
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

// EDIT an existing blog post
router.get("/edit/", async (req, res) => {
  res.render("load", {
    post: {}
  });
});

router.post("/load/", async (req, res) => {
  const { date } = req.body;
  try {
    // Prefer loading via API so the editor is a client of blogt-api
    const apiUrl = `${API_BASE_URL}/posts/details/${date}`;
    debug("Loading post from API:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const post = await response.json();

    res.render("edit", {
      post: {
        date: post.date,
        content: [
          `Tags: ${post.tags.join(", ")}`,
          `Title: ${post.title}`,
          "",
          post.content || ""
        ].join("\n")
      }
    });
  } catch (error) {
    debug("Error loading post via API:", error.message);

    // Fallback: try legacy filesystem load (useful in local dev if API is down)
    try {
      const [year, month, day] = date.split("-");
      const filePath = path.join(postsDir, year, month, `${day}.md`);
      const fileContent = await fs.readFile(filePath, "utf8");

      res.render("edit", {
        post: {
          date,
          content: fileContent,
        }
      });
    } catch (fsError) {
      res.render("error", { message: error.code || fsError.code || "LOAD_FAILED" });
    }
  }
});

router.post("/edit/", async (req, res) => {
  const { date, text } = req.body;

  try {
    // Extract metadata from the editor text
    const tagsMatch = text.match(/^Tags:\s*(.+)$/m);
    const titleMatch = text.match(/^Title:\s*(.+)$/m);

    const tagsString = tagsMatch ? tagsMatch[1] : "";
    const title = titleMatch ? titleMatch[1] : "";

    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const content = text
      .replace(/^(Date:|Tags:|Title:).*$/gm, "")
      .trim();

    // First try to save via the API so that blogt-api owns the posts
    const apiUrl = `${API_BASE_URL}/posts/${date}`;
    debug("Saving post via API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, tags, content }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    // If API save succeeded, render index
    return res.render("index");
  } catch (error) {
    debug("Error saving post via API, falling back to filesystem:", error.message);

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

module.exports = router;
