import Feedback from "../model/Feedback.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


// export const submitFeedbackController = async (req, res) => {
//   try {
//     const { name, email, phone, message, rating, type } = req.body;

//     let attachments = [];
//     if (req.s3Uploads?.length > 0) {
//       attachments = req.s3Uploads.map((f) => ({ url: f.url }));
//     }

//     const newFeedback = await Feedback.create({
//       name,
//       email,
//       phone,
//       message,
//       rating: Number(rating),
//       type,
//       attachments,
//       userId: req.user?._id,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Feedback submitted successfully",
//       data: newFeedback,
//     });
//   } catch (err) {
//     console.log("FEEDBACK ERROR:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// ⭐ GET FEEDBACK WITH TYPE FILTER
export const submitFeedbackController = async (req, res) => {
  try {
    const { name, email, phone, message, rating, type } = req.body;

    let attachments = [];
    if (req.s3Uploads?.length > 0) {
      attachments = req.s3Uploads.map((f) => ({ url: f.url }));
    }

    const newFeedback = await Feedback.create({
      name,
      email,
      phone,
      message,
      rating: Number(rating),
      type,
      attachments,
      userId: req.user?._id,
    });

    /**
     * 🔔 NOTIFY ADMINS (FCM)
     */
    const adminDevices = await DeviceToken.find({
      "meta.userType": "admin",
    }).lean();

    if (!adminDevices.length) {
      console.log("⚠️ No admin device tokens found");
    } else {
      const userName = req.user?.name || name || "User";

      const title = "📩 New Feedback Received";
      const body = `${userName} submitted a new feedback`;

      await Promise.allSettled(
        adminDevices
          .filter((d) => d?.token)
          .map((d) =>
            sendToToken(d.token, {
              data: {
                title,
                body,
                type: "feedback_created",
                feedbackId: newFeedback._id.toString(),
                userId: newFeedback.userId?.toString() || "",
                feedbackType: type || "",
                rating: String(rating || ""),
              },
            })
          )
      );

      console.log("✅ Admin feedback notification sent");
    }

    return res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      data: newFeedback,
    });
  } catch (err) {
    console.log("❌ FEEDBACK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



export const getFeedbackByTypeController = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = type ? { type } : {};

    const feedback = await Feedback.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (err) {
    console.log("GET FEEDBACK ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const deleteFeedbackController = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // ⭐ Delete files from S3
    if (feedback.attachments?.length > 0) {
      for (const file of feedback.attachments) {
        if (!file.url) continue;

        // Extract S3 key from CloudFront URL
        const key = file.url.replace(`${process.env.CLOUDFRONT_URL}/`, "");

        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: key,
            })
          );

          console.log("🗑️ Deleted from S3:", key);
        } catch (err) {
          console.log("⚠️ S3 delete error:", err.message);
          // Not blocking, just continue
        }
      }
    }

    // ⭐ Delete feedback from DB
    await Feedback.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (err) {
    console.log("DELETE FEEDBACK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting feedback",
    });
  }
};