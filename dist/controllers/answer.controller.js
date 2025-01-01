"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCorrectAnswerHandler = exports.createAnswerForQuestionHandler = void 0;
const __1 = require("..");
const createAnswerForQuestionHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { questionId, value } = req.body;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                "success": false,
                "message": "student not authorized to create answers for a question"
            });
            return;
        }
        const question = yield __1.prisma.question.findUnique({ where: { id: questionId }, include: {
                level: {
                    select: {
                        subject: true,
                    }
                }
            } });
        if (!question) {
            res.status(400).json({
                "success": false,
                "message": "question not found"
            });
            return;
        }
        const gradeId = question.level.subject.gradeId;
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot add answers to a question in this grade"
                });
                return;
            }
        }
        if (value.trim() === "") {
            res.status(400).json({
                "success": false,
                "message": "please enter an answer value"
            });
            return;
        }
        const answer = yield __1.prisma.answer.create({ data: { value: value, questionId: question.id } });
        res.status(201).json({
            "success": true,
            answer,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "Internal server error when creating answer for question"
        });
    }
});
exports.createAnswerForQuestionHandler = createAnswerForQuestionHandler;
const updateCorrectAnswerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { answerId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                "success": false,
                "message": "student cannot choose correct answer for a question"
            });
            return;
        }
        const answer = yield __1.prisma.answer.findUnique({ where: { id: answerId }, include: {
                question: {
                    select: {
                        Answers: true,
                        level: {
                            select: {
                                subject: true,
                            }
                        }
                    }
                }
            } });
        if (!answer) {
            res.status(400).json({
                "success": false,
                "message": "answer not found"
            });
            return;
        }
        const gradeId = answer.question.level.subject.gradeId;
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot choose correct answer for questions in this grade"
                });
                return;
            }
        }
        const answers = answer.question.Answers;
        let isSelectedCorrect = false;
        let currentCorrectAnswerId = "";
        for (let i = 0; i < answers.length; i++) {
            if (answers[i].isCorrect) {
                isSelectedCorrect = true;
                currentCorrectAnswerId = answers[i].id;
                break;
            }
        }
        // cases:
        // 1. no answers are correct for this question 
        // 2. the answer is currently correct
        // 3. another answer is correct
        let responseMessage = "";
        if (!isSelectedCorrect) {
            // make the answer with id=answerId the correct answer
            yield __1.prisma.answer.update({ where: { id: answer.id }, data: {
                    isCorrect: true,
                } });
            responseMessage = `answer with id ${answer.id} is now the correct answer`;
        }
        else {
            // a correct answer is already selected
            if (answer.id === currentCorrectAnswerId) {
                // change the isCorrect flag for this answer
                yield __1.prisma.answer.update({ where: { id: answer.id }, data: {
                        isCorrect: false,
                    } });
                responseMessage = `answer with id ${answer.id} is now not the correct answer`;
            }
            else {
                //another answer is correct
                // change the isCorrect flag for another answer to false
                // and update the flag for answer with id = answer.id
                yield __1.prisma.$transaction([
                    __1.prisma.answer.update({ where: { id: currentCorrectAnswerId }, data: {
                            isCorrect: false,
                        } }),
                    __1.prisma.answer.update({ where: { id: answer.id }, data: {
                            isCorrect: true,
                        } })
                ]);
                responseMessage = `answer with id ${answer.id} is now the correct answer`;
            }
        }
        res.status(200).json({
            "success": true,
            "message": responseMessage,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when updating the correct answer"
        });
    }
});
exports.updateCorrectAnswerHandler = updateCorrectAnswerHandler;