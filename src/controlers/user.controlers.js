import UserModel from "../model/auth/user.model.js";
import { updateSessionService } from "../service/session.service.js";
import { createUserService, findAllUserService, findUserService, updateUserService } from "../service/user.service.js";
import { sendResetPasswordEmail } from "../utils/NodeMailerUtils.js";

const userRegisterControler = async (req, res) => {
    try {
        const email = req?.body?.email;
        const existUser = await findUserService({ email: email });
        if (existUser) {
            res.json({ 'error': "Email Already Exist" }).status(400);
        }
        else {
            const user = await createUserService(req.body);
            return res.json({ "message": "register successfully" }).status(200);
        }
    } catch (error) {
        res.json({ error: `Cannot Register at this time` }).status(500);
    }
}

export const getAllUser = async (req, res) => {
    try {
        const existUser = await findAllUserService({
            active: true, user_type:
                { $in: ['manager', 'technician', 'admin'] }
        });
        return res.json({ 
            user : existUser 
        }).status(200);
    } catch (error) {
        res.json({ error: `Cannot Register at this time` }).status(500);
    }
}

const userManagementController = async (req, res) => {
    try {
        const users = await findAllUserService({});
        users.sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};


export const updateProfile = async (req, res)=>{
    try {
        delete req.body.active;
        delete req.body.user_type;
        const data = await updateUserService(req.user._id, req.body);
        if (data){
            return res.json({ 'message' : "Updated Successfully!!" }).status(200);
        }
        return res.json({error : "Some Error Occured"}).status(400);
    }
    catch (error){
        return res.json({ error : "Internal Server Error" }).status(400);
    }
}
// export const updateUserController = async (req, res) => {
//     try {
//         const { id } = req.params;
//         if (req.user.user_type != 'admin') { return res.status(403).json({ error: "Forbidden: Admins only" }) };
//         if (!id) { return res.status(400).json({ error: "User ID is required" }) };
//         if (id === req.user._id) { return res.status(400).json({ error: "You cannot update your own profile" }) };
//         const updateData = req.body;
//         const updatedUser = await updateUserService(id, updateData);
//         const session = await updateSessionService({ user: id }, { valid: false });
//         if (!updatedUser) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         res.status(200).json({
//             message: "User updated successfully",
//             user: updatedUser,
//         });
//     } catch (err) {
//         res.status(500).json({ message: "Server error", error: err.message });
//     }
// };
export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.user_type !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot update your own profile" });
    }

    const updateData = req.body;

    if (typeof updateData.isActive !== "undefined") {
      updateData.isActive = Boolean(updateData.isActive);

      if (!updateData.isActive) {
        await updateSessionService({ user: id }, { valid: false });
      }
    }

    const updatedUser = await updateUserService(id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = (req.body || {});
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // ms
    user.resetOtp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    const html = `<b>${otp}</b>.`;
    await sendResetPasswordEmail(user.email, html);
    return res.status(200).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = (req.body || {});
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP and newPassword are required" });
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.resetOtp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: "No OTP requested. Please request a new OTP." });
    }
    if (String(user.resetOtp).trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (Date.now() > Number(user.otpExpiry)) {
      user.resetOtp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP." });
    }
    user.password = newPassword;
    user.resetOtp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




export { userManagementController };
export default userRegisterControler;