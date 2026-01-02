import { homePageControler } from "../controlers/home.controlers.js";
import multer from "multer";

import {
    createInventoryController,
    getCurrentUserInventoryControler,
    requestInventoryControler,
    returnInventoryControler,
} from "../controlers/inventoryControler/inventery.controler.js";
import {
    addItemsToSystemFormController,
    addUsageHistoryControler,
    createItInventoryItemController,
    deleteInventoryKeyController,
    deleteItemKeyCardController,
    getInventoryKeyControler,
    getItInventoryItemByIdController,
    getItInventoryItemController,
    updateItInventoryItemByIdController,
} from "../controlers/inventoryControler/itemInventory.controler.js";
import {
    createItInventoryController,
    deleteItInventoryController,
    downloadInventoryTemplate,
    exportInventoryExcel,
    getAllInventoryController,
    getAllLastUpdated,
    getFullUpdateHistory,
    getInventoryByIdController,
    getItInventoryByIdController,
    getItInventoryController,
    getLastUpdatedById,
    getPcOptions,
    importInventoryExcel,
    updateItInventoryControler,
    updateItInventoryController,
} from "../controlers/inventoryControler/itInventory.controler.js";
import itInventoryGetControler, {
    createItInventoryKeyControler,
    deleteItemKeysCardController,
    itInventoryItemGetHistoryControler,
    restoreInventoryKeyController,
} from "../controlers/inventoryControler/itinventorykey.controler.js";
import {
    createUserSessionHandler,
    getSessionHandler,
    reIssueAccessTokenSessionHandler,
    updateSessionHandler,
} from "../controlers/session.controlers.js";
import {
    addCommentController,
    createTicketController,
    deleteTicketAttachmentController,
    deleteTicketController,
    getMyTicketsByTypeController,
    getTicketByIdController,
    getTicketStatusController,
    updateTicketController,
} from "../controlers/ticketControler/ticket.controler.js";
import userRegisterControler, {
    forgotPassword,
    getAllUser,
    resetPassword,
    updateProfile,
    updateUserController,
    userManagementController,
} from "../controlers/user.controlers.js";
import requireUser, { isAdmin } from "../middleware/require.user.js";
import validateUser from "../middleware/validateUser.middleware.js";
import {
    inventoryCreateSchema,
    inventoryUpdateSchema,
} from "../schema/inventory.schema.js";
import { inventoryKeyUsageSchema } from "../schema/itemkey.schema.js";
import {
    inventoryItemCreateSchema,
    inventoryItemUsageSchema,
} from "../schema/items.schema.js";
import { itInventoryCreateSchema } from "../schema/itInventory.schema.js";
import {
    ticketCreateSchema,
    ticketUpdateSchema,
} from "../schema/ticket.schema.js";
import { userLoginSchema, userRegisterSchema } from "../schema/user.schema.js";
import {
    getUploadMiddleware,
    // inventoryUpload,
    uploadFileToS3,
} from "../middleware/upload.middleware.js";
import { deleteFeedbackController, getFeedbackByTypeController, submitFeedbackController } from "../controlers/feedback.controller.js";
import {  resetBadge, saveToken, sendByProjectId } from "../controlers/notification.controlers.js";

