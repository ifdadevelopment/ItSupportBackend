import lodash from "lodash";
import UserModel from "../model/auth/user.model.js";

const { omit } = lodash;

export async function createUserService(user_data) {
    try {
        const email = user_data?.email;
        const existingUser = await UserModel.findOne({
            email: email
        });

        if (existingUser) {
            throw new Error("This email already Exist");
        }

        const new_user_data = {
            email: user_data.email,
            password: user_data.password,
            name: user_data.name,
            user_type: user_data.user_type
        }
        const user = await UserModel.create(new_user_data);

        delete user.password;
        return user;
    } catch (error) {
        throw new Error("Create Service Error");
    }
}

export async function validatePasswordLoginService({ email, password }) {

    const user = await UserModel.findOne({ email, active: true });
    
    if (!user) return false;
    const isValid = await user.comparePassword(password);
    if (!isValid) return false;
    delete user.password;
    return user.toJSON ? omit(user.toJSON(), "password") : user;
}

export async function findUserService(query) {
    try {
        const user = await UserModel.findOne(query).lean();
        if (!user) return false
        delete user.password;
        return user.toJSON ? omit(user.toJSON(), "password") : user;
    }
    catch (error) {
        return false;
    }
}
export async function findAllUserService(query) {
    try {
        const user = await UserModel.find({ ...query, active: true }).lean();
        if (!user) return false;
        delete user.password;
        return user.toJSON ? omit(user.toJSON(), "password") : user;
    }
    catch (error) {
        return false;
    }
}

// Update user service
export const updateUserService = async (id, updateData) => {
    try {
        const updatedUser = await UserModel.updateOne({ _id: id }, updateData);
        return updatedUser;
    }
    catch (err) {
        return false;
    }
};

