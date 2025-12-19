const path = require("path");
require("dotenv").config();
const API_BASE_URL = process.env.BLOGT_API_BASE_URL || "http://blogt-api:3000";

const crypto = require("crypto");
const { marked } = require("marked");
const debug = require("debug")("blogt-editor:utils");
const https = require("https");

var buckets = [];

const fetchBuckets = async () => {
  return buckets;
};

const getUploadParams = async () => {
  const today = new Date();

  // Create bucket in YYYY/MM format
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const filePath = `${year}/${month}`;

  // Create file name in DD.jpeg format
  const day = String(today.getDate()).padStart(2, "0");
  const fileName = `${day}.jpeg`;
  return { fileName, filePath };
};

const findLatestPost = async () => {
  let latestPostDate = null;
  let latestPostPath = null;

  try {
    const years = await fs.readdir(POSTS_PATH);
    for (const year of years) {
      // Only proceed if it's a directory
      const yearPath = path.join(POSTS_PATH, year);
      if (!(await fs.stat(yearPath)).isDirectory()) {
        continue;
      }

      const monthsDir = path.join(POSTS_PATH, year);
      const months = await fs.readdir(monthsDir);

      for (const month of months) {
        // Only proceed if it's a directory
        const monthPath = path.join(monthsDir, month);
        if (!(await fs.stat(monthPath)).isDirectory()) {
          continue;
        }

        const daysDir = path.join(monthsDir, month);
        const days = await fs.readdir(daysDir);

        for (const day of days) {
          const dayRegex = /^(0[1-9]|[12][0-9]|3[01])\.md$/;

          if (!dayRegex.test(day)) {
            continue;
          }
          // Only process markdown files
          if (!day.endsWith(".md")) {
            continue;
          }

          const postPath = path.join(year, month, day);
          const dateParts = postPath.split("/");
          const postDate = new Date(
            `${dateParts[0]}-${dateParts[1]}-${dateParts[2].replace(".md", "")}`
          );

          if (!latestPostDate || postDate > latestPostDate) {
            latestPostDate = postDate;
            latestPostPath = postPath;
          }
        }
      }
    }

    return { latestPostPath, latestPostDate };
  } catch (error) {
    throw new Error("Could not retrieve post files");
  }
};

