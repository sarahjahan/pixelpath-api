import express from "express";
import * as tagsController from '../controllers/tags-controller.js';

const router = express.Router();

router.route("/").post(tagsController.addTags)

export default router;