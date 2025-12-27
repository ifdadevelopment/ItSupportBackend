import mongoose from "mongoose";
import bcrypt from "bcryptjs";


  const UserSchema = new mongoose.Schema(
    {
      email: { type: String, unique: true, required: true, },
      password: { type: String, required: true, },
      user_type: { type: String, default: "user", enum: ['admin', 'manager', 'technician', 'user'] },
      name: { type: String, required: true },
      active: { type: Boolean, default: true },
      profile_id: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: false },
      user_token : { type : String}
    },
    { timestamps: true, }
  );


UserSchema.pre('save', async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


UserSchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
  const update = this.getUpdate();

  const password = update?.password || update?.$set?.password;
  if (!password) return next();

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  if (update.password) {
    update.password = hashed;
  } else if (update.$set?.password) {
    update.$set.password = hashed;
  }

  next();
});


UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// UserSchema.index({ profile_id: 1 }, { unique: true, sparse: true });

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
