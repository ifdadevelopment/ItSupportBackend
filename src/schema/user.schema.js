import yup, { object, ref, string } from "yup";


const userLoginSchema = yup.object().shape({
    body: object({
        email: string().required("Email is required"),
        password: string().required("Password is required")
    })
});

const userRegisterSchema = yup.object().shape({
    body: object({
        email: string().required("Email Is required"),
        name: string().required("User name is required"),
        password: string().required("This field is required"),
        confirmPassword: string().oneOf([ref('password')], "Confirm Password must same")
    })
});

export {
    userLoginSchema, userRegisterSchema
};