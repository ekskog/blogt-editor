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
  updateTagsDictionary,
} = require("../utils/utils");

var express = require("express");
var router = express.Router();
const postsDir = path.join(__dirname, "..", "posts");

/* GET the editor land page listing. */
router.get("/", async (req, res) => {
  res.render("new", {});
});

router.get("/imgupl", async (req, res) => {
  const buckets = await fetchBuckets();
  res.render("imgup", { buckets });
});

router.post("/imgup", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const [year, month, day] = req.body.dateField.split("-");
    var fileName = `${day}.jpeg` || file.originalname;

    const bucketName = "blotpix";
    var folderPath = `${year}/${month}`;

    const calculatedParams = await getUploadParams();

    // Fallback to calculated values if necessary
    if (!folderPath) {
      folderPath = calculatedParams.filePath;
    }

    if (bucketName === "blotpix" && !fileName) {
      fileName = calculatedParams.fileName;
    }

    // Log the buffer to ensure it's present
    debug("File buffer length:", file.buffer.length);

    // Upload to MinIO (assuming the utility function works as expected)
    const result = await uploadToMinio(file, bucketName, folderPath, fileName);
    debug("Upload result:", result);

    res.render("index", { result });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).send("Error uploading file.");
  }
});

router.post("/", async (req, res) => {
  // Extract date and text from the request body
  const { date, text, tags, title } = req.body;
  debug("Received data:", { date, text, tags, title });

  try {
    // First commit the post to the filesystem
    const postResult = await commitPost(date, text, tags, title);

    if (postResult.res !== "ok") {
      let message = "Error writing post to disk";
      let error = postResult.error;
      return res.render("error", { error, message });
    }

    // Then update the tags dictionary
    const tagsResult = await updateTagsDictionary(date, title, tags);
    debug("Tags result:", tagsResult);

    if (tagsResult.status !== "ok") {
      debug(
        "Warning: Post was saved but tags dictionary update failed:",
        tagsResult.error
      );
      // You might want to log this error but still consider the post creation successful
    }

    res.render("index");
  } catch (error) {
    debug(error);
    let message = "Error processing request";
    res.render("error", { error, message });
  }
});

// EDIT an existing blog post
router.get("/edit/", async (req, res) => {
  res.render("load", {
    post: {},
  });
});

router.post("/load/", async (req, res) => {
  const { date } = req.body;
  const [year, month, day] = date.split("-");

  try {
    const filePath = path.join(postsDir, year, month, `${day}.md`);
    const fileContent = await fs.readFile(filePath, "utf8");
    // Render edit page with existing content
    res.render("edit", {
      post: {
        date,
        content: fileContent,
      },
    });
  } catch (error) {
    res.render("error", { message: error.code });
  }
});

router.post("/edit/", async (req, res) => {
  const { date, text } = req.body;

  try {
    const tagsMatch = text.match(/^Tags:\s*(.+)$/m);
    const titleMatch = text.match(/^Title:\s*(.+)$/m);

    const tags = tagsMatch ? tagsMatch[1] : "";
    const title = titleMatch ? titleMatch[1] : "";

    const textNoMetadata = text
      .replace(/^(Date:|Tags:|Title:).*$/gm, "")
      .trim();

    const result = await commitPost(date, textNoMetadata, tags, title);
    
    if (result.res == "ok") res.render("index");
    else {
      let message = "Error writing to disk";
      let error = result.error;
      res.render("error", { error, message });
    }
  } catch (error) {
    let message = "Error writing to disk";
    res.render("error", { error, message });
  }
});

module.exports = router;
