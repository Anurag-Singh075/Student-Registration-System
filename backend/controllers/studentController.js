
const db = require("../config/db");
const {
    s3,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    getSignedUrl
} = require("../services/s3Service");

const bucket = process.env.S3_BUCKET_NAME;

// CREATE
exports.createStudent = async (req, res) => {
    try {
        const { name, age, course } = req.body;

        if (!name || !age || !course || !req.file) {
            return res.status(400).json({ message: "All fields and ID card are required" });
        }

        const key = `student-id-cards/${Date.now()}-${req.file.originalname}`;

        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        const [result] = await db.promise().query(
            "INSERT INTO students (name, age, course, id_card) VALUES (?, ?, ?, ?)",
            [name, age, course, key]
        );

        res.status(201).json({ message: "Student created", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ
exports.getStudents = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT * FROM students ORDER BY id DESC"
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PRIVATE FILE URL
exports.getStudentFile = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT id_card FROM students WHERE id = ?",
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Student not found" });
        }

        const url = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: bucket,
            Key: rows[0].id_card
        }), { expiresIn: 300 });

        res.json({ url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE
exports.updateStudent = async (req, res) => {
    try {
        const { name, age, course } = req.body;

        const [rows] = await db.promise().query(
            "SELECT id_card FROM students WHERE id = ?",
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Student not found" });
        }

        let key = rows[0].id_card;

        if (req.file) {
            const newKey = `student-id-cards/${Date.now()}-${req.file.originalname}`;

            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: newKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            }));

            if (key) {
                await s3.send(new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: key
                }));
            }

            key = newKey;
        }

        await db.promise().query(
            "UPDATE students SET name=?, age=?, course=?, id_card=? WHERE id=?",
            [name, age, course, key, req.params.id]
        );

        res.json({ message: "Student updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE
exports.deleteStudent = async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT id_card FROM students WHERE id = ?",
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (rows[0].id_card) {
            await s3.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: rows[0].id_card
            }));
        }

        await db.promise().query(
            "DELETE FROM students WHERE id = ?",
            [req.params.id]
        );

        res.json({ message: "Student deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
