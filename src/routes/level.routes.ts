
import express from "express"
import { authenticateUser } from "../middlewares/auth.middleware";
import { addLevelHandler, completeLevelHandler, deleteLevelHandler, getCompletedLevelsBySubjectHandler, getLevelById, getLevelQuestions, getLevelResultsHandler, getLevelsBySubjectHandler, updateLevelHandler } from "../controllers/level.controller";


const router = express.Router();


router.get("/:levelId/questions",authenticateUser,getLevelQuestions);
router.post("/",authenticateUser,addLevelHandler);
router.post("/:levelId/complete",authenticateUser,completeLevelHandler)
router.get("/levels/:subjectId",authenticateUser,getLevelsBySubjectHandler);
router.get("/levels/:subjectId/completed",authenticateUser,getCompletedLevelsBySubjectHandler);
router.get("/:levelId",getLevelById);
router.delete("/:levelId",authenticateUser,deleteLevelHandler);
router.put("/:levelId",authenticateUser,updateLevelHandler);
router.get("/:levelId/results",authenticateUser,getLevelResultsHandler);

export default router;