const inventoryUpload = multer({ storage: multer.memoryStorage() });
const routeFunc = (app) => {
    app.post("/login", validateUser(userLoginSchema), createUserSessionHandler);
    app.post(
        "/register",
        isAdmin,
        validateUser(userRegisterSchema),
        userRegisterControler
    );
    app.post("/get-access-token", reIssueAccessTokenSessionHandler);
    app.get("/session", requireUser, getSessionHandler);
    app.post("/re-issue-access-token", reIssueAccessTokenSessionHandler);

    // User Management Controlers
    app.get("/get-all-user", requireUser, userManagementController);
    app.post("/logout", requireUser, updateSessionHandler);
    app.post("/update-user/:id", requireUser, updateUserController);
    app.put("/update-profile/", requireUser, updateProfile);
    app.post("/forgot-password", forgotPassword);
    app.post("/reset-password", resetPassword);
    app.post("/add-comment/:ticketId", requireUser, addCommentController);
    app.get("/home-page", requireUser, homePageControler);
    app.get("/get-all-user-for-ticket", requireUser, getAllUser);

    // Ticket Management
    app.post(
        "/raise-ticket",
        requireUser,
        getUploadMiddleware(),
        uploadFileToS3,
        validateUser(ticketCreateSchema),
        createTicketController
    );
    app.post(
        "/update-ticket-status/:id",
        requireUser,
        validateUser(ticketUpdateSchema),
        updateTicketController
    );
    app.get("/get-ticket/:id", requireUser, getTicketByIdController);
    app.get("/get-ticket-status", requireUser, getMyTicketsByTypeController);
    app.delete(
        "/ticket/:ticketId/attachment/:attachmentKey",
        requireUser,
        deleteTicketAttachmentController
    );
    app.delete("/delete-ticket/:id", requireUser, deleteTicketController);
    //IT inventory Management System
    app.post(
        "/add-it-inventory",
        requireUser,
        validateUser(itInventoryCreateSchema),
        createItInventoryController
    );
    app.get("/get-it-inventory", requireUser, getItInventoryController);
    app.post("/inventory/import-excel", requireUser, inventoryUpload.any(),
        importInventoryExcel);
    app.get("/inventory/export-excel", exportInventoryExcel);
    app.get("/inventory/template", downloadInventoryTemplate);
    app.get("/get-it-inventory-key", requireUser, getInventoryKeyControler);
    app.get("/get-pc-options", requireUser, getPcOptions);
    app.get(
        "/get-it-inventory-by-id/:id",
        requireUser,
        getItInventoryByIdController
    );
    app.put("/update-inventory/:id", requireUser, updateItInventoryControler);

    // It Inventory Items Management System
    app.post(
        "/add-inventory-item",
        requireUser,
        validateUser(inventoryItemCreateSchema),
        createItInventoryItemController
    );
    app.get("/get-inventory-items", requireUser, itInventoryGetControler);
    app.get("/add-inventory-items", requireUser, addItemsToSystemFormController);
    app.delete("/delete-itemkey-card/:id", requireUser, deleteItemKeysCardController);
    app.get(
        "/get-items-by-id/:id",
        requireUser,
        getItInventoryItemByIdController
    );
    app.get(
        "/get-itemkey-history-detail/:id",
        requireUser,
        itInventoryItemGetHistoryControler
    );
    app.delete("/deleteItemkey-card/:itemKeyId", requireUser, deleteItemKeyCardController);
    app.delete("/delete-itemkey-history-detail/:id", requireUser, deleteInventoryKeyController);

    app.post(
        "/restore-itemkey-history-detail",
        requireUser,
        restoreInventoryKeyController
    );

    app.put(
        "/update-items-by-id/:id",
        requireUser,
        updateItInventoryItemByIdController
    );
    app.put(
        "/add-items-history/",
        requireUser,
        validateUser(inventoryItemUsageSchema),
        addUsageHistoryControler
    );
    app.post(
        "/create-key-controler/",
        requireUser,
        validateUser(inventoryKeyUsageSchema),
        createItInventoryKeyControler
    );

    // Inventory Management System
    app.post(
        "/request-inventory/:inventoryId",
        requireUser,
        validateUser(inventoryUpdateSchema),
        requestInventoryControler
    );
    app.post(
        "/return-inventory/:inventoryId",
        requireUser,
        validateUser(inventoryUpdateSchema),
        returnInventoryControler
    );
    app.get(
        "/get-user-inventory/",
        requireUser,
        getCurrentUserInventoryControler
    );
    app.post(
        "/add-inventory",
        requireUser,
        validateUser(inventoryCreateSchema),
        createInventoryController
    );
    app.post(
        "/submit-feedback",
        requireUser,
        (req, res, next) => {
            req.upload = req.upload || {};
            req.upload.type = "feedback";
            next();
        },
        getUploadMiddleware(),
        uploadFileToS3,
        submitFeedbackController
    );
    app.delete("/delete-feedback/:id", requireUser, deleteFeedbackController)
    app.get("/get-feedback", requireUser, getFeedbackByTypeController);
    app.get("/it-inventory", requireUser, getAllInventoryController);
    app.get("/it-inventory/:id", requireUser, getInventoryByIdController);
    app.put("/it-inventory/:id", requireUser, updateItInventoryController);
    app.delete("/it-inventory/:id", requireUser, deleteItInventoryController);
    app.get("/inventory/:id/last-update", requireUser, getLastUpdatedById);
    app.get("/inventory-last-updated", requireUser, getAllLastUpdated);
    app.get("/inventory/:id/update-history", requireUser, getFullUpdateHistory);
    /* Notifications */
    app.post("/save-token", requireUser, saveToken);
    app.post("/send-by-project", sendByProjectId);
    app.post("/reset-badge", resetBadge);
};

export default routeFunc;
