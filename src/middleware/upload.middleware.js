import dotenv from "dotenv";
dotenv.config();

import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "upload.log");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log("📁 Created logs directory:", LOG_DIR);
}

if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, "");
  console.log("📝 Created upload.log file:", LOG_FILE);
}

function log(msg) {
  try {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, entry);
    console.log(entry.trim());
  } catch (err) {
    console.error("Log Write Error:", err.message);
  }
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
});

const ALLOWED_EXT = [
  "jpg", "jpeg", "png", "webp",
  "pdf", "doc", "docx",
  "xls", "xlsx", "csv",
  "txt", "mp4", "mov"
];

const BLOCKED_EXT = ["exe", "bat", "sh", "php", "js", "py"];

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

const diskStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, os.tmpdir()),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${uuidv4()}-${safe}`);
  }
});

export const getUploadMiddleware = () =>
  multer({
    storage: diskStorage,
    limits: { fileSize: MAX_SIZE },

    fileFilter: (_, file, cb) => {
      let ext = path.extname(file.originalname).replace(".", "").toLowerCase();
      if (!ext && file.mimetype) {
        const mimeExt = file.mimetype.split("/")[1];
        ext = mimeExt ? mimeExt.toLowerCase() : "";
      }

      if (!ext) {
        log(`⚠ Allowed file without ext: ${file.originalname}`);
        return cb(null, true);
      }

      if (BLOCKED_EXT.includes(ext)) {
        log(`❌ BLOCKED dangerous file: ${file.originalname}`);
        return cb(new Error(`File type .${ext} is not allowed`));
      }

      if (!ALLOWED_EXT.includes(ext)) {
        log(`⚠ Allowed (unknown but safe): ${file.originalname}`);
        return cb(null, true);
      }

      cb(null, true);
    }
  }).any();


export const inventoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE }
}).any();


export const uploadFileToS3 = async (req, res, next) => {
  const bucket = process.env.AWS_BUCKET_NAME;

  if (!bucket) {
    return res.status(500).json({
      success: false,
      message: "S3 is not configured",
    });
  }

  const files = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files || {}).flat();

  if (!files.length) {
    req.s3Uploads = [];
    return next();
  }

  try {
    const folder = req.uploadType === "feedback"
      ? "feedback-attachments"
      : "ticket-attachments";

    const uploaded = await Promise.all(
      files.map(async (file) => {
        let ext = path.extname(file.originalname).replace(".", "").toLowerCase();

        if (!ext && file.mimetype) {
          const mimeExt = file.mimetype.split("/")[1];
          ext = mimeExt ? mimeExt.toLowerCase() : "bin";
        }

        if (!ext) ext = "bin";

        let base = file.originalname.replace(/\.[^/.]+$/, "");
        if (!base) base = `file-${Date.now()}`;
        base = base.replace(/\s+/g, "_").toLowerCase();

        // 🔥 FIXED: folder now dynamic
        const key = `${folder}/${Date.now()}-${uuidv4()}-${base}.${ext}`;

        const buffer = await fs.promises.readFile(file.path);

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: file.mimetype,
            CacheControl: "public, max-age=31536000",
          })
        );

        const url = `${process.env.CLOUDFRONT_URL}/${key}`;

        log(`Uploaded: ${file.originalname} → ${key}`);

        await fs.promises.unlink(file.path);

        return {
          url,
          key,
          originalName: file.originalname,
          type: file.mimetype,
          size: file.size,
        };
      })
    );

    req.s3Uploads = uploaded;
    next();

  } catch (err) {
    log(`❌ S3 Upload Error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "S3 upload failed",
      error: err.message,
    });
  }
};
