
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/students";

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    age: "",
    course: ""
  });
  const [file, setFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStudents = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load students");
      }

      setStudents(data);
    } catch (error) {
      console.error("Load Students Error:", error);
      alert("Unable to load student records. Check backend.");
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const resetForm = () => {
    setForm({ name: "", age: "", course: "" });
    setFile(null);
    setEditId(null);

    const fileInput = document.getElementById("id_card");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!editId && !file) {
      alert("Please upload student ID card.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("name", form.name.trim());
      data.append("age", form.age);
      data.append("course", form.course.trim());

      if (file) {
        data.append("id_card", file);
      }

      const res = await fetch(
        editId ? `${API}/${editId}` : API,
        {
          method: editId ? "PUT" : "POST",
          body: data
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || result.error || "Operation failed"
        );
      }

      alert(
        result.message ||
        (editId
          ? "Student updated successfully"
          : "Student added successfully")
      );

      resetForm();
      await loadStudents();

    } catch (error) {
      console.error("Submit Error:", error);
      alert(error.message || "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setForm({
      name: student.name,
      age: student.age,
      course: student.course
    });

    setEditId(student.id);
    setFile(null);

    const fileInput = document.getElementById("id_card");
    if (fileInput) fileInput.value = "";

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;

    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE"
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Delete failed");
      }

      alert(result.message || "Student deleted successfully");
      await loadStudents();

    } catch (error) {
      console.error("Delete Error:", error);
      alert(error.message || "Unable to delete student");
    }
  };

  const viewFile = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/file`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to access ID card");
      }

      if (!data.url) {
        throw new Error("File URL not found");
      }

      window.open(data.url, "_blank");

    } catch (error) {
      console.error("View File Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Student Management System</h1>
        <p>Manage student records and ID cards</p>
      </header>

      <section className="form-card">
        <h2>
          {editId ? "Update Student" : "Add New Student"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Student Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <input
            type="number"
            placeholder="Age"
            min="1"
            max="120"
            value={form.age}
            onChange={(e) =>
              setForm({ ...form, age: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Course"
            value={form.course}
            onChange={(e) =>
              setForm({ ...form, course: e.target.value })
            }
            required
          />

          <label>Upload ID Card (JPG, PNG, PDF)</label>

          <input
            id="id_card"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            required={!editId}
            onChange={(e) =>
              setFile(e.target.files[0] || null)
            }
          />

          <button type="submit" disabled={loading}>
            {loading
              ? editId
                ? "Updating..."
                : "Adding..."
              : editId
                ? "Update Student"
                : "Add Student"}
          </button>

          {editId && (
            <button
              type="button"
              className="cancel"
              disabled={loading}
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      <section className="table-card">
        <h2>Student Records ({students.length})</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Course</th>
                <th>ID Card</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.age}</td>
                  <td>{student.course}</td>

                  <td>
                    <button
                      type="button"
                      className="view"
                      onClick={() => viewFile(student.id)}
                    >
                      View ID
                    </button>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="edit"
                      onClick={() => handleEdit(student)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete"
                      onClick={() => handleDelete(student.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan="6">No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;
