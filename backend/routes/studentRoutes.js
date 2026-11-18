
const express = require("express");
const multer = require("multer");

const router = express.Router();
const student = require("../controllers/studentController");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "application/pdf"];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and PDF files allowed"));
        }
    }
});

router.post("/", upload.single("id_card"), student.createStudent);
router.get("/", student.getStudents);
router.get("/:id/file", student.getStudentFile);
router.put("/:id", upload.single("id_card"), student.updateStudent);
router.delete("/:id", student.deleteStudent);

module.exports = router;
