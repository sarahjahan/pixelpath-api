import express from "express";
import * as tagsController from '../controllers/tags-controller.js';

const router = express.Router();

router.route("/").get(tagsController.getTags)
.put(tagsController.editTags)

export default router;