async function getNext(dateString) {
  const year = parseInt(dateString.slice(0, 4));
  const month = parseInt(dateString.slice(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(dateString.slice(6));
  let date = new Date(year, month, day);

  let iterations = 0;
  while (iterations < 365) {
    iterations++;
    date.setDate(date.getDate() + 1);
    const nextYear = date.getFullYear().toString();
    const nextMonth = (date.getMonth() + 1).toString().padStart(2, "0");
    const nextDay = date.getDate().toString().padStart(2, "0");
    const filePath = path.join(
      POSTS_PATH,
      nextYear,
      nextMonth,
      `${nextDay}.md`
    );

    try {
      await fs.access(filePath);
      return `${nextYear}${nextMonth}${nextDay}`;
    } catch (error) {
      // Log the missing entry
      // debug(`No entry found for ${nextYear}-${nextMonth}-${nextDay}. Checking next date...`);
      // Continue to next date
    }
  }
}

async function getPrev(dateString) {
  const year = parseInt(dateString.slice(0, 4));
  const month = parseInt(dateString.slice(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(dateString.slice(6));
  let date = new Date(year, month, day);

  let iterations = 0;
  while (iterations < 365) {
    iterations++;
    date.setDate(date.getDate() - 1);
    const prevYear = date.getFullYear().toString();
    const prevMonth = (date.getMonth() + 1).toString().padStart(2, "0");
    const prevDay = date.getDate().toString().padStart(2, "0");
    const filePath = path.join(
      POSTS_PATH,
      prevYear,
      prevMonth,
      `${prevDay}.md`
    );

    try {
      await fs.access(filePath);
      return `${prevYear}${prevMonth}${prevDay}`;
    } catch (error) {
      // Log the missing entry
      // console.err(`No entry found for ${prevYear}-${prevMonth}-${prevDay}. Checking previous date...`);
      // Continue to previous date
    }
  }
}

const formatDate = async (dateString) => {
  const date = new Date(dateString);

  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");

  let formatted = `${year}${month}${day}`;
  return formatted;
};

const commitPost = async (date, text, tags, title) => {
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}${month}${year}`;
  const textWithMetadata = `Date: ${formattedDate}\nTags: ${tags} \nTitle: ${title}\n${text}`;

  try {
    // Define the file path
    let dirPath = path.join(POSTS_PATH, year, month);
    let filePath = path.join(dirPath, `${day}.md`);

    debug(`Committing post to: ${filePath}`);

    // Ensure the directory exists
    await fs.mkdir(dirPath, { recursive: true });
    // Write the text content to the file
    await fs.writeFile(filePath, textWithMetadata, "utf8");

    // recalculate the latest Post Date

    const htmlContent = marked(text);
    const md5Title = crypto.createHash("md5").update(text).digest("hex");

    const imageUrl = `https://objects.hbvu.su/blotpix/${year}/${month}/${day}.jpeg`;

    const prev = await getPrev(date.replace(/-/g, ""));
    const next = await getNext(date.replace(/-/g, ""));

    // display the Post

    let post = {
      tags,
      title,
      md5Title,
      formattedDate,
      imageUrl,
      htmlContent,
      prev,
      next,
    };
    return { res: "ok", post };
  } catch (error) {
    return { res: "error", error };
  }
};

async function updateTagsDictionary(date, title, tagsString) {
  try {
    // 1. Read existing tags file
    let tagsDict = {};
    try {
      const data = await fs.readFile(TAGS_FILE_PATH, "utf8");
      tagsDict = JSON.parse(data);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist, we'll create a new one
      debug("Tags file not found, creating new dictionary");
    }

    // 2. Parse tags from the input string
    const tagsList = tagsString
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    // 3. Update the dictionary with new post information
    const postInfo = {
      date,
      title,
    };

    debug("Post info:", postInfo);

    tagsList.forEach((tag) => {
      if (!tagsDict[tag]) {
        tagsDict[tag] = [];
        debug(`Creating new tag entry for: ${tag}`);
      }

      // Check if this post is already listed under this tag
      const isDuplicate = tagsDict[tag].some(
        (post) => post.date === date && post.title === title
      );

      if (!isDuplicate) {
        tagsDict[tag].push(postInfo);
        debug(`Adding post to tag: ${tag}`);
      }
    });

    // 4. Save the updated dictionary back to the file
    await fs.writeFile(
      TAGS_FILE_PATH,
      JSON.stringify(tagsDict, null, 2),
      "utf8"
    );

    return { status: "ok" };
  } catch (error) {
    debug("Error updating tags dictionary:", error);
    return {
      status: "error",
      error: error.message,
    };
  }
}

const verifyTurnstile = async (token) => {
  // Bypass in local/dev when explicitly enabled
  const bypass =
    process.env.TURNSTILE_BYPASS === "true" ||
    process.env.NODE_ENV === "development";

  if (bypass) {
    debug("Turnstile bypass enabled; skipping verification");
    return true;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!token) {
    debug("No Turnstile token provided");
    return false;
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await response.json();
    debug("Turnstile verification result:", data);
    return data.success;
  } catch (error) {
    debug("Turnstile verification error:", error);
    return false;
  }
};

async function main() {
  const apiUrl = `${API_BASE_URL}`;
  const response = await fetch(apiUrl);
  buckets = await response.json();
  debug("Buckets:", buckets);
}

module.exports = {
  findLatestPost,
  getNext,
  getPrev,
  formatDate,
  fetchBuckets,
  getUploadParams,
  commitPost,
  updateTagsDictionary,
  verifyTurnstile,
};
